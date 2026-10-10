import { Link, NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import {
  IconBookOpenText,
  IconBookOpenTextFill,
  IconCameraFill,
  IconCompass,
  IconCompassFill,
  IconHouseSimple,
  IconHouseSimpleFill,
  IconUserCircle,
  IconUserCircleFill,
  type IconComponent,
} from './icons';

type Tab = { to: string; label: string; icon: IconComponent; activeIcon: IconComponent; end?: boolean };

// §5.3 通常は regular、選択中は fill
const TABS: (Tab | null)[] = [
  { to: '/', label: 'ホーム', icon: IconHouseSimple, activeIcon: IconHouseSimpleFill, end: true },
  { to: '/zukan', label: '図鑑', icon: IconBookOpenText, activeIcon: IconBookOpenTextFill },
  null, // 中央の記録ボタン
  { to: '/explore', label: '体験', icon: IconCompass, activeIcon: IconCompassFill },
  { to: '/me', label: 'マイページ', icon: IconUserCircle, activeIcon: IconUserCircleFill },
];

/**
 * タブバー（docs/DESIGN_SYSTEM.md §7.2）。/ /zukan /explore /me だけで出す。
 * 下端に固定、高さ 56px ＋ 安全領域、page の不透明な地、上辺に 1px の sep。浮かせない・角丸なし・影なし・ぼかしなし。
 * 5 つの等幅の区画。選択中は fill のアイコンと brand の 600 のラベル（点や下線は付けない）。
 * 中央は 48px の brand-fill の円に camera-fill（ラベルなし）。タップした時のアニメーションはない。
 */
export function TabBar() {
  return (
    <nav
      aria-label="メインメニュー"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-sep bg-page pb-[var(--safe-bottom)]"
    >
      <div className="grid h-14 grid-cols-5">
        {TABS.map((t) =>
          t === null ? (
            <div key="capture" className="grid place-items-center">
              <Link
                to="/capture"
                aria-label="記録する"
                className="grid h-12 w-12 place-items-center rounded-full bg-brand-fill text-on-brand active:bg-brand-pressed"
              >
                <IconCameraFill size={24} />
              </Link>
            </div>
          ) : (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn('flex select-none flex-col items-center justify-center pt-[2px]', isActive ? 'text-brand' : 'text-fg-2')
              }
            >
              {({ isActive }) => {
                const Icon = isActive ? t.activeIcon : t.icon;
                return (
                  <>
                    <Icon size={24} />
                    <span className={cn('mt-0.5 text-tab', isActive && 'font-semibold')}>{t.label}</span>
                  </>
                );
              }}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
