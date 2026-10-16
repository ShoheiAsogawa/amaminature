import { describe, expect, it } from 'vitest';
import { CLOSERS, OPENERS, canBreakBetween, phrases } from '../src/lib/phrases';

describe('phrases（文節で折り返す）', () => {
  it('括弧の中で「法な／ど）」のように切らず、括弧を前後の文節に付ける', () => {
    const ps = phrases('分野ごとの連邦法や州法（カリフォルニア州の消費者プライバシー法など）があります。');
    expect(ps.join('')).toBe('分野ごとの連邦法や州法（カリフォルニア州の消費者プライバシー法など）があります。');
    for (const p of ps) {
      expect(CLOSERS.includes(p[0])).toBe(false);
      expect(OPENERS.includes(p[p.length - 1])).toBe(false);
    }
    expect(ps.some((p) => p.endsWith('など）'))).toBe(true);
  });

  it('和文に接した半角スペースは折り返さない（「最長 30 日間」）', () => {
    const ps = phrases('データを最長 30 日間保存します');
    expect(ps.join('')).toBe('データを最長 30 日間保存します');
    expect(ps.join('')).not.toContain(' ');
  });

  it('閉じ括弧・句読点の前、開き括弧の後では折り返さない', () => {
    expect(canBreakBetween('アマミノクロウサギ', '）')).toBe(false);
    expect(canBreakBetween('「', 'ルリカケス')).toBe(false);
    expect(canBreakBetween('森の', 'なかで')).toBe(true);
  });
});
