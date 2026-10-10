import { cva, type VariantProps } from 'class-variance-authority';
import { m } from 'framer-motion';
import {
  Children,
  createContext,
  forwardRef,
  Fragment,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type InputHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RARITY_META } from '../data/species';
import type { Category, Rarity } from '../data/types';
import { cn } from '../lib/cn';
import type { Badge } from '../lib/progress';
import { BadgeEmblem, BadgeName } from './BadgeEmblem';
import {
  IconAmamiFern,
  IconAmamiFernFill,
  IconAmamiFrog,
  IconAmamiFrogFill,
  IconAmamiKurousagi,
  IconAmamiKurousagiFill,
  IconBird,
  IconButterfly,
  IconCaretLeft,
  IconCaretRight,
  IconCheck,
  IconCheckCircleFill,
  IconFishSimple,
  IconInfo,
  IconMagnifyingGlass,
  IconMoonStars,
  IconWarning,
  IconWarningCircleFill,
  IconX,
  type IconComponent,
} from './icons';
import { Phrase } from './Phrase';
import type { ConfirmDialogProps, SheetProps } from './Sheet';

// ───────── 再公開 ─────────

export { cn } from '../lib/cn';
/** トースト（Sonner、§7.18）。<Toaster> は App.tsx に 1 つだけ置いてある */
export { toast } from 'sonner';
export type { ConfirmDialogProps, SheetProps, SheetSnapPoint } from './Sheet';
export { BadgeEmblem, BadgeName } from './BadgeEmblem';
export { StampSeal } from './StampSeal';

/** アイコンとして渡せるもの（生成した Icon* と、size / className を受け取る同じ形のコンポーネント） */
export type IconLike = IconComponent | ComponentType<{ size?: number | string; className?: string }>;

// ───────── アイコンの対応（§5.3〜5.5） ─────────

/** カテゴリのアイコン（通常）。§5.4 */
export const CATEGORY_ICON: Record<Category, IconComponent> = {
  mammal: IconAmamiKurousagi,
  bird: IconBird,
  herp: IconAmamiFrog,
  insect: IconButterfly,
  aqua: IconFishSimple,
  plant: IconAmamiFern,
};

/** カテゴリのアイコン（選択中）。bird・insect・aqua は fill 版がないので同じもの（色だけ変える） */
export const CATEGORY_ICON_SELECTED: Record<Category, IconComponent> = {
  mammal: IconAmamiKurousagiFill,
  bird: IconBird,
  herp: IconAmamiFrogFill,
  insect: IconButterfly,
  aqua: IconFishSimple,
  plant: IconAmamiFernFill,
};

// ───────── 書式 ─────────

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * 日本語の日付。既定は「2026年10月10日」。
 * { time: true } で「2026年10月10日 21:14」、{ year: false } で「10月10日」。
 */
export function formatDateJa(iso: string | Date, opts: { time?: boolean; year?: boolean } = {}): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const { time = false, year = true } = opts;
  const date = `${year ? `${d.getFullYear()}年` : ''}${d.getMonth() + 1}月${d.getDate()}日`;
  return time ? `${date} ${d.getHours()}:${pad2(d.getMinutes())}` : date;
}

/** 画面ごとの document.title（§7.3）。LINE のヘッダーに出る */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}

// ───────── 画面の枠 ─────────

/** タブ画面の本文（下にタブバーの余白を取る）。出現アニメーションは付けない（§9） */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('pb-tabbar', className)}>{children}</main>;
}

