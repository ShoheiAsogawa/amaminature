import { Fragment } from 'react';
import { cn } from '../lib/cn';
import type { Badge } from '../lib/progress';
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

/** 紋章の形（§5.5）。○ 記録の節目 / ◇ 生き物 / □ 島と季節 / ⬡ 守る */
export type EmblemShape = 'circle' | 'diamond' | 'square' | 'hex';

type TextGlyph = { text: string; font: 'jp' | 'num'; size: number };
type Glyph = IconComponent | TextGlyph;

/** 「幻」の図柄（IBM Plex Sans JP 600、紋章 64 に対し 26px） */
const MABOROSHI: TextGlyph = { text: '幻', font: 'jp', size: 26 };
/** 「12」の図柄（IBM Plex Sans 600、24px） */
const TWELVE: TextGlyph = { text: '12', font: 'num', size: 24 };

/** バッジ id → 形と図柄（§5.5 の表） */
export const BADGE_EMBLEM: Record<string, { shape: EmblemShape; glyph: Glyph }> = {
  'first-step': { shape: 'circle', glyph: IconFootprintsFill },
  half: { shape: 'circle', glyph: IconBookOpenTextFill },
  complete: { shape: 'circle', glyph: IconTrophyFill },
  ruri: { shape: 'diamond', glyph: IconFeatherFill },
  'bird-watcher': { shape: 'diamond', glyph: IconBinocularsFill },
  'night-walker': { shape: 'diamond', glyph: IconMoonStarsFill },
  'endemic-hunter': { shape: 'diamond', glyph: IconIslandFill },
  legend: { shape: 'diamond', glyph: MABOROSHI },
  shore: { shape: 'diamond', glyph: IconWavesFill },
  mangrove: { shape: 'diamond', glyph: IconAmamiKayakFill },
  'island-hopper': { shape: 'square', glyph: IconSailboatFill },
  'all-areas': { shape: 'square', glyph: TWELVE },
  'four-seasons': { shape: 'square', glyph: IconSunHorizonFill },
  pledge: { shape: 'hex', glyph: IconHandHeartFill },
  'safe-driver': { shape: 'hex', glyph: IconCarProfileFill },
  'road-guardian': { shape: 'hex', glyph: IconRoadHorizonFill },
};

const DIAMOND = 'M32 3 L61 32 L32 61 L3 32 Z';
const HEX = 'M18 4 H46 L61 32 L46 60 H18 L3 32 Z';

function isText(g: Glyph): g is TextGlyph {
  return typeof g === 'object' && g !== null && 'text' in g;
}

/** 形を塗る。菱と亀甲は同じ色の 4 の線で角を丸める。未獲得は外側に 1px の sep の縁 */
function Shape({ shape, earned, legend, px }: { shape: EmblemShape; earned: boolean; legend: boolean; px: number }) {
  const body = earned ? (legend ? 'text-legend' : 'text-brand-fill') : 'text-fill';
  if (shape === 'circle') {
    return (
      <>
        <circle cx="32" cy="32" r="30" fill="currentColor" className={body} />
        {!earned && <circle cx="32" cy="32" r={30 + px / 2} fill="none" stroke="currentColor" strokeWidth={px} className="text-sep" />}
      </>
    );
  }
  if (shape === 'square') {
    // 角印: 内側 5 に 1px の線（獲得済みは on-brand の 40%、未獲得は sep）
    return (
      <>
        {!earned && <rect x={4 - px / 2} y={4 - px / 2} width={56 + px} height={56 + px} rx={10 + px / 2} fill="none" stroke="currentColor" strokeWidth={px} className="text-sep" />}
        <rect x="4" y="4" width="56" height="56" rx="10" fill="currentColor" className={body} />
        <rect
          x={9 + px / 2}
          y={9 + px / 2}
          width={46 - px}
          height={46 - px}
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth={px}
          className={earned ? 'text-on-brand opacity-40' : 'text-sep'}
        />
      </>
    );
  }
  const d = shape === 'diamond' ? DIAMOND : HEX;
  return (
    <>
      {!earned && <path d={d} fill="none" stroke="currentColor" strokeWidth={4 + px * 2} strokeLinejoin="round" className="text-sep" />}
      <path d={d} fill="currentColor" stroke="currentColor" strokeWidth={4} strokeLinejoin="round" className={body} />
    </>
  );
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
 * バッジの紋章（docs/DESIGN_SYSTEM.md §5.5・§7.14）。形で系統を表す印影。
 * 獲得済み: 形を brand-fill（幻だけ legend）で塗り、図柄を on-brand で白抜き。
 * 未獲得: 形を fill で塗り、1px の sep の縁、図柄は fg-3。図柄は紋章の 44%。
 */
export function BadgeEmblem({ badge, earned, size = 56, onClick, className }: BadgeEmblemProps) {
  const spec = BADGE_EMBLEM[badge.id] ?? { shape: 'circle' as const, glyph: IconSealCheck };
  const legend = badge.id === 'legend';
  // 夜の森の「幻」は on-brand（明るい）と legend（明るい金）が 1.9:1 しかないので、図柄を page（黒）にする
  const glyphColor = earned ? (legend ? 'text-on-brand dark:text-page' : 'text-on-brand') : 'text-fg-3';
  const px = 64 / size; // viewBox（64）の中での 1px
  const glyph = spec.glyph;
  const label = `${badge.title}${earned ? '' : '（未獲得）'}`;

  const emblem = (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role={onClick ? undefined : 'img'}
      aria-label={onClick ? undefined : label}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} className="absolute inset-0 overflow-visible" aria-hidden="true" focusable="false">
        <Shape shape={spec.shape} earned={earned} legend={legend} px={px} />
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
      {!isText(glyph) && (() => {
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

/**
 * バッジ名の改行位置（§3.5）。| の位置でだけ改行する。BADGES に titleBreak が入ったらそちらを優先する。
 */
export const BADGE_TITLE_BREAK: Record<string, string> = {
  'bird-watcher': 'バード|ウォッチャー',
  'safe-driver': 'セーフ|ドライバー',
  'road-guardian': '夜道の|見守り隊',
  mangrove: 'マングローブ|探検家',
  'endemic-hunter': '固有種|ハンター',
};

/** バッジ名。titleBreak（なければ BADGE_TITLE_BREAK）の | で改行し、それ以外は文節で改行する */
export function BadgeName({ badge, className }: { badge: Pick<Badge, 'id' | 'title'> & { titleBreak?: string }; className?: string }) {
  const br = badge.titleBreak ?? BADGE_TITLE_BREAK[badge.id];
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
