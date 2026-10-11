import { Link, NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { sfx } from '../lib/sfx';
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

const TABS: (Tab | null)[] = [
  { to: '/', label: 'ホーム', icon: IconHouseSimple, activeIcon: IconHouseSimpleFill, end: true },
  { to: '/zukan', label: '図鑑', icon: IconBookOpenText, activeIcon: IconBookOpenTextFill },
  null, // 中央の記録ボタン
  { to: '/explore', label: '体験', icon: IconCompass, activeIcon: IconCompassFill },
  { to: '/me', label: 'マイページ', icon: IconUserCircle, activeIcon: IconUserCircleFill },
];

/**
 * タブバー（docs/DESIGN_SYSTEM.md）。/ /zukan /explore /me だけで出す。
 * 下に浮いた白いバー（2px の線と厚み）。中央は大きな赤い「きろく」ボタン（白い縁、波紋が広がる）。
 * 選択中のタブはアイコンを瑠璃の丸に入れ、少し跳ねる。
 */
export function TabBar() {
  return (
    <nav aria-label="メインメニュー" className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-3 pb-[calc(10px+var(--safe-bottom))]">
      <div className="grid h-16 grid-cols-5 rounded-xl border-2 border-line bg-surface shadow-[0_4px_0_rgb(var(--c-edge)),0_10px_24px_rgb(20_27_66/.12)]">
        {TABS.map((t) =>
          t === null ? (
            <div key="capture" className="relative grid place-items-center">
              <Link
                to="/capture"
                aria-label="記録する"
                onClick={() => sfx('tap')}
                className="absolute -top-7 grid h-[66px] w-[66px] place-items-center rounded-full border-4 border-surface bg-capture text-white shadow-[0_4px_0_rgb(var(--c-capture-edge)),0_8px_18px_rgb(240_69_58/.35)] transition-transform duration-75 active:translate-y-[3px]"
              >
                <span aria-hidden className="absolute inset-0 animate-ring-pulse rounded-full border-4 border-capture" />
                <IconCameraFill size={30} />
              </Link>
              <span aria-hidden className="absolute bottom-[7px] text-tab text-capture">
                きろく
              </span>
            </div>
          ) : (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              onClick={() => sfx('tap')}
              className={({ isActive }) =>
                cn('flex select-none flex-col items-center justify-center gap-0.5 pt-[2px]', isActive ? 'text-brand' : 'text-fg-3')
              }
            >
              {({ isActive }) => {
                const Icon = isActive ? t.activeIcon : t.icon;
                return (
                  <>
                    <span
                      className={cn(
                        'grid h-8 w-12 place-items-center rounded-full transition-colors',
                        isActive && 'animate-pop-in bg-brand-soft',
                      )}
                    >
                      <Icon size={24} />
                    </span>
                    <span className="text-tab">{t.label}</span>
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
