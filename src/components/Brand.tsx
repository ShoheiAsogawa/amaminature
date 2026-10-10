import { IconAmamiFern } from './icons';
import { cn } from '../lib/cn';

/**
 * ブランドの印: ヒカゲヘゴ（amami:fern）。docs/DESIGN_SYSTEM.md §6。
 * 色は親から受け取る（既定は瑠璃）。
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return <IconAmamiFern size={size} className={cn('shrink-0 text-brand', className)} />;
}

/**
 * ワードマーク（§6）: amami:fern ＋「AMAMI NATURE」（IBM Plex Sans 600、字間 0.04em）、
 * 下に「奄美いきものコレクション」（sub、fg-2、字間 0）。
 * 画面内に出すのはオンボーディングの 1 ページ目とマイページのフッター（size="sm"、caption の fg-3）だけ（§7.3）。
 */
export function Wordmark({ size = 'md', className }: { size?: 'md' | 'sm'; className?: string }) {
  if (size === 'sm') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-fg-3', className)}>
        <LogoMark size={16} className="text-current" />
        <span className="font-num text-caption font-semibold tracking-[0.04em]">AMAMI NATURE</span>
      </span>
    );
  }
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={32} />
      <div>
        <div className="font-num text-headline font-semibold tracking-[0.04em] text-fg">AMAMI NATURE</div>
        <div className="text-sub text-fg-2">奄美いきものコレクション</div>
      </div>
    </div>
  );
}
