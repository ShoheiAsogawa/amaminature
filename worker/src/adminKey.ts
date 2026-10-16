/**
 * 管理キー・提携先キーの純粋な関数（Cloudflare の型に依存しないので、テストからそのまま読める）
 */
import { sha256Hex, timingSafeEqual } from './crypto';

/** 管理キーが正しいか（キーは 24 文字以上。ハッシュの比較は時間一定） */
export async function isAdminKey(key: string | null | undefined, expectedSha256: string | null | undefined): Promise<boolean> {
  if (!key || !expectedSha256 || key.length < 24) return false;
  return timingSafeEqual(await sha256Hex(key), expectedSha256.trim().toLowerCase());
}

/**
 * 新しい提携先キー（pk_ ＋ 32 バイトの乱数の 16 進数）。
 * 画面のドット文字は 0 と O、I と l が見分けにくいので、英字の大文字・小文字の混ざらない 16 進数にする（前に発行したキーもそのまま使える）
 */
export function newPartnerKey(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
  return `pk_${hex}`;
}