function useBack(onBack?: () => void) {
  const navigate = useNavigate();
  return () => {
    if (onBack) onBack();
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export type ScreenHeaderProps = {
  title?: ReactNode;
  /**
   * tab: タブ画面。52px の行に title（22/30）を左寄せ。right に 40px のボタンを 2 つまで。
   * nav: 遷移先。44px の固定行、左に戻る、中央にタイトル（headline）。8px スクロールで page の背景と下線。
   * photo: 写真の上。36px の丸い戻るボタン（scrim の地に白）だけを重ねる。
   */
  variant?: 'tab' | 'nav' | 'photo';
  /** 右側（tab: HeaderButton を 2 つまで / nav: 1 / 3 などの短い要素 / photo: PhotoButton） */
  right?: ReactNode;
  /** 戻るボタンの動作（既定は履歴を戻る。履歴がなければホーム） */
  onBack?: () => void;
  /** nav: 戻るボタンを出さない（記録の 1 段階目など、左に別のボタンを置く時は left を使う） */
  left?: ReactNode;
  /**
   * photo: このスクロール量（px）を超えたら、丸ボタンを消して nav と同じ 44px の固定バー（戻る＋title）に替える。
   * 既定は 4:3 の全幅写真の高さ − 44。
   */
  solidAfter?: number;
  className?: string;
};

/**
 * 画面ヘッダー（docs/DESIGN_SYSTEM.md §7.3）。画面内にワードマークは出さない。英字の上ラベルは付けない。
 * document.title は useDocumentTitle() で別に設定する（タブ画面と固定の画面は App.tsx が設定済み）。
 */
export function ScreenHeader({ title, variant = 'tab', right, onBack, left, solidAfter, className }: ScreenHeaderProps) {
  const back = useBack(onBack);
  const photoThreshold =
    solidAfter ?? (typeof window !== 'undefined' ? Math.round(Math.min(window.innerWidth, 480) * 0.75) - 44 : 248);
  const scrolled = useScrolled(variant === 'photo' ? photoThreshold : 8);

  if (variant === 'tab') {
    return (
      <header className={cn('pt-safe', className)}>
        <div className="flex h-[52px] items-center gap-2 px-4 pb-2 pt-3">
          <h1 className="min-w-0 flex-1 truncate text-title text-fg">{title}</h1>
          {right && <div className="-mr-2 flex shrink-0 items-center">{right}</div>}
        </div>
      </header>
    );
  }

  if (variant === 'photo') {
    // 写真が上に流れたら、浮いた丸ボタンを本文に重ねたままにせず、遷移先と同じ固定バー（戻る＋タイトル）に替える（150ms のクロスフェード）
    return (
      <header className={cn('pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-[480px]', className)}>
        <div
          aria-hidden={!scrolled}
          className={cn(
            'pt-safe border-b border-sep bg-page transition-opacity duration-150',
            scrolled ? 'pointer-events-auto opacity-100' : 'opacity-0',
          )}
        >
          <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={back}
                aria-label="戻る"
                tabIndex={scrolled ? 0 : -1}
                className="grid h-11 w-11 place-items-center text-fg active:opacity-60"
              >
                <IconCaretLeft size={24} />
              </button>
            </div>
            <div aria-hidden="true" className="min-w-0 truncate px-1 text-center text-headline text-fg">{title}</div>
            <div />
          </div>
        </div>
        <div
          aria-hidden={scrolled}
          className={cn('pt-safe absolute inset-x-0 top-0 transition-opacity duration-150', scrolled && 'opacity-0')}
        >
          <div className="flex h-[52px] items-center justify-between px-2">
            <div className={cn('flex items-center', !scrolled && 'pointer-events-auto')}>
              {left ?? <PhotoButton label="戻る" icon={IconCaretLeft} onClick={back} />}
            </div>
            <div className={cn('flex items-center', !scrolled && 'pointer-events-auto')}>{right}</div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'pt-safe sticky top-0 z-30 border-b transition-colors duration-150',
        scrolled ? 'border-sep bg-page' : 'border-transparent bg-transparent',
        className,
      )}
    >
      <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center justify-start">
          {left ?? (
            <button type="button" onClick={back} aria-label="戻る" className="grid h-11 w-11 place-items-center text-fg active:opacity-60">
              <IconCaretLeft size={24} />
            </button>
          )}
        </div>
        <h1 className="min-w-0 truncate px-1 text-center text-headline text-fg">{title}</h1>
        <div className="flex items-center justify-end pr-4">{right}</div>
      </div>
    </header>
  );
}

/** ヘッダー右側の 40px のアイコンボタン（アイコン 24、色は fg） */
export function HeaderButton({
  icon: Icon,
  label,
  onClick,
  to,
  className,
}: {
  icon: IconLike;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  to?: string;
  className?: string;
}) {
  const cls = cn('grid h-10 w-10 place-items-center rounded-full text-fg active:bg-fill', className);
  if (to) {
    return (
      <Link to={to} aria-label={label} className={cls}>
        <Icon size={24} />
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      <Icon size={24} />
    </button>
  );
}

/** 写真の上の丸ボタン（36px の円、var(--scrim) の地に白いアイコン 20、当たり判定 44） */
export function PhotoButton({
  icon: Icon,
  label,
  onClick,
  pressed,
  className,
}: {
  icon: IconLike;
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  pressed?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={cn('pointer-events-auto grid h-11 w-11 place-items-center active:opacity-80', className)}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: 'var(--scrim)' }}>
        <Icon size={20} />
      </span>
    </button>
  );
}

// ───────── セクション見出し（§7.4） ─────────

export type SectionHeaderProps = {
  title: ReactNode;
  /** 右側の「すべて見る」のリンク先 */
  to?: string;
  /** to の代わりにボタンにする時 */
  onAction?: () => void;
  /** 右側の文字（既定「すべて見る」） */
  actionLabel?: string;
  /** 右側に任意の要素を置く（to / onAction より優先度は低い） */
  action?: ReactNode;
  /** 見出しの下の補足 1 行（sub、fg-2） */
  note?: ReactNode;
  /** 画面で最初のセクション（上を 16px にする。既定は 32px） */
  first?: boolean;
  id?: string;
  className?: string;
};

