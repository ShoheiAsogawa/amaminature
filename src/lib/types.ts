export interface Sighting {
  id: string;
  /** 図鑑の種ID。null は「図鑑にない・わからない生き物」 */
  speciesId: string | null;
  /** speciesId が null のときのメモ的な名前 */
  customName?: string;
  /** ユーザーがつけたニックネーム */
  nickname: string;
  memo: string;
  /** 観察日時 (ISO) */
  observedAt: string;
  createdAt: string;
  areaId: string | null;
  lat: number | null;
  lng: number | null;
  /** 希少種のため位置をぼかした */
  locationProtected: boolean;
  photoId: string | null;
  /** photo: 写真あり / sign: 声・痕跡・目撃のみ */
  kind: 'photo' | 'sign';
  /**
   * 路上レポート（行政・保護機関と共有するデータ）
   * - roadkill: 交通事故で死んでいた / injured: けがをしていた / on-road: 路上にいた（生きている）
   * roadkill・injured は図鑑の「発見」には数えない。
   */
  roadReport?: RoadReport;
  /** 路上レポートの正確な位置（行政・保護機関への共有用。アプリ内・共有画像には出さない） */
  reportLat?: number | null;
  reportLng?: number | null;
  /**
   * サーバー同期状態（LINEログイン時のみ）。未定義はローカルのみ。
   * rejected：サーバーが受け付けなかった（同じ写真の重複など）。再送せず、ポイント対象外
   */
  syncState?: 'pending' | 'synced' | 'rejected';
}

export type RoadReport = 'roadkill' | 'injured' | 'on-road';

export interface PhotoRecord {
  id: string;
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

export type ThemePref = 'system' | 'light' | 'dark';
export type PlusPlan = 'trip' | 'month' | 'year';

export interface Settings {
  theme: ThemePref;
  name: string;
  onboarded: boolean;
  pledged: boolean;
  plus: { plan: PlusPlan; since: string; until: string } | null;
  /** セーフドライブ宣言をした日（YYYY-MM-DD） */
  safeDriveDates: string[];
  /** ポイント交換の履歴 */
  redemptions: Redemption[];
}

export interface Redemption {
  id: string;
  rewardId: string;
  points: number;
  at: string;
}
