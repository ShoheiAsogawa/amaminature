/**
 * テーマの色を 16 進数で持つ表（docs/DESIGN_SYSTEM.md）。
 *
 * 画面の色は CSS 変数（src/styles/index.css の --c-*）と Tailwind のトークンで指定する。
 * この表を使うのは canvas（共有画像）など CSS 変数を読めない所だけ。
 * src の .ts で 16 進数の色を書いてよいのはこのファイルだけ。
 *
 * 値は index.css と同じにする。`npm run contrast` が両者の一致も確かめる。
 */

export type ThemeColors = {
  page: string;
  surface: string;
  fill: string;
  fillStrong: string;
  sep: string;
  fg: string;
  fg2: string;
  fg3: string;
  brand: string;
  brandFill: string;
  brandPressed: string;
  brandSoft: string;
  onBrand: string;
  onDanger: string;
  success: string;
  warning: string;
  danger: string;
  legend: string;
  silhouette: string;
  lineGreen: string;
  thumb: string;
  toast: string;
  toastFg: string;
};

/** ライト（共有画像はテーマに関係なく常にこちら） */
export const LIGHT: ThemeColors = {
  page: '#EEF5FF',
  surface: '#FFFFFF',
  fill: '#EEF3FA',
  fillStrong: '#DEE7F3',
  sep: '#DDE5F1',
  fg: '#1B1F3B',
  fg2: '#475174',
  fg3: '#5F6A8A',
  brand: '#1F5FE0',
  brandFill: '#2160E8',
  brandPressed: '#1546B8',
  brandSoft: '#DCE8FF',
  onBrand: '#FFFFFF',
  onDanger: '#FFFFFF',
  success: '#0B7A3F',
  warning: '#A85200',
  danger: '#C8261B',
  legend: '#9A5B00',
  silhouette: '#26305C',
  lineGreen: '#06C755',
  thumb: '#FFFFFF',
  toast: '#1B1F3B',
  toastFg: '#F3F5FF',
};

/** よるの森 */
export const DARK: ThemeColors = {
  page: '#0B1030',
  surface: '#161D45',
  fill: '#1E2752',
  fillStrong: '#293466',
  sep: '#2C386C',
  fg: '#F3F5FF',
  fg2: '#BBC3E6',
  fg3: '#929CC6',
  brand: '#8FB4FF',
  brandFill: '#2F66EE',
  brandPressed: '#1C46B4',
  brandSoft: '#1E2D64',
  onBrand: '#FFFFFF',
  onDanger: '#161D45',
  success: '#4FD58A',
  warning: '#FFBE4D',
  danger: '#FF8A80',
  legend: '#FFCF5C',
  silhouette: '#04071A',
  lineGreen: '#06C755',
  thumb: '#293466',
  toast: '#293466',
  toastFg: '#F3F5FF',
};

/** 色の位置（0〜1）と色の組 */
export type ColorStop = readonly [offset: number, color: string];

/**
 * 共有画像（canvas）で使うゲームの色。値は index.css の --c-type-* / --c-rare-* / --c-gold など と同じ。
 * カードの枠は CollectibleCard.tsx の FRAME と同じ並び（めずらしい＝虹、幻＝金）。
 */
export const GAME = {
  type: {
    mammal: '#C25418',
    bird: '#7048E8',
    herp: '#097C73',
    insect: '#5E7E06',
    aqua: '#1A73D4',
    plant: '#238636',
  },
  rare: { 1: '#66738F', 2: '#1F7FD6', 3: '#9333EA', 4: '#E89A00' },
  gold: '#FFC12E',
  goldEdge: '#D99A00',
  xp: '#22C56E',
  xpInk: '#0B3D22',
  capture: '#F0453A',
  night: '#141B42',
  frame3: [
    [0, '#7C3AED'],
    [0.35, '#38BDF8'],
    [0.55, '#A78BFA'],
    [0.8, '#F472B6'],
    [1, '#7C3AED'],
  ] as readonly ColorStop[],
  frame4: [
    [0, '#8A5A00'],
    [0.3, '#FFD75E'],
    [0.45, '#FFF3C4'],
    [0.62, '#E8A400'],
    [0.8, '#FFE08A'],
    [1, '#8A5A00'],
  ] as readonly ColorStop[],
} as const;

/** 龍郷柄（§6）の地の色。brand-fill と同じ値 */
export const TATSUGO_GROUND = { light: LIGHT.brandFill, dark: DARK.brandFill } as const;
