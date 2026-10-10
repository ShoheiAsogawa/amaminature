// LINE公式アカウントのリッチメニュー画像を生成し、（--deploy 指定時）LINEに登録する
//
//   画像だけ作る:  node scripts/line-richmenu.mjs
//   登録まで行う:  LINE_CHANNEL_ACCESS_TOKEN=... LIFF_ID=... node scripts/line-richmenu.mjs --deploy
//
// Playwright のブラウザが別の場所にある環境では PW_CHROMIUM=/path/to/chrome を指定する。
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { __iconNode as bookOpen } from 'lucide-react/dist/esm/icons/book-open.js';
import { __iconNode as camera } from 'lucide-react/dist/esm/icons/camera.js';
import { __iconNode as compass } from 'lucide-react/dist/esm/icons/compass.js';
import { __iconNode as gift } from 'lucide-react/dist/esm/icons/gift.js';
import { __iconNode as alert } from 'lucide-react/dist/esm/icons/triangle-alert.js';
import { __iconNode as user } from 'lucide-react/dist/esm/icons/user.js';

const W = 2500;
const H = 1686;
const OUT = 'line/richmenu.jpg';

const TILES = [
  { label: '記録する', en: 'RECORD', icon: camera, path: '/capture', primary: true },
  { label: '図鑑', en: 'FIELD GUIDE', icon: bookOpen, path: '/zukan' },
  { label: '路上レポート', en: 'ROAD REPORT', icon: alert, path: '/capture?mode=road', tone: '#E0694A' },
  { label: '体験・ツアー', en: 'EXPLORE', icon: compass, path: '/explore' },
  { label: 'ポイント交換', en: 'REWARDS', icon: gift, path: '/rewards', tone: '#C79A2E' },
  { label: 'マイページ', en: 'MY PAGE', icon: user, path: '/me' },
];

const svg = (node, color, size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')}</svg>`;

const kasuri = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M32 16 L48 32 L32 48 L16 32Z" fill="none" stroke="rgba(246,241,231,0.05)" stroke-width="2"/><path d="M32 26v12M26 32h12" stroke="rgba(246,241,231,0.06)" stroke-width="2.4"/></svg>`,
);

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: ${W}px; height: ${H}px; background: #08190F; font-family: 'Zen Kaku Gothic New', sans-serif; }
  .grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr);
          background: radial-gradient(70% 60% at 15% 20%, rgba(43,103,80,.55), transparent 70%), radial-gradient(60% 60% at 90% 100%, rgba(42,79,163,.35), transparent 70%), url("data:image/svg+xml,${kasuri}"); }
  .tile { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 44px;
          border-right: 2px solid rgba(246,241,231,.08); border-bottom: 2px solid rgba(246,241,231,.08); color: #F6F1E7; }
  .tile:nth-child(3n) { border-right: 0 } .tile:nth-child(n+4) { border-bottom: 0 }
  .icon { width: 260px; height: 260px; border-radius: 50%; display: grid; place-items: center; background: rgba(246,241,231,.08); }
  .primary .icon { background: #F6F1E7; box-shadow: 0 0 0 18px rgba(199,154,46,.25); }
  .label { font-size: 92px; font-weight: 900; letter-spacing: .04em; }
  .en { font-size: 40px; font-weight: 700; letter-spacing: .3em; color: rgba(246,241,231,.45); margin-top: -26px; }
  .primary .en { color: #C79A2E; }
</style></head><body><div class="grid">
${TILES.map(
  (t) => `<div class="tile ${t.primary ? 'primary' : ''}"><div class="icon">${svg(t.icon, t.primary ? '#0E2A20' : t.tone ?? '#F6F1E7', 140)}</div><div class="label">${t.label}</div><div class="en">${t.en}</div></div>`,
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
