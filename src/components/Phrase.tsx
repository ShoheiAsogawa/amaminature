import { Fragment, useMemo } from 'react';
import { loadDefaultJapaneseParser } from 'budoux';
import { cn } from '../lib/cn';

// BudouX の日本語モデル。モジュールの外で 1 回だけ作る（§3.5）
const parser = loadDefaultJapaneseParser();

/**
 * 日本語を文節で改行する（docs/DESIGN_SYSTEM.md §3.5）。
 * 文節の間に <wbr> を入れ、.phrase（文節の途中では折り返さない）を付ける。
 * 見出し、ボタン、バッジ名、クエスト名、体験のタイトル、空状態の一文に使う。
 * 見出しの行の長さをそろえる .balance は、親のブロック要素（h1・h2 など）に付ける
 * （text-wrap: balance はインラインの <span> では効かない）。
 */
export function Phrase({ text, className }: { text: string; className?: string }) {
  const parts = useMemo(() => parser.parse(text), [text]);
  return (
    <span className={cn('phrase', className)}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {p}
        </Fragment>
      ))}
    </span>
  );
}
