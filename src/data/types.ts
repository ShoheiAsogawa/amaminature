export type Category = 'mammal' | 'bird' | 'herp' | 'insect' | 'aqua' | 'plant';

/** 1: よく見る / 2: ときどき / 3: めずらしい / 4: 幻 */
export type Rarity = 1 | 2 | 3 | 4;

export type Habitat = '森' | '渓流' | '里' | '海岸' | 'マングローブ' | '海' | '空';

export interface Species {
  id: string;
  no: number;
  name: string;
  /** 改行してよい位置を | で区切った和名（例: アマミノ|クロウサギ）。7 文字以上の和名には必ず入れる（docs/DESIGN_SYSTEM.md §3.5） */
  nameBreak?: string;
  en: string;
  sci: string;
  category: Category;
  rarity: Rarity;
  /** 固有種 / 固有亜種 */
  endemic?: 'species' | 'subspecies';
  /** 法的な保護区分（天然記念物・種の保存法など） */
  protection?: string[];
  /** 位置情報を自動でぼかす（盗掘・密猟・営巣地保護） */
  sensitive?: boolean;
  /** 危険生物の注意書き */
  danger?: string;
  nocturnal?: boolean;
  habitat: Habitat[];
  /** 見やすい月（1-12）。通年なら 1..12 */
  months: number[];
  range: string;
  description: string;
  tip: string;
  manner?: string;
  culture?: string;
  /** 参考写真（提携先・環境省・CC BY のもの）。credit（撮影者・提供元）は必ず表示する（§6） */
  photo?: { src: string; credit: string };
}

export interface Area {
  id: string;
  name: string;
  island: string;
  /** 近傍判定用の代表点（複数可：奄美市は名瀬・住用・笠利に分かれる） */
  points: [number, number][];
}

export interface Experience {
  id: string;
  title: string;
  kind: 'night' | 'forest' | 'mangrove' | 'sea' | 'bird' | 'facility';
  summary: string;
  priceFrom?: number;
  priceNote?: string;
  duration: string;
  months: number[];
  area: string;
  certifiedGuide: boolean;
  speciesIds: string[];
  provider: string;
  url?: string;
  /** 事業者から提供された 16:9 の写真。credit（撮影者・提供元）は写真の下に必ず表示する。ない体験は写真なしの行になる（§6） */
  image?: { src: string; credit: string };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  /** 対象の種（いずれか / すべて） */
  speciesIds?: string[];
  mode: 'any' | 'all' | 'count';
  /** mode=count のときの条件 */
  count?: number;
  filter?: 'nocturnal' | 'endemic' | 'aqua' | 'bird';
  months?: number[];
  reward: number;
  sponsor?: string;
}
