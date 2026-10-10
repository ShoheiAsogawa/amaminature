import { useMemo } from 'react';
import { countsForCollection } from '../lib/progress';
import type { Sighting } from '../lib/types';
import { useStore } from './useStore';

export interface CollectionEntry {
  count: number;
  /** 一覧に出す代表写真（最新の写真つき記録） */
  photoId: string | null;
  sightings: Sighting[];
}

/** 種ID → その種の記録（図鑑に数える記録のみ） */
export function useCollection(): Map<string, CollectionEntry> {
  const sightings = useStore((s) => s.sightings);
  return useMemo(() => {
    const map = new Map<string, CollectionEntry>();
    for (const s of sightings) {
      if (!s.speciesId || !countsForCollection(s) || s.syncState === 'rejected') continue;
      const e = map.get(s.speciesId) ?? { count: 0, photoId: null, sightings: [] };
      e.count++;
      e.sightings.push(s);
      if (!e.photoId && s.photoId) e.photoId = s.photoId;
      map.set(s.speciesId, e);
    }
    return map;
  }, [sightings]);
}
