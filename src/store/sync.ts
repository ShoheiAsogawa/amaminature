/**
 * LINEログイン時のサーバー同期（オフラインファースト）
 *
 * 森の中は圏外になりやすいので、記録はまず端末（IndexedDB）に保存し、
 * 電波が戻ったら Cloudflare Workers へ送る。
 */
import { api, ApiError, type Me, type ServerRedemption, type ServerSighting } from '../lib/api';
import * as db from '../lib/db';
import { getIdToken, getLineProfile, initLiff, LIFF_ID } from '../lib/liff';
import type { Sighting } from '../lib/types';
import { toast } from '../components/ui';
import { setAfterWrite, useStore } from './useStore';

const PENDING_DELETES_KEY = 'amami-nature:pending-deletes';
const PENDING_SAFE_DRIVES_KEY = 'amami-nature:pending-safe-drives';

function readList(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // noop
  }
}

const readPendingDeletes = () => readList(PENDING_DELETES_KEY);

export function queueDelete(id: string) {
  writeList(PENDING_DELETES_KEY, [...new Set([...readPendingDeletes(), id])]);
}

/** 圏外で宣言したセーフドライブ（日本時間の日付）。電波が戻ったら送る */
export function queueSafeDrive(date: string) {
  writeList(PENDING_SAFE_DRIVES_KEY, [...new Set([...readList(PENDING_SAFE_DRIVES_KEY), date])]);
}

export const REMOTE_PREFIX = 'remote:';

function fromServer(s: ServerSighting): Sighting {
  const { hasPhoto, revoked, ...rest } = s;
  return {
    ...rest,
    photoId: hasPhoto ? `${REMOTE_PREFIX}${s.id}` : null,
    ...(revoked ? { syncState: 'rejected' as const, rejectReason: 'revoked' as const } : { syncState: 'synced' as const }),
  };
}

let syncing: Promise<void> | null = null;
/** 同期の途中で書き込みがあった（終わったらもう一度回す） */
let dirty = false;

export function syncNow(): Promise<void> {
  if (useStore.getState().account.mode !== 'line' || !api.hasSession()) return Promise.resolve();
  if (syncing) {
    dirty = true;
    return syncing;
  }
  syncing = (async () => {
    try {
      do {
        dirty = false;
        await doSync();
      } while (dirty && api.hasSession());
    } finally {
      syncing = null;
    }
  })();
  return syncing;
}

const codeOf = (e: unknown) => (e as { code?: string }).code;
/** あとでもう一度送れば通るかもしれない失敗（圏外・混雑・サーバーの不調・ログイン切れ） */
const retryLater = (e: unknown) =>
  !(e instanceof ApiError) || e.code === 'offline' || e.code === 'rate_limited' || e.status === 401 || e.status >= 500;

