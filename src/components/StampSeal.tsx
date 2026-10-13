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
 * 訪問済み: 押した印影。page の地に brand の二重の輪（外 2px、内 1px）、市町村名は brand の 600、
 * 日付は印の中の下側に caption で入れる。塗りの円はボタンやアバターに見えるので使わない（仕様からの変更）。
 * 未訪問: 1px の sep の輪、名前は fg-3 の 400。回転・かすれ・押印の動きは付けない。
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
          'relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full min-[360px]:h-20 min-[360px]:w-20',
          visited ? 'border-2 border-brand text-brand' : 'border border-sep text-fg-3',
        )}
      >
        {visited && <span aria-hidden className="absolute inset-[3px] rounded-full border border-brand" />}
        <span aria-hidden className="relative flex flex-col items-center">
          <span className={cn('whitespace-nowrap pt-[2px] text-[14px] leading-5 min-[360px]:text-callout', visited ? 'font-semibold' : 'font-normal')}>{label}</span>
          {day && <span className="num whitespace-nowrap text-[11px] leading-[14px] tracking-normal min-[360px]:text-caption">{day}</span>}
        </span>
      </div>
      {caption && <span className="mt-1.5 whitespace-nowrap text-caption text-fg-3">{caption}</span>}
    </div>
  );
}
