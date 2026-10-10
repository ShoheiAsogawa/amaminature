// PWA / LINE用アイコンを public/favicon.svg から書き出す
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
// ローカルの Playwright 版と異なるブラウザを使う環境では PW_CHROMIUM でパスを指定
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage();

async function render(size, out, { maskable = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  // maskable は安全領域（80%）に収めるため余白をつけ、角丸なしの背景で塗る
  const inner = maskable ? Math.round(size * 0.72) : size;
  const body = maskable
    ? `<div style="width:${size}px;height:${size}px;background:#0E2A20;display:grid;place-items:center">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>`
    : svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
  await page.setContent(`<html><body style="margin:0;background:transparent">${body}</body></html>`);
  await page.screenshot({ path: out, omitBackground: !maskable, clip: { x: 0, y: 0, width: size, height: size } });
}

await render(192, 'public/icons/icon-192.png');
await render(512, 'public/icons/icon-512.png');
await render(512, 'public/icons/icon-maskable-512.png', { maskable: true });
await render(180, 'public/icons/apple-touch-icon.png', { maskable: true });
await render(640, 'line/channel-icon.png', { maskable: true });
await browser.close();
console.log('icons generated');
