import { loadDefaultJapaneseParser } from 'budoux';

// BudouX の日本語モデル（モジュールの外で 1 回だけ作る。docs/DESIGN_SYSTEM.md §3）
const parser = loadDefaultJapaneseParser();

/** 行の終わりに来てはいけない字（開き括弧） */
export const OPENERS = '（(「『【〔［[〈《“‘';
/** 行の始めに来てはいけない字（閉じ括弧・句読点） */
export const CLOSERS = '）)」』】〕］]〉》”’、。，．！？';

const BRACKETS = /([（(「『【〔［[〈《）)」』】〕］\]〉》])/;
const isCjk = (c: string | undefined) => !!c && /[　-ヿ㐀-鿿豈-﫿＀-￯]/.test(c);

/** 和文に接した半角スペース（「最長 30 日間」「の OpenAI に」）は折り返さない */
function keepCjkSpaces(s: string) {
  let out = '';
  for (let i = 0; i < s.length; i++) out += s[i] === ' ' && (isCjk(s[i - 1]) || isCjk(s[i + 1])) ? ' ' : s[i];
  return out;
}

/**
 * 日本語を折り返してよい文節に分ける。BudouX は括弧をまたぐと「州法（／…プライバシー法な／ど）」のように切るので、
 * 括弧の外と中を別々に分け、開き括弧は次の文節に、閉じ括弧は前の文節に付ける。
 */
export function phrases(text: string): string[] {
  const out: string[] = [];
  let open = '';
  for (const run of text.split(BRACKETS)) {
    if (!run) continue;
    if (OPENERS.includes(run)) {
      open += run;
    } else if (CLOSERS.includes(run) && !open && out.length) {
      out[out.length - 1] += run;
    } else {
      parser.parse(run).forEach((p, i) => out.push(i === 0 ? open + p : p));
      open = '';
    }
  }
  if (open) out.push(open);
  return out.map(keepCjkSpaces);
}

/** a と b の間で折り返してよいか（閉じ括弧・句読点の前、開き括弧の後では折り返さない） */
export function canBreakBetween(a: string, b: string) {
  return !CLOSERS.includes(b[0] ?? '') && !OPENERS.includes(a[a.length - 1] ?? '');
}
