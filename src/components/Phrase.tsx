import { Fragment, useMemo } from 'react';
import { cn } from '../lib/cn';
import { phrases } from '../lib/phrases';

/**
 * 日本語を文節で改行する（docs/DESIGN_SYSTEM.md §3.5）。
 * 文節の間に <wbr> を入れ、.phrase（文節の途中では折り返さない）を付ける。
 * 見出し、ボタン、バッジ名、クエスト名、体験のタイトル、空状態の一文に使う。
 * 見出しの行の長さをそろえる .balance は、親のブロック要素（h1・h2 など）に付ける
 * （text-wrap: balance はインラインの <span> では効かない）。
 */
export function Phrase({ text, className }: { text: string; className?: string }) {
  // 括弧は前後の文節に付けて分ける（src/lib/phrases.ts）
  const parts = useMemo(() => phrases(text), [text]);
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
