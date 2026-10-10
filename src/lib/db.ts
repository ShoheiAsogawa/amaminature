import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PhotoRecord, Sighting } from './types';

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
  return all.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
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

async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob();
}

export async function exportBackup(): Promise<Blob> {
  const d = await db();
  const [sightings, photos] = await Promise.all([d.getAll('sightings'), d.getAll('photos')]);
  const file: BackupFile = {
    app: 'amami-nature',
    version: 1,
    exportedAt: new Date().toISOString(),
    sightings,
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

export async function importBackup(file: File): Promise<number> {
  const parsed = JSON.parse(await file.text()) as Partial<BackupFile>;
  if (parsed.app !== 'amami-nature' || !Array.isArray(parsed.sightings)) {
    throw new Error('AMAMI NATURE のバックアップファイルではありません');
  }
  const photos: PhotoRecord[] = await Promise.all(
    (parsed.photos ?? []).map(async (p) => ({
      id: p.id,
      full: await dataUrlToBlob(p.full),
      thumb: await dataUrlToBlob(p.thumb),
      width: p.width,
      height: p.height,
    })),
  );
  const d = await db();
  const tx = d.transaction(['sightings', 'photos'], 'readwrite');
  for (const p of photos) await tx.objectStore('photos').put(p);
  for (const s of parsed.sightings) await tx.objectStore('sightings').put(s);
  await tx.done;
  return parsed.sightings.length;
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
