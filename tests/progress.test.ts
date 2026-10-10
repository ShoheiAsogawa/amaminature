import { describe, expect, it } from 'vitest';
import { SPECIES, SPECIES_BY_ID, normalize, searchSpecies } from '../src/data/species';
import { nearestArea, protectLocation } from '../src/lib/geo';
import {
  computePoints,
  computeStats,
  currentMonth,
  earnedBadges,
  monthOf,
  pointsForNewSighting,
  questProgress,
  rankFor,
  REPEAT_POINTS,
  RESCUE_REPORT_POINTS,
  SAFE_DRIVE_POINTS,
} from '../src/lib/progress';
import { QUESTS } from '../src/data/quests';
import type { Sighting } from '../src/lib/types';

let n = 0;
function sighting(speciesId: string | null, patch: Partial<Sighting> = {}): Sighting {
  n++;
  return {
    id: `s${n}`,
    speciesId,
    nickname: '',
    memo: '',
    observedAt: '2026-10-10T12:00:00+09:00',
    createdAt: '2026-10-10T12:00:00+09:00',
    areaId: 'amami',
    lat: null,
    lng: null,
    locationProtected: false,
    photoId: null,
    kind: 'photo',
    ...patch,
  };
}

describe('species data', () => {
  it('has unique ids and sequential numbers', () => {
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(SPECIES.length);
    SPECIES.forEach((s, i) => expect(s.no).toBe(i + 1));
  });

  it('has valid months and required text', () => {
    for (const s of SPECIES) {
      expect(s.months.length).toBeGreaterThan(0);
      expect(s.months.every((m) => m >= 1 && m <= 12)).toBe(true);
      expect(s.description.length).toBeGreaterThan(10);
      expect(s.tip.length).toBeGreaterThan(5);
    }
  });

  it('marks the most poaching-prone species as sensitive', () => {
    for (const id of ['amami-kurousagi', 'amami-ishikawagaeru', 'amami-marubane', 'amami-ebine', 'amami-seishika']) {
      expect(SPECIES_BY_ID[id].sensitive).toBe(true);
    }
  });

  it('searches with hiragana, katakana and scientific names', () => {
    expect(normalize('るりかけす')).toBe('ルリカケス');
    expect(searchSpecies('るりかけす').map((s) => s.id)).toContain('rurikakesu');
    expect(searchSpecies('Pentalagus').map((s) => s.id)).toContain('amami-kurousagi');
    expect(searchSpecies('')).toHaveLength(SPECIES.length);
  });
});

describe('location protection', () => {
  it('drops coordinates for sensitive species', () => {
    expect(protectLocation(SPECIES_BY_ID['amami-kurousagi'], 28.3, 129.4)).toEqual({ lat: null, lng: null, locationProtected: true });
  });

  it('rounds coordinates to ~100m for other species', () => {
    expect(protectLocation(SPECIES_BY_ID.kurosagi, 28.123456, 129.987654)).toEqual({ lat: 28.123, lng: 129.988, locationProtected: false });
  });

  it('finds the nearest municipality and rejects places outside the islands', () => {
    expect(nearestArea(28.38, 129.5)?.area.id).toBe('amami'); // 名瀬
    expect(nearestArea(28.27, 129.4)?.area.id).toBe('amami'); // 住用
    expect(nearestArea(27.05, 128.42)?.area.id).toBe('yoron');
    expect(nearestArea(35.68, 139.76)).toBeNull(); // 東京
  });
});

describe('time zone', () => {
  it('counts months in Japan time regardless of the runtime time zone', () => {
    // 11/1 05:00 JST = 10/31 20:00 UTC
    expect(monthOf('2026-10-31T20:00:00Z')).toBe(11);
    expect(currentMonth(new Date('2026-12-31T16:00:00Z'))).toBe(1);
  });
});

describe('points and ranks', () => {
  it('gives rarity points for the first sighting and repeat points after', () => {
    const a = sighting('kurosagi'); // よく見る 10pt
    const b = sighting('kurosagi', { observedAt: '2026-10-11T08:00:00+09:00' });
    const c = sighting('amami-kurousagi'); // めずらしい 80pt
    expect(computePoints([a, b, c], 10)).toBe(10 + REPEAT_POINTS + 80);
    expect(pointsForNewSighting(b, [a])).toBe(REPEAT_POINTS);
    expect(pointsForNewSighting(c, [a])).toBe(80);
  });

  it('rewards road reports but does not count roadkill as a discovery', () => {
    const roadkill = sighting('amami-kurousagi', { roadReport: 'roadkill' });
    const stats = computeStats([roadkill]);
    expect(stats.discovered).toBe(0);
    expect(stats.roadReports).toBe(1);
    expect(computePoints([roadkill], 10)).toBe(RESCUE_REPORT_POINTS);
    // その後に生きた個体を記録したら、初記録としてフルポイント
    expect(pointsForNewSighting(sighting('amami-kurousagi'), [roadkill])).toBe(80);
  });

  it('adds safe-drive points', () => {
    expect(computePoints([], 10, 3)).toBe(3 * SAFE_DRIVE_POINTS);
  });

  it('computes rank progress', () => {
    expect(rankFor(0).current.title).toBe('島のたまご');
    expect(rankFor(60).current.title).toBe('見習い観察者');
    expect(rankFor(125).progress).toBeCloseTo(0.5);
    expect(rankFor(99999).next).toBeNull();
  });
});

describe('quests and badges', () => {
  it('only counts in-season sightings for seasonal quests', () => {
    const quest = QUESTS.find((q) => q.id === 'autumn-migration')!;
    expect(questProgress(quest, [sighting('sashiba', { observedAt: '2026-10-05T10:00:00+09:00' })], 10).done).toBe(true);
    expect(questProgress(quest, [sighting('sashiba', { observedAt: '2026-01-05T10:00:00+09:00' })], 10).done).toBe(false);
    expect(questProgress(quest, [], 5).active).toBe(false);
  });

  it('tracks count quests by unique species', () => {
    const quest = QUESTS.find((q) => q.id === 'night-debut')!;
    const list = [sighting('amami-kurousagi'), sighting('amami-kurousagi'), sighting('ryukyu-konohazuku')];
    expect(questProgress(quest, list, 10)).toMatchObject({ current: 2, target: 3, done: false });
  });

  it('awards badges', () => {
    const badges = earnedBadges(computeStats([sighting('rurikakesu')]), { pledged: true, safeDriveDays: 5 });
    expect([...badges].sort()).toEqual(['first-step', 'pledge', 'ruri', 'safe-driver'].sort());
  });

  it('counts islands, not municipalities, for the island hopper badge', () => {
    const two = computeStats([sighting('mejiro', { areaId: 'amami' }), sighting('mejiro', { areaId: 'setouchi' })]);
    expect(two.islands.size).toBe(1); // どちらも奄美大島
    const three = computeStats([sighting('mejiro', { areaId: 'amami' }), sighting('mejiro', { areaId: 'yoron' })]);
    expect(three.islands.size).toBe(2);
  });
});