/** セクション見出し。左に section（18/26、600）、右に任意で「すべて見る ›」 */
export function SectionHeader({ title, to, onAction, actionLabel = 'すべて見る', action, note, first = false, id, className }: SectionHeaderProps) {
  // 「すべて見る」は 400（見出しと行の太さに埋もれないよう、太さは構造だけに使う）
  const linkCls = '-my-[11px] -mr-1 flex h-11 shrink-0 items-center gap-0.5 px-1 pt-[2px] text-sub text-brand active:opacity-60';
  const right = to ? (
    <Link to={to} className={linkCls}>
      {actionLabel}
      <IconCaretRight size={14} />
    </Link>
  ) : onAction ? (
    <button type="button" onClick={onAction} className={linkCls}>
      {actionLabel}
      <IconCaretRight size={14} />
    </button>
  ) : (
    action
  );
  return (
    <div className={cn('px-4 pb-2', first ? 'pt-4' : 'pt-8', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="balance min-w-0 text-section text-fg">
          {typeof title === 'string' ? <Phrase text={title} /> : title}
        </h2>
        {right}
      </div>
      {note && <p className="mt-0.5 text-sub text-fg-2">{note}</p>}
    </div>
  );
}

// ───────── リスト（§7.5） ─────────

const GroupContext = createContext(false);

/**
 * グループ（fill、rounded-md、左右 16px の余白）。設定・フォーム・種詳細の項目・料金プラン・
 * セーフドライブのチェック・KPI・グラフ・シート内の選択肢だけに使う（§4.4）。見出しはグループの外に置く。
 */
export function Group({
  children,
  note,
  className,
  boxClassName,
}: {
  children: ReactNode;
  /** グループの下の注記（sub、fg-2、上 8px） */
  note?: ReactNode;
  /** 外側（余白の調整など） */
  className?: string;
  /** 面（グリッドにする時など） */
  boxClassName?: string;
}) {
  return (
    <div className={className}>
      <div className={cn('mx-4 overflow-hidden rounded-md bg-fill', boxClassName)}>
        <GroupContext.Provider value={true}>{children}</GroupContext.Provider>
      </div>
      {note && <p className="mx-4 mt-2 px-4 text-sub text-fg-2">{note}</p>}
    </div>
  );
}

/** 行がグループの中にあるか */
export function useInGroup() {
  return useContext(GroupContext);
}

export type ListRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** 行頭のアイコン（20、fg-2） */
  icon?: IconLike;
  /** 行頭のアイコンの色を変える時（例: 選択中のラジオ行は text-danger） */
  iconClassName?: string;
  /** 行頭に任意の要素（サムネイルなど）。thumbSize で行の高さが決まる */
  leading?: ReactNode;
  /** leading がサムネイルの時の大きさ（56 で行の高さ 76） */
  thumbSize?: 40 | 48 | 56;
  /** 末尾の値（callout、fg-2。数字は .num を付けて渡す） */
  value?: ReactNode;
  /** 末尾に任意の要素（スイッチ、ボタンなど） */
  trailing?: ReactNode;
  /** 末尾の caret-right 16（fg-3） */
  chevron?: boolean;
  /** 末尾の check-circle-fill（success） */
  checked?: boolean;
  /** タイトルの大きさ。既定はプレーンリストで headline、グループ内で callout */
  titleSize?: 'headline' | 'callout';
  /** 文字列のタイトルを文節で改行する（既定 true）。和名は <SpeciesName> を title に渡す */
  phrase?: boolean;
  to?: string;
  /** react-router の replace / state */
  replace?: boolean;
  state?: unknown;
  /** 外部サイト（新しいタブで開く） */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** 選択中の候補行（brand-soft）。記録の名前の段階だけ（§8.4） */
  selected?: boolean;
  /** 準備中など（文字を fg-3 にし、押せなくする） */
  disabled?: boolean;
  /** 区切り線を引かない（最後の行は自動で引かない） */
  noDivider?: boolean;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  role?: string;
  'aria-checked'?: boolean;
  className?: string;
};

/**
 * リストの行（docs/DESIGN_SYSTEM.md §7.5）。プレーンリスト（ページの上）とグループ内の両方で使う。
 * 区切り線はタイトルの開始位置から右端まで、最後の行には引かない（行を兄弟要素として並べること。
 * 1 行ずつ別の要素で包むと、どの行も「最後の行」になって線が消える）。
 * 押下: プレーンリストは fill、グループ内は fill-strong（縮小アニメーションなし）。
 */
export function ListRow({
  title,
  subtitle,
  icon: Icon,
  iconClassName,
  leading,
  thumbSize,
  value,
  trailing,
  chevron = false,
  checked = false,
  titleSize,
  phrase = true,
  to,
  replace,
  state,
  href,
  onClick,
  selected = false,
  disabled = false,
  noDivider = false,
  className,
  ...aria
}: ListRowProps) {
  const inGroup = useInGroup();
  const interactive = !disabled && Boolean(to || href || onClick);
  const size = titleSize ?? (inGroup ? 'callout' : 'headline');
  const minH = thumbSize === 56 ? 'min-h-[76px]' : thumbSize ? 'min-h-16' : subtitle ? 'min-h-16' : inGroup ? 'min-h-12' : 'min-h-14';

  const rowCls = cn(
    'group/row relative flex w-full items-stretch pl-4 text-left',
    interactive && (inGroup ? 'active:bg-fill-strong' : 'active:bg-fill'),
    selected && 'bg-brand-soft',
    className,
  );

  const inner = (
    <>
      {(Icon || leading) && (
        <span className="flex shrink-0 items-center pr-3">
          {leading ?? (Icon && <Icon size={20} className={cn('text-fg-2', disabled && 'text-fg-3', iconClassName)} />)}
        </span>
      )}
      <span
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-4',
          minH,
          !noDivider && 'border-b border-sep group-last/row:border-b-0',
        )}
      >
        <span className="min-w-0 flex-1">
          {/* 行のタイトルは 400（太さは画面・セクションの見出し、主な数字、主ボタンだけに使う） */}
          <span className={cn('block font-normal', size === 'headline' ? 'text-headline' : 'text-callout', disabled ? 'text-fg-3' : 'text-fg')}>
            {phrase && typeof title === 'string' ? <Phrase text={title} /> : title}
          </span>
          {/* 副題は 2 行に折り返すことがあるので palt を切る（句読点を詰めない。§3.4） */}
          {subtitle && (
            <span className={cn('mt-0.5 block text-pretty text-sub [font-feature-settings:normal]', disabled ? 'text-fg-3' : 'text-fg-2')}>{subtitle}</span>
          )}
        </span>
        {value != null && value !== false && <span className="shrink-0 text-callout text-fg-2">{value}</span>}
        {trailing}
        {checked && (
          <>
            <IconCheckCircleFill size={20} className="shrink-0 text-success" />
            <span className="sr-only">記録済み</span>
          </>
        )}
        {chevron && <IconCaretRight size={16} className="shrink-0 text-fg-3" />}
      </span>
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} replace={replace} state={state} onClick={onClick} className={rowCls} {...aria}>
        {inner}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={rowCls} {...aria}>
        {inner}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={rowCls} {...aria}>
        {inner}
      </button>
    );
  }
  return (
    <div className={rowCls} {...aria}>
      {inner}
    </div>
  );
}

