/**
 * 運営（株式会社アマリンク）の管理画面 API — /api/admin/*
 *
 * - 認証: `X-Admin-Key` ヘッダーの SHA-256 を、シークレット ADMIN_KEY_SHA256 と時間一定で比べる。
 *   ADMIN_KEY_SHA256 が未設定なら 503（管理 API は閉じたまま）。
 * - 操作（交換申請・記録の取り消し・路上レポート・提携先）は admin_actions に記録する。
 * - 希少種の座標はもともと保存していない。路上レポートの正確な位置は、行政・保護機関への連絡のために運営だけが見られる。
 */
import { Hono, type Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { AREA_BY_ID, AREAS } from '../../src/data/areas';
import { REWARDS } from '../../src/data/rewards';
import { SPECIES_BY_ID } from '../../src/data/species';
import { computePoints, currentMonth, levelFor } from '../../src/lib/progress';
import { isAdminKey, newPartnerKey } from './adminKey';
import { jstDate, jstMidnightIso, sha256Hex } from './crypto';
import type { AppEnv, Env } from './env';
import { rowToSighting } from './validate';

const DAY = 86400000;
const nowIso = () => new Date().toISOString();

const REDEMPTION_STATUS = ['requested', 'fulfilled', 'cancelled'] as const;
const ROAD_STATUS = ['new', 'forwarded', 'closed'] as const;
/** 取り消しの理由（画面の選択肢と同じ） */
export const REVOKE_REASONS = ['同じ写真・他人の写真の使い回し', '生き物が写っていない', '種の名前が明らかに違う', '不適切な写真', 'その他'] as const;
const RARE_IDS = Object.values(SPECIES_BY_ID)
  .filter((s) => s.rarity >= 3)
  .map((s) => s.id);

type Ctx = Context<AppEnv>;

const adminAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.ADMIN_KEY_SHA256) return c.json({ error: 'admin_not_configured' }, 503);
  if (!(await isAdminKey(c.req.header('X-Admin-Key'), c.env.ADMIN_KEY_SHA256))) return c.json({ error: 'unauthorized' }, 401);
  await next();
});

