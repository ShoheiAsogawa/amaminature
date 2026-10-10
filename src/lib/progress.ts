import { AREA_BY_ID } from '../data/areas';
import { QUESTS } from '../data/quests';
import { CATEGORY_ORDER, RARITY_META, SPECIES, SPECIES_BY_ID } from '../data/species';
import type { Category, Quest, Species } from '../data/types';
import type { Sighting } from './types';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASON_LABEL: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

export function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

const JST_OFFSET_MS = 9 * 3600 * 1000;

/** 観察した月（奄美の現地時間＝日本時間で数える。端末やサーバーのタイムゾーンに依存しない） */
export function monthOf(iso: string): number {
  return new Date(Date.parse(iso) + JST_OFFSET_MS).getUTCMonth() + 1;
}

/** 今の月（日本時間） */
export function currentMonth(now: Date = new Date()): number {
  return new Date(now.getTime() + JST_OFFSET_MS).getUTCMonth() + 1;
}

/** 同じ種を2回目以降に記録したときのポイント */
export const REPEAT_POINTS = 5;
/** 図鑑にない生き物の記録ポイント */
export const CUSTOM_POINTS = 5;
/** ロードキル・けがをした動物の報告（保全ポイント） */
export const RESCUE_REPORT_POINTS = 20;
/** 路上にいた生き物の注意情報ボーナス */
export const ON_ROAD_BONUS = 10;
/** セーフドライブ宣言（1日1回） */
export const SAFE_DRIVE_POINTS = 10;

/** 図鑑の「発見」に数える記録か（死体・けがの報告は数えない） */
export function countsForCollection(s: Sighting): boolean {
  return s.roadReport !== 'roadkill' && s.roadReport !== 'injured';
}

export interface Stats {
  total: number;
  speciesIds: Set<string>;
  discovered: number;
  byCategory: Record<Category, { found: number; total: number }>;
  nocturnal: number;
  endemic: number;
  aqua: number;
  bird: number;
  legendary: number;
  mangrove: number;
  areas: Set<string>;
  islands: Set<string>;
  seasons: Set<Season>;
  photos: number;
  /** 路上レポート数（ロードキル・けが・路上） */
  roadReports: number;
}

const MANGROVE_IDS = new Set(['ohirugi', 'mehirugi', 'minami-tobihaze', 'shiomaneki']);

export function computeStats(sightings: Sighting[]): Stats {
  const speciesIds = new Set<string>();
  const areas = new Set<string>();
  const islands = new Set<string>();
  const seasons = new Set<Season>();
  let photos = 0;
  let roadReports = 0;

  for (const s of sightings) {
    if (s.roadReport) roadReports++;
    if (s.speciesId && SPECIES_BY_ID[s.speciesId] && countsForCollection(s)) speciesIds.add(s.speciesId);
    if (s.areaId && AREA_BY_ID[s.areaId]) {
      areas.add(s.areaId);
      // 「奄美大島・加計呂麻島…」のような複合表記は先頭の島で代表させる
      islands.add(AREA_BY_ID[s.areaId].island.split('・')[0]);
    }
    seasons.add(seasonOf(monthOf(s.observedAt)));
    if (s.photoId) photos++;
  }

  const found = [...speciesIds].map((id) => SPECIES_BY_ID[id]);
  const count = (pred: (sp: Species) => boolean) => found.filter(pred).length;

  const byCategory = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [
      c,
      {
        found: count((sp) => sp.category === c),
        total: SPECIES.filter((sp) => sp.category === c).length,
      },
    ]),
  ) as Stats['byCategory'];

  return {
    total: sightings.length,
    speciesIds,
    discovered: speciesIds.size,
    byCategory,
    nocturnal: count((sp) => !!sp.nocturnal),
    endemic: count((sp) => !!sp.endemic),
    aqua: count((sp) => sp.category === 'aqua'),
    bird: count((sp) => sp.category === 'bird'),
    legendary: count((sp) => sp.rarity === 4),
    mangrove: count((sp) => MANGROVE_IDS.has(sp.id)),
    areas,
    islands,
    seasons,
    photos,
    roadReports,
  };
}

