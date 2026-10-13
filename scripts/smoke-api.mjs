// ローカルの Worker（`npm run dev:worker`、.dev.vars で DEV_AUTH=true）に対するAPIスモークテスト
// 使い方: node scripts/smoke-api.mjs [http://127.0.0.1:8787]
import { createHmac, randomUUID } from 'node:crypto';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8787';
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? 'dev-channel-secret';
const PARTNER_KEY = process.env.PARTNER_KEY ?? 'test-partner-key';
const user = `Udev${Date.now()}`;
const RUN = Date.now() % 251; // 実行ごとに写真のバイト列（ハッシュ）を変える
const H = { Authorization: `Dev ${user}` };
let failures = 0;

function check(name, cond, detail = '') {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : `  ${detail}`}`);
  if (!cond) failures++;
}

async function call(method, path, { body, headers = {}, form } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...H, ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const type = res.headers.get('content-type') ?? '';
  return { status: res.status, data: type.includes('json') ? await res.json() : await res.arrayBuffer() };
}

function jpeg(seed) {
  // 最小のJPEGではなく、ハッシュが変わるだけのダミーバイト列（サーバーは中身を解釈しない）
  const bytes = new Uint8Array(2048).map((_, i) => (i * 31 + seed * 7 + RUN * 13 + (i % 97) * RUN) % 256);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  return new Blob([bytes], { type: 'image/jpeg' });
}

function sightingForm(meta, photoSeed) {
  const f = new FormData();
  f.set('meta', JSON.stringify(meta));
  if (photoSeed != null) {
    f.set('photo', jpeg(photoSeed), 'p.jpg');
    f.set('thumb', jpeg(photoSeed + 1), 't.jpg');
  }
  return f;
}

const now = new Date().toISOString();
const base = { nickname: 'テスト', memo: '', observedAt: now, createdAt: now, areaId: 'yamato', kind: 'photo', locationProtected: false };

// 認証
check('401 without auth', (await fetch(`${BASE}/api/me`)).status === 401);
const me0 = await call('GET', '/api/me');
check('GET /api/me', me0.status === 200 && me0.data.points === 0, JSON.stringify(me0.data));

// 記録（一般種：座標は約100mに丸める）
const s1 = randomUUID();
const r1 = await call('POST', '/api/sightings', { form: sightingForm({ ...base, id: s1, speciesId: 'kurosagi', lat: 28.123456, lng: 129.456789 }, 1) });
check('POST sighting (kurosagi)', r1.status === 200 && r1.data.points === 10, JSON.stringify(r1.data));

// 希少種：クライアントが座標を送ってきてもサーバーが捨てる
const s2 = randomUUID();
const r2 = await call('POST', '/api/sightings', { form: sightingForm({ ...base, id: s2, speciesId: 'amami-kurousagi', lat: 28.3, lng: 129.4 }, 10) });
check('POST sighting (sensitive)', r2.status === 200 && r2.data.points === 90, JSON.stringify(r2.data));

const list = await call('GET', '/api/sightings');
const k = list.data.sightings?.find((x) => x.id === s1);
const r = list.data.sightings?.find((x) => x.id === s2);
check('rounds normal coords', k?.lat === 28.123 && k?.lng === 129.457, JSON.stringify(k));
check('strips sensitive coords', r?.lat === null && r?.lng === null && r?.locationProtected === true, JSON.stringify(r));
check('hasPhoto flag', k?.hasPhoto === true);

// 写真の取得（本人のみ）
const photo = await call('GET', `/api/photos/${s1}?size=thumb`);
check('GET own photo', photo.status === 200 && photo.data.byteLength === 2048);
const other = await call('GET', `/api/photos/${s1}?size=thumb`, { headers: { Authorization: 'Dev Uother' } });
check('cannot read others photo', other.status === 404);

// 同じ写真の使い回しは拒否
const dup = await call('POST', '/api/sightings', { form: sightingForm({ ...base, id: randomUUID(), speciesId: 'rurikakesu' }, 1) });
check('duplicate photo → 409', dup.status === 409 && dup.data.error === 'duplicate_photo', JSON.stringify(dup.data));

// 不正な入力
const bad = await call('POST', '/api/sightings', { form: sightingForm({ ...base, id: randomUUID(), speciesId: 'godzilla' }) });
check('unknown species → 400', bad.status === 400);
const future = await call('POST', '/api/sightings', {
  form: sightingForm({ ...base, id: randomUUID(), speciesId: 'mejiro', observedAt: new Date(Date.now() + 5 * 86400000).toISOString() }),
});
check('future date → 400', future.status === 400);

// 他人の記録は上書きできない
const hijack = await call('POST', '/api/sightings', { form: sightingForm({ ...base, id: s1, speciesId: 'mejiro' }), headers: { Authorization: 'Dev Uother' } });
check('cannot overwrite others sighting', hijack.status === 403);

// ロードキル報告（正確な位置は road_reports にだけ保存）
const s3 = randomUUID();
const r3 = await call('POST', '/api/sightings', {
  form: sightingForm({ ...base, id: s3, speciesId: 'amami-kurousagi', roadReport: 'roadkill', reportLat: 28.3512, reportLng: 129.3821, nickname: 'x' }, 20),
});
check('POST road report (+20)', r3.status === 200 && r3.data.points === 110, JSON.stringify(r3.data));

// セーフドライブ（1日1回）
const d1 = await call('POST', '/api/safe-drive', { body: {} });
const d2 = await call('POST', '/api/safe-drive', { body: {} });
check('safe drive once per day', d1.data.alreadyDeclared === false && d2.data.alreadyDeclared === true && d2.data.points === 120, JSON.stringify(d2.data));

// ポイント交換：残高チェック・バッジ条件
const r4 = await call('POST', '/api/redeem', { body: { rewardId: 'tour-coupon' } });
check('redeem insufficient → 409', r4.status === 409, JSON.stringify(r4.data));
const r5 = await call('POST', '/api/redeem', { body: { rewardId: 'pin-badge' } });
check('redeem badge-gated → 403', r5.status === 403, JSON.stringify(r5.data));
const r6 = await call('POST', '/api/redeem', { body: { rewardId: 'donate' } });
check('redeem donate (100pt)', r6.status === 200 && r6.data.balance === 20, JSON.stringify(r6.data));

// AI判定の回数制限（APIキー未設定でも上限チェックは先に効く）
const ai = await call('POST', '/api/identify', { body: { image: 'AAAA', month: 10 } });
check('identify: model result, or 503 when no API key', ai.status === 200 || (ai.status === 503 && ai.data.error === 'ai_unavailable'), `${ai.status} ${JSON.stringify(ai.data)}`);

// 提携先API（正確な位置つき）
const p0 = await fetch(`${BASE}/api/partner/summary`, { headers: { 'X-Partner-Key': 'wrong' } });
check('partner wrong key → 401', p0.status === 401);
const p1 = await (await fetch(`${BASE}/api/partner/summary`, { headers: { 'X-Partner-Key': PARTNER_KEY } })).json();
const rr = p1.roadReports?.find((x) => x.id === s3);
check('partner sees precise road report', rr?.lat === 28.3512 && rr?.lng === 129.3821, JSON.stringify(rr));
check('partner byHour has 24 bins', p1.byHour?.length === 24);
check('partner byArea counts yamato', p1.byArea?.find((a) => a.areaId === 'yamato')?.sightings >= 3, JSON.stringify(p1.byArea?.slice(0, 3)));

// 共有カード（公開URL）
const sf = new FormData();
sf.set('image', jpeg(99), 'card.jpg');
const share = await call('POST', '/api/shares', { form: sf });
check('POST share', share.status === 200 && /\/s\/[0-9a-f-]{36}\.jpg$/.test(share.data.url), JSON.stringify(share.data));
if (share.data.url) {
  const pub = await fetch(`${BASE}/s/${share.data.url.split('/s/')[1]}`);
  check('GET public share image', pub.status === 200);
}

// 運営の管理画面 API（.dev.vars の ADMIN_KEY_SHA256 に対応するキー）
const ADMIN_KEY = process.env.ADMIN_KEY ?? 'dev-admin-key-0123456789abcdef';
const admin = (method, path, body) =>
  fetch(`${BASE}/api/admin${path}`, {
    method,
    headers: { 'X-Admin-Key': ADMIN_KEY, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, data: (r.headers.get('content-type') ?? '').includes('json') ? await r.json() : null }));
const a0 = await fetch(`${BASE}/api/admin/summary`, { headers: { 'X-Admin-Key': 'wrong-key-wrong-key-wrong-key' } });
check('admin wrong key → 401', a0.status === 401);
const a1 = await admin('GET', '/summary');
check('admin summary', a1.status === 200 && a1.data.daily?.length === 14 && a1.data.users.total >= 1, JSON.stringify(a1.data).slice(0, 200));
const before = (await call('GET', '/api/me')).data;
const a2 = await admin('POST', `/sightings/${s2}/revoke`, { reason: '生き物が写っていない' });
const revokedMe = (await call('GET', '/api/me')).data;
const mineAfter = (await call('GET', '/api/sightings')).data.sightings.find((x) => x.id === s2);
check('admin revoke removes the points', a2.status === 200 && revokedMe.points < before.points && mineAfter?.revoked === true, `${before.points} → ${revokedMe.points} ${JSON.stringify(mineAfter)}`);
const a3 = await admin('POST', `/sightings/${s2}/restore`);
check('admin restore gives them back', a3.status === 200 && (await call('GET', '/api/me')).data.points === before.points);
const a4 = await admin('GET', '/redemptions?status=requested');
const mineRedeem = a4.data.redemptions?.find((x) => x.userId === user);
check('admin lists the redemption', a4.status === 200 && mineRedeem?.rewardId === 'donate', JSON.stringify(a4.data).slice(0, 200));
const a5 = await admin('PATCH', `/redemptions/${mineRedeem?.id}`, { status: 'cancelled' });
check('admin cancel returns the points', a5.status === 200 && (await call('GET', '/api/me')).data.balance === before.balance + 100);
const a6 = await admin('PATCH', `/redemptions/${mineRedeem?.id}`, { status: 'bogus' });
check('admin rejects a bad status', a6.status === 400);
const a7 = await admin('GET', '/road-reports?status=all');
const myRoad = a7.data.roadReports?.find((x) => x.id === s3);
check('admin sees the precise road report', myRoad?.lat === 28.3512 && myRoad?.lng === 129.3821, JSON.stringify(myRoad));
const a8 = await admin('PATCH', `/road-reports/${s3}`, { status: 'forwarded' });
check('admin forwards the road report', a8.status === 200);
const a9 = await admin('POST', '/partners', { name: 'スモークテスト', scope: ['yamato'] });
const issued = a9.data.apiKey;
const ps = await fetch(`${BASE}/api/partner/summary`, { headers: { 'X-Partner-Key': issued } });
check('admin-issued partner key works', a9.status === 200 && /^pk_/.test(issued ?? '') && ps.status === 200);
await admin('DELETE', `/partners/${a9.data.partner?.id}`);
const ps2 = await fetch(`${BASE}/api/partner/summary`, { headers: { 'X-Partner-Key': issued } });
check('deleted partner key stops working', ps2.status === 401);
const a10 = await admin('GET', `/users?q=`);
check('admin users list computes points', a10.status === 200 && a10.data.users?.some((u) => u.id === user && u.points === before.points), JSON.stringify(a10.data.users?.find((u) => u.id === user)));
const a11 = await admin('GET', '/actions');
check('admin actions are logged', a11.status === 200 && a11.data.actions?.length >= 4);

// 削除
const del = await call('DELETE', `/api/sightings/${s1}`);
const after = await call('GET', '/api/sightings');
check('DELETE sighting', del.status === 200 && !after.data.sightings.some((x) => x.id === s1));

// LINE Webhook 署名検証
const body = JSON.stringify({ destination: 'x', events: [] });
const sig = createHmac('sha256', CHANNEL_SECRET).update(body).digest('base64');
const w0 = await fetch(`${BASE}/api/line/webhook`, { method: 'POST', body, headers: { 'x-line-signature': 'bad' } });
const w1 = await fetch(`${BASE}/api/line/webhook`, { method: 'POST', body, headers: { 'x-line-signature': sig } });
check('webhook bad signature → 401', w0.status === 401);
check('webhook valid signature → 200', w1.status === 200);

// SPA フォールバック
const spa = await fetch(`${BASE}/species/rurikakesu`);
check('SPA fallback serves index.html', spa.status === 200 && (await spa.text()).includes('<div id="root">'));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
