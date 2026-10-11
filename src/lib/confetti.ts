/**
 * 紙吹雪（canvas-confetti）。記録・レベルアップ・ミッション達成の時だけ。
 * 動きを減らす設定では出さない。ライブラリは最初に使う時に読み込む。
 */
export type ConfettiKind = 'get' | 'rare' | 'legend' | 'level' | 'mission';

const COLORS: Record<ConfettiKind, string[]> = {
  get: ['#2160E8', '#22C56E', '#FFC12E', '#F0453A', '#FFFFFF'],
  rare: ['#9333EA', '#C084FC', '#38BDF8', '#FFFFFF', '#FFC12E'],
  legend: ['#FFC12E', '#FDE68A', '#F59E0B', '#FFFFFF', '#FFF7D6'],
  level: ['#22C56E', '#FFC12E', '#2160E8', '#FFFFFF'],
  mission: ['#FFC12E', '#F0453A', '#22C56E', '#2160E8'],
};

function reduced(): boolean {
  return typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export async function confettiBurst(kind: ConfettiKind = 'get'): Promise<void> {
  if (reduced()) return;
  try {
    const { default: confetti } = await import('canvas-confetti');
    const colors = COLORS[kind];
    const base = { colors, zIndex: 80, disableForReducedMotion: true, scalar: 1.1, ticks: 220 };
    if (kind === 'legend' || kind === 'rare') {
      // 左右から 2 回
      confetti({ ...base, particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, startVelocity: 55 });
      confetti({ ...base, particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, startVelocity: 55 });
      if (kind === 'legend') {
        window.setTimeout(() => confetti({ ...base, particleCount: 120, spread: 120, origin: { y: 0.35 }, shapes: ['star'], scalar: 1.4 }), 350);
      }
      return;
    }
    confetti({ ...base, particleCount: kind === 'mission' ? 70 : 110, spread: 80, origin: { y: 0.45 }, startVelocity: 42 });
  } catch {
    // 読み込めなくても記録には影響しない
  }
}
