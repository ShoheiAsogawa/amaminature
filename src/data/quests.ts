import type { Quest } from './types';

/**
 * 季節クエスト。sponsor 枠は企業協賛（ネイチャーポジティブ／CSR）の販売単位。
 * sponsor は協賛が決まったクエストにだけ入れる（「募集中」などの社内の状況は画面に出さない）。
 */
export const QUESTS: Quest[] = [
  {
    id: 'autumn-migration',
    title: '秋の渡りを見届けよう',
    description: '南へ旅するサシバかアサギマダラを記録しよう。',
    speciesIds: ['sashiba', 'asagimadara'],
    mode: 'any',
    months: [10, 11],
    reward: 50,
  },
  {
    id: 'whale-season',
    title: 'クジラの季節',
    description: '冬の奄美の海にやってくるザトウクジラを記録しよう。',
    speciesIds: ['zatoukujira'],
    mode: 'any',
    months: [12, 1, 2, 3, 4],
    reward: 60,
  },
  {
    id: 'summer-messenger',
    title: '夏の使者',
    description: '「キョロロロ」の声の主、リュウキュウアカショウビンに会いに行こう。',
    speciesIds: ['ryukyu-akashobin'],
    mode: 'any',
    months: [4, 5, 6, 7, 8, 9],
    reward: 50,
  },
  {
    id: 'turtle-beach',
    title: 'ウミガメの浜',
    description: 'ルールを守ってウミガメを観察・記録しよう。',
    speciesIds: ['aoumigame', 'akaumigame'],
    mode: 'any',
    months: [5, 6, 7, 8],
    reward: 50,
  },
  {
    id: 'night-debut',
    title: '夜の森デビュー',
    description: '夜行性の生き物を3種記録しよう。ナイトツアーがおすすめ。',
    mode: 'count',
    filter: 'nocturnal',
    count: 3,
    reward: 80,
  },
  {
    id: 'shore-watcher',
    title: '海辺の観察者',
    description: '海・水辺の生き物を3種記録しよう。クロサギは岩場で待っている。',
    mode: 'count',
    filter: 'aqua',
    count: 3,
    reward: 60,
  },
  {
    id: 'endemic-birds',
    title: '奄美の固有の鳥',
    description: 'ルリカケス・オーストンオオアカゲラ・オオトラツグミ・アマミヤマシギをすべて記録しよう。',
    speciesIds: ['rurikakesu', 'ooston-ooakagera', 'ootoratsugumi', 'amami-yamashigi'],
    mode: 'all',
    reward: 300,
  },
];
