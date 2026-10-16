import { Link, NavLink } from 'react-router-dom';
import { cn } from '../lib/cn';
import { sfx } from '../lib/sfx';
import { pxCircleClip } from './game';
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
 * 下に浮いた白いバー（ドット絵の枠 px-panel、線と厚みは枠の絵）。中央は大きな赤い「きろく」ボタン
 * （墨の線と白い縁のドット絵の丸。厚みは切り抜かない外側の drop-shadow、波紋は丸の兄弟の px-ring-capture）。
 * 選択中のタブはアイコンを淡い瑠璃の四角（角を段々に切り抜く）に入れ、少し跳ねる。
 */
export function TabBar() {
  return (
    <nav aria-label="メインメニュー" className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] px-3 pb-[calc(10px+var(--safe-bottom))]">
      <div className="px-panel tab-grid grid h-16">
        {TABS.map((t) =>
          t === null ? (
            <div key="capture" className="relative grid place-items-center">
              <Link
                to="/capture"
                aria-label="記録する"
                onClick={() => sfx('tap')}
                className="absolute -top-8 grid h-[66px] w-[66px] place-items-center text-white transition-transform duration-75 active:translate-y-[3px]"
              >
                {/* 波紋は切り抜いた丸の外に広がるので、丸の兄弟にして下に置く */}
                <span aria-hidden className="px-ring-capture absolute inset-0 animate-ring-pulse" />
                {/* 墨の線 → 白い縁 → 赤い面。線があるので、厚み（drop-shadow）がボタンにつながって見える */}
                <span aria-hidden className="absolute inset-0 [filter:drop-shadow(0_3px_0_rgb(var(--c-capture-edge)))]">
                  <span className="absolute inset-0 bg-ink" style={{ clipPath: pxCircleClip(66) }} />
                  <span className="absolute inset-[3px] bg-surface" style={{ clipPath: pxCircleClip(60) }} />
                  <span className="absolute inset-[6px] bg-capture" style={{ clipPath: pxCircleClip(54) }} />
                </span>
                <IconCameraFill size={30} className="relative" />
              </Link>
              <span aria-hidden className="absolute bottom-px text-tab text-capture">
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
                        'grid h-8 w-12 place-items-center transition-colors',
                        isActive && 'px-clip-2 animate-pop-in bg-brand-soft',
                      )}
                    >
                      <Icon size={24} />
                    </span>
                    <span className="whitespace-nowrap text-tab">{t.label}</span>
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
