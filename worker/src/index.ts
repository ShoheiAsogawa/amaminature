/**
 * AMAMI NATURE API — Cloudflare Workers (Hono) + D1 + R2
 *
 * - /api/*     アプリ（LIFF）用API・LINE Webhook・提携先API
 * - /s/*       共有カード画像（公開）
 * - それ以外   静的アセット（LIFFアプリ本体、SPA）
 */
import { Hono, type Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { AREA_BY_ID } from '../../src/data/areas';
import { REWARDS } from '../../src/data/rewards';
import { computePoints, computeStats, currentMonth, earnedBadges } from '../../src/lib/progress';
import type { Sighting } from '../../src/lib/types';
import { adminApp } from './admin';
import { jstDate, jstMidnightIso, sha256Hex, signSession, toBase64, verifyLineSignature, verifySession } from './crypto';
import type { AppEnv, Env } from './env';
import { IdentifyError, identifySpecies, MAX_IMAGE_BASE64_LENGTH, type ImageMediaType } from './identify';
import * as line from './line';
import { parseSightingMeta, rowToSighting, ValidationError } from './validate';

export const LIMITS = {
  aiFreePerDay: 1,
  aiPlusPerDay: 30,
  sightingsPerDay: 50,
  photoBytes: 4 * 1024 * 1024,
  thumbBytes: 1024 * 1024,
  shareBytes: 2 * 1024 * 1024,
  sharesPerDay: 30,
};

const app = new Hono<AppEnv>();

app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: 'invalid_request', detail: err.message }, 400);
  console.error(err);
  return c.json({ error: 'internal_error' }, 500);
});

// ───────── 共通 ─────────

const nowIso = () => new Date().toISOString();

async function ensureUser(env: Env, userId: string, profile?: { displayName?: string; pictureUrl?: string | null }) {
  await env.DB.prepare(
    `INSERT INTO users (id, display_name, picture_url, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?4, ?4)
     ON CONFLICT(id) DO UPDATE SET
       display_name = CASE WHEN ?2 <> '' THEN ?2 ELSE users.display_name END,
       picture_url = COALESCE(?3, users.picture_url),
       last_seen_at = ?4`,
  )
    .bind(userId, profile?.displayName ?? '', profile?.pictureUrl ?? null, nowIso())
    .run();
}

/**
 * 利用者の記録。既定では運営が取り消した記録を除く（ポイントの計算用）。
 * includeRevoked: 端末との同期用（取り消した記録も revoked: true で返し、端末側でポイントの対象外にする）
 */
async function userSightings(env: Env, userId: string, opts: { includeRevoked?: boolean } = {}): Promise<(Sighting & { hasPhoto: boolean; revoked: boolean })[]> {
  // 取り消した後に利用者が消した記録は、行は残るが利用者には見せない（tombstone あり）
  const { results } = await env.DB.prepare(
    `SELECT * FROM sightings WHERE user_id = ?1 ${opts.includeRevoked ? 'AND id NOT IN (SELECT id FROM sighting_tombstones WHERE user_id = ?1)' : 'AND revoked_at IS NULL'}
     ORDER BY observed_at DESC`,
  )
    .bind(userId)
    .all();
  return results.map(rowToSighting);
}

function isPlus(user: Record<string, unknown> | null): boolean {
  return !!user?.plus_until && Date.parse(user.plus_until as string) > Date.now();
}

async function aiUsedToday(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare('SELECT count FROM ai_usage WHERE user_id = ? AND date = ?').bind(userId, jstDate()).first<{ count: number }>();
  return row?.count ?? 0;
}

/**
 * AI判定の1回分を、呼び出す前に1つの文で確保する（同時に何枚送られても上限を超えない）。
 * 確保できたら { date, used }（used は確保後の回数）、上限に達していたら null。
 * 判定に失敗したら releaseAi で返す。
 */
async function reserveAi(env: Env, userId: string, limit: number): Promise<{ date: string; used: number } | null> {
  const date = jstDate();
  const row = await env.DB.prepare(
    `INSERT INTO ai_usage (user_id, date, count) VALUES (?1, ?2, 1)
     ON CONFLICT(user_id, date) DO UPDATE SET count = ai_usage.count + 1 WHERE ai_usage.count < ?3
     RETURNING count`,
  )
    .bind(userId, date, limit)
    .first<{ count: number }>();
  return row ? { date, used: row.count } : null;
}

