// ZzFX（MIT、https://github.com/KilledByAPixel/ZzFX）の型。パッケージに型定義がないので、使う分だけ書く
declare module 'zzfx' {
  export function zzfx(...parameters: (number | undefined)[]): AudioBufferSourceNode;
  export const ZZFX: { volume: number; sampleRate: number; audioContext: AudioContext };
}
