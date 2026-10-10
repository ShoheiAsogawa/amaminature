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
  sponsor: string;
  /** このバッジを持っている人だけ交換できる */
  requiresBadge?: string;
}

export const REWARDS: Reward[] = [
  {
    id: 'donate',
    title: '奄美の自然保護に寄付する',
    description: '100ptごとに100円相当を、協賛企業が保全活動（ロードキル対策・外来種対策など）へ寄付します。',
    points: 100,
    kind: 'donation',
    sponsor: '協賛企業（募集中）',
  },
  {
    id: 'tour-coupon',
    title: '提携ツアー 1,000円OFF',
    description: 'ナイトツアーや森のガイドウォークで使える割引クーポン。',
    points: 300,
    kind: 'coupon',
    sponsor: '掲載ガイド事業者（募集中）',
  },
  {
    id: 'local-shop',
    title: '島の協賛店クーポン',
    description: '黒糖スイーツやパッションフルーツなど、協賛店で使えるクーポン。',
    points: 200,
    kind: 'coupon',
    sponsor: '地元協賛店（募集中）',
  },
  {
    id: 'whale-lottery',
    title: '抽選：ホエールウォッチング ペア招待',
    description: '冬のザトウクジラに会いに行こう。1口150pt、何口でも応募できます。',
    points: 150,
    kind: 'lottery',
    sponsor: '協賛枠（募集中）',
  },
  {
    id: 'pin-badge',
    title: 'オリジナル缶バッジ「瑠璃の使者」',
    description: 'ルリカケスを記録した人だけがもらえる、限定デザインの缶バッジ。',
    points: 500,
    kind: 'goods',
    sponsor: 'AMAMI NATURE',
    requiresBadge: 'ruri',
  },
  {
    id: 'municipal-gift',
    title: '12市町村制覇 記念品',
    description: '奄美群島12市町村すべてで記録した人へ、各市町村からの記念品。',
    points: 0,
    kind: 'goods',
    sponsor: '奄美群島の市町村（調整前）',
    requiresBadge: 'all-areas',
  },
];

export const REWARD_KIND_LABEL: Record<Reward['kind'], string> = {
  donation: '寄付',
  coupon: 'クーポン',
  goods: '記念品',
  lottery: '抽選',
};