/**
 * 項目と値の行（グループ内。種詳細の「分類 鳥類」、記録詳細の「日時」など）。
 * 左の項目は callout の fg-2、右の値は callout の fg（文章のまま折り返す）。
 */
export function InfoRow({ label, children, trailing, className }: { label: ReactNode; children: ReactNode; trailing?: ReactNode; className?: string }) {
  return (
    <div className={cn('group/row flex pl-4', className)}>
      <div className="flex min-h-12 min-w-0 flex-1 items-start gap-3 border-b border-sep py-3 pr-4 group-last/row:border-b-0">
        <span className="w-24 shrink-0 text-callout text-fg-2">{label}</span>
        <span className="min-w-0 flex-1 text-callout text-fg">{children}</span>
        {trailing && <span className="-my-1 shrink-0 self-center">{trailing}</span>}
      </div>
    </div>
  );
}

// ───────── ボタン（§7.6） ─────────

/**
 * ボタンのクラス。<button className={button({ variant: 'secondary', size: 'md' })}> や <Link> にも使える。
 * 角丸はすべて 12。ラベルの後ろに矢印を付けない。押下は色の切り替えだけ。
 */
export const button = cva('inline-flex select-none items-center justify-center gap-2 pt-[2px] transition-colors disabled:pointer-events-none', {
  variants: {
    variant: {
      primary: 'bg-brand-fill text-on-brand active:bg-brand-pressed disabled:bg-fill disabled:text-fg-3',
      secondary: 'bg-fill text-fg active:bg-fill-strong disabled:text-fg-3',
      text: 'bg-transparent text-brand active:opacity-60',
      'danger-text': 'bg-transparent text-danger active:opacity-60',
      danger: 'bg-danger text-on-danger active:opacity-90',
      line: 'bg-line-green text-white active:opacity-90',
      'on-stage': 'bg-white/[.14] text-white active:bg-white/20',
    },
    size: {
      lg: 'h-[50px] w-full rounded-md px-5 text-headline',
      md: 'h-11 rounded-md px-4 text-callout font-semibold',
      hit: 'min-h-11 px-1 text-callout font-semibold',
    },
  },
  defaultVariants: { variant: 'primary', size: 'lg' },
});

export type ButtonVariants = VariantProps<typeof button>;
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants;

/** button の cva を当てた <button>（type の既定は "button"） */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant, size, className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={cn(button({ variant, size }), className)} {...props} />;
});

