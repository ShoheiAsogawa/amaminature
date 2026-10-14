// 利用規約・プライバシーポリシーを公開する前の確認（docs/LEGAL_CHECKLIST.md）
// 使い方: npm run check:legal（埋まっていない項目があれば終了コード 1）
import { readFile } from 'node:fs/promises';

const company = await readFile(new URL('../src/data/company.ts', import.meta.url), 'utf8');
const problems = [];

const block = company.slice(company.indexOf('export const COMPANY'), company.indexOf('};', company.indexOf('export const COMPANY')));
for (const m of block.matchAll(/^\s+(\w+):\s*'([^']*)'/gm)) {
  if (!m[2].trim()) problems.push(`src/data/company.ts の ${m[1]} が空です`);
}
if (/export const LEGAL_DRAFT = true/.test(company)) problems.push('LEGAL_DRAFT が true です（弁護士の確認が終わったら false にする）');

for (const file of ['legalTexts.ts', 'consentTexts.ts']) {
  const text = await readFile(new URL(`../src/data/${file}`, import.meta.url), 'utf8');
  if (text.includes('（準備中）')) problems.push(`src/data/${file} に（準備中）が残っています`);
}

if (problems.length) {
  console.log('公開の前に、次を確かめてください（docs/LEGAL_CHECKLIST.md）:');
  for (const p of problems) console.log(`- ${p}`);
  process.exit(1);
}
console.log('利用規約・プライバシーポリシーの公開の準備ができています。');