async function logAction(env: Env, action: string, targetId: string, detail = '') {
  await env.DB.prepare('INSERT INTO admin_actions (id, action, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), action, targetId, detail.slice(0, 500), nowIso())
    .run();
}

async function body<T>(c: Ctx): Promise<Partial<T>> {
  return c.req.json<Partial<T>>().catch(() => ({}) as Partial<T>);
}

const clampLimit = (v: string | undefined, def: number, max: number) => Math.max(1, Math.min(max, Number.parseInt(v ?? '', 10) || def));

export const adminApp = new Hono<AppEnv>();
adminApp.use('*', adminAuth);

// ───────── ダッシュボード ─────────

adminApp.get('/summary', async (c) => {
  const now = Date.now();
  const week = new Date(now - 7 * DAY).toISOString();
  const since14 = new Date(now - 14 * DAY).toISOString();
  const since30 = new Date(now - 30 * DAY).toISOString();
  const [users, sightings, road, redemptions, ai, daily, top, rareWeek] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT COUNT(*) AS total,
         SUM(CASE WHEN created_at >= ?1 THEN 1 ELSE 0 END) AS new7,
         SUM(CASE WHEN last_seen_at >= ?1 THEN 1 ELSE 0 END) AS active7,
         SUM(is_friend) AS friends,
         SUM(CASE WHEN plus_until > ?2 THEN 1 ELSE 0 END) AS plus
       FROM users`,
    ).bind(week, nowIso()),
    c.env.DB.prepare(
      `SELECT SUM(CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END) AS total,
         SUM(CASE WHEN revoked_at IS NULL AND received_at >= ?1 THEN 1 ELSE 0 END) AS today,
         SUM(CASE WHEN revoked_at IS NULL AND received_at >= ?2 THEN 1 ELSE 0 END) AS week,
         SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) AS revoked
       FROM sightings`,
    ).bind(jstMidnightIso(now), week),
    c.env.DB.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS open FROM road_reports`),
    c.env.DB.prepare(
      `SELECT SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) AS open,
         COALESCE(SUM(CASE WHEN status = 'requested' THEN points ELSE 0 END), 0) AS openPoints,
         COALESCE(SUM(CASE WHEN status = 'fulfilled' THEN points ELSE 0 END), 0) AS fulfilledPoints
       FROM redemptions`,
    ),
    c.env.DB.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM ai_usage WHERE date = ?').bind(jstDate(now)),
    c.env.DB.prepare(
      `SELECT strftime('%Y-%m-%d', received_at, '+9 hours') AS day, COUNT(*) AS n FROM sightings
       WHERE received_at >= ? AND revoked_at IS NULL GROUP BY day`,
    ).bind(since14),
    c.env.DB.prepare(
      `SELECT species_id AS speciesId, COUNT(*) AS n FROM sightings
       WHERE received_at >= ? AND revoked_at IS NULL AND species_id IS NOT NULL GROUP BY species_id ORDER BY n DESC LIMIT 8`,
    ).bind(since30),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM sightings WHERE received_at >= ? AND revoked_at IS NULL
       AND species_id IN (${RARE_IDS.map(() => '?').join(',')})`,
    ).bind(week, ...RARE_IDS),
  ]);
  const row = <T>(r: D1Result) => (r.results[0] ?? {}) as T;
  const u = row<{ total?: number; new7?: number; active7?: number; friends?: number; plus?: number }>(users);
  const s = row<{ total?: number; today?: number; week?: number; revoked?: number }>(sightings);
  const rr = row<{ total?: number; open?: number }>(road);
  const rd = row<{ open?: number; openPoints?: number; fulfilledPoints?: number }>(redemptions);
  const days = new Map((daily.results as { day: string; n: number }[]).map((d) => [d.day, d.n]));
  return c.json({
    generatedAt: nowIso(),
    users: { total: u.total ?? 0, new7: u.new7 ?? 0, active7: u.active7 ?? 0, friends: u.friends ?? 0, plus: u.plus ?? 0 },
    sightings: { total: s.total ?? 0, today: s.today ?? 0, week: s.week ?? 0, revoked: s.revoked ?? 0, rareWeek: row<{ n?: number }>(rareWeek).n ?? 0 },
    roadReports: { total: rr.total ?? 0, open: rr.open ?? 0 },
    redemptions: { open: rd.open ?? 0, openPoints: rd.openPoints ?? 0, fulfilledPoints: rd.fulfilledPoints ?? 0 },
    aiToday: row<{ n?: number }>(ai).n ?? 0,
    daily: Array.from({ length: 14 }, (_, i) => {
      const day = jstDate(now - (13 - i) * DAY);
      return { day, sightings: days.get(day) ?? 0 };
    }),
    topSpecies: top.results,
  });
});

// ───────── 景品の交換申請 ─────────

adminApp.get('/redemptions', async (c) => {
  const status = c.req.query('status') ?? 'requested';
  const limit = clampLimit(c.req.query('limit'), 100, 300);
  const filter = (REDEMPTION_STATUS as readonly string[]).includes(status) ? 'WHERE r.status = ?' : '';
  const stmt = c.env.DB.prepare(
    `SELECT r.id, r.user_id AS userId, r.reward_id AS rewardId, r.points, r.status, r.note, r.created_at AS createdAt,
       r.updated_at AS updatedAt, u.display_name AS displayName, u.nickname, u.is_friend AS isFriend
     FROM redemptions r LEFT JOIN users u ON u.id = r.user_id ${filter} ORDER BY r.created_at ${status === 'requested' ? 'ASC' : 'DESC'} LIMIT ${limit}`,
  );
  const { results } = await (filter ? stmt.bind(status) : stmt).all<Record<string, unknown>>();
  return c.json({
    redemptions: results.map((r) => ({
      ...r,
      isFriend: !!r.isFriend,
      rewardTitle: REWARDS.find((x) => x.id === r.rewardId)?.title ?? (r.rewardId as string),
    })),
  });
});

adminApp.patch('/redemptions/:id', async (c) => {
  const id = c.req.param('id');
  const { status, note } = await body<{ status: string; note: string }>(c);
  if (status !== undefined && !(REDEMPTION_STATUS as readonly string[]).includes(status)) return c.json({ error: 'invalid_status' }, 400);
  const row = await c.env.DB.prepare('SELECT status FROM redemptions WHERE id = ?').bind(id).first<{ status: string }>();
  if (!row) return c.json({ error: 'not_found' }, 404);
  await c.env.DB.prepare('UPDATE redemptions SET status = COALESCE(?, status), note = COALESCE(?, note), updated_at = ? WHERE id = ?')
    .bind(status ?? null, typeof note === 'string' ? note.trim().slice(0, 200) : null, nowIso(), id)
    .run();
  await logAction(c.env, 'redemption.update', id, `${row.status} → ${status ?? row.status}${typeof note === 'string' ? ` / ${note.slice(0, 100)}` : ''}`);
  return c.json({ ok: true });
});

// ───────── 記録の確認（不正の取り消し） ─────────

adminApp.get('/sightings', async (c) => {
  const filter = c.req.query('filter') ?? 'all';
  const limit = clampLimit(c.req.query('limit'), 60, 200);
  const before = c.req.query('before');
  const where: string[] = [];
  const binds: unknown[] = [];
  if (filter === 'rare') {
    where.push(`s.species_id IN (${RARE_IDS.map(() => '?').join(',')}) AND s.revoked_at IS NULL`);
    binds.push(...RARE_IDS);
  } else if (filter === 'photo') where.push('s.photo_key IS NOT NULL AND s.revoked_at IS NULL');
  else if (filter === 'road') where.push('s.road_report IS NOT NULL');
  else if (filter === 'revoked') where.push('s.revoked_at IS NOT NULL');
  if (before && !Number.isNaN(Date.parse(before))) {
    where.push('s.received_at < ?');
    binds.push(before);
  }
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, u.display_name AS displayName, u.nickname AS userNickname FROM sightings s LEFT JOIN users u ON u.id = s.user_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY s.received_at DESC LIMIT ${limit}`,
  )
    .bind(...binds)
    .all<Record<string, unknown>>();
  return c.json({
    sightings: results.map((r) => ({
      ...rowToSighting(r),
      userId: r.user_id as string,
      displayName: (r.displayName as string | null) ?? '',
      userNickname: (r.userNickname as string | null) ?? '',
      revokedAt: (r.revoked_at as string | null) ?? null,
      revokeReason: (r.revoke_reason as string | null) ?? null,
      // サーバーが受け取った日時（次のページの before に使う。created_at は端末の申告なので並び順に使わない）
      receivedAt: (r.received_at as string | null) ?? null,
    })),
  });
});