/** 無効なボタンの下に出す理由 1 行（sub、fg-2）。例「あと140pt」 */
export function ButtonNote({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-2 text-center text-sub text-fg-2', className)}>{children}</p>;
}

/** 固定 CTA バーがある画面の本文に付ける下余白（74px ＋ 安全領域 ＋ 16px） */
export const CTA_PADDING = 'pb-[calc(90px+var(--safe-bottom))]';

/**
 * 固定 CTA バー（§7.6）。page の地、上辺に 1px の sep。主な操作が 1 つの画面だけ（記録 3、Plus、
 * セーフドライブ、オンボーディング）。本文には CTA_PADDING を付ける。
 */
export function CtaBar({ children, note, className }: { children: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-sep bg-page px-4 pb-[calc(12px+var(--safe-bottom))] pt-3',
        className,
      )}
    >
      {children}
      {note && <ButtonNote>{note}</ButtonNote>}
    </div>
  );
}

// ───────── チェック・ラジオ（§2.5・§8.10・§8.11） ─────────

/** オン・オフが切り替わった時だけ scale 0.9 → 1（120ms）。表示した時は動かさない（§9） */
function useToggleScale() {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current ? false : { scale: 0.9 };
}

/**
 * チェックの円（セーフドライブの出発前のチェックなど）。既定 24px。
 * チェック済みは brand-fill の円に on-brand の check、未チェックは fg-3 の輪。行の trailing に置く。
 */
export function CheckMark({ checked, size = 24, className }: { checked: boolean; size?: number; className?: string }) {
  const initial = useToggleScale();
  return (
    <m.span
      key={checked ? 'on' : 'off'}
      aria-hidden
      initial={initial}
      animate={{ scale: 1 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        checked ? 'bg-brand-fill text-on-brand' : 'border-[1.5px] border-fg-3',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {checked && <IconCheck size={Math.round(size * 0.6)} />}
    </m.span>
  );
}

/**
 * ラジオの円（Plus のプラン、路上レポートの種類など）。20px。
 * 選択中は brand-fill の円に on-brand の 8px の点、それ以外は fg-3 の輪。行の外枠を色で囲まない。
 */
export function RadioMark({ checked, className }: { checked: boolean; className?: string }) {
  const initial = useToggleScale();
  return (
    <m.span
      key={checked ? 'on' : 'off'}
      aria-hidden
      initial={initial}
      animate={{ scale: 1 }}
      transition={{ duration: 0.12 }}
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-full',
        checked ? 'bg-brand-fill' : 'border-[1.5px] border-fg-3',
        className,
      )}
    >
      {checked && <span className="h-2 w-2 rounded-full bg-on-brand" />}
    </m.span>
  );
}

// ───────── チップ（§7.7） ─────────

export type ChipProps = {
  children: ReactNode;
  selected?: boolean;
  /** 先頭のアイコン 16 */
  icon?: IconLike;
  /** 選択中の先頭アイコン（fill 版）。省くと icon のまま */
  selectedIcon?: IconLike;
  /** 件数（例 3/19）。.num、不透明度 72% */
  count?: ReactNode;
  /** グループやシートの中（fill-strong の地） */
  onFill?: boolean;
  /** 末尾に × を出す（押すと解除するチップ。例「未発見 ×」） */
  removable?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

/** チップ。高さ 32、rounded-full、sub。選択中は brand-fill の地に on-brand の 600 */
export function Chip({ children, selected = false, icon, selectedIcon, count, onFill = false, removable = false, onClick, disabled, className, ...aria }: ChipProps) {
  const Icon = selected ? (selectedIcon ?? icon) : icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-8 shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-3 pt-[2px] text-sub transition-colors',
        selected
          ? 'bg-brand-fill font-semibold text-on-brand active:bg-brand-pressed'
          : onFill
            ? 'bg-fill-strong text-fg active:opacity-[.72]'
            : 'bg-fill text-fg active:bg-fill-strong',
        disabled && 'text-fg-3',
        className,
      )}
      {...aria}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span>{children}</span>
      {count != null && <span className="num opacity-[.72]">{count}</span>}
      {removable && <IconX size={14} className="shrink-0" aria-hidden />}
    </button>
  );
}

/** チップの横スクロール行（間隔 8、左右 16、端のフェードなし）。シートの中でもスワイプと競合しない */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-scrollbar flex gap-2 overflow-x-auto px-4', className)} data-base-ui-swipe-ignore="x">
      {children}
    </div>
  );
}

// ───────── セグメント（§7.8） ─────────

/** セグメント。溝 32、つまみは layoutId で動かす（spring 500 / 40）。全幅で使う */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  'aria-label'?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex h-8 w-full rounded-sm bg-fill p-[2px]', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn('relative flex-1 select-none whitespace-nowrap rounded-thumb px-2 pt-[2px] text-sub', active ? 'font-semibold text-fg' : 'text-fg-2')}
          >
            {active && (
              <m.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-thumb bg-thumb shadow-thumb dark:shadow-none"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ───────── 検索欄・入力欄（§7.9） ─────────

/** 検索欄。高さ 36、fill、左に虫眼鏡 16。入力中は右に消去ボタン */
export function SearchField({
  value,
  onChange,
  placeholder = '名前・学名で探す',
  autoFocus,
  className,
  'aria-label': ariaLabel = '検索',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div className={cn('relative flex h-9 min-w-0 items-center rounded-sm bg-fill focus-within:ring-2 focus-within:ring-brand', className)}>
      <IconMagnifyingGlass size={16} className="pointer-events-none absolute left-3 text-fg-3" />
      <input
        type="search"
        size={1}
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        className="h-full w-full min-w-0 appearance-none rounded-sm bg-transparent pl-9 pr-10 text-input leading-5 text-fg outline-none placeholder:text-fg-3 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="入力を消す" className="absolute right-0 grid h-9 w-10 place-items-center">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-fg-3 text-fill">
            <IconX size={12} />
          </span>
        </button>
      )}
    </div>
  );
}

