import { AREAS } from '../data/areas';
import type { Area, Species } from '../data/types';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** 群島外とみなす距離（最寄りの代表点からの距離） */
export const MAX_AREA_DISTANCE_KM = 35;

export function nearestArea(lat: number, lng: number): { area: Area; distanceKm: number } | null {
  let best: { area: Area; distanceKm: number } | null = null;
  for (const area of AREAS) {
    for (const p of area.points) {
      const d = haversineKm([lat, lng], p);
      if (!best || d < best.distanceKm) best = { area, distanceKm: d };
    }
  }
  if (!best || best.distanceKm > MAX_AREA_DISTANCE_KM) return null;
  return best;
}

/**
 * 位置情報の保護。
 * - 希少種（sensitive）は座標を保存しない（市町村名のみ）。
 * - それ以外も約100m単位に丸めて保存し、共有画像には座標を出さない。
 */
export function protectLocation(
  species: Pick<Species, 'sensitive'> | null,
  lat: number | null,
  lng: number | null,
): { lat: number | null; lng: number | null; locationProtected: boolean } {
  if (lat == null || lng == null) return { lat: null, lng: null, locationProtected: false };
  if (species?.sensitive) return { lat: null, lng: null, locationProtected: true };
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return { lat: round(lat), lng: round(lng), locationProtected: false };
}
