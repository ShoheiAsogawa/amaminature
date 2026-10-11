import { useEffect, useRef, useState, type ReactNode } from 'react';
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

/** タイプのチップ（色の地に白い文字とアイコン） */
export function TypeBadge({ category, size = 'md', className }: { category: Category; size?: 'sm' | 'md'; className?: string }) {
  const t = TYPE_META[category];
  const Icon = t.icon;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-bold text-white',
        t.bg,
        size === 'sm' ? 'h-5 px-2 text-[10px] leading-none' : 'h-7 px-2.5 text-caption',
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
              i <= rarity && rarity >= 3 && 'drop-shadow-[0_0_4px_currentColor]',
            )}
          />
        ))}
      </span>
      {withLabel && (
        <span className={cn('text-sub font-bold', onDark ? 'text-white' : LABEL_COLOR[rarity])} aria-hidden>
          {word}
        </span>
      )}
    </span>
  );
}

// ───────── レベル・XP ─────────

/** レベルのバッジ（瑠璃の円に白い数字。下に厚み） */
export function LevelBadge({ level, size = 48, className }: { level: number; size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`レベル ${level}`}
      className={cn('relative grid shrink-0 place-items-center rounded-full border-[3px] border-white bg-brand-fill text-white', className)}
      style={{ width: size, height: size, boxShadow: '0 3px 0 rgb(var(--c-brand-pressed)), 0 0 0 2px rgb(var(--c-brand-pressed))' }}
    >
      <span aria-hidden className="flex flex-col items-center leading-none">
        <span className="num text-[10px] leading-none opacity-80">Lv</span>
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
 * XP バー（紺の溝に、斜線が流れる緑のバー）。id を渡すと、前に見た値から伸ばす。
 * tone: xp（緑）/ brand（瑠璃）/ gold（金）
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
      className={cn('relative overflow-hidden rounded-full border-2 border-night bg-night dark:border-white/10 dark:bg-black/55', className)}
      style={{ height }}
    >
      <div
        className={cn('stripes animate-stripes relative h-full rounded-full transition-[width] duration-700 ease-out', fill)}
        style={{ width: `${Math.max(shown > 0 ? 6 : 0, shown * 100)}%` }}
      >
        <span aria-hidden className="absolute inset-x-1 top-[2px] h-[30%] rounded-full bg-white/45" />
      </div>
    </div>
  );
}

// ───────── コイン（ポイント） ─────────

/** コインの印（金の円に星） */
export function Coin({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full border-2 border-gold-edge bg-gold text-[#8a5a00]', className)}
      style={{ width: size, height: size, boxShadow: 'inset 0 -2px 0 rgb(0 0 0 / .12), inset 0 2px 0 rgb(255 255 255 / .5)' }}
    >
      <IconStarFill size={Math.round(size * 0.55)} />
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
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = clamp01(value);
  return (
    <span className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg aria-hidden width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

// ───────── メッセージウィンドウ ─────────

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * ゲームの会話窓。文字を 1 文字ずつ出し（押すと全部出る）、出し終えたら ▼ が点滅する。
 * 読み上げは全文をまとめて読む。speaker で窓の上に名前の札を出す。
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
    <div className={cn('relative', speaker && 'pt-3', className)}>
      {speaker && (
        <span className="absolute left-4 top-0 z-10 rounded-full border-[3px] border-[#1b1f3b] bg-gold px-3 py-0.5 font-sans text-caption font-black text-[#1b1f3b]">
          {speaker}
        </span>
      )}
      <div
        className="msg-window min-h-[88px] px-4 pb-4 pt-4 text-[17px] leading-[28px]"
        onClick={() => setN(chars.length)}
        role="presentation"
      >
        <p aria-live="polite" className="sr-only">
          {text}
        </p>
        <p aria-hidden className="whitespace-pre-wrap [overflow-wrap:anywhere] [word-break:keep-all]">
          {chars.slice(0, n).join('')}
          {done && <span className="ml-1 inline-block animate-bounce text-[13px] text-[#2160E8]">▼</span>}
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