/** 入力欄のラベル（入力欄の上 6px、sub 600 の fg-2）と入力欄をまとめる */
export function Field({ label, children, note, className }: { label: ReactNode; children: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sub font-semibold text-fg-2">{label}</span>
      {children}
      {note && <span className="mt-1.5 block text-sub text-fg-2">{note}</span>}
    </label>
  );
}

const fieldBox = 'rounded-sm bg-fill text-input text-fg outline-none placeholder:text-fg-3 focus-visible:outline-none';

/** 入力欄。高さ 48、fill、枠線なし、フォーカスで 2px の brand のリング。trailing で右端にボタン（40px）を置ける */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { trailing?: ReactNode }>(function Input(
  { className, trailing, ...props },
  ref,
) {
  // size={1}: 和文フォントの字幅で入力欄の最小幅が広がり、横スクロールが出るのを防ぐ（幅は w-full で決める）
  if (!trailing) {
    return <input ref={ref} size={1} className={cn(fieldBox, 'h-12 w-full min-w-0 px-[14px] focus:ring-2 focus:ring-brand', className)} {...props} />;
  }
  return (
    <div className={cn('flex h-12 w-full min-w-0 items-center rounded-sm bg-fill focus-within:ring-2 focus-within:ring-brand', className)}>
      <input ref={ref} size={1} className={cn(fieldBox, 'h-full min-w-0 flex-1 bg-transparent pl-[14px] pr-1')} {...props} />
      <span className="flex shrink-0 items-center pr-1">{trailing}</span>
    </div>
  );
});

/** 複数行の入力欄（最小 96px、入力欄と同じ見た目） */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} cols={1} className={cn(fieldBox, 'block min-h-24 w-full min-w-0 resize-none px-[14px] py-3 focus:ring-2 focus:ring-brand', className)} {...props} />;
});

/**
 * 日時の行（グループ内）。datetime-local を透明にして行全体に重ね、行には「10月10日 21:14」を出す（§7.9）。
 * value / onChange は datetime-local の書式（YYYY-MM-DDTHH:mm）。
 */
export function DateTimeRow({
  label = '日時',
  value,
  onChange,
  max,
  className,
}: {
  label?: ReactNode;
  value: string;
  onChange: (v: string) => void;
  max?: string;
  className?: string;
}) {
  const d = value ? new Date(value) : null;
  const shown = d && !Number.isNaN(d.getTime()) ? formatDateJa(d, { time: true, year: d.getFullYear() !== new Date().getFullYear() }) : '';
  return (
    <div className={cn('group/row relative flex pl-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand active:bg-fill-strong', className)}>
      <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 border-b border-sep py-2.5 pr-4 group-last/row:border-b-0">
        <span className="w-24 shrink-0 text-callout text-fg-2">{label}</span>
        <span className="min-w-0 flex-1 text-callout text-fg">{shown}</span>
        <IconCaretRight size={16} className="shrink-0 text-fg-3" />
      </div>
      <input
        type="datetime-local"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        aria-label={typeof label === 'string' ? label : '日時'}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

// ───────── レア度・進捗・統計（§7.11〜7.13） ─────────

/**
 * レア度ジェム。6px の菱形 4 つ、間隔 3px。塗りは fg-2（幻は legend）、空きは 1px の sep の輪郭。
 * withLabel で右に言葉（sub、fg-2、間隔 6px）。行と詳細では付け、タイルではジェムだけ。
 */
export function RarityGems({
  rarity,
  withLabel = false,
  className,
}: {
  rarity: Rarity;
  withLabel?: boolean;
  className?: string;
}) {
  const word = RARITY_META[rarity].label;
  const on = rarity === 4 ? 'bg-legend' : 'bg-fg-2';
  return (
    <span role="img" aria-label={`レア度 ${word}`} className={cn('inline-flex shrink-0 items-center gap-1.5', className)}>
      <span className="inline-flex items-center gap-[3px]" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="grid h-[9px] w-[9px] place-items-center">
            <span data-gem={i <= rarity ? 'on' : 'off'} className={cn('block h-1.5 w-1.5 rotate-45', i <= rarity ? on : 'border border-sep')} />
          </span>
        ))}
      </span>
      {withLabel && (
        <span className="text-sub text-fg-2" aria-hidden>
          {word}
        </span>
      )}
    </span>
  );
}

