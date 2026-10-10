// 主要画面のスクリーンショットを撮って見た目を確認する（DEMO_BUILD の preview を対象）
// 使い方: npm run build:demo && npx vite preview --outDir dist-demo --port 4173 & node scripts/screenshots.mjs
//   THEME=dark で夜の森（prefers-color-scheme: dark）。OUT_DIR で保存先、BASE_URL で対象、PW_CHROMIUM でブラウザを指定。
//
// docs/DESIGN_SYSTEM.md §13.2 の「画面の検査」用。390×844 の全画面をライトとダークで撮り、目で確認する。
// 横スクロールが出た画面は「OVERFLOW」と表示する（撮影は続ける）。
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
let problems = 0;
page.on('pageerror', (e) => {
  problems++;
  console.error('PAGEERROR', e.message);
});
page.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));

const shot = async (name, full = false) => {
  await page.waitForTimeout(900);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 0) {
    problems++;
    console.error(`OVERFLOW ${name}: ${overflow}px`);
  }
  await page.screenshot({ path: `${OUT}/${theme}-${name}.png`, fullPage: full });
  console.log('shot', name);
};

const go = async (hash) => {
  await page.goto(`${BASE}#${hash}`);
  await page.waitForLoadState('networkidle');
};

/** シートを閉じる（右上の閉じるボタン） */
const closeSheet = async () => {
  await page.getByRole('button', { name: '閉じる' }).last().click();
  await page.waitForTimeout(500);
};

// オンボーディング（3 ページ → 3つの約束）
await go('/onboarding');
await shot('01-onboarding');
for (let i = 0; i < 2; i++) await page.getByRole('button', { name: '次へ' }).click();
await page.waitForTimeout(500);
await shot('01b-onboarding-last');
await page.getByRole('button', { name: 'はじめる', exact: true }).click();
await page.waitForTimeout(400);
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

// 図鑑（一覧 → 表示の条件のシート）
await go('/zukan');
await shot('04-zukan');
await page.getByRole('button', { name: /^表示の条件/ }).click();
await shot('04b-zukan-filter');
await closeSheet();

// 種詳細（記録済み・未発見）
await go('/species/rurikakesu');
await shot('05-species-found', true);
await go('/species/ootoratsugumi');
await shot('06-species-missing');

// 記録詳細（ホームの「最近の記録」の先頭から）
await go('/');
await page.locator('a[href*="/sighting/"]').first().click();
await page.waitForLoadState('networkidle');
await shot('06b-sighting', true);

// 記録（1 写真の舞台）と路上レポート
await go('/capture');
await shot('07-capture');
await go('/capture?mode=road');
await page.getByText('交通事故にあった生き物').click();
await shot('08-road');

// 体験（体験 / スタンプ / マナー）
await go('/explore');
await shot('09-explore', true);
await go('/explore?tab=stamps');
await shot('10-stamps', true);
await go('/explore?tab=manner');
await shot('10b-manner', true);

// マイページ（全体 → バッジのシート）
await go('/me');
await shot('11-me', true);
await page.getByRole('button', { name: 'すべて見る' }).first().click();
await shot('11b-me-badges');
await closeSheet();

await go('/plus');
await shot('12-plus', true);
await go('/rewards');
await shot('13-rewards', true);
await go('/safe-drive');
await shot('14-safedrive');
await go('/partners');
await shot('15-partners', true);

// 記録の流れを通しで（写真 → 名前 → 記録 → 図鑑カードの演出）。最後に撮るのは記録が 1 件増えるため
const photo = await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 800; c.height = 1000;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 800, 1000);
  grad.addColorStop(0, 'hsl(210 50% 40%)');
  grad.addColorStop(1, 'hsl(160 45% 22%)');
  g.fillStyle = grad; g.fillRect(0, 0, 800, 1000);
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
});
await go('/capture');
await page.locator('input[type=file]:not([capture])').setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(photo, 'base64') });
await shot('16-capture-preview');
await page.getByRole('button', { name: 'この写真で進む' }).click();
await page.getByText('名前を選ぶ').waitFor();
await shot('17-capture-name');
await page.getByLabel('生き物の名前で探す').fill('あかしょうびん');
await page.getByRole('button', { name: /リュウキュウアカショウビン/ }).first().click();
await page.getByText('ニックネーム', { exact: true }).waitFor();
await shot('18-capture-details');
await page.getByRole('button', { name: '図鑑に記録する' }).click();
await page.getByText('図鑑に登録しました').waitFor();
await page.waitForTimeout(1200);
await shot('19-reveal');

await browser.close();
if (problems) {
  console.error(`\n${problems} problem(s) found`);
  process.exit(1);
}
