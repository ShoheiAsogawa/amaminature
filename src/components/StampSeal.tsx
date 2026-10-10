import { cn } from '../lib/cn';

/** 市町村名から「市」「町」「村」を除いた印の文字（奄美市 → 奄美、徳之島町 → 徳之島） */
export function stampLabel(name: string): string {
  return name.replace(/[市町村]$/, '');
}

function monthDay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export type StampSealProps = {
  /** 市町村名（例: 龍郷町）。印には「町」を除いた「龍郷」を入れる */
  name: string;
  visited: boolean;
  /** 訪問した日（最初に記録した日など）。訪問済みの時だけ円の下に 10/10 の形で出す */
  date?: string | Date | null;
  className?: string;
};

/**
 * スタンプ（docs/DESIGN_SYSTEM.md §7.15）。72px の円。
 * 訪問済み: brand-fill の円、内側 4px に 1px の on-brand（40%）の輪、市町村名を on-brand の 15/600。
 * 未訪問: fill の円、1px の sep の輪、名前は fg-3 の 400。回転・かすれ・押印の動きは付けない。
 */
export function StampSeal({ name, visited, date, className }: StampSealProps) {
  const label = stampLabel(name);
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        role="img"
        aria-label={`${name} ${visited ? '訪問済み' : '未訪問'}`}
        className={cn(
          'relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full',
          visited ? 'bg-brand-fill text-on-brand' : 'border border-sep bg-fill text-fg-3',
        )}
      >
        {visited && <span aria-hidden className="absolute inset-1 rounded-full border border-on-brand/40" />}
        <span aria-hidden className={cn('relative whitespace-nowrap pt-[2px] text-callout', visited ? 'font-semibold' : 'font-normal')}>
          {label}
        </span>
      </div>
      {visited && date && <span className="num mt-1.5 text-caption text-fg-2">{monthDay(date)}</span>}
    </div>
  );
}