async function doSync() {
  const store = useStore.getState();
  store.setAccount({ syncing: true });
  try {
    // 0) 圏外で宣言したセーフドライブ
    const drives = readList(PENDING_SAFE_DRIVES_KEY);
    if (drives.length) {
      const keep: string[] = [];
      let expired = 0;
      for (const date of drives) {
        try {
          await api.safeDrive(date);
        } catch (e) {
          if (codeOf(e) === 'invalid_date') expired++;
          else keep.push(date);
        }
      }
      writeList(PENDING_SAFE_DRIVES_KEY, keep);
      if (expired) toast('圏外で宣言したセーフドライブのうち、日がたったものは送れませんでした');
    }

    // 1) 削除した記録（アップロードより先に送る。消した記録は 2) で送らない）
    const sent = readPendingDeletes();
    const remaining: string[] = [];
    for (const id of sent) {
      try {
        await api.deleteSighting(id);
      } catch (e) {
        // 自分の記録でない（403）など、何度送っても消せないものは諦める
        if (retryLater(e)) remaining.push(id);
      }
    }
    // 送っている間に増えた分は残す（次の回で送る）
    const added = readPendingDeletes().filter((id) => !sent.includes(id));
    writeList(PENDING_DELETES_KEY, [...remaining, ...added]);

    // 2) 未送信の記録をアップロード（送る直前に最新の内容を読み直す。途中で消した・直した記録を古い内容で送らない）
    const ids = useStore
      .getState()
      .sightings.filter((x) => x.syncState === 'pending')
      .map((x) => x.id);
    for (const id of ids) {
      const s = useStore.getState().sightings.find((x) => x.id === id);
      if (!s || s.syncState !== 'pending') continue;
      let photo: { full: Blob; thumb: Blob } | undefined;
      if (s.photoId && !s.photoId.startsWith(REMOTE_PREFIX)) {
        const rec = await db.getPhoto(s.photoId);
        if (rec) photo = { full: rec.full, thumb: rec.thumb };
      }
      try {
        await api.upsertSighting(s, photo);
        // 送っている間に直された記録は pending のまま残し、次の回で送る
        await useStore.getState().markSynced(id, 'synced', s);
      } catch (e) {
        const code = codeOf(e);
        // 圏外・混雑などは、残りも通らないので次の回にまとめて送る（写真を何度も送らない）
        if (retryLater(e)) break;
        if (code === 'deleted') {
          // ほかの端末で消した記録
          const cur = useStore.getState().sightings.find((x) => x.id === id);
          if (cur) await useStore.getState().removeSighting(cur);
        } else {
          // サーバーが受け付けない記録（同じ写真・日時が正しくない・写真が大きすぎる・ほかの人の記録など）は
          // 再送しない（端末には残し、ポイント対象外にする）
          await useStore.getState().markSynced(id, 'rejected', s, code === 'duplicate_photo' ? 'duplicate' : 'invalid');
          toast(
            code === 'duplicate_photo'
              ? '同じ写真の記録があるため、クラウドには保存されませんでした'
              : 'クラウドに保存できない記録がありました（日時が古すぎるなど。ポイントの対象外です）',
          );
          console.warn('sync rejected', id, e);
        }
      }
    }

    // 3) 他の端末で記録したものを取り込み、他の端末で消したものを消す
    const { sightings, deleted = [] } = await api.listSightings();
    const deleting = new Set(readPendingDeletes());
    const gone = new Set(deleted);
    for (const x of useStore.getState().sightings.filter((x) => gone.has(x.id))) await useStore.getState().removeSighting(x);
    const localById = new Map(useStore.getState().sightings.map((x) => [x.id, x]));
    const incoming = sightings.filter((x) => !localById.has(x.id) && !deleting.has(x.id) && !gone.has(x.id)).map(fromServer);
    if (incoming.length) await useStore.getState().mergeSightings(incoming);

    // 3b) 運営が取り消した記録（と、取り消しを戻した記録）を端末にも反映する
    let revokedNow = 0;
    for (const x of sightings) {
      const mine = localById.get(x.id);
      if (!mine) continue;
      if (x.revoked && mine.syncState !== 'rejected') {
        await useStore.getState().markSynced(x.id, 'rejected', undefined, 'revoked');
        revokedNow++;
      } else if (!x.revoked && mine.syncState === 'rejected' && (mine.rejectReason ?? 'revoked') === 'revoked') {
        // 運営が取り消しを戻した。取り消されている間に端末で直したメモなどもあるので、送り直す（pending にする）
        const cur = useStore.getState().sightings.find((s) => s.id === x.id);
        if (cur) {
          const { rejectReason: _r, ...rest } = cur;
          await useStore.getState().updateSighting({ ...rest, syncState: 'synced' });
        }
      }
    }
    if (revokedNow > 0) toast(`運営の確認により、${revokedNow}件の記録がポイントの対象外になりました`);

    // 4) サーバー側のポイント・残高と、交換・セーフドライブ・Plus・誓い（ほかの端末やデータを消した後でも揃える）
    const [me, history] = await Promise.all([api.me(), api.history()]);
    useStore.getState().setAccount({ me });
    hydrateFromServer(me, history);
  } catch (e) {
    console.warn('sync error', e);
  } finally {
    useStore.getState().setAccount({ syncing: false, lastSyncAt: new Date().toISOString() });
  }
}

