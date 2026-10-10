import { AREA_BY_ID } from '../../src/data/areas';
import { SPECIES_BY_ID } from '../../src/data/species';
import { protectLocation } from '../../src/lib/geo';
import type { RoadReport, Sighting } from '../../src/lib/types';

const ROAD: RoadReport[] = ['roadkill', 'injured', 'on-road'];
const UUIDish = /^[A-Za-z0-9-]{8,64}$/;
const DAY = 86400000;

export class ValidationError extends Error {}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function coord(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;
}

/** 奄美群島周辺（ざっくりとした範囲）に入っているか */
function inAmamiRegion(lat: number | null, lng: number | null) {
  return lat != null && lng != null && lat > 26.8 && lat < 28.8 && lng > 128.1 && lng < 130.3;
}

export interface SightingRow {
  id: string;
  speciesId: string | null;
  customName: string | null;
  nickname: string;
  memo: string;
  observedAt: string;
  createdAt: string;
  areaId: string | null;
  lat: number | null;
  lng: number | null;
  locationProtected: boolean;
  kind: 'photo' | 'sign';
  roadReport: RoadReport | null;
  reportLat: number | null;
  reportLng: number | null;
}

/**
 * クライアントから送られた記録を検証・正規化する。
 * 希少種の座標はサーバー側でも必ず落とす（クライアントを信用しない）。
 */
export function parseSightingMeta(raw: unknown, now = Date.now()): SightingRow {
  if (!raw || typeof raw !== 'object') throw new ValidationError('meta must be an object');
  const m = raw as Record<string, unknown>;

  const id = str(m.id, 64);
  if (!UUIDish.test(id)) throw new ValidationError('invalid id');

  const speciesId = m.speciesId == null ? null : str(m.speciesId, 64);
  if (speciesId !== null && !SPECIES_BY_ID[speciesId]) throw new ValidationError('unknown species');
  const species = speciesId ? SPECIES_BY_ID[speciesId] : null;

  const observed = Date.parse(str(m.observedAt, 40));
  if (!Number.isFinite(observed)) throw new ValidationError('invalid observedAt');
  if (observed > now + DAY) throw new ValidationError('observedAt is in the future');
  if (observed < now - 3 * 365 * DAY) throw new ValidationError('observedAt is too old');

  const areaId = m.areaId == null || m.areaId === '' ? null : str(m.areaId, 32);
  if (areaId !== null && !AREA_BY_ID[areaId]) throw new ValidationError('unknown area');

  const kind = m.kind === 'sign' ? 'sign' : 'photo';
  const roadReport = ROAD.includes(m.roadReport as RoadReport) ? (m.roadReport as RoadReport) : null;

  const rawLat = coord(m.lat, -90, 90);
  const rawLng = coord(m.lng, -180, 180);
  const loc = protectLocation(species, rawLat, rawLng);

  // 路上レポートの正確な位置は群島内のものだけ受け付ける
  const rLat = coord(m.reportLat, -90, 90);
  const rLng = coord(m.reportLng, -180, 180);
  const precise = roadReport && inAmamiRegion(rLat, rLng);

  return {
    id,
    speciesId,
    customName: speciesId === null ? str(m.customName, 40) || null : null,
    nickname: roadReport === 'roadkill' || roadReport === 'injured' ? '' : str(m.nickname, 24),
    memo: str(m.memo, 500),
    observedAt: new Date(observed).toISOString(),
    createdAt: new Date(Math.min(Date.parse(str(m.createdAt, 40)) || now, now)).toISOString(),
    areaId,
    lat: loc.lat,
    lng: loc.lng,
    locationProtected: loc.locationProtected || !!m.locationProtected,
    kind,
    roadReport,
    reportLat: precise ? rLat : null,
    reportLng: precise ? rLng : null,
  };
}

/** D1の行 → アプリの Sighting（ポイント計算・API応答用） */
export function rowToSighting(r: Record<string, unknown>): Sighting & { hasPhoto: boolean } {
  return {
    id: r.id as string,
    speciesId: (r.species_id as string | null) ?? null,
    customName: (r.custom_name as string | null) ?? undefined,
    nickname: (r.nickname as string) ?? '',
    memo: (r.memo as string) ?? '',
    observedAt: r.observed_at as string,
    createdAt: r.created_at as string,
    areaId: (r.area_id as string | null) ?? null,
    lat: (r.lat as number | null) ?? null,
    lng: (r.lng as number | null) ?? null,
    locationProtected: !!r.location_protected,
    photoId: null,
    kind: (r.kind as 'photo' | 'sign') ?? 'photo',
    roadReport: (r.road_report as RoadReport | null) ?? undefined,
    hasPhoto: !!r.photo_key,
  };
}