async function releaseAi(env: Env, userId: string, date: string) {
  await env.DB.prepare('UPDATE ai_usage SET count = MAX(0, count - 1) WHERE user_id = ? AND date = ?').bind(userId, date).run();
}

async function aiLimitFor(env: Env, userId: string): Promise<number> {
  const user = await env.DB.prepare('SELECT plus_until FROM users WHERE id = ?').bind(userId).first<Record<string, unknown>>();
  return isPlus(user) ? LIMITS.aiPlusPerDay : LIMITS.aiFreePerDay;
}

async function spentPoints(env: Env, userId: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT COALESCE(SUM(points), 0) AS n FROM redemptions WHERE user_id = ? AND status <> 'cancelled'`)
    .bind(userId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

/** サーバー側で計算したポイント・残高（不正対策のため景品交換はこちらを正とする） */
async function buildMe(env: Env, userId: string) {
  const [user, sightings, drives, spent, used] = await Promise.all([
    env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<Record<string, unknown>>(),
    userSightings(env, userId),
    env.DB.prepare('SELECT COUNT(*) AS n FROM safe_drives WHERE user_id = ?').bind(userId).first<{ n: number }>(),
    spentPoints(env, userId),
    aiUsedToday(env, userId),
  ]);
  const safeDriveDays = drives?.n ?? 0;
  const points = computePoints(sightings, currentMonth(), safeDriveDays);
  const plus = isPlus(user);
  const stats = computeStats(sightings);
  return {
    me: {
      userId,
      displayName: (user?.display_name as string) ?? '',
      pictureUrl: (user?.picture_url as string | null) ?? null,
      nickname: (user?.nickname as string) ?? '',
      pledged: !!user?.pledged,
      plusUntil: plus ? (user!.plus_until as string) : null,
      plusPlan: plus ? ((user!.plus_plan as string | null) ?? null) : null,
      points,
      balance: Math.max(0, points - spent),
      aiRemainingToday: Math.max(0, (plus ? LIMITS.aiPlusPerDay : LIMITS.aiFreePerDay) - used),
    },
    badges: earnedBadges(stats, { pledged: !!user?.pledged, safeDriveDays }),
  };
}

const auth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  let userId: string | null = null;
  if (header.startsWith('Bearer ') && c.env.SESSION_SECRET) {
    userId = await verifySession(header.slice(7), c.env.SESSION_SECRET);
  } else if (c.env.DEV_AUTH === 'true' && header.startsWith('Dev ')) {
    userId = header.slice(4).trim() || null;
    if (userId) await ensureUser(c.env, userId, { displayName: 'dev' });
  }
  if (!userId) return c.json({ error: 'unauthorized' }, 401);
  c.set('userId', userId);
  await next();
});

// ───────── ヘルスチェック・認証 ─────────

app.get('/api/health', (c) => c.json({ ok: true, time: nowIso() }));

app.post('/api/auth/line', async (c) => {
  if (!c.env.LINE_LOGIN_CHANNEL_ID || !c.env.SESSION_SECRET) return c.json({ error: 'line_not_configured' }, 503);
  const { idToken } = await c.req.json<{ idToken?: string }>().catch(() => ({ idToken: undefined }));
  if (!idToken) return c.json({ error: 'id_token_required' }, 400);
  const payload = await line.verifyIdToken(idToken, c.env.LINE_LOGIN_CHANNEL_ID);
  if (!payload) return c.json({ error: 'unauthorized' }, 401);
  await ensureUser(c.env, payload.sub, { displayName: payload.name, pictureUrl: payload.picture ?? null });
  const session = await signSession(payload.sub, c.env.SESSION_SECRET);
  const { me } = await buildMe(c.env, payload.sub);
  return c.json({ session, me });
});

// ───────── プロフィール ─────────

app.get('/api/me', auth, async (c) => c.json((await buildMe(c.env, c.get('userId'))).me));

app.patch('/api/me', auth, async (c) => {
  const body = await c.req.json<{ nickname?: unknown; pledged?: unknown }>();
  const userId = c.get('userId');
  if (typeof body.nickname === 'string') {
    await c.env.DB.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(body.nickname.trim().slice(0, 20), userId).run();
  }
  if (body.pledged === true) {
    await c.env.DB.prepare('UPDATE users SET pledged = 1 WHERE id = ?').bind(userId).run();
  }
  return c.json((await buildMe(c.env, userId)).me);
});

/** 交換とセーフドライブ宣言の履歴（別の端末・データを消した端末でも、ポイントの使い道と宣言を戻せるように） */
app.get('/api/me/history', auth, async (c) => {
  const userId = c.get('userId');
  const [redemptions, drives] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT id, reward_id AS rewardId, points, status, created_at AS at FROM redemptions
       WHERE user_id = ? AND status <> 'cancelled' ORDER BY created_at`,
    ).bind(userId),
    c.env.DB.prepare('SELECT date FROM safe_drives WHERE user_id = ? ORDER BY date').bind(userId),
  ]);
  return c.json({ redemptions: redemptions.results, safeDriveDates: (drives.results as { date: string }[]).map((d) => d.date) });
});

