// 配色のコントラスト検査（docs/DESIGN_SYSTEM.md §2.2・§12.3）
// 使い方: npm run contrast
//
// src/styles/index.css の :root（ライト）と :root[data-theme='dark']（夜の森）から --c-* を読み、
// 文字と面の組み合わせが WCAG 2.x の基準（文字 4.5:1、UI 部品・細いバー 3:1）を満たすか確かめる。
// あわせて src/styles/palette.ts（canvas 用の 16 進数）が index.css と同じ値かも確かめる。
// 1 つでも満たさなければ終了コード 1。
import { readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const css = await readFile(new URL('src/styles/index.css', ROOT), 'utf8');
const paletteSrc = await readFile(new URL('src/styles/palette.ts', ROOT), 'utf8');

/** `selector {` から対応する `}` までを取り出す */
function block(src, selector) {
  const start = src.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`index.css に ${selector} がありません`);
  const end = src.indexOf('\n}', start);
  return src.slice(start, end);
}

function tokens(text) {
  const out = {};
  for (const m of text.matchAll(/--c-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) out[m[1]] = [+m[2], +m[3], +m[4]];
  return out;
}

const light = tokens(block(css, ':root'));
// ダークで書き換えないトークン（line-green など）はライトの値を引き継ぐ
const dark = { ...light, ...tokens(block(css, ":root[data-theme='dark']")) };

const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const hex = ([r, g, b]) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0').toUpperCase()).join('');

const TEXT = ['fg', 'fg-2', 'fg-3', 'brand', 'success', 'warning', 'danger', 'legend'];
const checks = [];
for (const [theme, t] of [
  ['light', light],
  ['dark', dark],
]) {
  const grounds = theme === 'dark' ? ['page', 'surface', 'fill'] : ['page', 'fill'];
  for (const fg of TEXT) for (const bg of grounds) checks.push({ theme, fg, bg, min: 4.5, t });
  checks.push({ theme, fg: 'on-brand', bg: 'brand-fill', min: 4.5, t });
  checks.push({ theme, fg: 'on-brand', bg: 'brand-pressed', min: 4.5, t });
  checks.push({ theme, fg: 'on-danger', bg: 'danger', min: 4.5, t });
  checks.push({ theme, fg: 'toast-fg', bg: 'toast', min: 4.5, t });
  // UI 部品（記録ボタンなど）とページ、細いバー（進捗・季節）と溝は 3:1
  checks.push({ theme, fg: 'brand-fill', bg: 'page', min: 3, t, note: 'UI 部品' });
  checks.push({ theme, fg: 'brand', bg: 'fill', min: 3, t, note: '細いバー' });
}

let failed = 0;
const rows = [];
for (const c of checks) {
  const a = c.t[c.fg];
  const b = c.t[c.bg];
  if (!a || !b) {
    failed++;
    rows.push([c.theme, `${c.fg} / ${c.bg}`, '—', `≥${c.min}`, 'NG（トークンがありません）']);
    continue;
  }
  const r = ratio(a, b);
  const ok = r >= c.min;
  if (!ok) failed++;
  rows.push([c.theme, `${c.fg} / ${c.bg}`, `${r.toFixed(2)}:1`, `≥${c.min}`, `${ok ? 'OK' : 'NG'}${c.note ? `（${c.note}）` : ''}`, `${hex(a)} on ${hex(b)}`]);
}

// palette.ts が index.css と同じ値か
function paletteObject(name) {
  const start = paletteSrc.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`palette.ts に ${name} がありません`);
  const body = paletteSrc.slice(start, paletteSrc.indexOf('};', start));
  return Object.fromEntries([...body.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2].toUpperCase()]));
}
const camel = (s) => s.replace(/-(\w)/g, (_, ch) => ch.toUpperCase());
const mismatches = [];
for (const [name, t] of [
  ['LIGHT', light],
  ['DARK', dark],
]) {
  const p = paletteObject(name);
  for (const [k, rgb] of Object.entries(t)) {
    const key = camel(k);
    if (p[key] !== hex(rgb)) mismatches.push(`${name}.${key}: palette.ts ${p[key] ?? '（なし）'} / index.css ${hex(rgb)}`);
  }
  for (const key of Object.keys(p)) {
    if (!Object.keys(t).some((k) => camel(k) === key)) mismatches.push(`${name}.${key}: index.css に --c-* がありません`);
  }
}
// 素材（--mat-*）の色の並び
function cssHexList(selector, prop) {
  const m = block(css, selector).match(new RegExp(`--mat-${prop}:([^;]+);`));
  return m ? [...m[1].matchAll(/#[0-9a-fA-F]{6}/g)].map((x) => x[0].toUpperCase()) : [];
}
function paletteHexList(theme, prop) {
  const start = paletteSrc.indexOf('export const MATERIALS');
  const tStart = paletteSrc.indexOf(`${theme}: {`, start);
  const pStart = paletteSrc.indexOf(`${prop}:`, tStart);
  const pEnd = prop === 'dorozome' ? paletteSrc.indexOf('\n', pStart) : paletteSrc.indexOf('],\n    },', pStart);
  return [...paletteSrc.slice(pStart, pEnd).matchAll(/#[0-9a-fA-F]{6}/g)].map((x) => x[0].toUpperCase());
}
for (const [theme, selector] of [
  ['light', ':root'],
  ['dark', ":root[data-theme='dark']"],
]) {
  for (const prop of ['dorozome', 'yakougai', 'kinpaku']) {
    const a = cssHexList(selector, prop).join(' ');
    const b = paletteHexList(theme, prop).join(' ');
    if (a !== b) mismatches.push(`MATERIALS.${theme}.${prop}: palette.ts [${b}] / index.css [${a}]`);
  }
}

const w = [6, 26, 9, 5, 20];
console.log(['テーマ', '文字 / 面', '比', '基準', '結果'].map((s, i) => s.padEnd(w[i])).join(' '), '色');
for (const r of rows) console.log(r.slice(0, 5).map((s, i) => String(s).padEnd(w[i])).join(' '), r[5] ?? '');
console.log('');
if (mismatches.length) {
  console.log('palette.ts と index.css の値が違います:');
  for (const m of mismatches) console.log('  ' + m);
} else {
  console.log('palette.ts は index.css と一致しています。');
}
console.log('');
if (failed || mismatches.length) {
  console.error(`NG: コントラスト不足 ${failed} 件、値の不一致 ${mismatches.length} 件`);
  process.exit(1);
}
console.log(`OK: ${checks.length} 組すべて基準を満たしています。`);
