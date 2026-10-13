import { useMemo } from 'react';
import {
  allQuestProgress,
  computePoints,
  computeStats,
  currentMonth,
  earnedBadges,
  levelFor,
  rankFor,
} from '../lib/progress';
import { dailyMissions, visitStreak } from '../lib/missions';
import { dayKey, useStore } from './useStore';

export function useProgress() {
  const all = useStore((s) => s.sightings);
  // サーバーが受け付けなかった記録はポイント・図鑑に数えない（サーバーの計算と揃える）
  const sightings = useMemo(() => all.filter((s) => s.syncState !== 'rejected'), [all]);
  const settings = useStore((s) => s.settings);
  const month = currentMonth();

  return useMemo(() => {
    const stats = computeStats(sightings);
    const safeDriveDays = settings.safeDriveDates.length;
    const points = computePoints(sightings, month, safeDriveDays);
    const spent = settings.redemptions.reduce((sum, r) => sum + r.points, 0);
    const badges = earnedBadges(stats, { pledged: settings.pledged, safeDriveDays });
    return {
      stats,
      points,
      balance: Math.max(0, points - spent),
      rank: rankFor(points),
      level: levelFor(points),
      badges,
      quests: allQuestProgress(sightings, month),
      month,
    };
  }, [sightings, settings, month]);
}

/** きょうのミッションと連続日数 */
export function useMissions() {
  const sightings = useStore((s) => s.sightings);
  const daily = useStore((s) => s.settings.daily);
  const safeDriveDates = useStore((s) => s.settings.safeDriveDates);
  const visitDates = useStore((s) => s.settings.visitDates);
  const today = dayKey();
  return useMemo(() => {
    const missions = dailyMissions({ sightings, daily, safeDriveDates, today });
    return {
      missions,
      done: missions.filter((m) => m.done).length,
      allDone: missions.every((m) => m.done),
      celebrated: daily.date === today && daily.celebrated,
      streak: visitStreak(visitDates, today),
    };
  }, [sightings, daily, safeDriveDates, visitDates, today]);
}
