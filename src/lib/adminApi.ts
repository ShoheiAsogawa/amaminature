/**
 * 運営の管理画面の API クライアント（/api/admin/*）。
 * 管理キーはタブを閉じると消える sessionStorage に置く（利用者のログイン情報とは別）。
 */
import type { Sighting } from './types';

const BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '');
const KEY = 'amami-nature:admin-key';

export function getAdminKey(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setAdminKey(key: string | null) {
  try {
    if (key) sessionStorage.setItem(KEY, key);
    else sessionStorage.removeItem(KEY);
  } catch {
    // プライベートモードなどでは保存しない（画面を閉じるまで有効）
  }
}

export class AdminError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  unauthorized: '管理キーが違います。',
  admin_not_configured: '管理画面はまだ設定されていません（サーバーに ADMIN_KEY_SHA256 がありません）。',
  not_found: '見つかりませんでした。ほかの人が先に対応したかもしれません。',
  invalid_status: '状態の指定が正しくありません。',
  name_required: '名前を入れてください。',
  scope_required: '市町村を1つ以上選んでください。',
};

async function req<T>(key: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Admin-Key', key);
  if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/admin${path}`, { ...init, headers });
  } catch {
    throw new AdminError('通信できませんでした。ネットワークを確かめてください。', 0, 'offline');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new AdminError(MESSAGES[body.error ?? ''] ?? `エラーが発生しました（${res.status}）。`, res.status, body.error);
  }
  const type = res.headers.get('content-type') ?? '';
  return (type.includes('application/json') ? res.json() : res.blob()) as Promise<T>;
}

export type RedemptionStatus = 'requested' | 'fulfilled' | 'cancelled';
export type RoadStatus = 'new' | 'forwarded' | 'closed';
export type SightingFilter = 'all' | 'rare' | 'photo' | 'road' | 'revoked';

export interface AdminSummary {
  generatedAt: string;
  users: { total: number; new7: number; active7: number; friends: number; plus: number };
  sightings: { total: number; today: number; week: number; revoked: number; rareWeek: number };
  roadReports: { total: number; open: number };
  redemptions: { open: number; openPoints: number; fulfilledPoints: number };
  aiToday: number;
  daily: { day: string; sightings: number }[];
  topSpecies: { speciesId: string; n: number }[];
}

export interface AdminRedemption {
  id: string;
  userId: string;
  rewardId: string;
  rewardTitle: string;
  points: number;
  status: RedemptionStatus;
  note: string;
  createdAt: string;
  updatedAt: string | null;
  displayName: string | null;
  nickname: string | null;
  isFriend: boolean;
}

export interface AdminSighting extends Omit<Sighting, 'photoId' | 'syncState'> {
  hasPhoto: boolean;
  userId: string;
  displayName: string;
  userNickname: string;
  revokedAt: string | null;
  revokeReason: string | null;
}

export interface AdminRoadReport {
  id: string;
  type: 'roadkill' | 'injured' | 'on-road';
  speciesId: string | null;
  areaId: string | null;
  lat: number | null;
  lng: number | null;
  observedAt: string;
  status: RoadStatus;
  updatedAt: string | null;
  hasPhoto: boolean;
  memo: string | null;
  revokedAt: string | null;
}

export interface AdminPartner {
  id: string;
  name: string;
  scope: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  displayName: string;
  nickname: string;
  pictureUrl: string | null;
  isFriend: boolean;
  plus: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  sightings: number;
  species: number;
  points: number;
  balance: number;
  level: number;
}

export interface AdminAction {
  action: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

const body = (b: unknown) => JSON.stringify(b);

export const adminApi = {
  summary: (key: string) => req<AdminSummary>(key, '/summary'),
  redemptions: (key: string, status: RedemptionStatus | 'all') => req<{ redemptions: AdminRedemption[] }>(key, `/redemptions?status=${status}`),
  updateRedemption: (key: string, id: string, patch: { status?: RedemptionStatus; note?: string }) =>
    req<{ ok: true }>(key, `/redemptions/${encodeURIComponent(id)}`, { method: 'PATCH', body: body(patch) }),
  sightings: (key: string, filter: SightingFilter, before?: string) =>
    req<{ sightings: AdminSighting[] }>(key, `/sightings?filter=${filter}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  revoke: (key: string, id: string, reason: string) =>
    req<{ ok: true }>(key, `/sightings/${encodeURIComponent(id)}/revoke`, { method: 'POST', body: body({ reason }) }),
  restore: (key: string, id: string) => req<{ ok: true }>(key, `/sightings/${encodeURIComponent(id)}/restore`, { method: 'POST' }),
  photo: (key: string, id: string, size: 'thumb' | 'full' = 'thumb') => req<Blob>(key, `/photos/${encodeURIComponent(id)}?size=${size}`),
  roadReports: (key: string, status: RoadStatus | 'all') => req<{ roadReports: AdminRoadReport[] }>(key, `/road-reports?status=${status}`),
  updateRoadReport: (key: string, id: string, status: RoadStatus) =>
    req<{ ok: true }>(key, `/road-reports/${encodeURIComponent(id)}`, { method: 'PATCH', body: body({ status }) }),
  partners: (key: string) => req<{ partners: AdminPartner[] }>(key, '/partners'),
  createPartner: (key: string, name: string, scope: string[] | 'all') =>
    req<{ partner: AdminPartner; apiKey: string }>(key, '/partners', { method: 'POST', body: body({ name, scope }) }),
  deletePartner: (key: string, id: string) => req<{ ok: true }>(key, `/partners/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  users: (key: string, q: string) => req<{ users: AdminUser[] }>(key, `/users?q=${encodeURIComponent(q)}`),
  actions: (key: string) => req<{ actions: AdminAction[] }>(key, '/actions'),
};
