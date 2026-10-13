import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { AREA_BY_ID } from '../data/areas';
import { SPECIES_BY_ID } from '../data/species';
import { protectLocation } from './geo';
import type { PhotoRecord, RoadReport, Sighting } from './types';

interface AmamiDB extends DBSchema {
  sightings: {
    key: string;
    value: Sighting;
    indexes: { bySpecies: string; byObservedAt: string };
  };
  photos: {
    key: string;
    value: PhotoRecord;
  };
}

const DB_NAME = 'amami-nature';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AmamiDB>> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB<AmamiDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const sightings = database.createObjectStore('sightings', { keyPath: 'id' });
        sightings.createIndex('bySpecies', 'speciesId');
        sightings.createIndex('byObservedAt', 'observedAt');
        database.createObjectStore('photos', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function listSightings(): Promise<Sighting[]> {
  const all = await (await db()).getAll('sightings');
  // 壊れた行が1つあっても、ほかの記録は見せる
  return all.filter((x) => typeof x?.observedAt === 'string').sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export async function putSighting(s: Sighting, photo?: PhotoRecord): Promise<void> {
  const d = await db();
  const tx = d.transaction(['sightings', 'photos'], 'readwrite');
  if (photo) await tx.objectStore('photos').put(photo);
  await tx.objectStore('sightings').put(s);
  await tx.done;
}

export async function deleteSighting(s: Sighting): Promise<void> {
  const d = await db();
  const tx = d.transaction(['sightings', 'photos'], 'readwrite');
  await tx.objectStore('sightings').delete(s.id);
  if (s.photoId) await tx.objectStore('photos').delete(s.photoId);
  await tx.done;
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  return (await db()).get('photos', id);
}

export async function clearAll(): Promise<void> {
  const d = await db();
  const tx = d.transaction(['sightings', 'photos'], 'readwrite');
  await tx.objectStore('sightings').clear();
  await tx.objectStore('photos').clear();
  await tx.done;
}

// ───────── バックアップ（JSON書き出し・読み込み） ─────────

interface BackupFile {
  app: 'amami-nature';
  version: 1;
  exportedAt: string;
  sightings: Sighting[];
  photos: { id: string; full: string; thumb: string; width: number; height: number }[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** バックアップの写真は data:image/ だけを読む（ファイルに外部の URL を書かれても取りに行かない） */
async function dataUrlToBlob(url: string): Promise<Blob> {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(url)) throw new Error('写真の形式が正しくありません');
  return (await fetch(url)).blob();
}

const ID = /^[A-Za-z0-9-]{8,64}$/;
const ROAD: RoadReport[] = ['roadkill', 'injured', 'on-road'];
const isDate = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

/** 読み込んだ記録を確かめて整える。使えない記録は null */
function sanitizeSighting(raw: unknown): Sighting | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = raw as Record<string, unknown>;
  if (typeof x.id !== 'string' || !ID.test(x.id) || !isDate(x.observedAt) || !isDate(x.createdAt)) return null;
  const speciesId = typeof x.speciesId === 'string' && SPECIES_BY_ID[x.speciesId] ? x.speciesId : null;
  if (x.speciesId != null && speciesId === null) return null;
  const species = speciesId ? SPECIES_BY_ID[speciesId] : null;
  // 希少種の座標は、ファイルに書かれていても持たない
  const loc = protectLocation(species, num(x.lat), num(x.lng));
  const roadReport = ROAD.includes(x.roadReport as RoadReport) ? (x.roadReport as RoadReport) : undefined;
  const syncState = x.syncState === 'pending' || x.syncState === 'synced' || x.syncState === 'rejected' ? x.syncState : undefined;
  return {
    id: x.id,
    speciesId,
    customName: speciesId === null && typeof x.customName === 'string' ? x.customName.slice(0, 40) : undefined,
    nickname: text(x.nickname, 24),
    memo: text(x.memo, 500),
    observedAt: new Date(x.observedAt).toISOString(),
    createdAt: new Date(x.createdAt).toISOString(),
    areaId: typeof x.areaId === 'string' && AREA_BY_ID[x.areaId] ? x.areaId : null,
    ...loc,
    locationProtected: loc.locationProtected || x.locationProtected === true,
    photoId: typeof x.photoId === 'string' && x.photoId ? x.photoId.slice(0, 80) : null,
    kind: x.kind === 'sign' ? 'sign' : 'photo',
    ...(roadReport ? { roadReport, reportLat: num(x.reportLat), reportLng: num(x.reportLng) } : {}),
    ...(syncState ? { syncState } : {}),
    ...(syncState === 'rejected' && (x.rejectReason === 'duplicate' || x.rejectReason === 'invalid' || x.rejectReason === 'revoked')
      ? { rejectReason: x.rejectReason }
      : {}),
  };
}

export async function exportBackup(): Promise<Blob> {
  const d = await db();
  const [sightings, photos] = await Promise.all([d.getAll('sightings'), d.getAll('photos')]);
  const file: BackupFile = {
    app: 'amami-nature',
    version: 1,
    exportedAt: new Date().toISOString(),
    // 路上レポートの正確な位置は行政・保護機関に送るためだけのもの。持ち歩くファイルには書かない
    sightings: sightings.map(({ reportLat: _lat, reportLng: _lng, ...rest }) => rest),
    photos: await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        full: await blobToDataUrl(p.full),
        thumb: await blobToDataUrl(p.thumb),
        width: p.width,
        height: p.height,
      })),
    ),
  };
  return new Blob([JSON.stringify(file)], { type: 'application/json' });
}

/** 読み込んだ記録の数を返す。形の正しくない記録は読み飛ばし、途中で失敗したら何も書き込まない */
export async function importBackup(file: File): Promise<number> {
  let parsed: Partial<BackupFile>;
  try {
    parsed = JSON.parse(await file.text()) as Partial<BackupFile>;
  } catch {
    throw new Error('AMAMI NATURE のバックアップファイルではありません');
  }
  if (parsed?.app !== 'amami-nature' || !Array.isArray(parsed.sightings) || (parsed.photos != null && !Array.isArray(parsed.photos))) {
    throw new Error('AMAMI NATURE のバックアップファイルではありません');
  }
  const sightings = parsed.sightings.map(sanitizeSighting).filter((x): x is Sighting => x !== null);
  const photos: PhotoRecord[] = [];
  for (const p of parsed.photos ?? []) {
    if (!p || typeof p.id !== 'string' || typeof p.full !== 'string' || typeof p.thumb !== 'string') continue;
    try {
      photos.push({ id: p.id, full: await dataUrlToBlob(p.full), thumb: await dataUrlToBlob(p.thumb), width: num(p.width) ?? 0, height: num(p.height) ?? 0 });
    } catch {
      // 読めない写真は飛ばす（記録は写真なしで残る）
    }
  }
  const d = await db();
  const tx = d.transaction(['sightings', 'photos'], 'readwrite');
  try {
    await Promise.all([
      ...photos.map((p) => tx.objectStore('photos').put(p)),
      ...sightings.map((s) => tx.objectStore('sightings').put(s)),
      tx.done,
    ]);
  } catch (e) {
    try {
      tx.abort();
    } catch {
      // すでに終わっている
    }
    throw e;
  }
  return sightings.length;
}

/** ブラウザによる自動削除を避けるため、永続ストレージをリクエストする */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // 非対応環境では何もしない
  }
}
