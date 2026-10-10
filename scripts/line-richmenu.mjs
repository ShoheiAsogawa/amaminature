// LINE公式アカウントのリッチメニュー画像を生成し、（--deploy 指定時）LINEに登録する
//
//   画像だけ作る:  node scripts/line-richmenu.mjs
//   登録まで行う:  LINE_CHANNEL_ACCESS_TOKEN=... LIFF_ID=... node scripts/line-richmenu.mjs --deploy
//
// Playwright のブラウザが別の場所にある環境では PW_CHROMIUM=/path/to/chrome を指定する。
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

// デザインシステム「瑠璃の野帳」（docs/DESIGN_SYSTEM.md）に合わせる:
// 白い地、1px（ここでは 4px）の区切り線、瑠璃 1 色、IBM Plex Sans JP 600、英字の上ラベルなし、
// アイコンは Phosphor（@iconify-json/ph）の regular。記録だけ brand-fill の円に camera-fill（タブバーと同じ）。
const ph = JSON.parse(await readFile(new URL('../node_modules/@iconify-json/ph/icons.json', import.meta.url), 'utf8'));

// src/styles/palette.ts のライトの値（このスクリプトは TypeScript を読めないので値を写す）
const C = { page: '#FFFFFF', sep: '#E1E4E2', fg: '#161A18', fg2: '#4A524E', brandFill: '#1E50A2', onBrand: '#FFFFFF', danger: '#C0322B' };

const W = 2500;
const H = 1686;
const OUT = 'line/richmenu.jpg';

const TILES = [
  { label: '記録する', icon: 'camera-fill', path: '/capture', primary: true },
  { label: '図鑑', icon: 'book-open-text', path: '/zukan' },
  { label: '路上レポート', icon: 'warning', path: '/capture?mode=road', color: C.danger },
  { label: '体験', icon: 'compass', path: '/explore' },
  { label: 'ポイント交換', icon: 'gift', path: '/rewards' },
  { label: 'マイページ', icon: 'user-circle', path: '/me' },
];

const icon = (name, color, size) => {
  const body = ph.icons[name]?.body;
  if (!body) throw new Error(`ph:${name} が @iconify-json/ph にありません`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256" fill="currentColor" style="color:${color}">${body}</svg>`;
};

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${W}px; height: ${H}px; background: ${C.page}; color: ${C.fg};
         font-family: 'IBM Plex Sans JP', 'Hiragino Sans', sans-serif; font-weight: 600; font-feature-settings: 'palt'; }
  .grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
  .tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 56px;
          border-right: 4px solid ${C.sep}; border-bottom: 4px solid ${C.sep}; }
  .tile:nth-child(3n) { border-right: 0 } .tile:nth-child(n+4) { border-bottom: 0 }
  .icon { width: 280px; height: 280px; display: grid; place-items: center; }
  .primary .icon { border-radius: 50%; background: ${C.brandFill}; }
  .label { font-size: 92px; line-height: 1.3; letter-spacing: 0; }
</style></head><body><div class="grid">
${TILES.map(
  (t) =>
    `<div class="tile ${t.primary ? 'primary' : ''}"><div class="icon">${icon(t.icon, t.primary ? C.onBrand : (t.color ?? C.fg2), t.primary ? 150 : 200)}</div><div class="label">${t.label}</div></div>`,
).join('')}
</div></body></html>`;

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT, type: 'jpeg', quality: 88 });
await browser.close();
console.log(`rich menu image → ${OUT}`);

// ───────── LINEへの登録 ─────────
if (process.argv.includes('--deploy')) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const liffId = process.env.LIFF_ID;
  if (!token || !liffId) throw new Error('LINE_CHANNEL_ACCESS_TOKEN と LIFF_ID が必要です');
  const cw = Math.floor(W / 3);
  const ch = Math.floor(H / 2);
  const menu = {
    size: { width: W, height: H },
    selected: true,
    name: 'AMAMI NATURE main',
    chatBarText: 'メニュー',
    areas: TILES.map((t, i) => ({
      bounds: { x: (i % 3) * cw, y: Math.floor(i / 3) * ch, width: i % 3 === 2 ? W - 2 * cw : cw, height: i < 3 ? ch : H - ch },
      action: { type: 'uri', label: t.label, uri: `https://liff.line.me/${liffId}${t.path}` },
    })),
  };
  const auth = { Authorization: `Bearer ${token}` };
  const created = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(menu),
  }).then((r) => r.json());
  if (!created.richMenuId) throw new Error(`rich menu create failed: ${JSON.stringify(created)}`);
  const up = await fetch(`https://api-data.line.me/v2/bot/richmenu/${created.richMenuId}/content`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'image/jpeg' },
    body: await readFile(OUT),
  });
  if (!up.ok) throw new Error(`image upload failed: ${up.status} ${await up.text()}`);
  const def = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${created.richMenuId}`, { method: 'POST', headers: auth });
  if (!def.ok) throw new Error(`set default failed: ${def.status}`);
  await writeFile('line/richmenu-id.txt', `${created.richMenuId}\n`);
  console.log(`rich menu deployed: ${created.richMenuId}`);
}
