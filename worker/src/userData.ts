/**
 * 利用者のデータの書き出し（開示）と削除（退会・削除の請求）。
 * 利用者の「退会」（DELETE /api/me）と、運営の管理画面（/api/admin/users/:id）の両方から使う。
 */
import { sha256Hex } from './crypto';
import type { Env } from './env';

/** お問い合わせ番号（AN-XXXXXXXX）。LINE ユーザー ID から決まり、画面と問い合わせでアカウントを特定するのに使う */
export async function supportCodeFor(userId: string): Promise<string> {
  return `AN-${(await sha256Hex(`support:${userId}`)).slice(0, 8).toUpperCase()}`;
}

/** 退会した利用者の印に使うハッシュ（LINE ユーザー ID そのものは残さない） */
export function userIdHash(userId: string): Promise<string> {
  return sha256Hex(`deleted:${userId}`);
}

/** R2 の prefix の下を全部消す（1回に1000件ずつ） */
async function deletePrefix(bucket: R2Bucket, prefix: string): Promise<number> {
  let cursor: string | undefined;
  let n = 0;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 1000 });
    const keys = page.objects.map((o) => o.key);
    if (keys.length) await bucket.delete(keys);
    n += keys.length;
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return n;
}

/**
 * 利用者のデータを消す。写真（R2）を先に消してから、データベースの行を消す
 * （途中で失敗しても、もう一度実行すれば残りが消える）。
 * 交換の記録は協賛先との精算のために、利用者と結びつかない形（user_id を置き換え、メモを空に）で残す。
 */
export async function deleteUserData(env: Env, userId: string): Promise<{ photos: number; shares: number }> {
  const hash = await userIdHash(userId);
  const { results: shareRows } = await env.DB.prepare('SELECT id FROM shares WHERE user_id = ?').bind(userId).all<{ id: string }>();
  const shareKeys = shareRows.map((r) => `shares/${r.id}.jpg`);
  for (let i = 0; i < shareKeys.length; i += 1000) await env.PHOTOS.delete(shareKeys.slice(i, i + 1000));
  const photos = (await deletePrefix(env.PHOTOS, `photos/${userId}/`)) + (await deletePrefix(env.PHOTOS, `inbox/${userId}/`));

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM road_reports WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM sightings WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM safe_drives WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM ai_usage WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM shares WHERE user_id = ?').bind(userId),
    env.DB.prepare('DELETE FROM sighting_tombstones WHERE user_id = ?').bind(userId),
    env.DB.prepare(`UPDATE redemptions SET user_id = ?, note = '' WHERE user_id = ?`).bind(`deleted:${hash.slice(0, 12)}`, userId),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId),
    env.DB.prepare('INSERT OR REPLACE INTO deleted_users (id_hash, deleted_at) VALUES (?, ?)').bind(hash, now),
  ]);
  return { photos, shares: shareKeys.length };
}

/** 退会した後に、退会前に発行したログイン（セッション）で来ていないか。issuedAt は発行日時（ミリ秒） */
export async function isRevokedSession(env: Env, userId: string, issuedAt: number): Promise<boolean> {
  const row = await env.DB.prepare('SELECT deleted_at FROM deleted_users WHERE id_hash = ?')
    .bind(await userIdHash(userId))
    .first<{ deleted_at: string }>();
  return !!row && issuedAt <= Date.parse(row.deleted_at);
}

/** 開示の請求に応えるための書き出し（運営の管理画面から）。写真は保存場所の一覧だけを入れる */
export async function exportUserData(env: Env, userId: string) {
  const [user, sightings, roadReports, safeDrives, redemptions, aiUsage, shares] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId),
    env.DB.prepare('SELECT * FROM sightings WHERE user_id = ? ORDER BY observed_at').bind(userId),
    env.DB.prepare('SELECT * FROM road_reports WHERE user_id = ? ORDER BY observed_at').bind(userId),
    env.DB.prepare('SELECT date, created_at FROM safe_drives WHERE user_id = ? ORDER BY date').bind(userId),
    env.DB.prepare('SELECT id, reward_id, points, status, note, created_at, updated_at FROM redemptions WHERE user_id = ? ORDER BY created_at').bind(userId),
    env.DB.prepare('SELECT date, count FROM ai_usage WHERE user_id = ? ORDER BY date').bind(userId),
    env.DB.prepare('SELECT id, created_at FROM shares WHERE user_id = ? ORDER BY created_at').bind(userId),
  ]);
  if (!user.results.length) return null;
  return {
    exportedAt: new Date().toISOString(),
    user: user.results[0] as Record<string, unknown>,
    sightings: sightings.results,
    roadReports: roadReports.results,
    safeDrives: safeDrives.results,
    redemptions: redemptions.results,
    aiUsage: aiUsage.results,
    shares: shares.results,
  };
}
