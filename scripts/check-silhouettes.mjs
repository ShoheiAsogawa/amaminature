#!/usr/bin/env node
/**
 * 種のシルエット（src/art/sil/*.svg）が docs/SILHOUETTE_LIST.md の共通仕様どおりか確かめる。
 * 使い方: npm run check:sil
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const silDir = join(root, 'src/art/sil');
const ids = [...readFileSync(join(root, 'src/data/species.ts'), 'utf8').matchAll(/^\s{4}id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]);

let files = [];
try {
  files = readdirSync(silDir).filter((f) => f.endsWith('.svg'));
} catch {
  // まだ 1 点も納品されていない
}

const problems = [];
for (const file of files) {
  const id = file.replace(/\.svg$/, '');
  const svg = readFileSync(join(silDir, file), 'utf8');
  const bad = (msg) => problems.push(`${file}: ${msg}`);
  if (!ids.includes(id)) bad('種の ID と一致しない（src/data/species.ts の id を使う）');
  if (!/viewBox=["']0 0 100 100["']/.test(svg)) bad('viewBox が "0 0 100 100" でない');
  if (/<svg[^>]*\s(width|height)=/.test(svg)) bad('width・height を付けない');
  const paths = svg.match(/<path\b/g) ?? [];
  if (paths.length !== 1) bad(`<path> が ${paths.length} 個（1 つだけにする）`);
  if (!/fill=["']currentColor["']/.test(svg)) bad('fill="currentColor" がない');
  for (const tag of ['text', 'image', 'style', 'linearGradient', 'radialGradient', 'clipPath', 'mask', 'g', 'circle', 'rect', 'ellipse', 'polygon']) {
    if (new RegExp(`<${tag}\\b`).test(svg)) bad(`<${tag}> は使わない（<path> 1 つにまとめる）`);
  }
  if (/\bstroke=/.test(svg) && !/\bstroke=["']none["']/.test(svg)) bad('線（stroke）は使わない');
  if (/\btransform=/.test(svg)) bad('transform は使わない（座標に反映する）');
  const kb = statSync(join(silDir, file)).size / 1024;
  if (kb > 8) bad(`${kb.toFixed(1)}KB（8KB 以下にする）`);
}

const done = files.filter((f) => ids.includes(f.replace(/\.svg$/, ''))).length;
console.log(`シルエット ${done} / ${ids.length} 点`);
if (problems.length) {
  console.error(problems.map((p) => `  ✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log('形式の問題はありません');
