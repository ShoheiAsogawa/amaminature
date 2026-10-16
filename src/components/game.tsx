import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { RARITY_META } from '../data/species';
import type { Category, Rarity } from '../data/types';
import { cn } from '../lib/cn';
import {
  IconAmamiFernFill,
  IconAmamiFrogFill,
  IconAmamiKurousagiFill,
  IconBird,
  IconButterfly,
  IconFishSimple,
  IconStarFill,
  type IconComponent,
} from './icons';

// ゲームの部品（タイプ・レア度の星・レベル・XP バー・コイン・メッセージ窓・リング）。docs/DESIGN_SYSTEM.md

// ───────── ドット絵の丸（docs/DESIGN_SYSTEM.md §4.1） ─────────

/** 直径 d ドットの丸の、上の行から順の左右の空き（ドット数）。scripts/pixel-frames.config.mjs の circleProfile と同じ */
function circleProfile(d: number): number[] {
  const r = d / 2;
  const out: number[] = [];
  for (let i = 0; ; i++) {
    const y = r - (i + 0.5);
    const inset = Math.round(r - Math.sqrt(Math.max(0, r * r - y * y)));
    if (inset <= 0) return out;
    out.push(inset);
  }
}

const circleClips = new Map<string, string>();

/** 20px 未満の丸は 1 ドット = 2px で描く（3px だと角が 1 段だけになり、十字に見える） */
const dotFor = (px: number) => (px < 20 ? 2 : 3);

/** ちょうど px の大きさの段々の丸の輪郭（左上が 0, 0 の点の列。時計回り） */
function pxCirclePoints(px: number, U = dotFor(px)): [number, number][] {
  const p = circleProfile(Math.round(px / U)).map((v) => v * U);
  const n = p.length;
  const pts: [number, number][] = [[0, n * U]];
  for (let k = n - 1; k >= 0; k--) pts.push([p[k], (k + 1) * U], [p[k], k * U]);
  for (let k = 0; k < n; k++) pts.push([px - p[k], k * U], [px - p[k], (k + 1) * U]);
  pts.push([px, n * U], [px, px - n * U]);
  for (let k = n - 1; k >= 0; k--) pts.push([px - p[k], px - (k + 1) * U], [px - p[k], px - k * U]);
  for (let k = 0; k < n; k++) pts.push([p[k], px - k * U], [p[k], px - (k + 1) * U]);
  pts.push([0, px - n * U]);
  return pts;
}

/**
 * ちょうど px の大きさの丸を、角の段々（1 ドット = 3px、20px 未満は 2px）で切り抜く clip-path（style の clipPath に渡す）。
 * px-circle-s / m / l / xl と同じ求め方で、どの大きさでも丸く見える形にする（px-circle-m は 39px、l は 63px の丸の形）。
 * 線のある丸は、3px（1 ドット）ずつ内側の要素に、その大きさの形を付けて重ねる（線が同じ太さでつながる）。
 */
export function pxCircleClip(px: number, U = dotFor(px)): string {
  const key = `${px}/${U}`;
  const hit = circleClips.get(key);
  if (hit) return hit;
  const clip = `polygon(${pxCirclePoints(px, U)
    .map(([x, y]) => `${x}px ${y}px`)
    .join(',')})`;
  circleClips.set(key, clip);
  return clip;
}

/** 太さ w の段々の輪（外の丸から内の丸をくり抜く clip-path） */
function pxRingClip(px: number, w: number): string {
  const sub = (pts: [number, number][], d: number) => `M${pts.map(([x, y]) => `${x + d} ${y + d}`).join(' L')} Z`;
  return `path(evenodd, '${sub(pxCirclePoints(px), 0)} ${sub(pxCirclePoints(px - w * 2), w)}')`;
}

// ───────── タイプ（分類） ─────────

