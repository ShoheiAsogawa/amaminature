import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAccount } from './store/sync';
import { applyTheme, useStore } from './store/useStore';
import { DARK, LIGHT } from './styles/palette';
import './styles/index.css';
import './styles/pixel-frames.css';
import './styles/pixel-fonts.css';

/**
 * ブラウザの上下のバーの色（theme-color、2 つの meta）をテーマに合わせる（§2.9・§12.2）。
 * ライトは白、夜の森は黒（palette.ts の page）。テーマを切り替えると <html data-theme> が変わるので、それを見て更新する。
 */
function syncThemeColor() {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? DARK.page : LIGHT.page));
}

applyTheme(useStore.getState().settings.theme);
syncThemeColor();
new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useStore.getState().settings.theme === 'system') applyTheme('system');
  syncThemeColor();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// LINE（LIFF）から開かれていればログインして同期を開始
void initAccount();

/**
 * 新しい版を公開した直後、古い版の分割ファイルはもうない。読み込みに失敗したら1回だけ読み込み直して新しい版にする
 * （サービスワーカーのない LINE の iPhone 内ブラウザなど）。App.tsx の RouteError と同じ印を使い、続けて読み直さない
 */
window.addEventListener('vite:preloadError', (event) => {
  if (!navigator.onLine) return;
  try {
    const last = Number(sessionStorage.getItem('amami-nature:reloaded-at') ?? 0);
    if (Date.now() - last < 30000) return;
    sessionStorage.setItem('amami-nature:reloaded-at', String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

// PWA（LINE外でホーム画面に追加した場合のオフライン対応）
if ('serviceWorker' in navigator && import.meta.env.PROD && window.top === window.self) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      // 新しい版が届いた。記録や入力の途中で読み込み直さないよう、アプリを裏に回した時か、
      // タブの画面でシートを開いていない時に入れ替える
      onNeedRefresh() {
        const calm = () =>
          document.visibilityState === 'hidden' ||
          (['/', '/zukan', '/explore', '/me'].includes(window.location.pathname) && !document.querySelector('[role="dialog"]'));
        const apply = () => {
          if (!calm()) return;
          document.removeEventListener('visibilitychange', apply);
          window.clearInterval(timer);
          void updateSW(true);
        };
        document.addEventListener('visibilitychange', apply);
        const timer = window.setInterval(apply, 5000);
        apply();
      },
    });
  });
}
