/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// DEMO_BUILD=1: LINE外で動くスタンドアロンのデモ（相対パス＋ハッシュルーター）
const demo = process.env.DEMO_BUILD === '1';

/**
 * BudouX（<Phrase> の文節改行）のブラウザ版の DOM 実装を使わせる。
 * Vite は budoux の package.json の "browser" フィールド（./module/dom.js → ./module/dom-browser.js）を
 * 解決しないので、そのままだと Node 用の linkedom がメインのチャンクに入り、約 60KB（gzip）重くなる。
 */
const budouxBrowserDom: Plugin = {
  name: 'budoux-browser-dom',
  enforce: 'pre',
  resolveId(source, importer) {
    if (source === './dom.js' && importer && /[\\/]node_modules[\\/]budoux[\\/]module[\\/]/.test(importer)) {
      return path.join(path.dirname(importer), 'dom-browser.js');
    }
    return null;
  },
};

export default defineConfig({
  base: demo ? './' : '/',
  define: {
    'import.meta.env.VITE_ROUTER': JSON.stringify(demo ? 'hash' : process.env.VITE_ROUTER ?? 'browser'),
  },
  build: { chunkSizeWarningLimit: 600 },
  server: {
    // `npm run dev:worker`（wrangler dev, :8787）にAPIをプロキシ
    proxy: { '/api': 'http://127.0.0.1:8787', '^/s/.*': 'http://127.0.0.1:8787' },
  },
  plugins: [
    budouxBrowserDom,
    react(),
    VitePWA({
      // 新しい版への入れ替えは src/main.tsx で、記録の途中でない時に行う（injectRegister: false では autoUpdate が効かない）
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'AMAMI NATURE 奄美いきものコレクション',
        short_name: 'AMAMI NATURE',
        description: '奄美群島で出会った生き物を撮って、名前をつけて、集める図鑑アプリ',
        lang: 'ja',
        start_url: demo ? '.' : '/',
        scope: demo ? '.' : '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EEF5FF',
        theme_color: '#2160E8',
        categories: ['education', 'travel', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/s\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
