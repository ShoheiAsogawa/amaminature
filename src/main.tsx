import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAccount } from './store/sync';
import { applyTheme, useStore } from './store/useStore';
import './styles/index.css';

applyTheme(useStore.getState().settings.theme);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useStore.getState().settings.theme === 'system') applyTheme('system');
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