/** 生き物のタイプ。色は Tailwind の type-* / type-soft-*（クラス名は JIT のため文字列で持つ） */
export const TYPE_META: Record<Category, { label: string; bg: string; soft: string; text: string; border: string; icon: IconComponent }> = {
  mammal: { label: 'けもの', bg: 'bg-type-mammal', soft: 'bg-type-soft-mammal', text: 'text-type-mammal', border: 'border-type-mammal', icon: IconAmamiKurousagiFill },
  bird: { label: 'とり', bg: 'bg-type-bird', soft: 'bg-type-soft-bird', text: 'text-type-bird', border: 'border-type-bird', icon: IconBird },
  herp: { label: 'は虫・両生', bg: 'bg-type-herp', soft: 'bg-type-soft-herp', text: 'text-type-herp', border: 'border-type-herp', icon: IconAmamiFrogFill },
  insect: { label: 'むし', bg: 'bg-type-insect', soft: 'bg-type-soft-insect', text: 'text-type-insect', border: 'border-type-insect', icon: IconButterfly },
  aqua: { label: 'うみ・みず', bg: 'bg-type-aqua', soft: 'bg-type-soft-aqua', text: 'text-type-aqua', border: 'border-type-aqua', icon: IconFishSimple },
  plant: { label: 'しょくぶつ', bg: 'bg-type-plant', soft: 'bg-type-soft-plant', text: 'text-type-plant', border: 'border-type-plant', icon: IconAmamiFernFill },
};

/** タイプのチップ（色の地に白い文字とアイコン。角を 1 段切ったドット絵の札） */
export function TypeBadge({ category, size = 'md', className }: { category: Category; size?: 'sm' | 'md'; className?: string }) {
  const t = TYPE_META[category];
  const Icon = t.icon;
  return (
    <span
      className={cn(
        'px-clip-1 inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-bold text-white',
        t.bg,
        size === 'sm' ? 'h-5 px-2 text-[12px] leading-none' : 'h-7 px-2.5 text-caption',
        className,
      )}
    >
      <Icon size={size === 'sm' ? 11 : 14} className="shrink-0" aria-hidden />
      {t.label}
    </span>
  );
}

// ───────── レア度の星 ─────────

const STAR_COLOR: Record<Rarity, string> = { 1: 'text-rare-1', 2: 'text-rare-2', 3: 'text-rare-3', 4: 'text-rare-4' };
const LABEL_COLOR: Record<Rarity, string> = { 1: 'text-fg-2', 2: 'text-brand', 3: 'text-rare-3', 4: 'text-legend' };

/**
 * レア度の星（4 段階）。めずらしい・幻は星が光る。withLabel で言葉（よく見る / ときどき / めずらしい / 幻）を添える。
 * onDark: 暗い舞台の上（空きの星を白の半透明に）
 */
export function Stars({
  rarity,
  size = 14,
  withLabel = false,
  onDark = false,
  className,
}: {
  rarity: Rarity;
  size?: number;
  withLabel?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  const word = RARITY_META[rarity].label;
  return (
    <span role="img" aria-label={`レア度 ${word}`} className={cn('inline-flex shrink-0 items-center gap-1.5', className)}>
      <span className="inline-flex items-center" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <IconStarFill
            key={i}
            data-gem={i <= rarity ? 'on' : 'off'}
            size={size}
            className={cn(
              '-mx-[1px]',
              i <= rarity ? STAR_COLOR[rarity] : onDark ? 'text-white/20' : 'text-fill-strong',
              i <= rarity && rarity >= 3 && 'drop-shadow-[0_2px_0_rgb(0_0_0/.22)]',
            )}
          />
        ))}
      </span>
      {withLabel && (
        <span className={cn('text-[16px] font-bold leading-5', onDark ? 'text-white' : LABEL_COLOR[rarity])} aria-hidden>
          {word}
        </span>
      )}
    </span>
  );
}

// ───────── レベル・XP ─────────

/**
 * レベルのバッジ（瑠璃のドット絵の丸に白い数字）。外から濃い瑠璃の線（size の外に 3px）・白い縁・瑠璃の地を重ねて切り抜き、
 * 下の厚みは切り抜かない外側の要素の drop-shadow で落とす
 */