/** LINE モードではポイントの使い道・宣言・Plus はサーバーを正とし、端末の設定をそれに合わせる */
function hydrateFromServer(me: Me, history: { redemptions: ServerRedemption[]; safeDriveDates: string[] }) {
  const { settings, updateSettings } = useStore.getState();
  const safeDriveDates = [...new Set([...history.safeDriveDates, ...readList(PENDING_SAFE_DRIVES_KEY)])].sort();
  const redemptions = history.redemptions.map((r) => ({ id: r.id, rewardId: r.rewardId, points: r.points, at: r.at }));
  const plan = (['trip', 'month', 'year'] as const).find((p) => p === me.plusPlan) ?? settings.plus?.plan ?? 'trip';
  const plus = me.plusUntil ? { plan, since: settings.plus?.since ?? new Date().toISOString(), until: me.plusUntil } : null;
  // 誓いは端末で先にした分もサーバーへ送る（オンボーディングで送れなかった時）
  if (settings.pledged && !me.pledged) void api.updateMe({ pledged: true }).catch(() => undefined);
  const same =
    JSON.stringify(settings.safeDriveDates) === JSON.stringify(safeDriveDates) &&
    JSON.stringify(settings.redemptions) === JSON.stringify(redemptions) &&
    JSON.stringify(settings.plus) === JSON.stringify(plus) &&
    settings.pledged === (settings.pledged || me.pledged);
  if (!same) updateSettings({ safeDriveDates, redemptions, plus, pledged: settings.pledged || me.pledged });
}

/**
 * 起動時：LIFFでログイン済み、または有効なセッションがあれば同期モードにする。
 * どちらもなければデモモード（端末内保存のみ）のまま。
 */
let initializing: Promise<void> | null = null;

export function initAccount(): Promise<void> {
  if (!initializing) {
    initializing = doInitAccount().finally(() => {
      initializing = null;
    });
  }
  return initializing;
}

/** 圏外・サーバーの不調（ログインが切れたわけではない） */
const isTransient = (e: unknown) => e instanceof ApiError && (e.code === 'offline' || e.status >= 500);

async function doInitAccount(): Promise<void> {
  const liff = LIFF_ID ? await initLiff() : null;
  if (!liff?.isLoggedIn() && !api.hasSession()) {
    useStore.getState().setAccount({ liffReady: true });
    return;
  }
  try {
    const profile = liff?.isLoggedIn() ? await getLineProfile() : null;
    let me: Me | null = null;
    let transient = false;
    if (api.hasSession()) {
      try {
        me = await api.me();
      } catch (e) {
        transient = isTransient(e);
      }
    }
    if (!me && !transient && liff?.isLoggedIn()) {
      const idToken = await getIdToken();
      if (!idToken) throw new Error('no id token');
      try {
        me = await api.loginWithLine(idToken);
      } catch (e) {
        if (!isTransient(e)) throw e;
        transient = true;
      }
    }
    if (!me && transient && api.hasSession()) {
      // 森の中など圏外で開いた時も、ログインは有効なまま同期モードにする（記録は送れるようになったら送る。me は同期の 4) で入る）
      useStore.getState().setAccount({ mode: 'line', liffReady: true, pictureUrl: profile?.pictureUrl ?? null });
      await useStore.getState().markAllLocalPending();
      return;
    }
    if (!me) {
      useStore.getState().setAccount({ liffReady: true });
      return;
    }
    const settings = useStore.getState().settings;
    const name = me.nickname || profile?.displayName || me.displayName;
    if (!settings.name && name) useStore.getState().updateSettings({ name });
    // 別の端末で誓いを済ませた人には、オンボーディングをもう一度させない
    if (me.pledged && !settings.onboarded) useStore.getState().updateSettings({ onboarded: true, pledged: true });
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
  window.addEventListener('online', () => {
    // 圏外で開いてログインできなかった時は、電波が戻ったらログインからやり直す
    if (useStore.getState().account.mode === 'line') void syncNow();
    else if (api.hasSession() || LIFF_ID) void initAccount();
  });
}

/**
 * 端末とサーバーの両方から記録を消す。
 * サーバーへは同期の 1) で送る（アップロードの途中に消しても、送り終えた後に必ず消える。オフライン時はあとで消す）
 */
export async function deleteEverywhere(s: Sighting): Promise<void> {
  await useStore.getState().removeSighting(s);
  // クラウドに送ったことのない（デモモードの）記録は端末から消すだけ。
  // 送ったことのある記録は、いまデモモードでも消したことを覚えておき、ログインした後に送る
  if (!s.syncState) return;
  queueDelete(s.id);
  void syncNow();
}
