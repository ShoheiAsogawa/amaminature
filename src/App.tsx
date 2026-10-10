import { lazy, Suspense, useEffect } from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
} from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { ToastHost } from './components/ui';
import Capture from './screens/Capture';
import Explore from './screens/Explore';
import Home from './screens/Home';
import Me from './screens/Me';
import SightingDetail from './screens/SightingDetail';
import SpeciesDetail from './screens/SpeciesDetail';
import Zukan from './screens/Zukan';
import { useStore } from './store/useStore';

// 利用頻度の低い画面は分割して読み込み、初回表示を軽くする
const Onboarding = lazy(() => import('./screens/Onboarding'));
const Partners = lazy(() => import('./screens/Partners'));
const Plus = lazy(() => import('./screens/Plus'));
const Rewards = lazy(() => import('./screens/Rewards'));
const SafeDrive = lazy(() => import('./screens/SafeDrive'));

function Spinner() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/10 border-t-accent" />
    </div>
  );
}

const TAB_ROUTES = ['/', '/zukan', '/explore', '/me'];

function Shell() {
  const onboarded = useStore((s) => s.settings.onboarded);
  const { pathname } = useLocation();

  if (!onboarded && pathname !== '/onboarding' && pathname !== '/partners') {
    return <Navigate to="/onboarding" replace />;
  }
  const showTabs = TAB_ROUTES.includes(pathname);
  return (
    <div className="relative mx-auto min-h-dvh max-w-[480px] bg-paper shadow-[0_0_80px_-20px_rgba(0,0,0,.25)]">
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
      {showTabs && <TabBar />}
      <ToastHost />
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

  if (!loaded) {
    return (
      <div className="grid min-h-dvh place-items-center bg-forest-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-washi/20 border-t-gold" />
      </div>
    );
  }
  return <RouterProvider router={router} />;
}
