import { describe, expect, it } from 'vitest';
import { dailyMissions, dayKey, visitStreak } from '../src/lib/missions';
import { levelFor, MAX_LEVEL, pointsForLevel } from '../src/lib/progress';
import type { Sighting } from '../src/lib/types';

describe('levelFor', () => {
  it('はじめは Lv1、20pt で Lv2、200pt で Lv5', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, base: 0, next: 20, toNext: 20, progress: 0 });
    expect(levelFor(19).level).toBe(1);
    expect(levelFor(20).level).toBe(2);
    expect(levelFor(199).level).toBe(4);
    expect(levelFor(200).level).toBe(5);
  });

  it('レベルの中の進み具合と、次までのポイント', () => {
    // Lv2 は 20〜59pt
    const l = levelFor(40);
    expect(l.level).toBe(2);
    expect(l.progress).toBeCloseTo(0.5);
    expect(l.toNext).toBe(20);
  });

  it('上限のレベルでは次がない', () => {
    const l = levelFor(pointsForLevel(MAX_LEVEL) + 10_000);
    expect(l).toMatchObject({ level: MAX_LEVEL, next: null, toNext: 0, progress: 1 });
  });
});

describe('visitStreak', () => {
  it('きょうまで続いた日数を数える', () => {
    expect(visitStreak(['2026-10-10', '2026-10-09', '2026-10-08', '2026-10-06'], '2026-10-10')).toBe(3);
  });
  it('きょうまだ開いていなければ、きのうまでの日数', () => {
    expect(visitStreak(['2026-10-09', '2026-10-08'], '2026-10-10')).toBe(2);
  });
  it('月をまたいでも続く', () => {
    expect(visitStreak(['2026-11-01', '2026-10-31'], '2026-11-01')).toBe(2);
  });
  it('途切れていたら 0', () => {
    expect(visitStreak(['2026-10-07'], '2026-10-10')).toBe(0);
  });
});

describe('dailyMissions', () => {
  const sighting = (createdAt: string, extra: Partial<Sighting> = {}): Sighting => ({
    id: createdAt,
    speciesId: 'kurosagi',
    nickname: '',
    memo: '',
    observedAt: createdAt,
    createdAt,
    areaId: null,
    lat: null,
    lng: null,
    locationProtected: false,
    photoId: null,
    kind: 'photo',
    ...extra,
  });
  const today = '2026-10-10';
  const noon = '2026-10-10T12:00:00+09:00';

  it('何もしていなければ 0 / 3', () => {
    const m = dailyMissions({ sightings: [], daily: { date: '', viewed: [], celebrated: false }, safeDriveDates: [], today });
    expect(m.filter((x) => x.done)).toHaveLength(0);
  });

  it('きょうの記録・図鑑 3 種・宣言で全部達成', () => {
    const m = dailyMissions({
      sightings: [sighting(noon)],
      daily: { date: today, viewed: ['a', 'b', 'c', 'd'], celebrated: false },
      safeDriveDates: [today],
      today,
    });
    expect(m.every((x) => x.done)).toBe(true);
    expect(m.find((x) => x.id === 'study')?.current).toBe(3);
  });

  it('前の日の記録と、前の日に見た種は数えない', () => {
    const yesterday = '2026-10-09T23:59:00+09:00';
    const m = dailyMissions({
      sightings: [sighting(yesterday)],
      daily: { date: '2026-10-09', viewed: ['a', 'b', 'c'], celebrated: true },
      safeDriveDates: ['2026-10-09'],
      today,
    });
    expect(m.filter((x) => x.done)).toHaveLength(0);
  });

  it('1日の区切りは日本時間（サーバーと同じ）', () => {
    expect(dayKey('2026-10-10T14:59:00Z')).toBe('2026-10-10');
    expect(dayKey('2026-10-10T15:00:00Z')).toBe('2026-10-11');
    const m = dailyMissions({
      sightings: [sighting('2026-10-09T15:30:00Z')],
      daily: { date: '', viewed: [], celebrated: false },
      safeDriveDates: [],
      today,
    });
    expect(m.find((x) => x.id === 'record')?.done).toBe(true);
  });

  it('サーバーが受け付けなかった記録は数えない', () => {
    const m = dailyMissions({
      sightings: [sighting(noon, { syncState: 'rejected' })],
      daily: { date: '', viewed: [], celebrated: false },
      safeDriveDates: [],
      today,
    });
    expect(m.find((x) => x.id === 'record')?.done).toBe(false);
  });
});

describe('まだ見つけていない種（？？？）', () => {
  it('名前を隠したまま見せる文（さがしかたのコツ・観察マナー・危険）に、その種の名前が入っていない', async () => {
    const { SPECIES } = await import('../src/data/species');
    const leaks: string[] = [];
    for (const s of SPECIES) {
      // 「オカヤドカリの仲間」は「オカヤドカリ」で調べる。nameBreak の 3 文字以上の部分（クロウサギ など）も調べる
      const base = s.name.replace(/の仲間$/, '');
      const parts = [base, ...(s.nameBreak ?? '').split('|').map((p) => p.replace(/の仲間$/, ''))].filter((p) => p.length >= 3 && p !== 'アマミ');
      for (const field of ['tip', 'manner', 'danger'] as const) {
        const text = s[field];
        if (!text) continue;
        for (const p of parts) if (text.includes(p)) leaks.push(`${s.name}.${field} に「${p}」`);
      }
    }
    expect(leaks).toEqual([]);
  });

  it('図鑑の検索は、ゲットした種だけ名前で見つかり、まだの種は番号で見つかる', async () => {
    const { searchZukan, SPECIES } = await import('../src/data/species');
    const none = new Set<string>();
    const found = new Set(['amami-kurousagi']);
    expect(searchZukan('くろうさぎ', none)).toEqual([]);
    expect(searchZukan('Pentalagus', none)).toEqual([]);
    expect(searchZukan('くろうさぎ', found).map((s) => s.id)).toEqual(['amami-kurousagi']);
    expect(searchZukan('1', none).map((s) => s.no)).toEqual([1]);
    expect(searchZukan('No.012', none).map((s) => s.no)).toEqual([12]);
    expect(searchZukan('no012', none).map((s) => s.no)).toEqual([12]);
    expect(searchZukan('007', none).map((s) => s.no)).toEqual([7]);
    expect(searchZukan('999', none)).toEqual([]);
    expect(searchZukan('', none)).toHaveLength(SPECIES.length);
  });
});

describe('連続日数の記録', () => {
  it('60日を超えても連続日数が止まらない', async () => {
    const { vi } = await import('vitest');
    const { useStore } = await import('../src/store/useStore');
    vi.useFakeTimers();
    try {
      const start = Date.parse('2026-01-01T12:00:00+09:00');
      for (let i = 0; i < 100; i++) {
        vi.setSystemTime(start + i * 86400000);
        useStore.getState().markVisit();
      }
      const { visitDates } = useStore.getState().settings;
      expect(visitStreak(visitDates, dayKey())).toBe(100);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('位置を保存しない種', () => {
  it('幻の種と、採集・営巣の注意がある種は、すべて sensitive', async () => {
    const { SPECIES } = await import('../src/data/species');
    const missing = SPECIES.filter((s) => (s.rarity === 4 || /採集|採取|営巣|盗掘/.test(s.manner ?? '')) && !s.sensitive).map((s) => s.id);
    expect(missing).toEqual([]);
  });
});
