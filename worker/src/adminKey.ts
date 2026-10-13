/**
 * 管理キー・提携先キーの純粋な関数（Cloudflare の型に依存しないので、テストからそのまま読める）
 */
import { b64url, sha256Hex, timingSafeEqual } from './crypto';

/** 管理キーが正しいか（キーは 24 文字以上。ハッシュの比較は時間一定） */
export async function isAdminKey(key: string | null | undefined, expectedSha256: string | null | undefined): Promise<boolean> {
  if (!key || !expectedSha256 || key.length < 24) return false;
  return timingSafeEqual(await sha256Hex(key), expectedSha256.trim().toLowerCase());
}

/** 新しい提携先キー（pk_ ＋ 32 バイトの乱数） */
export function newPartnerKey(): string {
  return `pk_${b64url(crypto.getRandomValues(new Uint8Array(32)))}`;
}
