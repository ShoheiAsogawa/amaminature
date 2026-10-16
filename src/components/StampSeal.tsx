import { cn } from '../lib/cn';

/** 市町村名から「市」「町」「村」を除いた印の文字（奄美市 → 奄美、徳之島町 → 徳之島） */
export function stampLabel(name: string): string {
  return name.replace(/[市町村]$/, '');
}

/** 印の中の日付（10月10日）。進み具合の「4/12」と読み違えないよう、スラッシュは使わない */
function monthDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ───────── ドット絵の輪（1 ドット = 3px） ─────────

/** 直径 d ドットの丸の、上から y 段目（0 始まり）の左右の空き（ドット数）。ドット絵の丸（px-circle-*）と同じ求め方 */
function circleInset(d: number, y: number): number {
  const r = d / 2;
  const dy = r - (Math.min(y, d - 1 - y) + 0.5);
  return Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)));
}

/** 直径 d ドットの印の、1 ドットの太さの輪（SVG の path。1 ドット = 1） */
function ringPath(d: number): string {
  const id = d - 2; // 内の直径
  let p = '';
  for (let y = 0; y < d; y++) {
    const o = circleInset(d, y);
    const inner = y >= 1 && y <= id;
    // 内の丸の端（輪が切れないよう、少なくとも 1 ドット）
    const i = inner ? Math.max(1 + circleInset(id, y - 1), o + 1) : 0;
    const runs = inner ? [[o, i], [d - i, d - o]] : [[o, d - o]];
    for (const [a, b] of runs) p += `M${a} ${y}h${b - a}v1h${a - b}z`;
  }
  return p;
}

// 68px の印は 22 ドット（66px）、80px の印は 26 ドット（78px）の輪。印の中に 1px ずつ余白。
// 輪の内側は 60px / 72px（丸い線の二重の輪だった時の内側 56px / 68px より広い）で、名前と日付が輪に重ならない
const SMALL = 22;
const LARGE = 26;
const RINGS = { small: ringPath(SMALL), large: ringPath(LARGE) };

function Ring({ dots, d, className }: { dots: number; d: string; className?: string }) {
  return (
    <svg
      aria-hidden
      width={dots * 3}
      height={dots * 3}
      viewBox={`0 0 ${dots} ${dots}`}
      shapeRendering="crispEdges"
      className={cn('absolute left-px top-px', className)}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export type StampSealProps = {
  /** 市町村名（例: 龍郷町）。印には「町」を除いた「龍郷」を入れる */
  name: string;
  visited: boolean;
  /** 訪問した日（最初に記録した日など）。訪問済みの時だけ印の中に「10月10日」の形で入れる */
  date?: string | Date | null;
  /** 印の下の小さな説明（例: 島の名前） */
  caption?: string;
  className?: string;
};

/**
 * スタンプ（docs/DESIGN_SYSTEM.md §7.15）。80px の円（日付を印の中に入れるため、仕様の 72px より大きくしている。360px 未満の幅では 68px）。
 * 輪はドット絵の丸（1 ドット = 3px の SVG。中は透けて、地の色がそのまま見える）。
 * 訪問済み: 押した印影。brand の 1 ドットの輪（二重にすると日付が輪に重なるので 1 本）、市町村名は brand の 600、
 * 日付は印の中の下側に caption で入れる。
 * 塗りの円はボタンやアバターに見えるので使わない（仕様からの変更）。
 * 未訪問: line の 1 本の輪、名前は fg-3 の 400。回転・かすれ・押印の動きは付けない。
 */
export function StampSeal({ name, visited, date, caption, className }: StampSealProps) {
  const label = stampLabel(name);
  const day = visited && date ? monthDay(date) : null;
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        role="img"
        aria-label={`${name} ${visited ? `訪問済み${day ? ` ${day}` : ''}` : '未訪問'}`}
        className={cn(
          // 4 列に並べるので、320px 幅の端末では 68px にして隣の印と重ならないようにする
          'relative grid h-[68px] w-[68px] shrink-0 place-items-center min-[360px]:h-20 min-[360px]:w-20',
          visited ? 'text-brand' : 'text-fg-3',
        )}
      >
        <Ring dots={SMALL} d={RINGS.small} className={cn('min-[360px]:hidden', !visited && 'text-line')} />
        <Ring dots={LARGE} d={RINGS.large} className={cn('hidden min-[360px]:block', !visited && 'text-line')} />
        <span aria-hidden className="relative flex flex-col items-center">
          {/* 小さい印（320px 幅）は 12px の PixelMplus12、大きい印は 16px の DotGothic16（ドットがにじまない大きさだけ） */}
          <span className="whitespace-nowrap pt-[2px] text-[12px] leading-5 min-[360px]:hidden">{label}</span>
          <span className="hidden whitespace-nowrap pt-[2px] text-callout min-[360px]:inline">{label}</span>
          {day && <span className="num whitespace-nowrap text-[12px] leading-[14px] min-[360px]:leading-4">{day}</span>}
        </span>
      </div>
      {caption && <span className="mt-1.5 whitespace-nowrap text-caption text-fg-3">{caption}</span>}
    </div>
  );
}
