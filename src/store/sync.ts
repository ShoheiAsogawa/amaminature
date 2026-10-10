/**
 * LINEログイン時のサーバー同期（オフラインファースト）
 *
 * 森の中は圏外になりやすいので、記録はまず端末（IndexedDB）に保存し、
 * 電波が戻ったら Cloudflare Workers へ送る。
 */
import { api, type ServerSighting } from '../lib/api';
import * as db from '../lib/db';
import { getIdToken, getLineProfile, initLiff, LIFF_ID } from '../lib/liff';
import type { Sighting } from '../lib/types';
import { toast } from '../components/ui';
import { setAfterWrite, useStore } from './useStore';

const PENDING_DELETES_KEY = 'amami-nature:pending-deletes';

function readPendingDeletes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_DELETES_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function writePendingDeletes(ids: string[]) {
  try {
    localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(ids));
  } catch {
    // noop
  }
}

export function queueDelete(id: string) {
  writePendingDeletes([...new Set([...readPendingDeletes(), id])]);
}

export const REMOTE_PREFIX = 'remote:';

function fromServer(s: ServerSighting): Sighting {
  const { hasPhoto, ...rest } = s;
  return { ...rest, photoId: hasPhoto ? `${REMOTE_PREFIX}${s.id}` : null, syncState: 'synced' };
}

let syncing: Promise<void> | null = null;

export function syncNow(): Promise<void> {
  if (useStore.getState().account.mode !== 'line' || !api.hasSession()) return Promise.resolve();
  if (!syncing) {
    syncing = doSync().finally(() => {
      syncing = null;
    });
  }
  return syncing;
}

async function doSync() {
  const store = useStore.getState();
  store.setAccount({ syncing: true });
  try {
    // 1) オフライン中に削除した記録
    const deletes = readPendingDeletes();
    const remaining: string[] = [];
    for (const id of deletes) {
      try {
        await api.deleteSighting(id);
      } catch {
        remaining.push(id);
      }
    }
    writePendingDeletes(remaining);

    // 2) 未送信の記録をアップロード
    for (const s of useStore.getState().sightings.filter((x) => x.syncState === 'pending')) {
      let photo: { full: Blob; thumb: Blob } | undefined;
      if (s.photoId && !s.photoId.startsWith(REMOTE_PREFIX)) {
        const rec = await db.getPhoto(s.photoId);
        if (rec) photo = { full: rec.full, thumb: rec.thumb };
      }
      try {
        await api.upsertSighting(s, photo);
        await useStore.getState().markSynced(s.id);
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === 'offline') break;
        if (code === 'duplicate_photo' || code === 'invalid_request') {
          // サーバーが受け付けない記録は再送しない（端末には残し、ポイント対象外にする）
          await useStore.getState().markSynced(s.id, 'rejected');
          if (code === 'duplicate_photo') toast('同じ写真の記録があるため、クラウドには保存されませんでした');
        } else {
          console.warn('sync failed', s.id, e);
        }
      }
    }

    // 3) 他の端末で記録したものを取り込む
    const { sightings } = await api.listSightings();
    const local = new Set(useStore.getState().sightings.map((x) => x.id));
    const incoming = sightings.filter((x) => !local.has(x.id) && !remaining.includes(x.id)).map(fromServer);
    if (incoming.length) await useStore.getState().mergeSightings(incoming);

    // 4) サーバー側のポイント・残高
    const me = await api.me();
    useStore.getState().setAccount({ me });
  } catch (e) {
    console.warn('sync error', e);
  } finally {
    useStore.getState().setAccount({ syncing: false, lastSyncAt: new Date().toISOString() });
  }
}

/**
 * 起動時：LIFFでログイン済み、または有効なセッションがあれば同期モードにする。
 * どちらもなければデモモード（端末内保存のみ）のまま。
 */
export async function initAccount(): Promise<void> {
  const liff = LIFF_ID ? await initLiff() : null;
  if (!liff?.isLoggedIn() && !api.hasSession()) {
    useStore.getState().setAccount({ liffReady: true });
    return;
  }
  try {
    const profile = liff?.isLoggedIn() ? await getLineProfile() : null;
    let me = api.hasSession() ? await api.me().catch(() => null) : null;
    if (!me && liff?.isLoggedIn()) {
      const idToken = await getIdToken();
      if (!idToken) throw new Error('no id token');
      me = await api.loginWithLine(idToken);
    }
    if (!me) {
      useStore.getState().setAccount({ liffReady: true });
      return;
    }
    const settings = useStore.getState().settings;
    const name = me.nickname || profile?.displayName || me.displayName;
    if (!settings.name && name) useStore.getState().updateSettings({ name });
    useStore.getState().setAccount({
      mode: 'line',
      me,
      liffReady: true,
      pictureUrl: profile?.pictureUrl ?? me.pictureUrl ?? null,
    });
    // ローカルにだけある既存の記録も送る
    await useStore.getState().markAllLocalPending();
    void syncNow();
  } catch (e) {
    console.warn('account init failed', e);
    useStore.getState().setAccount({ liffReady: true });
  }
}

setAfterWrite(() => void syncNow());

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void syncNow());
}

/** 端末とサーバーの両方から記録を消す（オフライン時はあとで消す） */
export async function deleteEverywhere(s: Sighting): Promise<void> {
  await useStore.getState().removeSighting(s);
  if (useStore.getState().account.mode !== 'line' || !s.syncState) return;
  try {
    await api.deleteSighting(s.id);
  } catch {
    queueDelete(s.id);
  }
}
