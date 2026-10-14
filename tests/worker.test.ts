import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { jstDate, jstMidnightIso, readSession, signSession, verifyLineSignature, verifySession } from '../worker/src/crypto';
import { normalizeCandidates } from '../worker/src/identify';
import { identifyResultMessage } from '../worker/src/line';
import { parseSightingMeta, ValidationError } from '../worker/src/validate';

const NOW = Date.parse('2026-10-10T03:00:00Z');

describe('session tokens', () => {
  it('round-trips and rejects tampering or expiry', async () => {
    const token = await signSession('U123', 'secret', NOW);
    expect(await verifySession(token, 'secret', NOW)).toBe('U123');
    expect(await verifySession(token, 'other-secret', NOW)).toBeNull();
    const [h, , s] = token.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ sub: 'Uadmin', exp: 9e9 })).toString('base64url')}.${s}`;
    expect(await verifySession(forged, 'secret', NOW)).toBeNull();
    expect(await verifySession(token, 'secret', NOW + 31 * 86400000)).toBeNull();
  });

  it('carries the issue time (退会の前に発行したログインを見分ける)', async () => {
    const token = await signSession('U123', 'secret', NOW + 123);
    expect(await readSession(token, 'secret', NOW)).toEqual({ sub: 'U123', issuedAt: NOW + 123 });
    // 発行日時のない古い形式は、期限（30日後）から逆算する
    const [h, , ] = token.split('.');
    const legacyPayload = Buffer.from(JSON.stringify({ sub: 'U123', exp: Math.floor(NOW / 1000) + 30 * 86400 })).toString('base64url');
    const sig = createHmac('sha256', 'secret').update(`${h}.${legacyPayload}`).digest('base64url');
    expect(await readSession(`${h}.${legacyPayload}.${sig}`, 'secret', NOW)).toEqual({ sub: 'U123', issuedAt: Math.floor(NOW / 1000) * 1000 });
  });
});

describe('LINE webhook signature', () => {
  it('matches the official HMAC-SHA256/base64 scheme', async () => {
    const body = JSON.stringify({ events: [{ type: 'follow' }] });
    const sig = createHmac('sha256', 'channel-secret').update(body).digest('base64');
    expect(await verifyLineSignature('channel-secret', body, sig)).toBe(true);
    expect(await verifyLineSignature('channel-secret', `${body} `, sig)).toBe(false);
    expect(await verifyLineSignature('channel-secret', body, null)).toBe(false);
  });
});

describe('JST helpers', () => {
  it('uses Japan dates for daily limits', () => {
    expect(jstDate(Date.parse('2026-10-09T15:30:00Z'))).toBe('2026-10-10');
    expect(jstMidnightIso(Date.parse('2026-10-09T15:30:00Z'))).toBe('2026-10-09T15:00:00.000Z');
  });
});

describe('sighting validation', () => {
  const base = {
    id: '0b6f6a52-6a8b-4b8e-9d7a-1a2b3c4d5e6f',
    speciesId: 'kurosagi',
    nickname: 'クロすけ',
    memo: '岩場で',
    observedAt: '2026-10-10T10:00:00+09:00',
    createdAt: '2026-10-10T10:00:00+09:00',
    areaId: 'tatsugo',
    kind: 'photo',
  };

  it('normalizes a valid sighting and rounds coordinates', () => {
    const s = parseSightingMeta({ ...base, lat: 28.4123456, lng: 129.5987654 }, NOW);
    expect(s).toMatchObject({ speciesId: 'kurosagi', lat: 28.412, lng: 129.599, locationProtected: false, roadReport: null });
  });

  it('never stores coordinates for sensitive species, even if the client sends them', () => {
    const s = parseSightingMeta({ ...base, speciesId: 'amami-ishikawagaeru', lat: 28.3, lng: 129.3 }, NOW);
    expect(s.lat).toBeNull();
    expect(s.lng).toBeNull();
    expect(s.locationProtected).toBe(true);
  });

  it('keeps precise road-report coordinates only inside the Amami region', () => {
    const inside = parseSightingMeta({ ...base, roadReport: 'roadkill', reportLat: 28.35, reportLng: 129.38 }, NOW);
    expect(inside).toMatchObject({ roadReport: 'roadkill', reportLat: 28.35, reportLng: 129.38, nickname: '' });
    const outside = parseSightingMeta({ ...base, roadReport: 'roadkill', reportLat: 35.6, reportLng: 139.7 }, NOW);
    expect(outside.reportLat).toBeNull();
  });

  it('rejects bad input', () => {
    expect(() => parseSightingMeta({ ...base, speciesId: 'unknown-animal' }, NOW)).toThrow(ValidationError);
    expect(() => parseSightingMeta({ ...base, areaId: 'tokyo' }, NOW)).toThrow(ValidationError);
    expect(() => parseSightingMeta({ ...base, id: '../etc' }, NOW)).toThrow(ValidationError);
    expect(() => parseSightingMeta({ ...base, observedAt: '2026-12-01T00:00:00Z' }, NOW)).toThrow(ValidationError);
    expect(() => parseSightingMeta(null, NOW)).toThrow(ValidationError);
  });

  it('truncates long text', () => {
    const s = parseSightingMeta({ ...base, memo: 'あ'.repeat(800), nickname: 'い'.repeat(50) }, NOW);
    expect(s.memo).toHaveLength(500);
    expect(s.nickname).toHaveLength(24);
  });
});

describe('AI candidates', () => {
  it('drops unknown ids, clamps confidence and keeps the top 3', () => {
    const out = normalizeCandidates([
      { speciesId: 'kurosagi', confidence: 0.4, reason: 'a' },
      { speciesId: 'not-a-species', confidence: 0.99, reason: 'b' },
      { speciesId: 'misago', confidence: 1.7, reason: 'c' },
      { speciesId: 'isohiyodori', confidence: -1, reason: 'd' },
      { speciesId: 'unknown', confidence: 0.1, reason: 'e' },
    ]);
    expect(out.map((c) => c.speciesId)).toEqual(['misago', 'kurosagi', 'unknown']);
    expect(out[0].confidence).toBe(1);
  });

  it('builds a LINE reply that deep-links into the LIFF capture screen', () => {
    const msg = identifyResultMessage('1234-abcd', '987', [{ speciesId: 'rurikakesu', confidence: 0.83, reason: '瑠璃色の翼' }], 0) as {
      altText: string;
      contents: { footer: { contents: { action: { uri: string } }[] } };
    };
    expect(msg.altText).toContain('ルリカケス');
    expect(msg.contents.footer.contents[0].action.uri).toBe('https://liff.line.me/1234-abcd/capture?inbox=987&species=rurikakesu');
  });
});

describe('admin key', () => {
  it('accepts only the key whose SHA-256 matches, and needs 24+ characters', async () => {
    const { isAdminKey, newPartnerKey } = await import('../worker/src/adminKey');
    const { sha256Hex } = await import('../worker/src/crypto');
    const key = 'ak_0123456789abcdefghijklmnop';
    const hash = await sha256Hex(key);
    expect(await isAdminKey(key, hash)).toBe(true);
    expect(await isAdminKey(key, hash.toUpperCase())).toBe(true);
    expect(await isAdminKey(`${key}x`, hash)).toBe(false);
    expect(await isAdminKey(key, undefined)).toBe(false);
    expect(await isAdminKey('short', await sha256Hex('short'))).toBe(false);
    expect(await isAdminKey(null, hash)).toBe(false);
    const p1 = newPartnerKey();
    expect(p1).toMatch(/^pk_[A-Za-z0-9_-]{43}$/);
    expect(newPartnerKey()).not.toBe(p1);
  });
});