// ───────── クエスト ─────────

export interface QuestProgress {
  quest: Quest;
  current: number;
  target: number;
  done: boolean;
  /** 開催期間中か（期間指定なしは常時） */
  active: boolean;
}

function matchesFilter(sp: Species, filter: Quest['filter']): boolean {
  switch (filter) {
    case 'nocturnal':
      return !!sp.nocturnal;
    case 'endemic':
      return !!sp.endemic;
    case 'aqua':
      return sp.category === 'aqua';
    case 'bird':
      return sp.category === 'bird';
    default:
      return true;
  }
}

export function questProgress(quest: Quest, sightings: Sighting[], nowMonth: number): QuestProgress {
  // 季節クエストは開催月に観察した記録だけを数える
  const collected = sightings.filter(countsForCollection);
  const eligible = quest.months
    ? collected.filter((s) => quest.months!.includes(monthOf(s.observedAt)))
    : collected;
  const ids = new Set(eligible.map((s) => s.speciesId).filter((id): id is string => !!id && !!SPECIES_BY_ID[id]));

  let current = 0;
  let target = 1;
  if (quest.mode === 'count') {
    target = quest.count ?? 1;
    current = [...ids].filter((id) => matchesFilter(SPECIES_BY_ID[id], quest.filter)).length;
  } else if (quest.mode === 'all') {
    target = quest.speciesIds?.length ?? 1;
    current = (quest.speciesIds ?? []).filter((id) => ids.has(id)).length;
  } else {
    target = 1;
    current = (quest.speciesIds ?? []).some((id) => ids.has(id)) ? 1 : 0;
  }
  const active = !quest.months || quest.months.includes(nowMonth);
  return { quest, current: Math.min(current, target), target, done: current >= target, active };
}

export function allQuestProgress(sightings: Sighting[], nowMonth: number): QuestProgress[] {
  return QUESTS.map((q) => questProgress(q, sightings, nowMonth));
}

// ───────── ポイント・ランク ─────────

export function pointsForSighting(s: Sighting, seenBefore: boolean): number {
  if (s.roadReport === 'roadkill' || s.roadReport === 'injured') return RESCUE_REPORT_POINTS;
  const sp = s.speciesId ? SPECIES_BY_ID[s.speciesId] : undefined;
  const bonus = s.roadReport === 'on-road' ? ON_ROAD_BONUS : 0;
  if (!sp) return CUSTOM_POINTS + bonus;
  return (seenBefore ? REPEAT_POINTS : RARITY_META[sp.rarity].points) + bonus;
}

/** 記録・クエスト・セーフドライブ宣言から得た累計ポイント（ランク計算用） */
export function computePoints(sightings: Sighting[], nowMonth: number, safeDriveDays = 0): number {
  const seen = new Set<string>();
  let points = 0;
  const ordered = [...sightings].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  for (const s of ordered) {
    const collected = countsForCollection(s) && !!s.speciesId && !!SPECIES_BY_ID[s.speciesId];
    points += pointsForSighting(s, collected && seen.has(s.speciesId!));
    if (collected) seen.add(s.speciesId!);
  }
  for (const qp of allQuestProgress(sightings, nowMonth)) {
    if (qp.done) points += qp.quest.reward;
  }
  return points + safeDriveDays * SAFE_DRIVE_POINTS;
}

/** 新しい記録1件で得られるポイント（記録直後の演出用、クエスト報酬は別） */
export function pointsForNewSighting(s: Sighting, existing: Sighting[]): number {
  const seenBefore = existing.some(
    (e) => e.id !== s.id && countsForCollection(e) && e.speciesId != null && e.speciesId === s.speciesId,
  );
  return pointsForSighting(s, seenBefore);
}

