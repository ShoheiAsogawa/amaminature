/** Web Crypto のユーティリティ（Workers / Node 18+ で動作） */

const enc = new TextEncoder();

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of u8) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function hmacSha256(secret: string, data: string | ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.sign('HMAC', await hmacKey(secret), typeof data === 'string' ? enc.encode(data) : data);
}

export async function sha256Hex(data: string | ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 長さに依存しない比較 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ───────── セッショントークン（HMAC署名つき、JWT互換の簡易形式） ─────────

const SESSION_DAYS = 30;

export async function signSession(userId: string, secret: string, now = Date.now()): Promise<string> {
  const header = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const iat = Math.floor(now / 1000);
  // iatMs: 発行日時（ミリ秒）。退会の直後に作り直したログインを、退会前のものと取り違えないように
  const payload = b64url(enc.encode(JSON.stringify({ sub: userId, iat, iatMs: now, exp: iat + SESSION_DAYS * 86400 })));
  const sig = b64url(await hmacSha256(secret, `${header}.${payload}`));
  return `${header}.${payload}.${sig}`;
}

/** 署名と期限を確かめて、利用者IDと発行日時（ミリ秒）を返す。発行日時のない古いトークンは期限から逆算する */
export async function readSession(token: string, secret: string, now = Date.now()): Promise<{ sub: string; issuedAt: number } | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = b64url(await hmacSha256(secret, `${header}.${payload}`));
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const { sub, exp, iat, iatMs } = JSON.parse(new TextDecoder().decode(b64urlDecode(payload))) as {
      sub?: string;
      exp?: number;
      iat?: number;
      iatMs?: number;
    };
    if (!sub || !exp || exp * 1000 < now) return null;
    const issuedAt = typeof iatMs === 'number' ? iatMs : typeof iat === 'number' ? iat * 1000 : (exp - SESSION_DAYS * 86400) * 1000;
    return { sub, issuedAt };
  } catch {
    return null;
  }
}

export async function verifySession(token: string, secret: string, now = Date.now()): Promise<string | null> {
  return (await readSession(token, secret, now))?.sub ?? null;
}

/** LINE Webhook の署名（X-Line-Signature）を検証 */
export async function verifyLineSignature(channelSecret: string, rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const expected = toBase64(await hmacSha256(channelSecret, rawBody));
  return timingSafeEqual(signature, expected);
}

/** 日本時間の日付 YYYY-MM-DD */
export function jstDate(now = Date.now()): string {
  return new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 日本時間の今日0時（UTCのISO文字列） */
export function jstMidnightIso(now = Date.now()): string {
  return new Date(Date.parse(`${jstDate(now)}T00:00:00+09:00`)).toISOString();
}
