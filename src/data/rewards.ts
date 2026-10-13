/**
 * ポイント交換の景品カタログ（掲載イメージ）。
 * 景品の原資は自治体・協賛企業・提携事業者が負担するモデル（docs/BUSINESS_PLAN.md 参照）。
 * ポイントは無料の観察行動でのみ貯まり、購入できない設計（資金決済法・景品表示法への配慮）。
 */
export interface Reward {
  id: string;
  title: string;
  description: string;
  points: number;
  kind: 'donation' | 'coupon' | 'goods' | 'lottery';
  /**
   * 一覧の副題（利用者にとっての中身を 1 行で）。提供元は契約が決まってから description に書く。
   * 「協賛企業（募集中）」のような社内の状況は画面に出さない。
   */
  note?: string;
  /** このバッジを持っている人だけ交換できる */
  requiresBadge?: string;
  /** 1人1回だけ交換できる（記念品など） */
  once?: boolean;
}

export const REWARDS: Reward[] = [
  {
    id: 'donate',
    title: '奄美の自然保護に寄付する',
    description: '100 pt ごとに100円相当を、ロードキル対策や外来種対策など、奄美の保全活動に寄付します。',
    points: 100,
    kind: 'donation',
    note: '集めたポイントを島の保護団体に届けます',
  },
  {
    id: 'tour-coupon',
    title: '提携ツアー 1,000円引き',
    description: 'ナイトツアーや森のガイドウォークで使える割引クーポン。',
    points: 300,
    kind: 'coupon',
    note: '提携ガイドのツアーで使えます',
  },
  {
    id: 'local-shop',
    title: '島のお店のクーポン',
    description: '黒糖スイーツやパッションフルーツなど、島のお店で使えるクーポン。',
    points: 200,
    kind: 'coupon',
    note: '島のお店で使えます',
  },
  {
    id: 'whale-lottery',
    title: '抽選：ホエールウォッチング ペア招待',
    description: '冬のザトウクジラに会いに行こう。1口150 pt、何口でも応募できます。',
    points: 150,
    kind: 'lottery',
    note: '何口でも応募できます',
  },
  {
    id: 'pin-badge',
    title: 'オリジナル缶バッジ「瑠璃の使者」',
    description: 'ルリカケスを記録した人だけがもらえる、限定デザインの缶バッジ。',
    points: 500,
    kind: 'goods',
    requiresBadge: 'ruri',
    once: true,
  },
  {
    id: 'municipal-gift',
    title: '12市町村制覇 記念品',
    description: '奄美群島12市町村すべてで記録した人への記念品。',
    points: 0,
    kind: 'goods',
    requiresBadge: 'all-areas',
    once: true,
  },
];

export const REWARD_KIND_LABEL: Record<Reward['kind'], string> = {
  donation: '寄付',
  coupon: 'クーポン',
  goods: '記念品',
  lottery: '抽選',
};
