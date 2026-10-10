import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  Binoculars,
  BookOpen,
  Bird,
  Bug,
  Car,
  ChevronLeft,
  Crown,
  Feather,
  Fish,
  Footprints,
  Gem,
  Heart,
  Kayak,
  Leaf,
  Moon,
  Rabbit,
  Sailboat,
  ShieldCheck,
  Stamp,
  Sun,
  Trophy,
  Turtle,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import type { Category, Rarity } from '../data/types';
import type { BadgeIcon } from '../lib/progress';

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  mammal: Rabbit,
  bird: Bird,
  herp: Turtle,
  insect: Bug,
  aqua: Fish,
  plant: Leaf,
};

export const BADGE_ICON: Record<BadgeIcon, LucideIcon> = {
  footprints: Footprints,
  heart: Heart,
  feather: Feather,
  binoculars: Binoculars,
  moon: Moon,
  gem: Gem,
  crown: Crown,
  waves: Waves,
  kayak: Kayak,
  sailboat: Sailboat,
  stamp: Stamp,
  sun: Sun,
  book: BookOpen,
  trophy: Trophy,
  car: Car,
  shield: ShieldCheck,
};

export const RARITY_COLOR: Record<Rarity, string> = {
  1: '#7E8C85',
  2: '#2E8B6E',
  3: '#3A62C4',
  4: '#C79A2E',
};

export function CategoryIcon({
  category,
  className,
  strokeWidth = 1.6,
}: {
  category: Category;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = CATEGORY_ICON[category];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** レア度を菱形の石で表す（◆◆◇◇） */
export function RarityGems({ rarity, light = false, size = 7 }: { rarity: Rarity; light?: boolean; size?: number }) {
  const color = RARITY_COLOR[rarity];
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`レア度 ${rarity} / 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="inline-block rotate-45 rounded-[1.5px]"
          style={{
            width: size,
            height: size,
            background: i <= rarity ? color : 'transparent',
            boxShadow: i <= rarity ? undefined : `inset 0 0 0 1px ${light ? 'rgba(255,255,255,.45)' : 'var(--line)'}`,
          }}
        />
      ))}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 112,
  stroke = 8,
  color = 'currentColor',
  track = 'rgba(255,255,255,.16)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.max(0, Math.min(1, value))) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, color, className = '' }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-ink/10 ${className}`}>
      <motion.div
        className="h-full rounded-full bg-accent"
        style={color ? { background: color } : undefined}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** 大島紬の絣（かすり）をモチーフにした地紋 */
export function Kasuri({ className = '', size = 28 }: { className?: string; size?: number }) {
  const id = `kasuri-${useId().replace(/:/g, '')}`;
  const h = size / 2;
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <path d={`M${h} ${h - 7} L${h + 7} ${h} L${h} ${h + 7} L${h - 7} ${h}Z`} fill="none" stroke="currentColor" strokeWidth="0.9" />
          <path d={`M${h} ${h - 2.5}v5M${h - 2.5} ${h}h5`} stroke="currentColor" strokeWidth="1.1" />
          <path d={`M0 0h1.6v1.6H0zM${size - 1.6} 0h1.6v1.6h-1.6zM0 ${size - 1.6}h1.6v1.6H0zM${size - 1.6} ${size - 1.6}h1.6v1.6h-1.6z`} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function PageHeader({
  title,
  label,
  back,
  right,
  onBack,
}: {
  title?: ReactNode;
  label?: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <header className="pt-safe sticky top-0 z-30 bg-paper/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-4">
        {back && (
          <button
            onClick={() => (onBack ? onBack() : window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink active:bg-ink/5"
            aria-label="戻る"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {label && <div className="label leading-none">{label}</div>}
          {title && <h1 className="truncate font-serif text-[19px] font-bold leading-tight">{title}</h1>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function SectionHeader({ label, title, action }: { label?: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-5">
      <div>
        {label && <div className="label mb-1">{label}</div>}
        <h2 className="font-serif text-[18px] font-bold leading-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] bg-paper px-5 pb-[calc(24px+var(--safe-bottom))] pt-3 shadow-lift"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink/15" />
            <div className="mb-3 flex items-start justify-between gap-3">
              {title ? <h3 className="font-serif text-[18px] font-bold leading-snug">{title}</h3> : <span />}
              <button onClick={onClose} className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5" aria-label="閉じる">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({
  icon: Icon = Award,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent/10 text-accent">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </div>
      <p className="font-serif text-[17px] font-bold">{title}</p>
      {body && <p className="mt-2 text-[13px] leading-relaxed text-ink2">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-ink/[0.06] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative flex-1 rounded-full px-3 py-2 text-[13px] font-bold transition ${
            value === o.value ? 'text-ink' : 'text-ink3'
          }`}
        >
          {value === o.value && (
            <motion.span layoutId="seg-active" className="absolute inset-0 rounded-full bg-card shadow-card" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// ───────── トースト ─────────

const useToastStore = create<{ message: string | null; show: (m: string) => void; hide: () => void }>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

export const toast = (m: string) => useToastStore.getState().show(m);

export function ToastHost() {
  const { message, hide } = useToastStore();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [message, hide]);
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(108px+var(--safe-bottom))] z-[70] flex justify-center px-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
        >
          <div className="rounded-full bg-forest-900/95 px-5 py-3 text-[13px] font-bold text-washi shadow-lift" role="status">
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      className={`pb-tabbar ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.main>
  );
}

export function formatDate(iso: string, withTime = false): string {
  const d = new Date(iso);
  const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  if (!withTime) return date;
  return `${date} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function yen(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}
