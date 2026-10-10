import { create } from 'zustand';
import * as db from '../lib/db';
import type { Me } from '../lib/api';
import type { PhotoRecord, PlusPlan, Redemption, Settings, Sighting } from '../lib/types';

const SETTINGS_KEY = 'amami-nature:settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  name: '',
  onboarded: false,
  pledged: false,
  plus: null,
  safeDriveDates: [],
  redemptions: [],
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
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#08190F' : '#0E2A20');
}

export function localDateKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
  markSynced: (id: string, state?: 'synced' | 'rejected') => Promise<void>;
  markAllLocalPending: () => Promise<void>;
  mergeSightings: (incoming: Sighting[]) => Promise<void>;
  addSighting: (s: Sighting, photo?: PhotoRecord) => Promise<void>;
  updateSighting: (s: Sighting) => Promise<void>;
  removeSighting: (s: Sighting) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  activatePlus: (plan: PlusPlan) => void;
  declareSafeDrive: () => boolean;
  redeem: (rewardId: string, points: number) => Redemption;
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
    const s: Sighting = get().account.mode === 'line' ? { ...input, syncState: 'pending' } : input;
    await db.putSighting(s);
    set({ sightings: get().sightings.map((x) => (x.id === s.id ? s : x)) });
    afterWrite();
  },

  removeSighting: async (s) => {
    await db.deleteSighting(s);
    set({ sightings: get().sightings.filter((x) => x.id !== s.id) });
  },

  markSynced: async (id, state = 'synced') => {
    const target = get().sightings.find((x) => x.id === id);
    if (!target) return;
    const s: Sighting = { ...target, syncState: state };
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

  declareSafeDrive: () => {
    const today = localDateKey();
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