const lastBarValues = new Map<string, number>();
const clamp01 = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

/**
 * 進捗バー。高さ 4、溝 fill、値 brand。値の文字はバーの外に置く。
 * 画面に出た時に 0 から伸ばさない。id を渡すと、同じセッションで前に見た値から 300ms で動かす。
 */
export function ProgressBar({
  value,
  id,
  label,
  className,
}: {
  /** 0〜1 */
  value: number;
  /** 同じバーを見分ける名前（例 "zukan"）。値が変わった時だけ動かす */
  id?: string;
  /** 支援技術に読ませる名前 */
  label?: string;
  className?: string;
}) {
  const v = clamp01(value);
  const [shown, setShown] = useState(() => (id && lastBarValues.has(id) ? lastBarValues.get(id)! : v));
  useEffect(() => {
    if (id) lastBarValues.set(id, v);
    const raf = requestAnimationFrame(() => setShown(v));
    return () => cancelAnimationFrame(raf);
  }, [v, id]);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('h-1 overflow-hidden rounded-bar bg-fill', className)}
    >
      <div className="h-full rounded-bar bg-brand transition-[width] duration-300 ease-out" style={{ width: `${shown * 100}%` }} />
    </div>
  );
}

/** 欧文の単位は 0.15em あけ、和文の単位は詰める（§3.7） */
function unitGap(unit: string) {
  return /^[A-Za-z]/.test(unit) ? 'ml-[0.15em]' : '';
}

/** 数字と単位（160 pt、62種）。数字は .num */
export function Num({ value, unit, className, unitClassName }: { value: ReactNode; unit?: string; className?: string; unitClassName?: string }) {
  return (
    <span className={className}>
      <span className="num">{value}</span>
      {unit && <span className={cn(unitGap(unit), unitClassName)}>{unit}</span>}
    </span>
  );
}

/** 統計の 1 列。数字は num-l（fg）、単位は sub の fg-2（基準線をそろえる）、ラベルは caption の fg-2 */
export function Stat({ value, unit, label, className }: { value: ReactNode; unit?: string; label: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col items-center text-center', className)}>
      <div className="flex items-baseline">
        <span className="num text-num-l text-fg">{value}</span>
        {unit && <span className={cn('text-sub text-fg-2', unitGap(unit))}>{unit}</span>}
      </div>
      <div className="mt-1 text-caption text-fg-2">{label}</div>
    </div>
  );
}

/** 統計の行。3〜4 列を高さ 28px の 1px の縦線（sep）で区切る。囲みは付けない */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  const items = Children.toArray(children);
  return (
    <div className={cn('flex items-center px-4', className)}>
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden className="h-7 w-px shrink-0 bg-sep" />}
          {c}
        </Fragment>
      ))}
    </div>
  );
}

// ───────── シート・確認ダイアログ（§7.16・§7.17） ─────────

// Base UI（Drawer・AlertDialog）は約 30KB（gzip）あるので、Sheet.tsx に分けて遅延読み込みする。
// 起動後の空き時間に先読みしておくので、初めて開く時も待たない。
const loadOverlays = () => import('./Sheet');
const LazyDrawerSheet = lazy(() => loadOverlays().then((mod) => ({ default: mod.DrawerSheet })));
const LazyAlertDialog = lazy(() => loadOverlays().then((mod) => ({ default: mod.AlertDialogImpl })));
if (typeof window !== 'undefined') {
  const idle: (cb: () => void) => void = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1500));
  idle(() => void loadOverlays().catch(() => {}));
}

/** 一度でも開いたら描画し続ける（閉じるアニメーションのため） */
function useEverOpen(open: boolean) {
  const [ever, setEver] = useState(open);
  useEffect(() => {
    if (open) setEver(true);
  }, [open]);
  return ever || open;
}

/**
 * ボトムシート（docs/DESIGN_SYSTEM.md §7.16、@base-ui/react/drawer）。
 * 入力欄のあるシートは keyboard（VirtualKeyboardProvider）、内容の多いシートは snapPoints={[0.55, 1]}。
 * シートの中の横スクロールには data-base-ui-swipe-ignore="x" を付ける（ChipRow は付いている）。
 */
export function Sheet(props: SheetProps) {
  const mounted = useEverOpen(props.open);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <LazyDrawerSheet {...props} />
    </Suspense>
  );
}

/**
 * 確認ダイアログ（§7.17、@base-ui/react/alert-dialog）。取り消せない操作（この端末のデータを消去、記録の削除）だけに使う。
 * ボタンは縦に 2 つ。上が danger-text の［消去する］、下が secondary の［やめる］。赤で塗ったボタンは使わない。
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const mounted = useEverOpen(props.open);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <LazyAlertDialog {...props} />
    </Suspense>
  );
}

function formatEarnedAt(iso: string): string {
  return `${formatDateJa(iso)}に獲得`;
}

/**
 * バッジの説明シート（§7.14）。紋章 120、名前（title）、説明（body）、獲得日または「未獲得」。
 * バッジを押した時に開く（バッジの説明にトーストは使わない）。badge を null にすると閉じる。
 */
