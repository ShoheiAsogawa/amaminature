/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// DEMO_BUILD=1: LINE外で動くスタンドアロンのデモ（相対パス＋ハッシュルーター）
const demo = process.env.DEMO_BUILD === '1';

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
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'AMAMI NATURE — 奄美いきものコレクション',
        short_name: 'AMAMI NATURE',
        description: '奄美群島で出会った生き物を撮って、名前をつけて、集める図鑑アプリ',
        lang: 'ja',
        start_url: demo ? '.' : '/',
        scope: demo ? '.' : '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6F1E7',
        theme_color: '#0E2A20',
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
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
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
