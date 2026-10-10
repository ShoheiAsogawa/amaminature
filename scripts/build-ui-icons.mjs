// UI アイコンを src/components/icons.tsx に書き出す（DESIGN_SYSTEM.md §5.1）
// 使い方: npm run icons:ui
//
// - Phosphor（MIT）の図案は node_modules/@iconify-json/ph/icons.json（viewBox 256）から必要な分だけ読む。
// - 奄美の独自グリフ（amami:*）は src/icons/amami/*.svg（viewBox 0 0 256 256）から読む。
// - アイコンごとに 1 つのコンポーネントを書き出す。名前は Icon + PascalCase
//   （house-simple-fill → IconHouseSimpleFill、amami:frog → IconAmamiFrog）。
// - 生成されたファイルはコミットする。手で編集しない。
import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const OUT = new URL('src/components/icons.tsx', ROOT);

// §5.1 の一覧。足すときはここに書いて `npm run icons:ui` を実行する。
const ICONS = `
house-simple house-simple-fill book-open-text book-open-text-fill camera-fill compass compass-fill
user-circle user-circle-fill caret-left caret-right caret-down x magnifying-glass sliders-horizontal
share-network pencil-simple trash check check-circle-fill warning warning-circle-fill info circle-notch
arrow-clockwise arrow-counter-clockwise arrow-square-out heart heart-fill dots-three
bird butterfly fish-simple footprints-fill trophy-fill feather-fill binoculars-fill moon-stars-fill
island-fill waves-fill sailboat-fill sun-horizon-fill hand-heart-fill car-profile-fill road-horizon-fill
moon-stars road-horizon car-profile gauge flashlight device-mobile map-pin gps-fix calendar-blank clock
image-square microphone scan dice-five hand-heart ticket gift coins lock-simple eye-slash cloud-slash
wifi-slash cloud-check file-arrow-down file-arrow-up buildings key bank table chart-bar speaker-high
chat-circle users user seal-check lightbulb path diamond frame-corners flag-banner sun moon tree
tree-palm leaf plant user-plus camera
amami:kurousagi amami:kurousagi-fill amami:frog amami:frog-fill amami:fern amami:fern-fill
amami:kayak amami:kayak-fill
`
  .trim()
  .split(/\s+/);

const ph = JSON.parse(await readFile(new URL('node_modules/@iconify-json/ph/icons.json', ROOT), 'utf8'));
const phVersion = JSON.parse(await readFile(new URL('node_modules/@iconify-json/ph/package.json', ROOT), 'utf8')).version;

const pascal = (name) =>
  name
    .split(/[:-]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
const constName = (name) => `B_${name.replace(/[:-]/g, '_').toUpperCase()}`;
const squash = (svg) => svg.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();

function phosphorBody(name) {
  let entry = ph.icons[name];
  // エイリアスは親の図案を使う（回転・反転のエイリアスは使わない）
  if (!entry && ph.aliases?.[name]) {
    const alias = ph.aliases[name];
    if (alias.rotate || alias.hFlip || alias.vFlip) throw new Error(`ph:${name} は変形付きのエイリアスなので使えません`);
    entry = ph.icons[alias.parent];
  }
  if (!entry) throw new Error(`ph:${name} が @iconify-json/ph@${phVersion} にありません`);
  const w = entry.width ?? ph.width ?? 16;
  const h = entry.height ?? ph.height ?? 16;
  if (w !== 256 || h !== 256) throw new Error(`ph:${name} の viewBox が 256 ではありません（${w}×${h}）`);
  return squash(entry.body);
}

const PRESENTATION = new Set(['fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'opacity']);

async function amamiBody(name) {
  const file = new URL(`src/icons/amami/${name}.svg`, ROOT);
  const src = await readFile(file, 'utf8').catch(() => {
    throw new Error(`amami:${name} の SVG（src/icons/amami/${name}.svg）がありません`);
  });
  const m = src.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/);
  if (!m) throw new Error(`amami:${name}: <svg> 要素を読めません`);
  const attrs = Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
  if (attrs.viewBox !== '0 0 256 256') throw new Error(`amami:${name}: viewBox は "0 0 256 256" にしてください（${attrs.viewBox}）`);
  if (/<(script|foreignObject|image|use)\b|\son\w+=|url\(|href=/i.test(m[2])) throw new Error(`amami:${name}: 使えない要素・属性があります`);
  // ルートの描画属性（stroke など）は <g> に移して、生成側の <svg fill="currentColor"> と両立させる
  const keep = Object.entries(attrs).filter(([k]) => PRESENTATION.has(k));
  const inner = squash(m[2]);
  return keep.length ? `<g ${keep.map(([k, v]) => `${k}="${v}"`).join(' ')}>${inner}</g>` : inner;
}

const seen = new Set();
const parts = [];
for (const name of ICONS) {
  if (seen.has(name)) throw new Error(`${name} が重複しています`);
  seen.add(name);
  const body = name.startsWith('amami:') ? await amamiBody(name.slice('amami:'.length)) : phosphorBody(name);
  const comp = `Icon${pascal(name)}`;
  const k = constName(name);
  parts.push(
    `const ${k} = ${JSON.stringify(body)};\n` +
      `/** ${name} */\n` +
      `export function ${comp}({ size = 24, ...p }: IconProps) {\n` +
      `  return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: ${k} }} />;\n` +
      `}\n`,
  );
}

const header = `// このファイルは scripts/build-ui-icons.mjs が生成します。直接編集しないでください（npm run icons:ui）。
// 図案: Phosphor Icons（MIT、@iconify-json/ph@${phVersion}）と src/icons/amami/*.svg
// 使い方: <IconHouseSimple size={24} className="text-fg-2" />。色は currentColor、viewBox は 256。
import type { ReactElement, SVGProps } from 'react';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML' | 'ref'> & {
  /** px。タブバーとヘッダー 24、行頭 20、チップ・文中・シェブロン 16 */
  size?: number | string;
};
export type IconComponent = (props: IconProps) => ReactElement;

`;

await writeFile(OUT, header + parts.join('\n'));
console.log(`icons: ${ICONS.length} 個を ${OUT.pathname.replace(ROOT.pathname, '')} に書き出しました`);
