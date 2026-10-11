import type { DailyLog, Sighting } from './types';

/** きょうのミッション（毎日 0 時にリセット）。ポイントは付かず、達成の印と連続日数で続ける楽しさを作る */
export interface Mission {
  id: 'record' | 'study' | 'safe';
  title: string;
  /** 達成のための操作の行き先 */
  to: string;
  current: number;
  target: number;
  done: boolean;
}

/** 図鑑で調べる種の数 */
export const STUDY_TARGET = 3;

function localKey(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dailyMissions(input: { sightings: Sighting[]; daily: DailyLog; safeDriveDates: string[]; today: string }): Mission[] {
  const { sightings, daily, safeDriveDates, today } = input;
  // 記録した日（作った日）で数える。あとから過去の記録を入れても、きょうの記録になる
  const recorded = sightings.some((s) => localKey(s.createdAt) === today && s.syncState !== 'rejected') ? 1 : 0;
  const viewed = daily.date === today ? daily.viewed.length : 0;
  const safe = safeDriveDates.includes(today) ? 1 : 0;
  const list: Omit<Mission, 'done'>[] = [
    { id: 'record', title: '生き物を1回きろくする', to: '/capture', current: recorded, target: 1 },
    { id: 'study', title: `図鑑で${STUDY_TARGET}種しらべる`, to: '/zukan', current: Math.min(viewed, STUDY_TARGET), target: STUDY_TARGET },
    { id: 'safe', title: 'セーフドライブ宣言をする', to: '/safe-drive', current: safe, target: 1 },
  ];
  return list.map((m) => ({ ...m, done: m.current >= m.target }));
}

/** きょうまで続けてアプリを開いた日数（きょう開いていなければ、きのうまでの日数） */
export function visitStreak(visitDates: string[], today: string): number {
  const set = new Set(visitDates);
  const d = new Date(`${today}T12:00:00`);
  if (!set.has(today)) d.setDate(d.getDate() - 1);
  let n = 0;
  const pad = (x: number) => String(x).padStart(2, '0');
  for (;;) {
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!set.has(key)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
