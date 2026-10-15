// ドット絵の枠（ピクセルフレーム）を作る（docs/DESIGN_SYSTEM.md §4）
// 使い方: npm run frames（src/styles/pixel-frames.css を書き出す）／ npm run frames -- --check（最新か確かめる）
//
// 枠は「ドット絵の小さな箱」を文字で描き、CSS の border-image（9 分割）で引き伸ばして使う。
// 色は src/styles/index.css の --c-*（ひるの島・よるの森）から読み、テーマごとに SVG を作って CSS 変数に入れる。
// 角の段々・二重の線・下の厚み（押すと沈む）を、1 ドット = U px で描く。
import { readFile, writeFile } from 'node:fs/promises';
import { CLIPS, FRAMES, U } from './pixel-frames.config.mjs';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('src/styles/pixel-frames.css', ROOT);
const css = await readFile(new URL('src/styles/index.css', ROOT), 'utf8');

function block(src, selector) {
  const start = src.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`index.css に ${selector} がありません`);
  return src.slice(start, src.indexOf('\n}', start));
}
function tokens(text) {
  const out = {};
  for (const m of text.matchAll(/--c-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) out[m[1]] = `rgb(${m[2]},${m[3]},${m[4]})`;
  return out;
}
const light = tokens(block(css, ':root'));
const THEMES = { light, dark: { ...light, ...tokens(block(css, ":root[data-theme='dark']")) } };

/** 色の指定（トークン名・#16進数・rgba()・{ light, dark }）をテーマの色にする */
function resolve(spec, theme) {
  if (spec && typeof spec === 'object') return resolve(spec[theme], theme);
  if (typeof spec !== 'string') throw new Error(`色の指定が正しくありません: ${JSON.stringify(spec)}`);
  if (spec.startsWith('#') || spec.startsWith('rgb')) return spec;
  // 'type-bird*0.6' はトークンの色を暗くする（線・厚みの色）
  if (spec.includes('*')) {
    const [name, k] = spec.split('*');
    const [r, g, b] = resolve(name, theme).match(/\d+/g).map(Number);
    return `rgb(${[r, g, b].map((c) => Math.round(c * Number(k))).join(',')})`;
  }
  // 'danger/0.5' はトークンの色に透明度をつける
  const [name, alpha] = spec.split('/');
  if (alpha) return resolve(name, theme).replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  const c = THEMES[theme][spec];
  if (!c) throw new Error(`index.css に --c-${spec} がありません`);
  return c;
}

/** 文字の絵を SVG にする（横に続く同じ色はまとめて 1 つの rect に） */
function svg(art, colors, theme, unit) {
  const h = art.length;
  const w = art[0].length;
  const rects = [];
  art.forEach((row, y) => {
    if (row.length !== w) throw new Error(`行の長さがそろっていません: "${row}"`);
    let x = 0;
    while (x < w) {
      const ch = row[x];
      let end = x + 1;
      while (end < w && row[end] === ch) end++;
      if (ch !== '.') {
        if (!(ch in colors)) throw new Error(`色が決まっていない文字 "${ch}"`);
        rects.push(`<rect x="${x * unit}" y="${y * unit}" width="${(end - x) * unit}" height="${unit}" fill="${resolve(colors[ch], theme)}"/>`);
      }
      x = end;
    }
  });
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * unit}" height="${h * unit}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  return `url("data:image/svg+xml,${body.replace(/"/g, "'").replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
}

/** 絵の大きさから 9 分割の幅を決める。mid は引き伸ばす列と行（[列, 行]） */
function geometry(f) {
  const unit = f.unit ?? U;
  const h = f.art.length;
  const w = f.art[0].length;
  const [mc, mr] = f.mid;
  const lip = f.lip ?? 0;
  const slice = { top: mr, right: w - mc - 1, bottom: h - mr - 1, left: mc };
  // 下の厚み（lip）は箱の外に描く（outset）。レイアウトの枠の太さは厚みを除いた分
  const border = f.border ?? { top: slice.top, right: slice.right, bottom: slice.bottom - lip, left: slice.left };
  return { unit, slice, border, lip };
}

const px = (n, unit) => `${n * unit}px`;
const sides = (o, unit) => [o.top, o.right, o.bottom, o.left].map((n) => (unit ? px(n, unit) : n)).join(' ');

const vars = { light: [], dark: [] };
const rules = [];
for (const [name, f] of Object.entries(FRAMES)) {
  const { unit, slice, border, lip } = geometry(f);
  for (const theme of ['light', 'dark']) {
    vars[theme].push(`  --pf-${name}: ${svg(f.art, f.colors, theme, unit)};`);
    if (f.pressed) vars[theme].push(`  --pf-${name}-p: ${svg(f.pressed, f.colors, theme, unit)};`);
  }
  const sliceNums = [slice.top, slice.right, slice.bottom, slice.left].map((n) => n * unit).join(' ');
  const outset = { top: 0, right: 0, bottom: lip, left: 0 };
  const sel = [`.px-${name}`, ...(f.alias ?? [])];
  rules.push(
    `/* ${f.note ?? name} */`,
    `${sel.join(',\n')} {`,
    `  border-style: solid;`,
    `  border-color: transparent;`,
    `  border-width: ${sides(border, unit)};`,
    `  border-image: var(--pf-${name}) ${sliceNums}${f.fill === false ? '' : ' fill'} / ${sides(slice, unit)} / ${sides(outset, unit)} stretch;`,
    `  border-radius: 0;`,
    `  background-clip: padding-box;`,
    f.fill === false ? null : `  background-color: transparent;`,
    `}`,
  );
  if (f.pressed)
    rules.push(
      `${sel.map((x) => `${x}.pressable:active,\n${x}[data-pressed]`).join(',\n')} {`,
      `  border-image-source: var(--pf-${name}-p);`,
      `  transform: translateY(${px(lip, unit)});`,
      `  box-shadow: none;`,
      `}`,
    );
}

/** 角の段々（[2, 1] など）を clip-path の多角形にする。左上から時計回り */
function clipPolygon(profile, unit) {
  const n = profile.length;
  const tl = [[0, n * unit]];
  for (let i = n - 1; i >= 0; i--) tl.push([profile[i] * unit, (i + 1) * unit], [profile[i] * unit, i * unit]);
  const X = (x, flip) => (flip ? (x ? `calc(100% - ${x}px)` : '100%') : `${x}px`);
  const Y = X;
  const pts = [
    ...tl.map(([x, y]) => [X(x), Y(y)]),
    ...[...tl].reverse().map(([x, y]) => [X(x, true), Y(y)]),
    ...tl.map(([x, y]) => [X(x, true), Y(y, true)]),
    ...[...tl].reverse().map(([x, y]) => [X(x), Y(y, true)]),
  ];
  return `polygon(${pts.map(([x, y]) => `${x} ${y}`).join(', ')})`;
}
for (const [name, profile] of Object.entries(CLIPS)) rules.push(`.px-${name} {`, `  clip-path: ${clipPolygon(profile, U)};`, `  border-radius: 0;`, `}`);

const out = [
  '/* このファイルは scripts/build-pixel-frames.mjs が作る。手で直さず `npm run frames` で作り直す */',
  '/* 枠の絵は scripts/pixel-frames.config.mjs、色は src/styles/index.css の --c-* */',
  ':root {',
  ...vars.light,
  '}',
  ":root[data-theme='dark'] {",
  ...vars.dark,
  '}',
  ...rules.filter((l) => l !== null),
  '',
].join('\n');

if (process.argv.includes('--check')) {
  const now = await readFile(OUT, 'utf8').catch(() => '');
  if (now !== out) {
    console.error('src/styles/pixel-frames.css が古いです。`npm run frames` で作り直してください');
    process.exit(1);
  }
  console.log('pixel-frames.css は最新です。');
} else {
  await writeFile(OUT, out);
  console.log(`pixel-frames.css を書き出しました（${Object.keys(FRAMES).length} 種類の枠）`);
}