adminApp.post('/sightings/:id/revoke', async (c) => {
  const id = c.req.param('id');
  const { reason } = await body<{ reason: string }>(c);
  const why = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 100) : 'その他';
  const r = await c.env.DB.prepare('UPDATE sightings SET revoked_at = ?, revoke_reason = ? WHERE id = ? AND revoked_at IS NULL')
    .bind(nowIso(), why, id)
    .run();
  if (r.meta.changes === 0) {
    const exists = await c.env.DB.prepare('SELECT 1 FROM sightings WHERE id = ?').bind(id).first();
    return exists ? c.json({ ok: true, already: true }) : c.json({ error: 'not_found' }, 404);
  }
  await logAction(c.env, 'sighting.revoke', id, why);
  return c.json({ ok: true });
});

adminApp.post('/sightings/:id/restore', async (c) => {
  const id = c.req.param('id');
  const r = await c.env.DB.prepare('UPDATE sightings SET revoked_at = NULL, revoke_reason = NULL WHERE id = ?').bind(id).run();
  if (r.meta.changes === 0) return c.json({ error: 'not_found' }, 404);
  await logAction(c.env, 'sighting.restore', id);
  return c.json({ ok: true });
});

adminApp.get('/photos/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT photo_key FROM sightings WHERE id = ?').bind(c.req.param('id')).first<{ photo_key: string | null }>();
  if (!row?.photo_key) return c.json({ error: 'not_found' }, 404);
  const obj = await c.env.PHOTOS.get(`${row.photo_key}${c.req.query('size') === 'full' ? '.jpg' : '_thumb.jpg'}`);
  if (!obj) return c.json({ error: 'not_found' }, 404);
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg', 'Cache-Control': 'private, no-store' } });
});

// ───────── 路上レポート ─────────

adminApp.get('/road-reports', async (c) => {
  const status = c.req.query('status') ?? 'new';
  const limit = clampLimit(c.req.query('limit'), 100, 300);
  const filter = (ROAD_STATUS as readonly string[]).includes(status) ? 'WHERE r.status = ?' : '';
  const stmt = c.env.DB.prepare(
    `SELECT r.sighting_id AS id, r.type, r.species_id AS speciesId, r.area_id AS areaId, r.lat, r.lng, r.observed_at AS observedAt,
       r.status, r.updated_at AS updatedAt, s.photo_key IS NOT NULL AS hasPhoto, s.memo, s.revoked_at AS revokedAt
     FROM road_reports r LEFT JOIN sightings s ON s.id = r.sighting_id ${filter} ORDER BY r.observed_at DESC LIMIT ${limit}`,
  );
  const { results } = await (filter ? stmt.bind(status) : stmt).all<Record<string, unknown>>();
  return c.json({ roadReports: results.map((r) => ({ ...r, hasPhoto: !!r.hasPhoto })) });
});

adminApp.patch('/road-reports/:id', async (c) => {
  const id = c.req.param('id');
  const { status } = await body<{ status: string }>(c);
  if (!status || !(ROAD_STATUS as readonly string[]).includes(status)) return c.json({ error: 'invalid_status' }, 400);
  const r = await c.env.DB.prepare('UPDATE road_reports SET status = ?, updated_at = ? WHERE sighting_id = ?').bind(status, nowIso(), id).run();
  if (r.meta.changes === 0) return c.json({ error: 'not_found' }, 404);
  await logAction(c.env, 'road_report.update', id, status);
  return c.json({ ok: true });
});

// ───────── 提携先（自治体・保護機関）のキー ─────────

