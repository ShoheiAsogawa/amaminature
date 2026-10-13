import { create } from 'zustand';
import * as db from '../lib/db';
import { dayKey, visitStreak } from '../lib/missions';
import type { Me } from '../lib/api';
import type { PhotoRecord, PlusPlan, Redemption, Settings, Sighting } from '../lib/types';

export { dayKey };

const SETTINGS_KEY = 'amami-nature:settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  name: '',
  onboarded: false,
  pledged: false,
  plus: null,
  safeDriveDates: [],
  redemptions: [],
  sound: true,
  daily: { date: '', viewed: [], celebrated: false },
  visitDates: [],
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // プライベートモード等で保存できない場合はメモリ上のみ
  }
}

export function applyTheme(pref: Settings['theme']) {
  const dark =
    pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface AccountState {
  /** demo: 端末内保存のみ / line: LINEログインしてサーバー同期 */
  mode: 'demo' | 'line';
  me: Me | null;
  pictureUrl: string | null;
  syncing: boolean;
  lastSyncAt: string | null;
  liffReady: boolean;
}

let afterWrite: () => void = () => {};
/** 書き込み後に呼ぶ処理（同期）を登録する。循環importを避けるため sync.ts から設定する */
export function setAfterWrite(fn: () => void) {
  afterWrite = fn;
}

const PLAN_DAYS: Record<PlusPlan, number> = { trip: 7, month: 31, year: 366 };

interface State {
  loaded: boolean;
  sightings: Sighting[];
  settings: Settings;
  account: AccountState;
  setAccount: (patch: Partial<AccountState>) => void;
  load: () => Promise<void>;
  /** expected: 送った時の記録。送っている間に直されていたら印を付けない（直した内容を次の回で送る） */
  markSynced: (id: string, state?: 'synced' | 'rejected', expected?: Sighting, reason?: Sighting['rejectReason']) => Promise<void>;
  markAllLocalPending: () => Promise<void>;
  mergeSightings: (incoming: Sighting[]) => Promise<void>;
  addSighting: (s: Sighting, photo?: PhotoRecord) => Promise<void>;
  updateSighting: (s: Sighting) => Promise<void>;
  removeSighting: (s: Sighting) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  activatePlus: (plan: PlusPlan) => void;
  /** 宣言した日を記録する（その日にまだ宣言していなければ true） */
  declareSafeDrive: (date?: string) => boolean;
  redeem: (rewardId: string, points: number) => Redemption;
  /** きょうアプリを開いたことを記録する（連続日数） */
  markVisit: () => void;
  /** 図鑑で種を見たことを記録する（きょうのミッション） */
  markViewed: (speciesId: string) => void;
  /** きょうのミッションをすべて達成した演出を見せた */
  markCelebrated: () => void;
  resetAll: () => Promise<void>;
}

export const useStore = create<State>((set, get) => ({
  loaded: false,
  sightings: [],
  settings: loadSettings(),
  account: { mode: 'demo', me: null, pictureUrl: null, syncing: false, lastSyncAt: null, liffReady: false },

  setAccount: (patch) => set({ account: { ...get().account, ...patch } }),

  load: async () => {
    try {
      const sightings = await db.listSightings();
      set({ sightings, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addSighting: async (input, photo) => {
    const s: Sighting = get().account.mode === 'line' ? { ...input, syncState: 'pending' } : input;
    await db.putSighting(s, photo);
    set({ sightings: [s, ...get().sightings].sort((a, b) => b.observedAt.localeCompare(a.observedAt)) });
    void db.requestPersistence();
    afterWrite();
  },

  updateSighting: async (input) => {
    // クラウドに送ったことのある記録は、いまデモモード（圏外で開いた等）でも送り直す印を付ける。
    // ポイントの対象外になった記録（同じ写真・運営の取り消し）は、メモを直しても対象外のまま（端末にだけ残す）
    const s: Sighting =
      input.syncState === 'rejected' ? input : get().account.mode === 'line' || input.syncState ? { ...input, syncState: 'pending' } : input;
    await db.putSighting(s);
    set({ sightings: get().sightings.map((x) => (x.id === s.id ? s : x)) });
    afterWrite();
  },

  removeSighting: async (s) => {
    await db.deleteSighting(s);
    set({ sightings: get().sightings.filter((x) => x.id !== s.id) });
  },

  markSynced: async (id, state = 'synced', expected, reason) => {
    const target = get().sightings.find((x) => x.id === id);
    if (!target || (expected && target !== expected)) return;
    // 送り終えたら、路上レポートの正確な位置は端末に残さない（サーバーが行政・保護機関のために持つ）
    const { reportLat: _lat, reportLng: _lng, rejectReason: _r, ...rest } = target;
    const s: Sighting =
      state === 'synced' ? { ...rest, syncState: 'synced' } : { ...target, syncState: 'rejected', rejectReason: reason ?? target.rejectReason };
    await db.putSighting(s);
    set({ sightings: get().sightings.map((x) => (x.id === id ? s : x)) });
  },

  markAllLocalPending: async () => {
    const locals = get().sightings.filter((x) => !x.syncState);
    for (const x of locals) await db.putSighting({ ...x, syncState: 'pending' });
    if (locals.length) {
      set({ sightings: get().sightings.map((x) => (x.syncState ? x : { ...x, syncState: 'pending' as const })) });
    }
  },

  mergeSightings: async (incoming) => {
    for (const x of incoming) await db.putSighting(x);
    set({
      sightings: [...get().sightings, ...incoming].sort((a, b) => b.observedAt.localeCompare(a.observedAt)),
    });
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    saveSettings(settings);
    set({ settings });
    if (patch.theme) applyTheme(patch.theme);
  },

  activatePlus: (plan) => {
    const since = new Date();
    const until = new Date(since.getTime() + PLAN_DAYS[plan] * 86400000);
    get().updateSettings({ plus: { plan, since: since.toISOString(), until: until.toISOString() } });
  },

  declareSafeDrive: (date) => {
    const today = date ?? dayKey();
    const { safeDriveDates } = get().settings;
    if (safeDriveDates.includes(today)) return false;
    get().updateSettings({ safeDriveDates: [...safeDriveDates, today] });
    return true;
  },

  redeem: (rewardId, points) => {
    const r: Redemption = { id: newId(), rewardId, points, at: new Date().toISOString() };
    get().updateSettings({ redemptions: [...get().settings.redemptions, r] });
    return r;
  },

  markVisit: () => {
    const today = dayKey();
    const { visitDates } = get().settings;
    if (visitDates[0] === today) return;
    // 直近60日に加えて、続いている日はすべて残す（60日で連続日数が止まらないように）
    const next = [today, ...visitDates.filter((d) => d !== today)];
    get().updateSettings({ visitDates: next.slice(0, Math.max(60, visitStreak(next, today))) });
  },

  markViewed: (speciesId) => {
    const today = dayKey();
    const daily = get().settings.daily.date === today ? get().settings.daily : { date: today, viewed: [], celebrated: false };
    if (daily.viewed.includes(speciesId)) return;
    get().updateSettings({ daily: { ...daily, viewed: [...daily.viewed, speciesId] } });
  },

  markCelebrated: () => {
    const today = dayKey();
    const daily = get().settings.daily.date === today ? get().settings.daily : { date: today, viewed: [], celebrated: false };
    get().updateSettings({ daily: { ...daily, celebrated: true } });
  },

  resetAll: async () => {
    await db.clearAll();
    saveSettings(DEFAULT_SETTINGS);
    set({ sightings: [], settings: DEFAULT_SETTINGS });
    applyTheme(DEFAULT_SETTINGS.theme);
  },
}));

export function isPlusActive(settings: Settings, now = new Date()): boolean {
  return !!settings.plus && new Date(settings.plus.until) > now;
}
