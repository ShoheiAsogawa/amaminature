import { Fragment, useId, type SVGProps } from 'react';
import { cn } from '../lib/cn';
import { BADGES, type Badge, type BadgeFamily, type BadgeIcon } from '../lib/progress';
import {
  IconAmamiKayakFill,
  IconBinocularsFill,
  IconBookOpenTextFill,
  IconCarProfileFill,
  IconFeatherFill,
  IconFootprintsFill,
  IconHandHeartFill,
  IconIslandFill,
  IconMoonStarsFill,
  IconRoadHorizonFill,
  IconSailboatFill,
  IconSealCheck,
  IconSunHorizonFill,
  IconTrophyFill,
  IconWavesFill,
  type IconComponent,
} from './icons';
import { Phrase } from './Phrase';

// このファイルは ui.tsx を import しない（ui.tsx がこのファイルを読むので、循環を避ける）

type TextGlyph = { text: string; font: 'jp' | 'num'; size: number };
type Glyph = IconComponent | TextGlyph;

/**
 * 図柄（§5.5 の表。BADGES[].icon の名前 → コンポーネント）。文字の図柄は、Phosphor の fill の図柄と
 * 同じ見た目の重さになる大きさ（紋章 64 に対する px）にしてある。
 */
const GLYPH: Record<BadgeIcon, Glyph> = {
  'footprints-fill': IconFootprintsFill,
  'book-open-text-fill': IconBookOpenTextFill,
  'trophy-fill': IconTrophyFill,
  'feather-fill': IconFeatherFill,
  'binoculars-fill': IconBinocularsFill,
  'moon-stars-fill': IconMoonStarsFill,
  'island-fill': IconIslandFill,
  'text:幻': { text: '幻', font: 'jp', size: 24 },
  'waves-fill': IconWavesFill,
  'amami:kayak-fill': IconAmamiKayakFill,
  'sailboat-fill': IconSailboatFill,
  'text:12': { text: '12', font: 'num', size: 23 },
  'sun-horizon-fill': IconSunHorizonFill,
  'hand-heart-fill': IconHandHeartFill,
  'car-profile-fill': IconCarProfileFill,
  'road-horizon-fill': IconRoadHorizonFill,
};

const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));

function isText(g: Glyph): g is TextGlyph {
  return typeof g === 'object' && g !== null && 'text' in g;
}


/** 系統ごとの形と色（ジムバッジのような金属のメダル） */
const FAMILY: Record<BadgeFamily, { from: string; to: string; edge: string }> = {
  milestone: { from: '#FFE58A', to: '#E09B00', edge: '#9A6400' },
  creature: { from: '#A99BFF', to: '#5B46E5', edge: '#3524A8' },
  place: { from: '#5EEAB5', to: '#0E9F6E', edge: '#086447' },
  protect: { from: '#FF9C8F', to: '#E5484D', edge: '#A3262B' },
};
const LEGEND = { from: '#FFF3B0', to: '#F5A400', edge: '#8A5A00' };

function Shape({ family, ...p }: { family: BadgeFamily } & SVGProps<SVGPathElement & SVGCircleElement>) {
  switch (family) {
    case 'milestone':
      return <path d="M32 2.5 57.5 17v30L32 61.5 6.5 47V17z" strokeLinejoin="round" {...p} />;
    case 'place':
      return <path d="M32 2.5 61.5 32 32 61.5 2.5 32z" strokeLinejoin="round" {...p} />;
    case 'protect':
      return <path d="M32 3 57 11v19c0 15.5-11 25.5-25 31C18 55.5 7 45.5 7 30V11z" strokeLinejoin="round" {...p} />;
    default:
      return <circle cx="32" cy="32" r="29.5" {...p} />;
  }
}

