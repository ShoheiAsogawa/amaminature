import { LazyMotion, MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useRouteError,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { IconCheckCircleFill, IconInfo, IconWarningCircleFill } from './components/icons';
import { TabBar } from './components/TabBar';
import { Button } from './components/ui';
import { cn } from './lib/cn';
import { PRIVACY_VERSION, TERMS_VERSION } from './data/legalVersions';
import { api } from './lib/api';
import { LIFF_ID } from './lib/liff';
import Explore from './screens/Explore';
import Home from './screens/Home';
import Me from './screens/Me';
import SpeciesDetail from './screens/SpeciesDetail';
import Zukan from './screens/Zukan';
import { useStore } from './store/useStore';

// framer-motion の機能は起動後に読み込む（それまでは m.* は止まった状態で描画される）
const loadMotionFeatures = () => import('./lib/motionFeatures').then((r) => r.default);

/** 分割した画面の読み込み。電波が一瞬切れた時のために1回だけやり直す */
function retry<T>(load: () => Promise<T>): () => Promise<T> {
  return () => load().catch(() => new Promise<T>((resolve, reject) => setTimeout(() => load().then(resolve, reject), 1200)));
}

// 利用頻度の低い画面は分割して読み込み、初回表示を軽くする
const loadOnboarding = retry(() => import('./screens/Onboarding'));
const loadPlus = retry(() => import('./screens/Plus'));
const loadRewards = retry(() => import('./screens/Rewards'));
const loadSafeDrive = retry(() => import('./screens/SafeDrive'));
const loadCapture = retry(() => import('./screens/Capture'));
const loadSightingDetail = retry(() => import('./screens/SightingDetail'));
const Onboarding = lazy(loadOnboarding);
const loadLegal = retry(() => import('./screens/Legal'));
const Legal = lazy(loadLegal);
const ConsentUpdate = lazy(() => loadLegal().then((m) => ({ default: m.ConsentUpdate })));
const Contact = lazy(retry(() => import('./screens/Contact')));
const Partners = lazy(retry(() => import('./screens/Partners')));
const Admin = lazy(retry(() => import('./screens/Admin')));
const Plus = lazy(loadPlus);
const Rewards = lazy(loadRewards);
const SafeDrive = lazy(loadSafeDrive);
const Capture = lazy(loadCapture);
const SightingDetail = lazy(loadSightingDetail);
// 利用者の画面は起動後の空き時間に先読みする（タブの［きろく］で待たせない。森の中で圏外になっても開けるように）
if (typeof window !== 'undefined') {
  const idle: (cb: () => void) => void = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 1200));
  idle(() => {
    for (const load of [loadCapture, loadSightingDetail, loadSafeDrive, loadRewards, loadPlus, loadOnboarding] as (() => Promise<{ default: ComponentType }>)[]) {
      void load().catch(() => {});
    }
  });
}

const RELOADED_KEY = 'amami-nature:reloaded-at';

/**
 * 画面を表示できなかった時（分割した画面の読み込みに失敗した・描画中のエラー）。
 * 新しい版を公開した直後は古いファイルが消えているので、1回だけ自動で読み込み直す。
 */
function RouteError() {
  const error = useRouteError();
  const chunk = error instanceof Error && /dynamically imported module|Importing a module script failed|Failed to fetch|Loading chunk/i.test(error.message);
  useEffect(() => {
    console.error(error);
    if (!chunk || !navigator.onLine) return;
    try {
      const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? 0);
      if (Date.now() - last < 30000) return;
      sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  }, [error, chunk]);
  return (
    <main className="mx-auto grid min-h-dvh max-w-[480px] place-items-center bg-page px-6 text-center">
      <div className="panel w-full p-6">
        <IconWarningCircleFill size={40} className="mx-auto text-warning" />
        <h1 className="mt-3 text-title font-black text-fg">画面を表示できませんでした</h1>
        <p className="mt-2 text-body text-fg-2">
          {chunk ? '電波の良い場所で、読み込み直してください。記録はこの端末に残っています。' : 'もう一度読み込み直してください。記録はこの端末に残っています。'}
        </p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          読み込み直す
        </Button>
        <Button variant="text" size="hit" className="mt-2 w-full" onClick={() => window.location.assign('/')}>
          ホームへ
        </Button>
      </div>
    </main>
  );
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
  '/admin': '運営ダッシュボード',
  '/onboarding': 'はじめに',
  '/terms': '利用規約',
  '/privacy': 'プライバシーポリシー',
  '/contact': 'お問い合わせ',
};

/** オンボーディングや規約の改定の同意の前でも開ける画面（提携先・運営・規約・お問い合わせ） */
const OPEN_ROUTES = ['/onboarding', '/partners', '/admin', '/terms', '/privacy', '/contact'];

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
  const consent = useStore((s) => s.settings.consent);
  const liffReady = useStore((s) => s.account.liffReady);
  const markVisit = useStore((s) => s.markVisit);
  const { pathname, search } = useLocation();
  // LIFF の初期化が URL のログイン情報（#access_token など）を読み終えるまで、オンボーディングへ移らない（長くても数秒）。
  // ログイン済みの端末も、サーバーの同意を読み込むまで待つ（別の端末で同意した人に同意の画面を一瞬出さない）
  const [liffWaited, setLiffWaited] = useState(!LIFF_ID && !api.hasSession());
  useEffect(() => {
    if (liffWaited) return;
    const t = window.setTimeout(() => setLiffWaited(true), 5000);
    return () => window.clearTimeout(t);
  }, [liffWaited]);
  useRouteTitle();
  // 連続日数のために、開いた日を記録する（バックグラウンドから戻った時も。同じ日は何度呼んでも1回）
  useEffect(() => {
    markVisit();
    const onVisible = () => {
      if (document.visibilityState === 'visible') markVisit();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [markVisit]);

  // 提携先・運営・規約の画面は、アプリのオンボーディングを経ずに開ける
  const open = OPEN_ROUTES.includes(pathname);
  if (!onboarded && !open) {
    if (!liffReady && !liffWaited) return <Blank />;
    // LINE のトークから開いた記録画面（?inbox= など）を、オンボーディングの後に開き直す
    return <Navigate to="/onboarding" replace state={{ from: pathname + search }} />;
  }
  // 利用規約・プライバシーポリシーを改定したら、同意してもらうまで先に進めない
  // （LINE で別の端末の同意を読み込む間は待つ。sync.ts の adoptServerConsent）
  if (onboarded && !open && (consent?.terms !== TERMS_VERSION || consent?.privacy !== PRIVACY_VERSION)) {
    if (!liffReady && !liffWaited) return <Blank />;
    return (
      <Suspense fallback={<Blank />}>
        <ConsentUpdate />
      </Suspense>
    );
  }
  const showTabs = TAB_ROUTES.includes(pathname);
  return (
    // 列幅は最大 480px。パートナー画面だけ 960px（§4.5）
    <div className={cn('relative mx-auto min-h-dvh w-full bg-page', pathname === '/partners' ? 'max-w-[960px]' : pathname === '/admin' ? '' : 'max-w-[480px]')}>
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
    errorElement: <RouteError />,
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
      { path: '/admin', element: <Admin /> },
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/terms', element: <Legal kind="terms" /> },
      { path: '/privacy', element: <Legal kind="privacy" /> },
      { path: '/contact', element: <Contact /> },
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
