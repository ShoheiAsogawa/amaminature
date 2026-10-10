/**
 * LINE LIFF 連携
 *
 * - VITE_LIFF_ID が設定されていれば LIFF を初期化し、LINEログインして同期モードで動く。
 * - 未設定、または LINE 外のブラウザで未ログインのときは「デモモード」（端末内保存のみ）で動く。
 */
import type { Liff } from '@line/liff';
import { LIGHT } from '../styles/palette';

export const LIFF_ID = (import.meta.env.VITE_LIFF_ID as string | undefined) ?? '';

let liffPromise: Promise<Liff | null> | null = null;

export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export function initLiff(): Promise<Liff | null> {
  if (!LIFF_ID) return Promise.resolve(null);
  if (!liffPromise) {
    liffPromise = (async () => {
      try {
        const { default: liff } = await import('@line/liff');
        await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: false });
        return liff;
      } catch (e) {
        console.warn('LIFF init failed', e);
        return null;
      }
    })();
  }
  return liffPromise;
}

export async function isLineLoggedIn(): Promise<boolean> {
  const liff = await initLiff();
  return !!liff?.isLoggedIn();
}

export async function lineLogin(): Promise<void> {
  const liff = await initLiff();
  if (liff && !liff.isLoggedIn()) liff.login({ redirectUri: window.location.href });
}

export async function getIdToken(): Promise<string | null> {
  const liff = await initLiff();
  return liff?.isLoggedIn() ? liff.getIDToken() : null;
}

export async function getLineProfile(): Promise<LineProfile | null> {
  const liff = await initLiff();
  if (!liff?.isLoggedIn()) return null;
  try {
    const p = await liff.getProfile();
    return { userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl };
  } catch {
    return null;
  }
}

export async function isInLineClient(): Promise<boolean> {
  const liff = await initLiff();
  return !!liff?.isInClient();
}

/** LIFF の画面URL（トークのボタンやシェアで使う） */
export function liffUrl(path = '/'): string {
  return LIFF_ID ? `https://liff.line.me/${LIFF_ID}${path}` : `${window.location.origin}${path}`;
}

/**
 * 友だちに図鑑カードを送る（LINEのシェアターゲットピッカー）。
 * 使えない環境では false を返すので、Web Share API などにフォールバックする。
 */
export async function shareToLine(imageUrl: string, altText: string, linkPath: string): Promise<boolean> {
  const liff = await initLiff();
  if (!liff?.isLoggedIn() || !liff.isApiAvailable('shareTargetPicker')) return false;
  const res = await liff.shareTargetPicker([
    {
      type: 'flex',
      altText,
      contents: {
        type: 'bubble',
        hero: { type: 'image', url: imageUrl, size: 'full', aspectRatio: '4:5', aspectMode: 'cover' },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              // LINE のメッセージの中のボタン（CSS 変数を使えないので palette.ts の瑠璃の値を使う）
              color: LIGHT.brandFill,
              action: { type: 'uri', label: 'わたしも奄美の生き物を集める', uri: liffUrl(linkPath) },
            },
          ],
        },
      },
    },
  ]);
  return !!res;
}

export async function closeLiffWindow(): Promise<void> {
  const liff = await initLiff();
  if (liff?.isInClient()) liff.closeWindow();
}