export const RANKS = [
  { min: 0, title: '島のたまご', en: 'Egg' },
  { min: 50, title: '見習い観察者', en: 'Apprentice' },
  { min: 200, title: '森の探検家', en: 'Explorer' },
  { min: 500, title: 'シマの博物学者', en: 'Naturalist' },
  { min: 1000, title: '奄美ナチュラリスト', en: 'Amami Naturalist' },
  { min: 2000, title: 'シマの守り人', en: 'Guardian' },
] as const;

export function rankFor(points: number) {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (points >= r.min) index = i;
  });
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;
  return { index, current, next, progress: Math.max(0, Math.min(1, progress)) };
}

// ───────── バッジ ─────────

export type BadgeIcon =
  | 'footprints'
  | 'heart'
  | 'feather'
  | 'binoculars'
  | 'moon'
  | 'gem'
  | 'crown'
  | 'waves'
  | 'kayak'
  | 'sailboat'
  | 'stamp'
  | 'sun'
  | 'book'
  | 'trophy'
  | 'car'
  | 'shield';

export interface BadgeContext {
  pledged: boolean;
  safeDriveDays: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  check: (stats: Stats, ctx: BadgeContext) => boolean;
}

export const BADGES: Badge[] = [
  { id: 'first-step', title: 'はじめの一歩', description: '最初の記録をした', icon: 'footprints', check: (s) => s.total >= 1 },
  { id: 'pledge', title: '森との約束', description: '観察マナーの約束をした', icon: 'heart', check: (_s, c) => c.pledged },
  { id: 'ruri', title: '瑠璃の使者', description: 'ルリカケスを記録した', icon: 'feather', check: (s) => s.speciesIds.has('rurikakesu') },
  { id: 'bird-watcher', title: 'バードウォッチャー', description: '鳥類を10種記録した', icon: 'binoculars', check: (s) => s.bird >= 10 },
  { id: 'night-walker', title: '夜の森の住人', description: '夜行性の生き物を5種記録した', icon: 'moon', check: (s) => s.nocturnal >= 5 },
  { id: 'endemic-hunter', title: '固有種ハンター', description: '固有種・固有亜種を5種記録した', icon: 'gem', check: (s) => s.endemic >= 5 },
  { id: 'legend', title: '幻との遭遇', description: '「幻」の生き物を記録した', icon: 'crown', check: (s) => s.legendary >= 1 },
  { id: 'shore', title: '潮だまりの友', description: '海・水辺の生き物を5種記録した', icon: 'waves', check: (s) => s.aqua >= 5 },
  { id: 'mangrove', title: 'マングローブ探検家', description: 'マングローブの生き物を2種記録した', icon: 'kayak', check: (s) => s.mangrove >= 2 },
  { id: 'island-hopper', title: '島めぐり', description: '2つ以上の島で記録した', icon: 'sailboat', check: (s) => s.islands.size >= 2 },
  { id: 'all-areas', title: '12市町村制覇', description: '奄美群島12市町村すべてで記録した', icon: 'stamp', check: (s) => s.areas.size >= 12 },
  { id: 'four-seasons', title: '四季の記録者', description: '春夏秋冬すべての季節に記録した', icon: 'sun', check: (s) => s.seasons.size >= 4 },
  { id: 'half', title: '図鑑の半分', description: `図鑑の半分（${Math.ceil(SPECIES.length / 2)}種）を記録した`, icon: 'book', check: (s) => s.discovered >= Math.ceil(SPECIES.length / 2) },
  { id: 'safe-driver', title: 'セーフドライバー', description: 'セーフドライブ宣言を5回した', icon: 'car', check: (_s, c) => c.safeDriveDays >= 5 },
  { id: 'road-guardian', title: '夜道の見守り隊', description: '路上レポートを3件送った', icon: 'shield', check: (s) => s.roadReports >= 3 },
  { id: 'complete', title: '奄美マスター', description: '図鑑をコンプリートした', icon: 'trophy', check: (s) => s.discovered >= SPECIES.length },
];

export function earnedBadges(stats: Stats, ctx: BadgeContext): Set<string> {
  return new Set(BADGES.filter((b) => b.check(stats, ctx)).map((b) => b.id));
}