export function BadgeSheet({
  badge,
  earned,
  earnedAt,
  onClose,
}: {
  badge: Pick<Badge, 'id' | 'title' | 'description'> | null;
  earned: boolean;
  /** 獲得日（ISO）。わからなければ省く（「獲得済み」と出す） */
  earnedAt?: string | null;
  onClose: () => void;
}) {
  // 閉じるアニメーションの間も中身を残す
  const [shown, setShown] = useState(badge);
  useEffect(() => {
    if (badge) setShown(badge);
  }, [badge]);
  const b = badge ?? shown;
  return (
    <Sheet open={!!badge} onClose={onClose} label={b?.title}>
      {b && (
        <div className="flex flex-col items-center px-2 pb-2 pt-2 text-center">
          <BadgeEmblem badge={b} earned={earned} size={120} />
          <h2 className="balance mt-4 text-title text-fg" aria-hidden>
            <BadgeName badge={b} />
          </h2>
          <p className="mt-2 text-body text-fg-2">{b.description}</p>
          <p className="mt-3 text-caption text-fg-2">{earned ? (earnedAt ? formatEarnedAt(earnedAt) : '獲得済み') : '未獲得'}</p>
        </div>
      )}
    </Sheet>
  );
}

// ───────── 空状態・お知らせ（§7.19・7.20） ─────────

/**
 * 空状態。セクションの中に左寄せ。アイコン 40（fg-3、任意）、1 行の見出し（headline）、
 * 2 行までの本文（body、fg-2）、ボタン 1 つ（secondary の md）。
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  actionLabel,
  to,
  onAction,
  className,
}: {
  icon?: IconLike;
  title: string;
  body?: string;
  /** 任意のボタン要素（actionLabel より優先） */
  action?: ReactNode;
  /** ボタンの文字（to か onAction と一緒に） */
  actionLabel?: string;
  to?: string;
  onAction?: () => void;
  className?: string;
}) {
  const btn = button({ variant: 'secondary', size: 'md' });
  const act =
    action ??
    (actionLabel ? (
      to ? (
        <Link to={to} className={btn}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={btn}>
          {actionLabel}
        </button>
      )
    ) : null);
  return (
    <div className={cn('px-4 py-6', className)}>
      {Icon && <Icon size={40} className="mb-3 text-fg-3" />}
      <p className="text-headline text-fg">
        <Phrase text={title} />
      </p>
      {body && (
        <p className="mt-1 line-clamp-2 text-body text-fg-2">
          <Phrase text={body} />
        </p>
      )}
      {act && <div className="mt-4">{act}</div>}
    </div>
  );
}

const NOTICE = {
  info: { icon: IconInfo, iconCls: 'text-fg-2', textCls: 'text-fg-2' },
  caution: { icon: IconWarning, iconCls: 'text-warning', textCls: 'text-fg' },
  danger: { icon: IconWarningCircleFill, iconCls: 'text-danger', textCls: 'text-fg' },
  night: { icon: IconMoonStars, iconCls: 'text-fg-2', textCls: 'text-fg-2' },
} as const;

export type NoticeKind = keyof typeof NOTICE;

/**
 * お知らせ行（§7.20）。色はアイコンだけに付け、文字は fg か fg-2。色付きの面や破線の枠は使わない。
 * info: info / caution: warning（ハブなど）/ danger: warning-circle-fill（最初の一文 title を 600）/ night: moon-stars（右端に text ボタン）。
 * boxed はデモデータの告知だけ（fill の rounded-sm、パディング 12）。
 */
export function Notice({
  kind = 'info',
  title,
  children,
  icon,
  boxed = false,
  action,
  className,
}: {
  kind?: NoticeKind;
  /** 最初の一文（600）。danger の時に使う */
  title?: ReactNode;
  children?: ReactNode;
  /** アイコンを差し替える（例: 位置をぼかす注意は eye-slash） */
  icon?: IconLike;
  boxed?: boolean;
  /** 右端のボタン（night の「セーフドライブ ›」など。button の text / hit） */
  action?: ReactNode;
  className?: string;
}) {
  const k = NOTICE[kind];
  const Icon = icon ?? k.icon;
  return (
    <div
      role={kind === 'danger' || kind === 'caution' ? 'note' : undefined}
      className={cn('mx-4 flex items-start gap-3', boxed && 'rounded-sm bg-fill p-3', action && 'items-center', className)}
    >
      <Icon size={20} className={cn('shrink-0', k.iconCls)} />
      <p className={cn('min-w-0 flex-1 text-sub', k.textCls)}>
        {title && <span className="font-semibold">{typeof title === 'string' ? <Phrase text={title} /> : title}</span>}
        {typeof children === 'string' ? <Phrase text={children} /> : children}
      </p>
      {action && <div className="-my-3 shrink-0">{action}</div>}
    </div>
  );
}
