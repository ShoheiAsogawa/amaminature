import type { Experience } from './types';

/**
 * 体験・ツアー掲載枠（送客型マネタイズ）。
 * 現在の掲載内容は「掲載イメージ」です。料金は公開されている市場相場を参考にした目安で、
 * 実際の提携事業者・料金・予約URLは契約後に差し替えます（docs/BUSINESS_PLAN.md 参照）。
 */
export const EXPERIENCES: Experience[] = [
  {
    id: 'night-forest',
    title: '夜の森ナイトツアー',
    kind: 'night',
    summary:
      'アマミノクロウサギやアマミヤマシギなど、夜にしか会えない固有種を認定ガイドと探す2〜3時間のツアー。ホテル送迎つきプランも。',
    priceFrom: 8000,
    duration: '約2〜3時間',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    area: '奄美大島',
    certifiedGuide: true,
    speciesIds: [
      'amami-kurousagi',
      'amami-yamashigi',
      'ryukyu-konohazuku',
      'kenaganezumi',
      'otton-gaeru',
      'iboimori',
      'habu',
    ],
    provider: '奄美群島認定エコツアーガイド（掲載事業者を募集中）',
  },
  {
    id: 'kinsakubaru',
    title: '金作原 原生林ガイドウォーク',
    kind: 'forest',
    summary:
      'ヒカゲヘゴが茂る世界自然遺産の森を歩く。利用ルールにより認定ガイドの同行が必要なエリアを、解説つきで安心して楽しめる。',
    priceNote: '料金は事業者により異なります',
    duration: '約2〜3時間',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    area: '奄美市',
    certifiedGuide: true,
    speciesIds: ['hikagehego', 'rurikakesu', 'akahige', 'ooston-ooakagera', 'zuakaaobato'],
    provider: '奄美群島認定エコツアーガイド（掲載事業者を募集中）',
  },
  {
    id: 'mangrove-canoe',
    title: 'マングローブ・カヌー',
    kind: 'mangrove',
    summary:
      '国内有数の規模を誇る住用のマングローブ林を、カヌーで水上から探検。干潟のトビハゼやシオマネキにも出会える。',
    priceFrom: 7000,
    duration: '約1時間〜',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    area: '奄美市住用',
    certifiedGuide: false,
    speciesIds: ['ohirugi', 'mehirugi', 'minami-tobihaze', 'shiomaneki', 'kurosagi'],
    provider: 'カヌー事業者（掲載事業者を募集中）',
  },
  {
    id: 'whale-watching',
    title: 'ホエールウォッチング',
    kind: 'sea',
    summary:
      '冬の奄美の海にやってくるザトウクジラを船から観察。ブリーチやブロウ（潮吹き）を間近で。自主ルール順守の事業者と提携。',
    priceNote: '料金は事業者により異なります',
    duration: '約3時間',
    months: [12, 1, 2, 3, 4],
    area: '奄美大島',
    certifiedGuide: false,
    speciesIds: ['zatoukujira', 'minami-bandouiruka', 'misago'],
    provider: '自主ルールを守る事業者（掲載事業者を募集中）',
  },
  {
    id: 'morning-birding',
    title: '早朝バードウォッチング',
    kind: 'bird',
    summary:
      '鳥たちが最も活発な早朝に、ルリカケスやアカヒゲ、オーストンオオアカゲラを探す。双眼鏡の貸し出しつき。',
    priceNote: '料金は事業者により異なります',
    duration: '約2時間',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    area: '奄美大島',
    certifiedGuide: true,
    speciesIds: [
      'rurikakesu',
      'akahige',
      'ooston-ooakagera',
      'ryukyu-akashobin',
      'karasubato',
      'amami-kogera',
    ],
    provider: '奄美群島認定エコツアーガイド（掲載事業者を募集中）',
  },
  {
    id: 'wildlife-center',
    title: '奄美野生生物保護センターを訪ねる',
    kind: 'facility',
    summary:
      '環境省の施設で、奄美の希少な生き物と保護の取り組みを学ぶ。フィールドに出る前の予習にぴったり。',
    priceNote: '開館日・料金は施設の公式情報をご確認ください',
    duration: '約1時間',
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    area: '大和村',
    certifiedGuide: false,
    speciesIds: ['amami-kurousagi', 'ootoratsugumi', 'amami-togenezumi'],
    provider: '施設紹介（大和村）',
  },
];

export const KIND_LABEL: Record<Experience['kind'], string> = {
  night: 'ナイト',
  forest: '森',
  mangrove: 'マングローブ',
  sea: '海',
  bird: '野鳥',
  facility: '施設',
};

export function experiencesForSpecies(speciesId: string): Experience[] {
  return EXPERIENCES.filter((e) => e.speciesIds.includes(speciesId));
}
