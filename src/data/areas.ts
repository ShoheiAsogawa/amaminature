import type { Area } from './types';

/**
 * 奄美群島12市町村（奄美群島広域事務組合の構成市町村）。
 * 代表点はおおよその集落・役場付近の座標で、最寄り判定にだけ使う。
 */
export const AREAS: Area[] = [
  {
    id: 'amami',
    name: '奄美市',
    island: '奄美大島',
    points: [
      [28.377, 129.494], // 名瀬
      [28.27, 129.4], // 住用
      [28.455, 129.68], // 笠利
    ],
  },
  { id: 'tatsugo', name: '龍郷町', island: '奄美大島', points: [[28.41, 129.59]] },
  { id: 'yamato', name: '大和村', island: '奄美大島', points: [[28.36, 129.39]] },
  { id: 'uken', name: '宇検村', island: '奄美大島', points: [[28.29, 129.3]] },
  {
    id: 'setouchi',
    name: '瀬戸内町',
    island: '奄美大島・加計呂麻島・請島・与路島',
    points: [
      [28.147, 129.313], // 古仁屋
      [28.115, 129.27], // 加計呂麻島
      [28.03, 129.25], // 請島
      [28.03, 129.165], // 与路島
    ],
  },
  { id: 'kikai', name: '喜界町', island: '喜界島', points: [[28.32, 129.94]] },
  { id: 'tokunoshima', name: '徳之島町', island: '徳之島', points: [[27.73, 129.0]] },
  { id: 'amagi', name: '天城町', island: '徳之島', points: [[27.81, 128.9]] },
  { id: 'isen', name: '伊仙町', island: '徳之島', points: [[27.67, 128.93]] },
  { id: 'wadomari', name: '和泊町', island: '沖永良部島', points: [[27.39, 128.65]] },
  { id: 'china', name: '知名町', island: '沖永良部島', points: [[27.33, 128.59]] },
  { id: 'yoron', name: '与論町', island: '与論島', points: [[27.05, 128.42]] },
];

export const AREA_BY_ID: Record<string, Area> = Object.fromEntries(AREAS.map((a) => [a.id, a]));

export const ISLAND_ORDER = ['奄美大島', '喜界島', '徳之島', '沖永良部島', '与論島'];