export function LevelBadge({ level, size = 48, className }: { level: number; size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`レベル ${level}`}
      className={cn('relative grid shrink-0 place-items-center text-white [filter:drop-shadow(0_3px_0_rgb(var(--c-brand-pressed)))]', className)}
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="absolute -inset-[3px] bg-brand-pressed" style={{ clipPath: pxCircleClip(size + 6) }} />
      <span aria-hidden className="absolute inset-0 bg-white" style={{ clipPath: pxCircleClip(size) }} />
      <span aria-hidden className="absolute inset-[3px] bg-brand-fill" style={{ clipPath: pxCircleClip(size - 6) }} />
      <span aria-hidden className="relative flex flex-col items-center leading-none">
        <span className="num text-[12px] leading-none opacity-80">Lv</span>
        <span className="num leading-none" style={{ fontSize: Math.round(size * 0.42) }}>
          {level}
        </span>
      </span>
    </span>
  );
}

const lastXp = new Map<string, number>();
const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/**
 * XP バー（紺のドット絵の溝 px-track-night に、斜線が流れる緑の四角いバー）。id を渡すと、前に見た値から伸ばす。
 * tone: xp（緑）/ brand（瑠璃）/ gold（金）
 * height: 外の高さ。溝の枠（上下 3px）の中にバーが見えるよう、12px より低くしない
 */
export function XPBar({
  value,
  id,
  label,
  tone = 'xp',
  height = 14,
  className,
}: {
  value: number;
  id?: string;
  label?: string;
  tone?: 'xp' | 'brand' | 'gold';
  height?: number;
  className?: string;
}) {
  const v = clamp01(value);
  const [shown, setShown] = useState(() => (id && lastXp.has(id) ? lastXp.get(id)! : v));
  useEffect(() => {
    if (id) lastXp.set(id, v);
    const raf = requestAnimationFrame(() => setShown(v));
    return () => cancelAnimationFrame(raf);
  }, [v, id]);
  const fill = tone === 'xp' ? 'bg-xp' : tone === 'gold' ? 'bg-gold' : 'bg-brand-fill';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('px-track-night relative overflow-hidden', className)}
      style={{ height: Math.max(12, height) }}
    >
      <div
        className={cn('stripes animate-stripes relative h-full transition-[width] duration-700 ease-out', fill)}
        style={{ width: `${Math.max(shown > 0 ? 6 : 0, shown * 100)}%` }}
      >
        <span aria-hidden className="absolute inset-x-[3px] top-[1px] h-[2px] bg-white/45" />
      </div>
    </div>
  );
}

// ───────── コイン（ポイント） ─────────

/**
 * コインの印（金のドット絵の丸に星）。外の金の縁と内の金の地を重ねて切り抜く。
 * 20px 未満の小さいコインは縁を 2px にし、内の地は角 1 段の四角（px-clip-1）にする
 */
