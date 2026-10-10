import { Fragment } from 'react';
import { cn } from '../lib/cn';
import { BADGES, type Badge, type BadgeIcon } from '../lib/progress';
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

export type BadgeEmblemProps = {
  /** id と title があればよい（BADGES の要素をそのまま渡せる） */
  badge: Pick<Badge, 'id' | 'title'>;
  earned: boolean;
  /** 一覧 56、マイページの「最近獲得した」64、獲得画面・説明シート 120 */
  size?: number;
  /** 渡すとボタンになる（押すとバッジの説明シートを開く。§7.14） */
  onClick?: () => void;
  className?: string;
};

/**
 * バッジの紋章（docs/DESIGN_SYSTEM.md §5.5・§7.14）。印影。
 * すべて同じ丸い印（r=30）に、内側 3.5 の 1px の輪を入れる。§5.5 は系統ごとに ○◇□⬡ の形を変えるが、
 * 4 種の形と 2 種の図柄（アイコンと文字）が混ざって既製のバッジ集に見えたため、外形を丸い印にそろえている。
 * 獲得済み: 形を brand-fill（幻だけ legend）で塗り、図柄を on-brand で白抜き。内側の輪は on-brand の 40%。
 * 未獲得: 形を fill で塗り、1px の sep の縁と内側の輪、図柄は fg-3。図柄は紋章の 44%。
 */
export function BadgeEmblem({ badge, earned, size = 56, onClick, className }: BadgeEmblemProps) {
  const def = BADGE_BY_ID.get(badge.id);
  const glyph: Glyph = def ? GLYPH[def.icon] : IconSealCheck;
  const legend = badge.id === 'legend';
  // 夜の森の「幻」は on-brand（明るい）と legend（明るい金）が 1.9:1 しかないので、図柄を page（黒）にする
  const glyphColor = earned ? (legend ? 'text-on-brand dark:text-page' : 'text-on-brand') : 'text-fg-3';
  const body = earned ? (legend ? 'text-legend' : 'text-brand-fill') : 'text-fill';
  const px = 64 / size; // viewBox（64）の中での 1px
  const label = `${badge.title}${earned ? '' : '（未獲得）'}`;

  const emblem = (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role={onClick ? undefined : 'img'}
      aria-label={onClick ? undefined : label}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} className="absolute inset-0 overflow-visible" aria-hidden="true" focusable="false">
        {!earned && <circle cx="32" cy="32" r={30 + px / 2} fill="none" stroke="currentColor" strokeWidth={px} className="text-sep" />}
        <circle cx="32" cy="32" r="30" fill="currentColor" className={body} />
        <circle
          cx="32"
          cy="32"
          r={26.5 - px / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={px}
          className={earned ? (legend ? 'text-on-brand opacity-50 dark:text-page' : 'text-on-brand opacity-40') : 'text-sep'}
        />
        {isText(glyph) && (
          <text
            x="32"
            y="33"
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize={glyph.size}
            className={cn('font-semibold', glyph.font === 'num' ? 'font-num' : 'font-sans', glyphColor)}
          >
            {glyph.text}
          </text>
        )}
      </svg>
      {!isText(glyph) &&
        (() => {
          const G = glyph;
          return <G size={Math.round(size * 0.44)} className={cn('relative', glyphColor)} />;
        })()}
    </span>
  );

  if (!onClick) return emblem;
  return (
    <button type="button" onClick={onClick} aria-label={label} className="inline-grid shrink-0 place-items-center rounded-full active:opacity-[.72]">
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
