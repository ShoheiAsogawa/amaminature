// 主要画面のスクリーンショットを撮って見た目を確認する（DEMO_BUILD の preview を対象）
// 使い方: npm run build:demo && npx vite preview --outDir dist-demo --port 4173 & node scripts/screenshots.mjs
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173/';
const OUT = process.env.OUT_DIR ?? 'screenshots';
const theme = process.env.THEME ?? 'light';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: theme === 'dark' ? 'dark' : 'light',
  locale: 'ja-JP',
  timezoneId: 'Asia/Tokyo',
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));

const shot = async (name, full = false) => {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${theme}-${name}.png`, fullPage: full });
  console.log('shot', name);
};

const go = async (hash) => {
  await page.goto(`${BASE}#${hash}`);
  await page.waitForLoadState('networkidle');
};

// オンボーディング
await go('/onboarding');
await shot('01-onboarding');
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'つぎへ' }).click();
await page.waitForTimeout(400);
for (const t of ['採らない・触らない・餌をあげない', '希少な生き物の場所を広めない', '夜の林道はゆっくり走る']) {
  await page.getByText(t).click();
}
await page.getByPlaceholder('例：しまのりす').fill('しまのりす');
await shot('02-pledge');
await page.getByRole('button', { name: '約束してはじめる' }).click();

// サンプル記録をいくつか投入（写真は canvas で生成）
await page.evaluate(async () => {
  const mk = async (hue) => {
    const c = document.createElement('canvas');
    c.width = 800; c.height = 1000;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 800, 1000);
    grad.addColorStop(0, `hsl(${hue} 45% 32%)`);
    grad.addColorStop(1, `hsl(${hue + 40} 50% 18%)`);
    g.fillStyle = grad; g.fillRect(0, 0, 800, 1000);
    g.fillStyle = 'rgba(255,255,255,.12)';
    for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(Math.random()*800, Math.random()*1000, 20+Math.random()*90, 0, 7); g.fill(); }
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8));
  };
  const items = [
    ['rurikakesu', 'ルリちゃん', 'amami', 220, 2],
    ['kurosagi', 'クロすけ', 'tatsugo', 200, 5],
    ['amami-kurousagi', 'クロ丸', 'yamato', 30, 9],
    ['hikagehego', '', 'amami', 120, 12],
    ['ryukyu-konohazuku', 'コホッ', 'uken', 260, 20],
  ];
  const now = Date.now();
  const blobs = [];
  for (const it of items) blobs.push(await mk(it[3]));
  const req = indexedDB.open('amami-nature', 1);
  const db = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
  const tx = db.transaction(['sightings', 'photos'], 'readwrite');
  for (const [i, [sp, nick, area, , hoursAgo]] of items.entries()) {
    const blob = blobs[i];
    const id = crypto.randomUUID();
    tx.objectStore('photos').put({ id, full: blob, thumb: blob, width: 800, height: 1000 });
    tx.objectStore('sightings').put({
      id: crypto.randomUUID(), speciesId: sp, nickname: nick, memo: '', observedAt: new Date(now - hoursAgo * 3600e3).toISOString(),
      createdAt: new Date().toISOString(), areaId: area, lat: null, lng: null, locationProtected: false, photoId: id, kind: 'photo',
    });
  }
  await new Promise((r) => (tx.oncomplete = r));
});
await page.reload();
await page.waitForLoadState('networkidle');
await shot('03-home');
await shot('03-home-full', true);
await go('/zukan');
await shot('04-zukan');
await go('/species/rurikakesu');
await shot('05-species-found', true);
await go('/species/ootoratsugumi');
await shot('06-species-missing');
await go('/capture');
await shot('07-capture');
await go('/capture?mode=road');
await page.getByText('交通事故にあった生き物').click();
await shot('08-road');
await go('/explore');
await shot('09-explore');
await go('/explore?tab=stamps');
await shot('10-stamps');
await go('/me');
await shot('11-me', true);
await go('/plus');
await shot('12-plus');
await go('/rewards');
await shot('13-rewards');
await go('/safe-drive');
await shot('14-safedrive');
await go('/partners');
await shot('15-partners', true);
await browser.close();
