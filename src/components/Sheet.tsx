import { AlertDialog } from '@base-ui/react/alert-dialog';
import { Drawer } from '@base-ui/react/drawer';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { IconX } from './icons';
import { Phrase } from './Phrase';
import { button } from './ui';

// Base UI（Drawer・AlertDialog）を使う実装。メインのチャンクを軽くするため、ui.tsx の <Sheet> と
// <ConfirmDialog> がこのファイルを遅延読み込みする（起動後の空き時間に先読みする）。
// 画面からはこのファイルを直接 import せず、ui.tsx の Sheet / ConfirmDialog を使うこと。

/** Base UI の Drawer.Root.SnapPoint（0〜1 は画面の高さの割合、1 より大きい数は px） */
export type SheetSnapPoint = number | string;

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** シートのタイトル（headline）。文字列は文節で改行する。省くと閉じるボタンだけを右上に重ねる */
  title?: ReactNode;
  /** title を出さないシートの名前（支援技術にだけ読ませる。例: バッジの説明シートのバッジ名） */
  label?: string;
  children: ReactNode;
  /**
   * 入力欄のあるシート（観察者ネーム、ニックネームとメモの編集など）は true。
   * Drawer.VirtualKeyboardProvider で包み、キーボードで入力欄が隠れないようにする（§7.16）。
   */
  keyboard?: boolean;
  /** 内容の多いシートは [0.55, 1]。確認用は指定しない（自動の高さ） */
  snapPoints?: SheetSnapPoint[];
  /** 閉じ終わった後に呼ぶ（アニメーションの後） */
  onClosed?: () => void;
  /** .sheet-popup に足すクラス */
  className?: string;
};

/**
 * ボトムシート（docs/DESIGN_SYSTEM.md §7.16）。@base-ui/react/drawer で作る。
 * 見た目は index.css の .sheet-backdrop / .sheet-popup / .sheet-grabber。
 * 動きは Base UI の CSS トランジションに任せる（AnimatePresence で包まない）。
 */
export function DrawerSheet({ open, onClose, title, label, children, keyboard = false, snapPoints, onClosed, className }: SheetProps) {
  const portal = (
    <Drawer.Portal>
      <Drawer.Backdrop className="sheet-backdrop" />
      {/* 全画面の大きさを持たせる（Base UI はこの要素の高さを基準に snapPoints の割合を計算する） */}
      <Drawer.Viewport className="fixed inset-0">
        <Drawer.Popup className={cn('sheet-popup text-fg outline-none', className)}>
          <div className="sheet-grabber" aria-hidden />
          <Drawer.Content>
            {/* タイトルがない時は閉じるボタンだけを右上に重ね、中身を上に詰める */}
            <header className={cn('flex items-center gap-3', title ? 'justify-between pb-3' : 'absolute right-4 top-2 z-10')}>
              {title ? (
                <Drawer.Title className="balance min-w-0 flex-1 text-section text-fg">
                  {typeof title === 'string' ? <Phrase text={title} /> : title}
                </Drawer.Title>
              ) : label ? (
                <Drawer.Title className="sr-only">{label}</Drawer.Title>
              ) : null}
              <Drawer.Close aria-label="閉じる" className="-mr-1.5 grid h-11 w-11 shrink-0 place-items-center text-fg">
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-line bg-surface shadow-pop-sm">
                  <IconX size={16} />
                </span>
              </Drawer.Close>
            </header>
            {children}
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClosed?.();
      }}
      snapPoints={snapPoints}
    >
      {keyboard ? <Drawer.VirtualKeyboardProvider>{portal}</Drawer.VirtualKeyboardProvider> : portal}
    </Drawer.Root>
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  body?: ReactNode;
  /** 既定「消去する」 */
  confirmLabel?: string;
  /** 既定「やめる」 */
  cancelLabel?: string;
  onConfirm: () => void;
  /** 処理中は押せなくする */
  busy?: boolean;
};

/**
 * 確認ダイアログ（§7.17、@base-ui/react/alert-dialog）。中央に表示、幅 min(320px, 100% - 48px)、
 * rounded-lg、surface、shadow-sheet、パディング 20。ボタンは縦に 2 つ（上 danger-text、下 secondary）。
 */
export function AlertDialogImpl({
  open,
  onClose,
  title,
  body,
  confirmLabel = '消去する',
  cancelLabel = 'やめる',
  onConfirm,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="sheet-backdrop" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 w-[min(320px,calc(100%-48px))] -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-line bg-surface p-5 text-fg shadow-sheet outline-none transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:shadow-none">
          <AlertDialog.Title className="balance text-headline font-black text-fg [font-feature-settings:normal]">
            <Phrase text={title} />
          </AlertDialog.Title>
          {body && (
            <AlertDialog.Description className="mt-2 text-body text-fg-2">{typeof body === 'string' ? <Phrase text={body} /> : body}</AlertDialog.Description>
          )}
          <div className="mt-4 grid gap-2">
            <button type="button" onClick={onConfirm} disabled={busy} className={cn(button({ variant: 'danger-text', size: 'hit' }), 'w-full')}>
              {confirmLabel}
            </button>
            <AlertDialog.Close className={cn(button({ variant: 'secondary', size: 'md' }), 'w-full')}>{cancelLabel}</AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
