/**
 * LINE Platform 連携（LINEログインのIDトークン検証・Messaging API）
 */
import { RARITY_META, SPECIES_BY_ID } from '../../src/data/species';
import type { Candidate } from './identify';

const API = 'https://api.line.me';
const DATA_API = 'https://api-data.line.me';

export interface LineIdTokenPayload {
  sub: string;
  name?: string;
  picture?: string;
  exp: number;
}

/** LIFFから受け取ったIDトークンをLINEのAPIで検証する */
export async function verifyIdToken(idToken: string, channelId: string): Promise<LineIdTokenPayload | null> {
  const res = await fetch(`${API}/oauth2/v2.1/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as LineIdTokenPayload;
  return data.sub ? data : null;
}

export async function getBotProfile(userId: string, token: string): Promise<{ displayName: string; pictureUrl?: string } | null> {
  const res = await fetch(`${API}/v2/bot/profile/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok ? ((await res.json()) as { displayName: string; pictureUrl?: string }) : null;
}

export async function getMessageContent(messageId: string, token: string): Promise<{ body: ArrayBuffer; type: string } | null> {
  const res = await fetch(`${DATA_API}/v2/bot/message/${encodeURIComponent(messageId)}/content`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return { body: await res.arrayBuffer(), type: res.headers.get('content-type') ?? 'image/jpeg' };
}

export async function reply(replyToken: string, messages: unknown[], token: string): Promise<void> {
  const res = await fetch(`${API}/v2/bot/message/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages: messages.slice(0, 5) }),
  });
  if (!res.ok) console.warn('LINE reply failed', res.status, await res.text());
}

// ───────── Webhook イベントの型（使う部分だけ） ─────────

export interface WebhookEvent {
  type: 'message' | 'follow' | 'unfollow' | 'postback' | string;
  replyToken?: string;
  source?: { type: string; userId?: string };
  message?: { id: string; type: 'text' | 'image' | string; text?: string };
}

// ───────── メッセージ（Flex Message） ─────────

// 色はアプリの「瑠璃の野帳」（docs/DESIGN_SYSTEM.md §2.1 のライト）に合わせる。白い地、墨の文字、瑠璃のボタン
const BRAND = '#1E50A2';
const FG = '#161A18';
const FG2 = '#4A524E';
const FG3 = '#656C68';
const DANGER = '#C8261B';

export function liffUrl(liffId: string, path = '/'): string {
  return `https://liff.line.me/${liffId}${path}`;
}

function uriButton(label: string, uri: string, style: 'primary' | 'secondary' | 'link' = 'primary') {
  return { type: 'button', style, height: 'sm', ...(style === 'primary' ? { color: BRAND } : style === 'link' ? { color: BRAND } : {}), action: { type: 'uri', label, uri } };
}

export function welcomeMessage(liffId: string) {
  return {
    type: 'flex',
    altText: 'AMAMI NATURE へようこそ！奄美で出会った生き物を集めよう',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        backgroundColor: '#FFFFFF',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: 'AMAMI NATURE', color: BRAND, size: 'xs', weight: 'bold' },
          { type: 'text', text: '奄美の生き物を、\nあなたの図鑑に。', color: FG, size: 'xl', weight: 'bold', wrap: true },
          {
            type: 'text',
            text: '写真をこのトークに送ると、AIが名前の候補を調べます（1日1回無料）。下のメニューから図鑑・路上レポート・ポイント交換も使えます。',
            color: FG2,
            size: 'sm',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [uriButton('図鑑をひらく', liffUrl(liffId, '/')), uriButton('観察マナーを読む', liffUrl(liffId, '/explore?tab=manner'), 'link')],
      },
    },
  };
}

export function identifyResultMessage(liffId: string, messageId: string, candidates: Candidate[], remaining: number) {
  const top = candidates.find((c) => c.speciesId !== 'unknown');
  const sp = top ? SPECIES_BY_ID[top.speciesId] : null;
  const recordUri = liffUrl(liffId, `/capture?inbox=${encodeURIComponent(messageId)}${sp ? `&species=${sp.id}` : ''}`);
  const others = candidates.filter((c) => c !== top && c.speciesId !== 'unknown').map((c) => SPECIES_BY_ID[c.speciesId]?.name).filter(Boolean);

  return {
    type: 'flex',
    // 毒のある生き物は、通知の文にも注意を入れる（写真を送った時は、まだすぐ近くにいることが多い）
    altText: sp ? `${sp.danger ? `【注意】${sp.danger} ` : ''}この生き物は「${sp.name}」かもしれません` : '図鑑の中からは特定できませんでした',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: sp
          ? [
              { type: 'text', text: 'AIの判定', size: 'xs', color: FG3, weight: 'bold' },
              { type: 'text', text: sp.name, size: 'xxl', weight: 'bold', color: FG, wrap: true },
              { type: 'text', text: sp.sci, size: 'sm', color: FG3, style: 'italic' },
              ...(sp.danger ? [{ type: 'text', text: `⚠ ${sp.danger}`, size: 'sm', color: DANGER, weight: 'bold', wrap: true, margin: 'md' }] : []),
              {
                type: 'text',
                text: `確からしさ ${Math.round((top!.confidence ?? 0) * 100)}%・${RARITY_META[sp.rarity].label}`,
                size: 'sm',
                color: BRAND,
                weight: 'bold',
                margin: 'md',
              },
              { type: 'text', text: top!.reason || ' ', size: 'sm', color: FG2, wrap: true },
              ...(others.length ? [{ type: 'text', text: `ほかの候補：${others.join('、')}`, size: 'xs', color: FG3, wrap: true, margin: 'md' }] : []),
              { type: 'text', text: `今日のAI判定 残り${remaining}回`, size: 'xxs', color: FG3, margin: 'lg' },
            ]
          : [
              { type: 'text', text: 'AIの判定', size: 'xs', color: FG3, weight: 'bold' },
              { type: 'text', text: '図鑑の中からは特定できませんでした', size: 'md', weight: 'bold', wrap: true },
              { type: 'text', text: candidates[0]?.reason || 'もう少し近く・明るい場所で撮るとわかりやすくなります。', size: 'sm', color: FG2, wrap: true },
            ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          uriButton(sp ? 'この写真で図鑑に記録する' : 'この写真を記録する', recordUri),
          ...(sp ? [uriButton('図鑑で見る', liffUrl(liffId, `/species/${sp.id}`), 'link')] : []),
        ],
      },
    },
  };
}

export function textMessage(text: string) {
  return { type: 'text', text };
}

export function menuMessage(liffId: string, text: string, label: string, path: string) {
  return {
    type: 'template',
    altText: text,
    template: { type: 'buttons', text, actions: [{ type: 'uri', label, uri: liffUrl(liffId, path) }] },
  };
}