// ───────── 観察記録 ─────────

app.get('/api/sightings', auth, async (c) => {
  const userId = c.get('userId');
  const [sightings, tombstones] = await Promise.all([
    userSightings(c.env, userId, { includeRevoked: true }),
    c.env.DB.prepare('SELECT id FROM sighting_tombstones WHERE user_id = ?').bind(userId).all<{ id: string }>(),
  ]);
  // deleted: ほかの端末で消した記録（この端末からも消す）
  return c.json({ sightings, deleted: tombstones.results.map((t) => t.id) });
});

app.post('/api/sightings', auth, async (c) => {
  const userId = c.get('userId');
  const form = await c.req.formData();
  const metaRaw = form.get('meta');
  if (typeof metaRaw !== 'string') return c.json({ error: 'meta_required' }, 400);
  const s = parseSightingMeta(JSON.parse(metaRaw));

  const existing = await c.env.DB.prepare('SELECT user_id, photo_key, photo_hash FROM sightings WHERE id = ?')
    .bind(s.id)
    .first<{ user_id: string; photo_key: string | null; photo_hash: string | null }>();
  if (existing && existing.user_id !== userId) return c.json({ error: 'forbidden' }, 403);

  const [tomb, today] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT 1 AS x FROM sighting_tombstones WHERE id = ? AND user_id = ?').bind(s.id, userId),
    // 1日の上限はサーバーが受け取った日時で数える（端末の申告する created_at は過去にずらせるため）
    c.env.DB.prepare('SELECT COUNT(*) AS n FROM sightings WHERE user_id = ? AND received_at >= ?').bind(userId, jstMidnightIso()),
  ]);
  // 消した記録が古い端末から送り直されても生き返らせない
  if (tomb.results.length) return c.json({ error: 'deleted' }, 410);
  if (!existing && ((today.results[0] as { n?: number } | undefined)?.n ?? 0) >= LIMITS.sightingsPerDay) {
    return c.json({ error: 'rate_limited' }, 429);
  }

  let photoKey = existing?.photo_key ?? null;
  let photoHash = existing?.photo_hash ?? null;
  const photo = form.get('photo');
  const thumb = form.get('thumb');
  if (photo instanceof File && thumb instanceof File) {
    if (photo.size > LIMITS.photoBytes || thumb.size > LIMITS.thumbBytes) return c.json({ error: 'image_too_large' }, 413);
    if (!photo.type.startsWith('image/') || !thumb.type.startsWith('image/')) return c.json({ error: 'invalid_image' }, 400);
    const bytes = await photo.arrayBuffer();
    photoHash = await sha256Hex(bytes);
    // 同じ写真の使い回し（ポイント目的の不正）を防ぐ
    const dup = await c.env.DB.prepare('SELECT id FROM sightings WHERE photo_hash = ? AND id <> ? LIMIT 1').bind(photoHash, s.id).first();
    if (dup) return c.json({ error: 'duplicate_photo' }, 409);
    photoKey = `photos/${userId}/${s.id}`;
    await Promise.all([
      c.env.PHOTOS.put(`${photoKey}.jpg`, bytes, { httpMetadata: { contentType: 'image/jpeg' } }),
      c.env.PHOTOS.put(`${photoKey}_thumb.jpg`, await thumb.arrayBuffer(), { httpMetadata: { contentType: 'image/jpeg' } }),
    ]);
  }

  const now = nowIso();
  const statements = [
    // セッションはユーザー行より長生きしうる（DB作り直し・退会後の再登録など）ので、外部キーのために必ず作る
    c.env.DB.prepare('INSERT OR IGNORE INTO users (id, created_at, last_seen_at) VALUES (?1, ?2, ?2)').bind(userId, now),
    c.env.DB.prepare(
      `INSERT INTO sightings (id, user_id, species_id, custom_name, nickname, memo, observed_at, created_at, updated_at,
         area_id, lat, lng, location_protected, kind, road_report, photo_key, photo_hash, received_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?9)
       ON CONFLICT(id) DO UPDATE SET
         species_id = ?3, custom_name = ?4, nickname = ?5, memo = ?6, observed_at = ?7, updated_at = ?9,
         area_id = ?10, lat = ?11, lng = ?12, location_protected = ?13, kind = ?14, road_report = ?15,
         photo_key = ?16, photo_hash = ?17`,
    ).bind(
      s.id,
      userId,
      s.speciesId,
      s.customName,
      s.nickname,
      s.memo,
      s.observedAt,
      s.createdAt,
      now,
      s.areaId,
      s.lat,
      s.lng,
      s.locationProtected ? 1 : 0,
      s.kind,
      s.roadReport,
      photoKey,
      photoHash,
    ),
  ];
  if (s.roadReport) {
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO road_reports (sighting_id, user_id, type, species_id, area_id, lat, lng, observed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(sighting_id) DO UPDATE SET type = excluded.type, species_id = excluded.species_id,
           area_id = excluded.area_id, lat = COALESCE(excluded.lat, road_reports.lat), lng = COALESCE(excluded.lng, road_reports.lng),
           observed_at = excluded.observed_at`,
      ).bind(s.id, userId, s.roadReport, s.speciesId, s.areaId, s.reportLat, s.reportLng, s.observedAt),
    );
  } else {
    statements.push(c.env.DB.prepare('DELETE FROM road_reports WHERE sighting_id = ?').bind(s.id));
  }
  await c.env.DB.batch(statements);

  const { me } = await buildMe(c.env, userId);
  return c.json({ ok: true, points: me.points, balance: me.balance });
});

app.delete('/api/sightings/:id', auth, async (c) => {
  const userId = c.get('userId');
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT user_id, photo_key, revoked_at FROM sightings WHERE id = ?')
    .bind(id)
    .first<{ user_id: string; photo_key: string | null; revoked_at: string | null }>();
  if (row && row.user_id !== userId) return c.json({ error: 'forbidden' }, 403);
  // まだ届いていない記録でも印を残す（このあとアップロードが届いても生き返らせない）
  const tombstone = c.env.DB.prepare('INSERT OR IGNORE INTO sighting_tombstones (id, user_id, deleted_at) VALUES (?, ?, ?)').bind(id, userId, nowIso());
  if (!row) {
    if (/^[A-Za-z0-9-]{8,64}$/.test(id)) await tombstone.run();
    return c.json({ ok: true });
  }
  if (row.revoked_at) {
    // 運営が取り消した記録は行を残す（写真のハッシュで同じ写真の使い回しを防ぎ続け、取り消した記録として運営が確かめられる）。
    // 利用者からは消えたことにして、写真は消す
    await c.env.DB.batch([c.env.DB.prepare('UPDATE sightings SET photo_key = NULL WHERE id = ?').bind(id), tombstone]);
  } else {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM road_reports WHERE sighting_id = ?').bind(id),
      c.env.DB.prepare('DELETE FROM sightings WHERE id = ?').bind(id),
      tombstone,
    ]);
  }
  if (row.photo_key) await c.env.PHOTOS.delete([`${row.photo_key}.jpg`, `${row.photo_key}_thumb.jpg`]);
  return c.json({ ok: true });
});

async function streamObject(c: Context<AppEnv>, key: string, cache: string) {
  const obj = await c.env.PHOTOS.get(key);
  if (!obj) return c.json({ error: 'not_found' }, 404);
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': cache,
      ETag: obj.httpEtag,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

app.get('/api/photos/:id', auth, async (c) => {
  const row = await c.env.DB.prepare('SELECT user_id, photo_key FROM sightings WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ user_id: string; photo_key: string | null }>();
  if (!row?.photo_key || row.user_id !== c.get('userId')) return c.json({ error: 'not_found' }, 404);
  const suffix = c.req.query('size') === 'full' ? '.jpg' : '_thumb.jpg';
  return streamObject(c, `${row.photo_key}${suffix}`, 'private, max-age=31536000, immutable');
});

/** LINEのトークに送られた写真（Webhookで保存したもの） */
app.get('/api/inbox/:messageId', auth, async (c) =>
  streamObject(c, `inbox/${c.get('userId')}/${c.req.param('messageId').replace(/[^0-9A-Za-z]/g, '')}`, 'private, max-age=600'),
);

// ───────── AI判定 ─────────

app.post('/api/identify', auth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<{ image?: string; month?: number; areaId?: string | null }>();
  if (typeof body.image !== 'string' || !body.image) return c.json({ error: 'image_required' }, 400);
  if (body.image.length > MAX_IMAGE_BASE64_LENGTH) return c.json({ error: 'image_too_large' }, 413);
  if (!c.env.ANTHROPIC_API_KEY) return c.json({ error: 'ai_unavailable' }, 503);

  const limit = await aiLimitFor(c.env, userId);
  const slot = await reserveAi(c.env, userId, limit);
  if (!slot) return c.json({ error: 'ai_quota_exceeded' }, 429);

  try {
    const candidates = await identifySpecies({
      apiKey: c.env.ANTHROPIC_API_KEY,
      imageBase64: body.image,
      month: body.month,
      areaId: typeof body.areaId === 'string' && AREA_BY_ID[body.areaId] ? body.areaId : null,
    });
    return c.json({ candidates, remainingToday: Math.max(0, limit - slot.used) });
  } catch (e) {
    // 判定できなかった分は回数に数えない
    await releaseAi(c.env, userId, slot.date);
    if (e instanceof IdentifyError) return c.json({ error: e.code }, e.code === 'rate_limited' ? 429 : e.code === 'refused' ? 422 : 502);
    throw e;
  }
});

// ───────── セーフドライブ・ポイント交換・Plus ─────────

app.post('/api/safe-drive', auth, async (c) => {
  const userId = c.get('userId');
  // 圏外で宣言した分はあとから送られてくるので、日本時間のきょうときのうの日付まで受け付ける
  const { date } = await c.req.json<{ date?: unknown }>().catch(() => ({ date: undefined }));
  const today = jstDate();
  const allowed = [today, jstDate(Date.now() - 86400000)];
  if (date !== undefined && !allowed.includes(date as string)) return c.json({ error: 'invalid_date' }, 400);
  const r = await c.env.DB.prepare('INSERT OR IGNORE INTO safe_drives (user_id, date, created_at) VALUES (?, ?, ?)')
    .bind(userId, (date as string | undefined) ?? today, nowIso())
    .run();
  const { me } = await buildMe(c.env, userId);
  return c.json({ ok: true, alreadyDeclared: r.meta.changes === 0, points: me.points, balance: me.balance });
});

app.post('/api/redeem', auth, async (c) => {
  const userId = c.get('userId');
  const { rewardId } = await c.req.json<{ rewardId?: string }>();
  const reward = REWARDS.find((r) => r.id === rewardId);
  if (!reward) return c.json({ error: 'unknown_reward' }, 400);
  const { me, badges } = await buildMe(c.env, userId);
  if (reward.requiresBadge && !badges.has(reward.requiresBadge)) return c.json({ error: 'badge_required' }, 403);
  // 残高の確認と書き込みを1つの文で行う（同時に何回押されても、持っているポイントを超えて交換できない）
  const r = await c.env.DB.prepare(
    `INSERT INTO redemptions (id, user_id, reward_id, points, created_at)
     SELECT ?1, ?2, ?3, ?4, ?5
     WHERE (SELECT COALESCE(SUM(points), 0) FROM redemptions WHERE user_id = ?2 AND status <> 'cancelled') + ?4 <= ?6
       AND (?7 = 0 OR NOT EXISTS (SELECT 1 FROM redemptions WHERE user_id = ?2 AND reward_id = ?3 AND status <> 'cancelled'))`,
  )
    .bind(crypto.randomUUID(), userId, reward.id, reward.points, nowIso(), me.points, reward.once ? 1 : 0)
    .run();
  if (r.meta.changes === 0) {
    if (reward.once) {
      const done = await c.env.DB.prepare(`SELECT 1 AS x FROM redemptions WHERE user_id = ? AND reward_id = ? AND status <> 'cancelled'`)
        .bind(userId, reward.id)
        .first();
      if (done) return c.json({ error: 'already_redeemed' }, 409);
    }
    return c.json({ error: 'insufficient_points' }, 409);
  }
  return c.json({ ok: true, balance: Math.max(0, me.points - (await spentPoints(c.env, userId))) });
});

app.post('/api/plus/demo', auth, async (c) => {
  if (c.env.DEMO_PLUS !== 'true') return c.json({ error: 'forbidden' }, 403);
  const { plan } = await c.req.json<{ plan?: string }>();
  const days = plan === 'year' ? 366 : plan === 'month' ? 31 : 7;
  await c.env.DB.prepare('UPDATE users SET plus_plan = ?, plus_until = ? WHERE id = ?')
    .bind(plan ?? 'trip', new Date(Date.now() + days * 86400000).toISOString(), c.get('userId'))
    .run();
  return c.json((await buildMe(c.env, c.get('userId'))).me);
});

// ───────── 共有カード（公開画像） ─────────

app.post('/api/shares', auth, async (c) => {
  const userId = c.get('userId');
  const form = await c.req.formData();
  const image = form.get('image');
  if (!(image instanceof File) || !image.type.startsWith('image/')) return c.json({ error: 'invalid_image' }, 400);
  if (image.size > LIMITS.shareBytes) return c.json({ error: 'image_too_large' }, 413);
  // 公開URLで配るので、アプリが作るカード（JPEG）以外は受け付けない
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return c.json({ error: 'invalid_image' }, 400);
  const today = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM shares WHERE user_id = ? AND created_at >= ?')
    .bind(userId, jstMidnightIso())
    .first<{ n: number }>();
  if ((today?.n ?? 0) >= LIMITS.sharesPerDay) return c.json({ error: 'rate_limited' }, 429);
  const id = crypto.randomUUID();
  await c.env.PHOTOS.put(`shares/${id}.jpg`, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
  await c.env.DB.prepare('INSERT INTO shares (id, user_id, created_at) VALUES (?, ?, ?)').bind(id, userId, nowIso()).run();
  const base = c.env.PUBLIC_BASE_URL || new URL(c.req.url).origin;
  return c.json({ url: `${base.replace(/\/$/, '')}/s/${id}.jpg` });
});

app.get('/s/:file', async (c) => {
  const file = c.req.param('file');
  if (!/^[0-9a-f-]{36}\.jpg$/.test(file)) return c.json({ error: 'not_found' }, 404);
  return streamObject(c, `shares/${file}`, 'public, max-age=31536000, immutable');
});

// ───────── 提携先（自治体・保護機関）向け集計API ─────────

app.get('/api/partner/summary', async (c) => {
  const key = c.req.header('X-Partner-Key');
  if (!key) return c.json({ error: 'unauthorized' }, 401);
  const partner = await c.env.DB.prepare('SELECT name, scope FROM partners WHERE api_key_hash = ?')
    .bind(await sha256Hex(key))
    .first<{ name: string; scope: string }>();
  if (!partner) return c.json({ error: 'unauthorized' }, 401);

  const areas = partner.scope === 'all' ? null : partner.scope.split(',').filter((a) => AREA_BY_ID[a]);
  const where = areas ? `area_id IN (${areas.map(() => '?').join(',')})` : '1=1';
  const binds = areas ?? [];
  const since = new Date(Date.now() - 365 * 86400000).toISOString();
  const q = (sql: string, ...extra: unknown[]) => c.env.DB.prepare(sql).bind(...binds, ...extra);

  const [totals, roadTotal, byArea, roadByArea, byHour, byMonth, roadByMonth, top, recent] = await c.env.DB.batch([
    q(`SELECT COUNT(*) AS sightings, COUNT(DISTINCT user_id) AS users, COUNT(DISTINCT species_id) AS species FROM sightings WHERE ${where} AND revoked_at IS NULL`),
    q(`SELECT COUNT(*) AS n FROM road_reports WHERE ${where}`),
    q(`SELECT area_id AS areaId, COUNT(*) AS sightings FROM sightings WHERE ${where} AND revoked_at IS NULL AND area_id IS NOT NULL GROUP BY area_id`),
    q(`SELECT area_id AS areaId, COUNT(*) AS n FROM road_reports WHERE ${where} AND area_id IS NOT NULL GROUP BY area_id`),
    q(`SELECT CAST(strftime('%H', observed_at, '+9 hours') AS INTEGER) AS hour, COUNT(*) AS sightings FROM sightings WHERE ${where} AND revoked_at IS NULL GROUP BY hour`),
    q(`SELECT strftime('%Y-%m', observed_at, '+9 hours') AS month, COUNT(*) AS sightings FROM sightings WHERE ${where} AND revoked_at IS NULL AND observed_at >= ? GROUP BY month`, since),
    q(
      `SELECT strftime('%Y-%m', observed_at, '+9 hours') AS month, COUNT(*) AS roadkill FROM road_reports
       WHERE ${where} AND type IN ('roadkill', 'injured') AND observed_at >= ? GROUP BY month`,
      since,
    ),
    q(`SELECT species_id AS speciesId, COUNT(*) AS sightings FROM sightings WHERE ${where} AND revoked_at IS NULL AND species_id IS NOT NULL GROUP BY species_id ORDER BY sightings DESC LIMIT 10`),
    q(
      `SELECT sighting_id AS id, type, species_id AS speciesId, area_id AS areaId, lat, lng, observed_at AS observedAt
       FROM road_reports WHERE ${where} ORDER BY observed_at DESC LIMIT 100`,
    ),
  ]);

  const t = (totals.results[0] ?? {}) as { sightings?: number; users?: number; species?: number };
  const roadMap = new Map((roadByArea.results as { areaId: string; n: number }[]).map((r) => [r.areaId, r.n]));
  const areaMap = new Map((byArea.results as { areaId: string; sightings: number }[]).map((r) => [r.areaId, r.sightings]));
  const hours = new Map((byHour.results as { hour: number; sightings: number }[]).map((r) => [r.hour, r.sightings]));
  const sMonth = new Map((byMonth.results as { month: string; sightings: number }[]).map((r) => [r.month, r.sightings]));
  const rMonth = new Map((roadByMonth.results as { month: string; roadkill: number }[]).map((r) => [r.month, r.roadkill]));
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now() + 9 * 3600000);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });
  const scopeAreas = areas ?? Object.keys(AREA_BY_ID);

  return c.json({
    partner: partner.name,
    generatedAt: nowIso(),
    totals: {
      sightings: t.sightings ?? 0,
      users: t.users ?? 0,
      species: t.species ?? 0,
      roadReports: (roadTotal.results[0] as { n?: number } | undefined)?.n ?? 0,
    },
    byArea: scopeAreas.map((areaId) => ({ areaId, sightings: areaMap.get(areaId) ?? 0, roadReports: roadMap.get(areaId) ?? 0 })),
    byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, sightings: hours.get(hour) ?? 0 })),
    byMonth: months.map((month) => ({ month, sightings: sMonth.get(month) ?? 0, roadkill: rMonth.get(month) ?? 0 })),
    topSpecies: top.results,
    roadReports: recent.results,
  });
});

// ───────── 運営の管理画面 API ─────────

app.route('/api/admin', adminApp);

// ───────── LINE Messaging API Webhook ─────────

app.post('/api/line/webhook', async (c) => {
  if (!c.env.LINE_CHANNEL_SECRET || !c.env.LINE_CHANNEL_ACCESS_TOKEN) return c.json({ error: 'line_not_configured' }, 503);
  const raw = await c.req.text();
  if (!(await verifyLineSignature(c.env.LINE_CHANNEL_SECRET, raw, c.req.header('x-line-signature') ?? null))) {
    return c.json({ error: 'invalid_signature' }, 401);
  }
  const { events = [] } = JSON.parse(raw) as { events?: line.WebhookEvent[] };
  // LINEには即座に200を返し、AI判定などの重い処理はレスポンス後に行う
  c.executionCtx.waitUntil(Promise.all(events.map((e) => handleEvent(c.env, e).catch((err) => console.error('webhook event failed', err)))));
  return c.json({ ok: true });
});

const KEYWORDS: { match: RegExp; text: string; label: string; path: string }[] = [
  { match: /図鑑|ずかん|コレクション/, text: 'あなたの奄美いきもの図鑑です', label: '図鑑をひらく', path: '/zukan' },
  { match: /ロードキル|事故|けが|怪我|報告/, text: '交通事故にあった・けがをした生き物を見つけたら、安全な場所に停車してから報告してください', label: '路上レポート', path: '/capture?mode=road' },
  { match: /ツアー|体験|ガイド/, text: '奄美の森と海を楽しむ体験・ツアー', label: '体験をさがす', path: '/explore' },
  { match: /マナー|ルール/, text: '世界自然遺産の島で、生き物と人がともに暮らすために', label: 'マナーを読む', path: '/explore?tab=manner' },
  { match: /ポイント|景品|交換/, text: '貯めたポイントで、島の体験やクーポンと交換できます', label: 'ポイント交換', path: '/rewards' },
];

async function handleEvent(env: Env, event: line.WebhookEvent) {
  const userId = event.source?.userId;
  if (!userId) return;
  const token = env.LINE_CHANNEL_ACCESS_TOKEN;

  if (event.type === 'follow') {
    const profile = await line.getBotProfile(userId, token);
    await ensureUser(env, userId, { displayName: profile?.displayName, pictureUrl: profile?.pictureUrl ?? null });
    await env.DB.prepare('UPDATE users SET is_friend = 1 WHERE id = ?').bind(userId).run();
    if (event.replyToken) await line.reply(event.replyToken, [line.welcomeMessage(env.LIFF_ID)], token);
    return;
  }
  if (event.type === 'unfollow') {
    await env.DB.prepare('UPDATE users SET is_friend = 0 WHERE id = ?').bind(userId).run();
    return;
  }
  if (event.type !== 'message' || !event.message || !event.replyToken) return;
  await ensureUser(env, userId);

  if (event.message.type === 'image') {
    const messageId = event.message.id;
    const content = await line.getMessageContent(messageId, token);
    if (!content) {
      await line.reply(event.replyToken, [line.textMessage('写真を受け取れませんでした。もう一度送ってください。')], token);
      return;
    }
    // LIFFの記録画面から読み込めるよう一時保存（R2のライフサイクルで7日後に自動削除する想定）
    await env.PHOTOS.put(`inbox/${userId}/${messageId}`, content.body, { httpMetadata: { contentType: content.type } });

    const recordOnly = line.menuMessage(env.LIFF_ID, 'この写真を図鑑に記録しますか？', '記録する', `/capture?inbox=${messageId}`);
    const base64 = toBase64(content.body);
    if (!env.ANTHROPIC_API_KEY || base64.length > MAX_IMAGE_BASE64_LENGTH) {
      await line.reply(event.replyToken, [line.textMessage('この写真はAI判定できませんでした。図鑑から選んで記録できます。'), recordOnly], token);
      return;
    }
    // 何枚まとめて送られても、1日の回数を超えないよう判定の前に1回分を確保する
    const limit = await aiLimitFor(env, userId);
    const slot = await reserveAi(env, userId, limit);
    if (!slot) {
      await line.reply(
        event.replyToken,
        [line.textMessage('今日のAI判定の回数を使い切りました。AMAMI NATURE+ なら1日30回まで調べられます。'), recordOnly],
        token,
      );
      return;
    }
    let candidates;
    try {
      const mediaType = (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(content.type) ? content.type : 'image/jpeg') as ImageMediaType;
      candidates = await identifySpecies({ apiKey: env.ANTHROPIC_API_KEY, imageBase64: base64, mediaType, month: currentMonth() });
    } catch (e) {
      console.warn('identify failed', e);
      await releaseAi(env, userId, slot.date);
      await line.reply(event.replyToken, [line.textMessage('AI判定に失敗しました。図鑑から選んで記録できます。'), recordOnly], token);
      return;
    }
    await line.reply(event.replyToken, [line.identifyResultMessage(env.LIFF_ID, messageId, candidates, Math.max(0, limit - slot.used))], token);
    return;
  }

  if (event.message.type === 'text') {
    const text = event.message.text ?? '';
    const hit = KEYWORDS.find((k) => k.match.test(text));
    const msg = hit
      ? line.menuMessage(env.LIFF_ID, hit.text, hit.label, hit.path)
      : line.textMessage('生き物の写真をこのトークに送ると、AIが名前の候補を調べます。下のメニューから図鑑・路上レポート・ポイント交換も使えます。');
    await line.reply(event.replyToken, [msg], token);
  }
}

// ───────── 静的アセット（LIFFアプリ） ─────────

app.all('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