export type BadgeEmblemProps = {
  /** id と title があればよい（BADGES の要素をそのまま渡せる） */
  badge: Pick<Badge, 'id' | 'title'>;
  earned: boolean;
  /** 一覧 56、マイページ 64、獲得画面・説明シート 120〜140 */
  size?: number;
  /** 渡すとボタンになる（押すとバッジの説明シートを開く） */
  onClick?: () => void;
  className?: string;
};

/**
 * バッジの紋章（ゲームのジムバッジのようなメダル）。系統ごとに形と色が違う
 * （記録の節目＝金の六角、生き物＝紫の円、島と季節＝緑のひし形、守る＝赤の盾。幻は金）。
 * 獲得済みは金属の光沢とハイライト。未獲得は灰色で、図柄だけ薄く見せる。
 */
export function BadgeEmblem({ badge, earned, size = 56, onClick, className }: BadgeEmblemProps) {
  const def = BADGE_BY_ID.get(badge.id);
  const glyph: Glyph = def ? GLYPH[def.icon] : IconSealCheck;
  const family: BadgeFamily = def?.family ?? 'milestone';
  const legend = badge.id === 'legend';
  const c = legend ? LEGEND : FAMILY[family];
  const id = useId().replace(/:/g, '');
  const glyphColor = earned ? 'text-white' : 'text-fg-3/60';
  const label = `${badge.title}${earned ? '' : '（未獲得）'}`;

  const emblem = (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role={onClick ? undefined : 'img'}
      aria-label={onClick ? undefined : label}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} className="absolute inset-0 overflow-visible" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={c.from} />
            <stop offset="1" stopColor={c.to} />
          </linearGradient>
        </defs>
        {earned ? (
          <>
            {/* 下の厚み */}
            <g transform="translate(0 2.5)">
              <Shape family={family} fill={c.edge} />
            </g>
            <Shape family={family} fill={`url(#g${id})`} stroke={c.edge} strokeWidth={1.5} />
            <circle cx="32" cy="32" r="19.5" fill="none" stroke="white" strokeOpacity={0.45} strokeWidth={1.6} />
            {/* 光沢 */}
            <ellipse cx="24" cy="18" rx="13" ry="6" fill="white" opacity={0.35} transform="rotate(-30 24 18)" />
          </>
        ) : (
          <>
            <Shape family={family} fill="currentColor" className="text-fill-strong" stroke="currentColor" strokeWidth={1.5} />
            <circle cx="32" cy="32" r="19.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeDasharray="3 3" className="text-line" />
          </>
        )}
        {isText(glyph) && (
          <text
            x="32"
            y="33"
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize={glyph.size}
            className={cn('font-black', glyph.font === 'num' ? 'font-num' : 'font-sans', glyphColor)}
            style={earned ? { filter: `drop-shadow(0 1.5px 0 ${c.edge})` } : undefined}
          >
            {glyph.text}
          </text>
        )}
      </svg>
      {!isText(glyph) &&
        (() => {
          const G = glyph;
          return (
            <G
              size={Math.round(size * 0.42)}
              className={cn('relative', glyphColor)}
              style={earned ? { filter: `drop-shadow(0 ${Math.max(1, size / 40)}px 0 ${c.edge})` } : undefined}
            />
          );
        })()}
    </span>
  );

  if (!onClick) return emblem;
  return (
    <button type="button" onClick={onClick} aria-label={label} className="pressable inline-grid shrink-0 place-items-center rounded-full">
      {emblem}
    </button>
  );
}

/** バッジ名。BADGES の titleBreak の | で改行し、それ以外は文節で改行する（§3.5） */
export function BadgeName({ badge, className }: { badge: Pick<Badge, 'id' | 'title'> & { titleBreak?: string }; className?: string }) {
  const br = badge.titleBreak ?? BADGE_BY_ID.get(badge.id)?.titleBreak;
  if (!br) return <Phrase text={badge.title} className={className} />;
  return (
    <span className={cn('phrase', className)}>
      {br.split('|').map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}
