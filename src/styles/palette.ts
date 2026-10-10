/**
 * テーマの色を 16 進数で持つ表（docs/DESIGN_SYSTEM.md §2.1・§8.15）。
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
  page: '#FFFFFF',
  surface: '#FFFFFF',
  fill: '#F1F3F2',
  fillStrong: '#E4E8E6',
  sep: '#E1E4E2',
  fg: '#161A18',
  fg2: '#4A524E',
  fg3: '#656C68',
  brand: '#1E50A2',
  brandFill: '#1E50A2',
  brandPressed: '#173F82',
  brandSoft: '#E8EEF7',
  onBrand: '#FFFFFF',
  onDanger: '#FFFFFF',
  success: '#1B7A47',
  warning: '#8F5C00',
  danger: '#C0322B',
  legend: '#8A6A1E',
  silhouette: '#D3D8D5',
  lineGreen: '#06C755',
  thumb: '#FFFFFF',
  toast: '#1F2422',
  toastFg: '#F2F4F3',
};

/** 夜の森 */
export const DARK: ThemeColors = {
  page: '#000000',
  surface: '#1A1714',
  fill: '#24201C',
  fillStrong: '#2F2A25',
  sep: '#36302A',
  fg: '#D4CDC2',
  fg2: '#ADA498',
  fg3: '#90877B',
  brand: '#9DA9D8',
  brandFill: '#4057A3',
  brandPressed: '#334790',
  brandSoft: '#1A2038',
  onBrand: '#ECEAF2',
  onDanger: '#1A1714',
  success: '#7DB894',
  warning: '#D6A35A',
  danger: '#E2786C',
  legend: '#C9A65A',
  silhouette: '#332D27',
  lineGreen: '#06C755',
  thumb: '#3A332C',
  toast: '#2E2924',
  toastFg: '#D4CDC2',
};

/** 色の位置（0〜1）と色の組 */
export type ColorStop = readonly [offset: number, color: string];

export type Materials = {
  /** 泥染（レア度 2）。単色 */
  dorozome: string;
  /** 夜光貝（レア度 3）。conic-gradient(from 200deg, …) の色を等間隔に並べる */
  yakougai: { fromDeg: number; stops: readonly ColorStop[] };
  /** 金箔（レア度 4）。linear-gradient(135deg, …) */
  kinpaku: { deg: number; stops: readonly ColorStop[] };
};

/**
 * 図鑑カードの素材（§2.1）。図鑑カードと共有画像の外周以外では使わない。
 * canvas では createConicGradient(fromDeg の角度) / createLinearGradient(deg の方向) で描く。
 */
export const MATERIALS: { light: Materials; dark: Materials } = {
  light: {
    dorozome: '#4B3A2E',
    yakougai: {
      fromDeg: 200,
      stops: [
        [0, '#C9DCE6'],
        [0.25, '#E3D3E6'],
        [0.5, '#D2E8DC'],
        [0.75, '#EDE1C8'],
        [1, '#C9DCE6'],
      ],
    },
    kinpaku: {
      deg: 135,
      stops: [
        [0, '#8A6A22'],
        [0.4, '#E2C77A'],
        [0.5, '#F3E4B2'],
        [0.62, '#BE9845'],
        [1, '#8A6A22'],
      ],
    },
  },
  dark: {
    dorozome: '#5A4738',
    yakougai: {
      fromDeg: 200,
      stops: [
        [0, '#3B4852'],
        [0.25, '#4A3E4D'],
        [0.5, '#3A4A41'],
        [0.75, '#52473A'],
        [1, '#3B4852'],
      ],
    },
    kinpaku: {
      deg: 135,
      stops: [
        [0, '#6E5520'],
        [0.45, '#C9AE68'],
        [0.52, '#DFCA8E'],
        [0.65, '#A3843F'],
        [1, '#6E5520'],
      ],
    },
  },
};

/** 龍郷柄（§6）の地の色。brand-fill と同じ値 */
export const TATSUGO_GROUND = { light: LIGHT.brandFill, dark: DARK.brandFill } as const;
