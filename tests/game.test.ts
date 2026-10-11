import { describe, expect, it } from 'vitest';
import { dailyMissions, visitStreak } from '../src/lib/missions';
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
  const noon = new Date(2026, 9, 10, 12).toISOString();

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
    const yesterday = new Date(2026, 9, 9, 12).toISOString();
    const m = dailyMissions({
      sightings: [sighting(yesterday)],
      daily: { date: '2026-10-09', viewed: ['a', 'b', 'c'], celebrated: true },
      safeDriveDates: ['2026-10-09'],
      today,
    });
    expect(m.filter((x) => x.done)).toHaveLength(0);
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
