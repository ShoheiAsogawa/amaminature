/**
 * AMAMI NATURE API（Cloudflare Workers）クライアント
 */
import type { Sighting } from './types';

const BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '');
const SESSION_KEY = 'amami-nature:session';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export interface ServerSighting extends Omit<Sighting, 'photoId' | 'syncState'> {
  hasPhoto: boolean;
  /** 運営が不正として取り消した記録（端末でもポイント・図鑑の対象外にする） */
  revoked?: boolean;
}

export interface Me {
  userId: string;
  /** お問い合わせ番号（AN-XXXXXXXX）。問い合わせの時に運営がアカウントを探すのに使う */
  supportCode: string;
  /** 同意した版（未同意は null） */
  consents: {
    terms: string | null;
    privacy: string | null;
    road: string | null;
    roadAt: string | null;
    /** AI判定で写真を米国の事業者に送ることへの同意 */
    ai: string | null;
    aiAt: string | null;
  };
  displayName: string;
  pictureUrl: string | null;
  nickname: string;
  pledged: boolean;
  plusUntil: string | null;
  plusPlan: string | null;
  points: number;
  balance: number;
  aiRemainingToday: number;
}

export function getSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function setSession(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // noop
  }
}

const MESSAGES: Record<string, string> = {
  rate_limited: '短時間にたくさん記録されています。少し時間をおいてお試しください。',
  duplicate_photo: 'この写真はすでに記録されています。',
  insufficient_points: 'ポイントが足りません。',
  badge_required: '交換条件のバッジをまだ持っていません。',
  ai_quota_exceeded: '今日のAI判定の回数を使い切りました。',
  ai_unavailable: 'AI判定は現在ご利用いただけません。図鑑から選んでください。',
  ai_consent_required: 'AI判定を使うには、写真の送信への同意が必要です。',
  unauthorized: 'ログインの有効期限が切れました。もう一度ひらき直してください。',
  already_redeemed: 'この景品はもう交換しています（1人1回まで）。',
  invalid_date: '宣言できる日を過ぎています。',
};

async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getSession();
  if (auth && token) headers.set('Authorization', `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('通信できませんでした。電波の良い場所で再度お試しください。', 0, 'offline');
  }
  // 利用者のセッションで呼んだ時だけ消す（提携先キーの入れ間違いなどでログアウトさせない）
  if (res.status === 401 && auth) setSession(null);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(MESSAGES[body.error ?? ''] ?? 'エラーが発生しました。', res.status, body.error);
  }
  const type = res.headers.get('content-type') ?? '';
  return (type.includes('application/json') ? res.json() : res.blob()) as Promise<T>;
}

function json(body: unknown, method = 'POST'): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const api = {
  hasSession: () => !!getSession(),
  logout: () => setSession(null),

  async loginWithLine(idToken: string): Promise<Me> {
    const r = await request<{ session: string; me: Me }>('/api/auth/line', json({ idToken }), false);
    setSession(r.session);
    return r.me;
  },

  me: () => request<Me>('/api/me'),
  updateMe: (
    patch: Partial<Pick<Me, 'nickname' | 'pledged'>> & {
      /** 利用規約とプライバシーポリシーに同意した版 */
      consent?: { terms: string; privacy: string };
      /** 路上レポートの位置の提供に同意した版（null で撤回） */
      roadConsent?: string | null;
      /** AI判定の写真の送信に同意した版（null で撤回） */
      aiConsent?: string | null;
    },
  ) => request<Me>('/api/me', json(patch, 'PATCH')),

  /** 退会：クラウドのデータをすべて消す（元に戻せない） */
  deleteAccount: () => request<{ ok: true }>('/api/me', { method: 'DELETE' }),

  /** deleted: ほかの端末で消した記録のID */
  listSightings: () => request<{ sightings: ServerSighting[]; deleted?: string[] }>('/api/sightings'),

  /** 交換とセーフドライブ宣言の履歴（サーバーが正） */
  history: () => request<{ redemptions: ServerRedemption[]; safeDriveDates: string[] }>('/api/me/history'),

  upsertSighting(s: Sighting, photo?: { full: Blob; thumb: Blob }) {
    const form = new FormData();
    const { photoId: _p, syncState: _s, rejectReason: _r, ...meta } = s;
    form.set('meta', JSON.stringify(meta));
    if (photo) {
      form.set('photo', photo.full, `${s.id}.jpg`);
      form.set('thumb', photo.thumb, `${s.id}_thumb.jpg`);
    }
    return request<{ ok: true; points: number; balance: number }>('/api/sightings', { method: 'POST', body: form });
  },

  deleteSighting: (id: string) => request<{ ok: true }>(`/api/sightings/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  photo: (sightingId: string, size: 'thumb' | 'full') =>
    request<Blob>(`/api/photos/${encodeURIComponent(sightingId)}?size=${size}`),

  inboxPhoto: (messageId: string) => request<Blob>(`/api/inbox/${encodeURIComponent(messageId)}`),

  identify: (image: string, month: number, areaId: string | null) =>
    request<{ candidates: { speciesId: string; confidence: number; reason: string }[]; remainingToday: number }>(
      '/api/identify',
      json({ image, month, areaId }),
    ),

  /** date: 日本時間の日付（圏外で宣言した分をあとから送る時。きょうかきのうまで） */
  safeDrive: (date?: string) =>
    request<{ ok: true; alreadyDeclared: boolean; points: number; balance: number }>('/api/safe-drive', json(date ? { date } : {})),

  /** 決済連携（Stripe）前の検証用。サーバーで DEMO_PLUS=true のときだけ有効 */
  demoPlus: (plan: string) => request<Me>('/api/plus/demo', json({ plan })),

  redeem: (rewardId: string) => request<{ ok: true; balance: number }>('/api/redeem', json({ rewardId })),

  createShare: (card: Blob) => {
    const form = new FormData();
    form.set('image', card, 'card.jpg');
    return request<{ url: string }>('/api/shares', { method: 'POST', body: form });
  },

  partnerSummary: (key: string) =>
    request<PartnerSummary>('/api/partner/summary', { headers: { 'X-Partner-Key': key } }, false),
};

export interface ServerRedemption {
  id: string;
  rewardId: string;
  points: number;
  status: 'requested' | 'fulfilled';
  at: string;
}

export interface PartnerSummary {
  partner: string;
  generatedAt: string;
  totals: { sightings: number; users: number; species: number; roadReports: number };
  byArea: { areaId: string; sightings: number; roadReports: number }[];
  byHour: { hour: number; sightings: number }[];
  byMonth: { month: string; sightings: number; roadkill: number }[];
  topSpecies: { speciesId: string; sightings: number }[];
  roadReports: {
    id: string;
    type: string;
    speciesId: string | null;
    areaId: string | null;
    lat: number | null;
    lng: number | null;
    observedAt: string;
  }[];
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'エラーが発生しました。';
}
