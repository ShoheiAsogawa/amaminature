// 撮影→名前→記録→カード演出→サーバー同期 までをブラウザで通しで確認する E2E
//
// 前提: `npm run build && npm run dev:worker`（.dev.vars の SESSION_SECRET を使用）
// 使い方: node scripts/e2e-capture.mjs [http://127.0.0.1:8787]
import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import { createHmac } from 'node:crypto';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787';
const OUT = process.env.OUT_DIR ?? 'screenshots';
await mkdir(OUT, { recursive: true });

const vars = Object.fromEntries(
  (await readFile('.dev.vars', 'utf8'))
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const b64url = (s) => Buffer.from(s).toString('base64url');
const userId = `Ue2e${Date.now()}`;
const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = b64url(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 }));
const sig = createHmac('sha256', vars.SESSION_SECRET).update(`${header}.${payload}`).digest('base64url');
const session = `${header}.${payload}.${sig}`;

let failures = 0;
const check = (name, cond, detail = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : `  ${detail}`}`);
  if (!cond) failures++;
};

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
const errors = [];

// テスト用の写真（JPEG）をブラウザで作る
const maker = await ctx.newPage();
// 実行ごとに中身を変える（サーバーの重複写真チェックにかからないように）
await maker.setContent(
  `<body style="margin:0;width:800px;height:1000px;background:linear-gradient(160deg,#2A4FA3,#8A4B2A);color:#fff;font:40px sans-serif"><p style="padding:40px">${Date.now()}-${Math.random()}</p></body>`,
);
await maker.setViewportSize({ width: 800, height: 1000 });
const photoPath = `${OUT}/e2e-photo.jpg`;
await maker.screenshot({ path: photoPath, type: 'jpeg', quality: 85 });
await maker.close();

await ctx.addInitScript(
  ([token]) => {
    localStorage.setItem('amami-nature:session', token);
    localStorage.setItem(
      'amami-nature:settings',
      JSON.stringify({ theme: 'light', name: 'E2E', onboarded: true, pledged: true, plus: null, safeDriveDates: [], redemptions: [] }),
    );
  },
  [session],
);
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => ['warning', 'error'].includes(m.type()) && console.log('  [browser]', m.text()));

await page.goto(`${BASE}/capture`);
await page.waitForLoadState('networkidle');
await page.locator('input[type=file]:not([capture])').setInputFiles(photoPath);
// 1 写真: 選んだ写真を舞台に出し、［この写真で進む］で 2 名前へ
await page.getByRole('button', { name: 'この写真で進む' }).click();
await page.getByText('なにを見ましたか？').waitFor();
check('photo accepted → identify step', true);

await page.getByLabel('生き物の名前で探す').fill('るりかけす');
await page.getByRole('button', { name: /ルリカケス/ }).first().click();
await page.getByText('ニックネーム', { exact: true }).waitFor();
await page.getByPlaceholder(/例：/).first().fill('ルリ太郎');
await page.getByLabel('地域').selectOption('tatsugo');
await page.screenshot({ path: `${OUT}/e2e-details.png` });
await page.getByRole('button', { name: '図鑑に記録する' }).click();

await page.getByText('図鑑に登録しました').waitFor();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${OUT}/e2e-reveal.png` });
check('card reveal shown', await page.getByText('「ルリ太郎」').isVisible());
check('reveal shows +30pt', await page.getByText('+30pt').isVisible());
// バッジ獲得は閉じる操作（続けて記録）の後に、同じ舞台で 1 つずつ出る（§8.5）。［OK］で次へ進む
await page.getByRole('button', { name: '続けて記録' }).click();
const ok = page.getByRole('button', { name: 'OK' });
await ok.waitFor();
let ruriShown = false;
for (let i = 0; i < 8 && (await ok.isVisible().catch(() => false)); i++) {
  if (await page.getByText('瑠璃の使者').isVisible()) {
    ruriShown = true;
    await page.screenshot({ path: `${OUT}/e2e-badge.png` });
  }
  await ok.click();
  await page.waitForTimeout(300);
}
check('badge shown after closing the reveal', ruriShown);

// サーバー同期を確認
let synced = null;
for (let i = 0; i < 20 && !synced; i++) {
  await page.waitForTimeout(500);
  const res = await fetch(`${BASE}/api/sightings`, { headers: { Authorization: `Bearer ${session}` } });
  synced = (await res.json()).sightings?.find((s) => s.speciesId === 'rurikakesu');
}
check('sighting synced to server', !!synced && synced.nickname === 'ルリ太郎' && synced.areaId === 'tatsugo', JSON.stringify(synced));
check('photo uploaded to R2', synced?.hasPhoto === true);
const me = await (await fetch(`${BASE}/api/me`, { headers: { Authorization: `Bearer ${session}` } })).json();
check('server points match (30pt)', me.points === 30, JSON.stringify(me));

// 別端末を想定：ローカルDBが空の状態でもサーバーから取り込める
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
await ctx2.addInitScript(
  ([token]) => {
    localStorage.setItem('amami-nature:session', token);
    localStorage.setItem('amami-nature:settings', JSON.stringify({ theme: 'light', name: 'E2E', onboarded: true, pledged: true }));
  },
  [session],
);
const page2 = await ctx2.newPage();
await page2.goto(`${BASE}/zukan?c=bird`);
await page2.waitForLoadState('networkidle');
await page2.waitForTimeout(1500);
check('second device pulls the record', (await page2.getByText('1/19').count()) > 0);
await page2.goto(`${BASE}/species/rurikakesu`);
await page2.waitForTimeout(1500);
const imgOk = await page2.locator('img[alt="ルリカケス"]').first().evaluate((el) => el.complete && el.naturalWidth > 0).catch(() => false);
check('second device loads the photo from R2', imgOk);
await page2.screenshot({ path: `${OUT}/e2e-second-device.png` });

check('no page errors', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