export function Coin({ size = 20, className }: { size?: number; className?: string }) {
  const small = size < 20;
  const shade = 'inset 0 -2px 0 rgb(0 0 0 / .12), inset 0 2px 0 rgb(255 255 255 / .5)';
  return (
    <span aria-hidden className={cn('relative grid shrink-0 place-items-center text-[#8a5a00]', className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 bg-gold-edge" style={{ clipPath: pxCircleClip(size) }} />
      <span
        className={cn('absolute bg-gold', small ? 'inset-[2px]' : 'inset-[3px]')}
        style={{ boxShadow: shade, clipPath: small ? pxCircleClip(size - 4, 2) : pxCircleClip(size - 6) }}
      />
      <IconStarFill size={Math.round(size * 0.55)} className="relative" />
    </span>
  );
}

/** コインと数（「1,240」）。pt は読み上げにだけ付ける */
export function CoinCount({ value, size = 20, className, numClassName }: { value: number; size?: number; className?: string; numClassName?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Coin size={size} />
      <span className={cn('num', numClassName)} aria-label={`${value.toLocaleString('ja-JP')}ポイント`}>
        {value.toLocaleString('ja-JP')}
      </span>
    </span>
  );
}

// ───────── リング ─────────

/** 円形の進み具合（図鑑のコンプ率など）。中に children を置く */
export function Ring({
  value,
  size = 76,
  stroke = 9,
  color = 'rgb(var(--c-brand-fill))',
  track = 'rgb(var(--c-fill-strong))',
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
}) {
  // 太さはドット（3px）の倍数にする
  const w = Math.max(3, Math.round(stroke / 3) * 3);
  const v = clamp01(value);
  return (
    <span className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      {/* ドット絵の段々の輪。進んだ分は上から時計回りの扇形の色（--ring は index.css の @property で動く） */}
      <span
        aria-hidden
        className="absolute inset-0 transition-[--ring] duration-700 ease-out"
        style={
          {
            '--ring': `${v * 360}deg`,
            background: `conic-gradient(${color} 0deg var(--ring), ${track} var(--ring) 360deg)`,
            clipPath: pxRingClip(size, w),
          } as CSSProperties
        }
      />
      <span className="relative">{children}</span>
    </span>
  );
}

// ───────── メッセージウィンドウ ─────────

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * ゲームの会話窓（ドット絵の飾りの窓 px-msg、枠の太さ 12px）。文字を 1 文字ずつ出し（押すと全部出る）、出し終えたら ▼ が点滅する。
 * 読み上げは全文をまとめて読む。speaker で窓の上に名前の札（px-nametag）を出す。
 */
export function MessageWindow({
  text,
  speaker,
  speed = 38,
  onDone,
  className,
  children,
}: {
  text: string;
  speaker?: string;
  /** 1 文字の間隔（ms） */
  speed?: number;
  onDone?: () => void;
  className?: string;
  /** 文字の下に置くもの（選択肢など） */
  children?: ReactNode;
}) {
  const reduce = prefersReduced();
  const chars = Array.from(text);
  const [n, setN] = useState(reduce ? chars.length : 0);
  const doneRef = useRef(false);
  const done = n >= chars.length;

  useEffect(() => {
    doneRef.current = false;
    setN(reduce ? Array.from(text).length : 0);
  }, [text, reduce]);

  useEffect(() => {
    if (done) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }
    const t = window.setTimeout(() => setN((x) => x + 1), speed);
    return () => window.clearTimeout(t);
  }, [n, done, speed, onDone]);

  return (
    <div className={cn('relative', speaker && 'pt-[13px]', className)}>
      {/* 名札は窓の上の枠（12px）に重ね、札の下の端を枠の内側の線にそろえる */}
      {speaker && (
        <span className="px-nametag absolute left-4 top-0 z-10 px-3 py-0.5 text-caption font-black text-[#1b1f3b]">
          {speaker}
        </span>
      )}
      <div
        className="px-msg msg-window min-h-[88px] px-2.5 py-2 text-[16px] leading-[28px]"
        onClick={() => setN(chars.length)}
        role="presentation"
      >
        <p aria-live="polite" className="sr-only">
          {text}
        </p>
        <p aria-hidden className="whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:keep-all]">
          {chars.slice(0, n).join('')}
          {/* まだ出ていない文字も透明で置いておく（打つたびに折り返しの位置が変わらないように） */}
          {!done && <span className="invisible">{chars.slice(n).join('')}</span>}
          {done && <span className="ml-1 inline-block animate-bounce text-[12px] text-[#2160E8]">▼</span>}
        </p>
        {done && children}
      </div>
    </div>
  );
}

// ───────── 小さな飾り ─────────

/** キラキラ（見出しや GET! の周り）。装飾なので読み上げない */
export function Sparkles({ className, count = 6 }: { className?: string; count?: number }) {
  const spots = [
    [8, 18],
    [88, 10],
    [16, 78],
    [92, 70],
    [50, 4],
    [70, 88],
    [30, 40],
    [80, 40],
  ].slice(0, count);
  return (
    <span aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {spots.map(([x, y], i) => (
        <span
          key={i}
          className="absolute animate-twinkle text-gold"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.23}s` }}
        >
          <IconStarFill size={10 + (i % 3) * 4} />
        </span>
      ))}
    </span>
  );
}