adminApp.get('/partners', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT id, name, scope, created_at AS createdAt FROM partners ORDER BY created_at DESC').all();
  return c.json({ partners: results });
});

adminApp.post('/partners', async (c) => {
  const { name, scope } = await body<{ name: string; scope: string[] | 'all' }>(c);
  const label = typeof name === 'string' ? name.trim().slice(0, 60) : '';
  if (!label) return c.json({ error: 'name_required' }, 400);
  const areas = scope === 'all' ? 'all' : Array.isArray(scope) ? scope.filter((a) => typeof a === 'string' && AREA_BY_ID[a]) : [];
  if (areas !== 'all' && areas.length === 0) return c.json({ error: 'scope_required' }, 400);
  const id = crypto.randomUUID();
  const apiKey = newPartnerKey();
  const scopeText = areas === 'all' || areas.length === AREAS.length ? 'all' : areas.join(',');
  await c.env.DB.prepare('INSERT INTO partners (id, name, api_key_hash, scope, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, label, await sha256Hex(apiKey), scopeText, nowIso())
    .run();
  await logAction(c.env, 'partner.create', id, `${label} (${scopeText})`);
  // キーはこの応答で 1 回だけ返す（保存しているのはハッシュだけ）
  return c.json({ partner: { id, name: label, scope: scopeText, createdAt: nowIso() }, apiKey });
});

adminApp.delete('/partners/:id', async (c) => {
  const id = c.req.param('id');
  const r = await c.env.DB.prepare('DELETE FROM partners WHERE id = ?').bind(id).run();
  if (r.meta.changes === 0) return c.json({ error: 'not_found' }, 404);
  await logAction(c.env, 'partner.delete', id);
  return c.json({ ok: true });
});

// ───────── ユーザー ─────────

adminApp.get('/users', async (c) => {
  const q = (c.req.query('q') ?? '').trim().slice(0, 40);
  const limit = clampLimit(c.req.query('limit'), 50, 100);
  const like = `%${q.replace(/[%_]/g, '')}%`;
  const { results: users } = await c.env.DB.prepare(
    `SELECT id, display_name AS displayName, nickname, picture_url AS pictureUrl, is_friend AS isFriend, plus_until AS plusUntil,
       created_at AS createdAt, last_seen_at AS lastSeenAt FROM users
     ${q ? 'WHERE display_name LIKE ?1 OR nickname LIKE ?1' : ''} ORDER BY COALESCE(last_seen_at, created_at) DESC LIMIT ${limit}`,
  )
    .bind(...(q ? [like] : []))
    .all<Record<string, unknown>>();
  if (users.length === 0) return c.json({ users: [] });
  const ids = users.map((u) => u.id as string);
  const inList = ids.map(() => '?').join(',');
  const [sightings, drives, spent] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT * FROM sightings WHERE user_id IN (${inList}) AND revoked_at IS NULL`).bind(...ids),
    c.env.DB.prepare(`SELECT user_id AS userId, COUNT(*) AS n FROM safe_drives WHERE user_id IN (${inList}) GROUP BY user_id`).bind(...ids),
    c.env.DB.prepare(
      `SELECT user_id AS userId, COALESCE(SUM(points), 0) AS n FROM redemptions WHERE user_id IN (${inList}) AND status <> 'cancelled' GROUP BY user_id`,
    ).bind(...ids),
  ]);
  const byUser = new Map<string, ReturnType<typeof rowToSighting>[]>();
  for (const r of sightings.results as Record<string, unknown>[]) {
    const list = byUser.get(r.user_id as string) ?? [];
    list.push(rowToSighting(r));
    byUser.set(r.user_id as string, list);
  }
  const driveMap = new Map((drives.results as { userId: string; n: number }[]).map((d) => [d.userId, d.n]));
  const spentMap = new Map((spent.results as { userId: string; n: number }[]).map((d) => [d.userId, d.n]));
  const month = currentMonth();
  return c.json({
    users: users.map((u) => {
      const list = byUser.get(u.id as string) ?? [];
      const points = computePoints(list, month, driveMap.get(u.id as string) ?? 0);
      return {
        ...u,
        isFriend: !!u.isFriend,
        plus: !!u.plusUntil && Date.parse(u.plusUntil as string) > Date.now(),
        sightings: list.length,
        species: new Set(list.map((s) => s.speciesId).filter(Boolean)).size,
        points,
        balance: Math.max(0, points - (spentMap.get(u.id as string) ?? 0)),
        level: levelFor(points).level,
      };
    }),
  });
});

// ───────── 操作の記録 ─────────

adminApp.get('/actions', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT action, target_id AS targetId, detail, created_at AS createdAt FROM admin_actions ORDER BY created_at DESC LIMIT 100').all();
  return c.json({ actions: results });
});
