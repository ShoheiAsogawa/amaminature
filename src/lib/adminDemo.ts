/**
 * 管理画面のデモデータ（管理キーを入れていない時に見せる見本）。
 * 実在の団体名・個人名は使わない。数字は提携先ダッシュボードのデモと同じくらいの規模にしてある。
 */
import type { AdminAction, AdminPartner, AdminRedemption, AdminRoadReport, AdminSighting, AdminSummary, AdminUser } from './adminApi';
import { AREAS } from '../data/areas';
import { SPECIES } from '../data/species';

const H = 3600000;
const D = 24 * H;

/** 見本を作る時刻（画面を開いた時刻を基準に、少し前の出来事として並べる） */
function at(base: number, hoursAgo: number) {
  return new Date(base - hoursAgo * H).toISOString();
}

/** 見本の並びを毎回同じにするための疑似乱数 */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const NAMES = ['しまのりす', 'ルリ探検隊', 'よるの森ねこ', 'kuro_usagi', 'はぶ注意報', 'マングローブ太郎', 'うみがめ係', 'あまみん', 'ヘゴ好き', 'Kanaco'];

export function demoAdmin(now = Date.now()) {
  const rnd = seeded(20261013);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];

  const daily = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now + 9 * H - (13 - i) * D).toISOString().slice(0, 10);
    const weekend = [0, 6].includes(new Date(`${d}T12:00:00+09:00`).getUTCDay());
    return { day: d, sightings: Math.round(18 + rnd() * 22 + (weekend ? 25 : 0)) };
  });

  const summary: AdminSummary = {
    generatedAt: new Date(now).toISOString(),
    users: { total: 326, new7: 41, active7: 158, friends: 291, plus: 23 },
    sightings: { total: 2052, today: 37, week: daily.slice(-7).reduce((a, b) => a + b.sightings, 0), revoked: 4, rareWeek: 12 },
    roadReports: { total: 132, open: 5 },
    redemptions: { open: 4, openPoints: 1050, fulfilledPoints: 8400 },
    aiToday: 64,
    daily,
    topSpecies: [
      { speciesId: 'rurikakesu', n: 128 },
      { speciesId: 'amami-kurousagi', n: 97 },
      { speciesId: 'kurosagi', n: 84 },
      { speciesId: 'sashiba', n: 61 },
      { speciesId: 'ryukyu-konohazuku', n: 55 },
      { speciesId: 'asagimadara', n: 43 },
      { speciesId: 'hikagehego', n: 38 },
      { speciesId: 'otton-gaeru', n: 21 },
    ],
  };

  const redemptions: AdminRedemption[] = [
    { rewardId: 'tour-coupon', points: 300, status: 'requested', h: 5 },
    { rewardId: 'local-shop', points: 200, status: 'requested', h: 9 },
    { rewardId: 'whale-lottery', points: 150, status: 'requested', h: 20 },
    { rewardId: 'pin-badge', points: 500, status: 'requested', h: 30 },
    { rewardId: 'donate', points: 100, status: 'fulfilled', h: 50 },
    { rewardId: 'tour-coupon', points: 300, status: 'fulfilled', h: 76 },
    { rewardId: 'local-shop', points: 200, status: 'cancelled', h: 100 },
  ].map((r, i) => ({
    id: `demo-redemption-${i + 1}`,
    userId: `Udemo${i}`,
    rewardId: r.rewardId,
    rewardTitle: '',
    points: r.points,
    status: r.status as AdminRedemption['status'],
    note: r.status === 'fulfilled' ? 'LINEでクーポンを送付' : '',
    createdAt: at(now, r.h),
    updatedAt: r.status === 'requested' ? null : at(now, r.h - 6),
    displayName: NAMES[i % NAMES.length],
    nickname: '',
    isFriend: i !== 2,
  }));

  const areaIds = AREAS.map((a) => a.id);
  const sightingSpecies = ['rurikakesu', 'amami-kurousagi', 'kurosagi', 'ryukyu-konohazuku', 'ootoratsugumi', 'amami-ishikawagaeru', 'sashiba', 'habu', 'aoumigame', 'gajumaru', 'amami-marubane', 'asagimadara', 'otton-gaeru', 'mejiro', 'zatoukujira', 'shiomaneki'];
  const sightings: AdminSighting[] = sightingSpecies.map((speciesId, i) => {
    const sp = SPECIES.find((s) => s.id === speciesId)!;
    const revoked = i === 5;
    return {
      id: `demo-sighting-${i + 1}`,
      speciesId,
      nickname: i % 3 === 0 ? pick(['ルリ太郎', 'クロ丸', 'ぴよ', 'コホッ', '']) : '',
      memo: i === 5 ? '図鑑の写真を撮影したもののよう' : '',
      observedAt: at(now, i * 3 + 1),
      createdAt: at(now, i * 3 + 0.5),
      areaId: pick(areaIds),
      lat: sp.sensitive ? null : 28.2 + rnd() * 0.3,
      lng: sp.sensitive ? null : 129.3 + rnd() * 0.3,
      locationProtected: !!sp.sensitive,
      kind: 'photo',
      hasPhoto: false,
      userId: `Udemo${i % NAMES.length}`,
      displayName: NAMES[i % NAMES.length],
      userNickname: '',
      revokedAt: revoked ? at(now, 2) : null,
      revokeReason: revoked ? '同じ写真・他人の写真の使い回し' : null,
    };
  });

  const roadTypes: AdminRoadReport['type'][] = ['roadkill', 'on-road', 'injured', 'on-road', 'roadkill', 'on-road', 'roadkill', 'injured'];
  const roadSpecies = ['amami-kurousagi', 'amami-yamashigi', 'amami-kurousagi', 'iboimori', null, 'amami-kurousagi', 'ryukyu-inoshishi', 'amami-yamashigi'];
  const roadReports: AdminRoadReport[] = roadTypes.map((type, i) => ({
    id: `demo-road-${i + 1}`,
    type,
    speciesId: roadSpecies[i],
    areaId: pick(['amami', 'yamato', 'uken', 'setouchi', 'tokunoshima']),
    lat: 28.25 + rnd() * 0.2,
    lng: 129.3 + rnd() * 0.25,
    observedAt: at(now, 6 + i * 11),
    status: i < 5 ? 'new' : i < 7 ? 'forwarded' : 'closed',
    updatedAt: i < 5 ? null : at(now, i * 8),
    hasPhoto: false,
    memo: i === 0 ? '県道の三太郎峠付近、夜21時ごろ' : null,
    revokedAt: null,
  }));

  const partners: AdminPartner[] = [
    { id: 'demo-partner-1', name: 'A市 環境課（見本）', scope: 'amami', createdAt: at(now, 24 * 20) },
    { id: 'demo-partner-2', name: '保護団体B（見本）', scope: 'all', createdAt: at(now, 24 * 8) },
  ];

  const users: AdminUser[] = NAMES.map((n, i) => {
    const points = Math.round(1800 / (i + 1) + rnd() * 80);
    return {
      id: `Udemo${i}`,
      displayName: n,
      nickname: i % 4 === 0 ? n : '',
      pictureUrl: null,
      isFriend: i % 5 !== 3,
      plus: i % 4 === 1,
      createdAt: at(now, 24 * (30 - i * 2)),
      lastSeenAt: at(now, i * 7 + 1),
      sightings: Math.round(points / 25),
      species: Math.min(62, Math.round(points / 60) + 3),
      points,
      balance: Math.round(points * 0.6),
      level: Math.max(1, Math.floor(Math.sqrt(points / 10))),
    };
  });

  const actions: AdminAction[] = [
    { action: 'sighting.revoke', targetId: 'demo-sighting-6', detail: '同じ写真・他人の写真の使い回し', createdAt: at(now, 2) },
    { action: 'redemption.update', targetId: 'demo-redemption-5', detail: 'requested → fulfilled', createdAt: at(now, 44) },
    { action: 'road_report.update', targetId: 'demo-road-6', detail: 'forwarded', createdAt: at(now, 48) },
    { action: 'partner.create', targetId: 'demo-partner-2', detail: '保護団体B（見本） (all)', createdAt: at(now, 24 * 8) },
  ];

  return { summary, redemptions, sightings, roadReports, partners, users, actions };
}
