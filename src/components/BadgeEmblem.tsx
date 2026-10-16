import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

/** 形（64 × 64 の座標）。円は path で書く（Path2D に渡すため） */
const SHAPE: Record<BadgeFamily, string> = {
  milestone: 'M32 2.5 57.5 17v30L32 61.5 6.5 47V17z',
  place: 'M32 2.5 61.5 32 32 61.5 2.5 32z',
  protect: 'M32 3 57 11v19c0 15.5-11 25.5-25 31C18 55.5 7 45.5 7 30V11z',
  creature: 'M32 2.5a29.5 29.5 0 1 0 0.001 0z',
};

/** 1 ドット = 3px */
const DOT = 3;

/** <html data-theme> の切り替え（未獲得の灰色はテーマの色で描く） */
function useThemeName() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'light');
  useEffect(() => {
    const ob = new MutationObserver(() => setTheme(document.documentElement.dataset.theme ?? 'light'));
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => ob.disconnect();
  }, []);
  return theme;
}

const token = (name: string) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim().split(/\s+/).join(',')})`;

/**
 * メダルの地を、1 ドット = 1 画素の小さな canvas に描く（表示は 3 倍に拡大して image-rendering: pixelated）。
 * 線は 1 ドット、下の厚みは 1 ドット、ふちのにじみ（半透明の画素）は消して、ドット絵の硬いふちにする。
 */
function drawMedal(cv: HTMLCanvasElement, n: number, family: BadgeFamily, c: { from: string; to: string; edge: string }, earned: boolean) {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  const k = n / 64; // 64 の座標 → ドット
  const one = 1 / k; // 1 ドットを 64 の座標で
  const shape = new Path2D(SHAPE[family]);
  const shrunk = (d: number) => {
    // 中心から d ドット内側に縮めた形
    const sc = (64 - 2 * d * one) / 64;
    ctx.translate(32, 32);
    ctx.scale(sc, sc);
    ctx.translate(-32, -32);
  };
  ctx.scale(k, k);
  if (earned) {
    // 下の厚み（1 ドット下にずらした縁の色）
    ctx.save();
    ctx.translate(0, one);
    ctx.fillStyle = c.edge;
    ctx.fill(shape);
    ctx.restore();
    // 縁（1 ドット）と、グラデーションの面
    ctx.fillStyle = c.edge;
    ctx.fill(shape);
    ctx.save();
    shrunk(1);
    const g = ctx.createLinearGradient(0, 0, 64, 64);
    g.addColorStop(0, c.from);
    g.addColorStop(1, c.to);
    ctx.fillStyle = g;
    ctx.fill(shape);
    ctx.restore();
    // 内側の白い輪と、左上の光（ドットの四角い光）
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = one;
    ctx.beginPath();
    ctx.arc(32, 32, 19.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(16, 12, 3 * one, one);
    ctx.fillRect(16 - one, 12 + one, one, 2 * one);
  } else {
    ctx.fillStyle = token('fg-3');
    ctx.globalAlpha = 0.35;
    ctx.fill(shape);
    ctx.globalAlpha = 1;
    ctx.save();
    shrunk(1);
    ctx.fillStyle = token('fill-strong');
    ctx.fill(shape);
    ctx.restore();
    ctx.strokeStyle = token('line');
    ctx.lineWidth = one;
    ctx.setLineDash([2 * one, 2 * one]);
    ctx.beginPath();
    ctx.arc(32, 32, 19.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  // ふちのにじみを消す（半分より薄い画素は透明、それ以外は不透明に）
  const img = ctx.getImageData(0, 0, cv.width, cv.height);
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) d[i] = d[i] < 128 ? 0 : 255;
  ctx.putImageData(img, 0, 0);
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
 * メダルの地はドット絵（1 ドット = 3px の canvas、縁と厚みは 1 ドット）。獲得済みは金属のグラデーションと光、未獲得は灰色で、図柄だけ薄く見せる。
 */
export function BadgeEmblem({ badge, earned, size = 56, onClick, className }: BadgeEmblemProps) {
  const def = BADGE_BY_ID.get(badge.id);
  const glyph: Glyph = def ? GLYPH[def.icon] : IconSealCheck;
  const family: BadgeFamily = def?.family ?? 'milestone';
  const legend = badge.id === 'legend';
  const c = legend ? LEGEND : FAMILY[family];
  const theme = useThemeName();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ドットの数（紋章の大きさを 3px のドットで割る）。厚みの 1 ドットを下に足す
  const n = Math.max(8, Math.floor(size / DOT));
  useLayoutEffect(() => {
    if (canvasRef.current) drawMedal(canvasRef.current, n, family, c, earned);
  }, [n, family, c, earned, theme]);
  const glyphColor = earned ? 'text-white' : 'text-fg-3/60';
  const label = `${badge.title}${earned ? '' : '（未獲得）'}`;

  const emblem = (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
      role={onClick ? undefined : 'img'}
      aria-label={onClick ? undefined : label}
    >
      {/* メダルの地（ドット絵）。1 ドット = 3px で、紋章の真ん中に置く。厚みの 1 ドットは下にはみ出す */}
      <canvas
        ref={canvasRef}
        width={n}
        height={n + 1}
        aria-hidden
        className="absolute [image-rendering:pixelated]"
        style={{ width: n * DOT, height: (n + 1) * DOT, left: Math.floor((size - n * DOT) / 2), top: Math.floor((size - n * DOT) / 2) }}
      />
      {/* 文字の図柄（幻・12）はドット文字（PixelMplus12）。にじまないよう 12 の倍数の大きさにし、影も 1 ドット */}
      {isText(glyph) &&
        (() => {
          const px = Math.max(12, Math.round((size * glyph.size) / 64 / 12) * 12);
          return (
            <span
              aria-hidden
              className={cn('relative font-small leading-none', glyphColor)}
              style={{ fontSize: px, filter: earned ? `drop-shadow(0 ${px / 12}px 0 ${c.edge})` : undefined }}
            >
              {glyph.text}
            </span>
          );
        })()}
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
    // 押すと沈むだけ（.pressable の押した時の細い影は付けない。厚みはメダルのドット絵が描く）
    <button type="button" onClick={onClick} aria-label={label} className="pressable inline-grid shrink-0 place-items-center active:shadow-none">
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
