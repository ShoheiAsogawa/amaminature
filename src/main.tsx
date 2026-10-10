import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAccount } from './store/sync';
import { applyTheme, useStore } from './store/useStore';
import { DARK, LIGHT } from './styles/palette';
import './styles/index.css';

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

// PWA（LINE外でホーム画面に追加した場合のオフライン対応）
if ('serviceWorker' in navigator && import.meta.env.PROD && window.top === window.self) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
