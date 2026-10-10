import { motion } from 'framer-motion';
import { BookOpen, Camera, Compass, House, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'ホーム', icon: House, end: true },
  { to: '/zukan', label: '図鑑', icon: BookOpen },
  null,
  { to: '/explore', label: '体験', icon: Compass },
  { to: '/me', label: 'マイページ', icon: User },
] as const;

export function TabBar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px]" aria-label="メインメニュー">
      <div className="relative mx-3 mb-[calc(10px+var(--safe-bottom))] flex h-[66px] items-center rounded-[26px] border hairline bg-card/90 px-1 shadow-lift backdrop-blur-xl">
        {TABS.map((t, i) =>
          t === null ? (
            <div key="capture" className="relative flex w-[76px] justify-center">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate('/capture')}
                className="absolute -top-[38px] grid h-[64px] w-[64px] place-items-center rounded-full bg-gradient-to-b from-forest-600 to-forest-900 text-washi shadow-lift ring-[5px] ring-paper"
                aria-label="いきものを記録する"
              >
                <Camera className="h-[26px] w-[26px]" strokeWidth={1.8} />
              </motion.button>
              <span className="mt-7 text-[10px] font-bold text-ink2">記録</span>
            </div>
          ) : (
            <NavLink
              key={i}
              to={t.to}
              end={'end' in t ? t.end : false}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-bold transition-colors ${
                  isActive ? 'text-accent' : 'text-ink3'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.1 : 1.7} />
                  <span>{t.label}</span>
                  {isActive && (
                    <motion.span layoutId="tab-dot" className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  );
}
