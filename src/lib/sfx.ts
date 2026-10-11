import { useStore } from '../store/useStore';

/**
 * 効果音（ZzFX でその場で合成する。音声ファイルは持たない）と、ふるえ（Android の振動）。
 * 設定の「効果音」がオフなら鳴らさない。音はユーザーの操作の後にしか出せない（ブラウザの制限）。
 */
export type SfxName = 'tap' | 'coin' | 'shake' | 'burst' | 'get' | 'rare' | 'levelup' | 'badge' | 'mission' | 'error' | 'whoosh';

type ZzfxModule = typeof import('zzfx');
let loading: Promise<ZzfxModule> | null = null;

function enabled(): boolean {
  return useStore.getState().settings.sound;
}

function load(): Promise<ZzfxModule> {
  // ZzFX は読み込んだ時に AudioContext を作るので、最初に鳴らす時まで読み込まない
  loading ??= import('zzfx').then((m) => {
    m.ZZFX.volume = 0.22;
    return m;
  });
  return loading;
}

/** 1 音（三角波、短い減衰） */
type Note = [freq: number, at: number, len?: number, vol?: number];

const MELODY: Partial<Record<SfxName, Note[]>> = {
  get: [
    [523, 0],
    [659, 90],
    [784, 180],
    [1047, 270, 0.22],
  ],
  rare: [
    [523, 0],
    [784, 80],
    [1047, 160],
    [1319, 240],
    [1568, 320, 0.3],
  ],
  levelup: [
    [392, 0],
    [523, 70],
    [659, 140],
    [784, 210],
    [1047, 300, 0.12],
    [1047, 420, 0.3],
  ],
  badge: [
    [1319, 0],
    [1568, 70],
    [2093, 140, 0.25],
  ],
  mission: [
    [784, 0],
    [988, 90],
    [1175, 180, 0.2],
  ],
};

/** ZzFX のパラメータ（volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, …） */
const RAW: Partial<Record<SfxName, (number | undefined)[]>> = {
  tap: [0.5, 0, 880, 0, 0.01, 0.04, 1, 2],
  coin: [0.7, 0, 1675, undefined, 0.06, 0.24, 1, 1.82, undefined, undefined, 837, 0.06],
  shake: [0.9, 0, 180, 0, 0.02, 0.09, 1, 1.4, -6],
  burst: [0.9, 0.1, 500, 0.01, 0.06, 0.45, 4, 0.6, -2],
  error: [0.5, 0, 150, 0, 0.08, 0.1, 2, 1.5],
  whoosh: [0.5, 0, 300, 0.05, 0.05, 0.2, 4, 0, 6],
};

export function sfx(name: SfxName): void {
  if (typeof window === 'undefined' || !enabled()) return;
  void load()
    .then(({ zzfx }) => {
      const raw = RAW[name];
      if (raw) {
        zzfx(...raw);
        return;
      }
      for (const [freq, at, len = 0.08, vol = 0.6] of MELODY[name] ?? []) {
        window.setTimeout(() => zzfx(vol, 0, freq, 0.005, len, 0.12, 1, 1.4), at);
      }
    })
    .catch(() => {
      // 音が出せない環境（古いブラウザ、テスト）では何もしない
    });
}

/** ふるえ（対応する端末だけ。iPhone の Safari は振動に対応していない） */
export function buzz(pattern: number | number[]): void {
  if (!enabled()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // 無視する
  }
}
