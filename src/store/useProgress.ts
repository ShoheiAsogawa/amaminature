import { useMemo } from 'react';
import {
  allQuestProgress,
  computePoints,
  computeStats,
  currentMonth,
  earnedBadges,
  rankFor,
} from '../lib/progress';
import { useStore } from './useStore';

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
      badges,
      quests: allQuestProgress(sightings, month),
      month,
    };
  }, [sightings, settings, month]);
}
