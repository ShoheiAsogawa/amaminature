import { LazyMotion, MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { IconCheckCircleFill, IconInfo, IconWarningCircleFill } from './components/icons';
import { TabBar } from './components/TabBar';
import { cn } from './lib/cn';
import Explore from './screens/Explore';
import Home from './screens/Home';
import Me from './screens/Me';
import SpeciesDetail from './screens/SpeciesDetail';
import Zukan from './screens/Zukan';
import { useStore } from './store/useStore';

// framer-motion の機能は起動後に読み込む（それまでは m.* は止まった状態で描画される）
const loadMotionFeatures = () => import('./lib/motionFeatures').then((r) => r.default);

// 利用頻度の低い画面は分割して読み込み、初回表示を軽くする
const Onboarding = lazy(() => import('./screens/Onboarding'));
const Partners = lazy(() => import('./screens/Partners'));
const Plus = lazy(() => import('./screens/Plus'));
const Rewards = lazy(() => import('./screens/Rewards'));
const SafeDrive = lazy(() => import('./screens/SafeDrive'));
// 記録と記録の詳細は起動後の空き時間に先読みする（タブの［きろく］を押した時に待たせない）
const loadCapture = () => import('./screens/Capture');
const loadSightingDetail = () => import('./screens/SightingDetail');
const Capture = lazy(loadCapture);
const SightingDetail = lazy(loadSightingDetail);
if (typeof window !== 'undefined') {
  const idle: (cb: () => void) => void = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1200));
  idle(() => {
    void loadCapture().catch(() => {});
    void loadSightingDetail().catch(() => {});
  });
}

/** 読み込み中は静止した page の地だけ（スピナーやシマーは出さない。§9） */
function Blank() {
  return <div className="min-h-dvh bg-page" />;
}

const TAB_ROUTES = ['/', '/zukan', '/explore', '/me'];

/** 画面ごとの document.title（§7.3）。種詳細と記録詳細は画面側で useDocumentTitle() を使う */
const TITLES: Record<string, string> = {
  '/': 'ホーム',
  '/zukan': '図鑑',
  '/capture': '記録する',
  '/explore': '体験',
  '/me': 'マイページ',
  '/plus': 'AMAMI NATURE+',
  '/rewards': 'ポイント交換',
  '/safe-drive': 'セーフドライブ宣言',
  '/partners': '自治体・保護団体の方へ',
  '/onboarding': 'はじめに',
};

function useRouteTitle() {
  const { pathname, search } = useLocation();
  // 画面の useDocumentTitle()（useEffect）より先に走るよう useLayoutEffect で既定の題を入れる
  useLayoutEffect(() => {
    const road = pathname === '/capture' && new URLSearchParams(search).get('mode') === 'road';
    document.title = road ? '路上レポート' : (TITLES[pathname] ?? 'AMAMI NATURE');
  }, [pathname, search]);
}

/**
 * トースト（Sonner、§7.18）。アプリに 1 つだけ。上中央（下はタブバーと固定 CTA で混んでいる）。
 * シート（body 直下のポータル）より上に出すため、body 直下に置く。
 */
function AppToaster() {
  const theme = useStore((s) => s.settings.theme);
  const top = 'calc(12px + env(safe-area-inset-top))';
  return createPortal(
    <Toaster
      position="top-center"
      offset={{ top }}
      mobileOffset={{ top }}
      theme={theme}
      visibleToasts={2}
      duration={2600}
      icons={{
        success: <IconCheckCircleFill size={22} className="text-xp" />,
        error: <IconWarningCircleFill size={22} className="text-capture" />,
        info: <IconInfo size={20} className="text-toast-fg/80" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex min-h-12 w-[calc(100vw-32px)] max-w-[448px] items-center gap-3 rounded-full border-2 border-white/15 bg-toast px-5 py-3 font-sans text-toast-fg shadow-toast dark:shadow-none',
          title: 'text-callout font-bold',
          description: 'text-sub opacity-80',
          icon: 'shrink-0',
          actionButton: 'ml-auto text-callout font-black text-gold underline-offset-2',
        },
      }}
    />,
    document.body,
  );
}

function Shell() {
  const onboarded = useStore((s) => s.settings.onboarded);
  const markVisit = useStore((s) => s.markVisit);
  const { pathname } = useLocation();
  useRouteTitle();
  // 連続日数のために、開いた日を記録する
  useEffect(() => {
    markVisit();
  }, [markVisit]);

  if (!onboarded && pathname !== '/onboarding' && pathname !== '/partners') {
    return <Navigate to="/onboarding" replace />;
  }
  const showTabs = TAB_ROUTES.includes(pathname);
  return (
    // 列幅は最大 480px。パートナー画面だけ 960px（§4.5）
    <div className={cn('relative mx-auto min-h-dvh w-full bg-page', pathname === '/partners' ? 'max-w-[960px]' : 'max-w-[480px]')}>
      <Suspense fallback={<Blank />}>
        <Outlet />
      </Suspense>
      {showTabs && <TabBar />}
      <ScrollRestoration />
    </div>
  );
}

const routes = [
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/zukan', element: <Zukan /> },
      { path: '/species/:id', element: <SpeciesDetail /> },
      { path: '/capture', element: <Capture /> },
      { path: '/sighting/:id', element: <SightingDetail /> },
      { path: '/explore', element: <Explore /> },
      { path: '/me', element: <Me /> },
      { path: '/plus', element: <Plus /> },
      { path: '/rewards', element: <Rewards /> },
      { path: '/safe-drive', element: <SafeDrive /> },
      { path: '/partners', element: <Partners /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

const router = import.meta.env.VITE_ROUTER === 'hash' ? createHashRouter(routes) : createBrowserRouter(routes);

export default function App() {
  const loaded = useStore((s) => s.loaded);
  const load = useStore((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    // 動きを減らす設定では framer-motion の移動・回転を止める（§9）
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        {loaded ? <RouterProvider router={router} /> : <Blank />}
        <AppToaster />
      </MotionConfig>
    </LazyMotion>
  );
}
