import { Fragment, type ElementType } from 'react';
import { cn } from '../lib/cn';

type NameSource = { name: string; nameBreak?: string };

type Props = {
  /** 種（name と nameBreak を読む） */
  species?: NameSource;
  /** species の代わりに直接渡す時 */
  name?: string;
  /** 改行してよい位置を | で区切った和名（例: アマミノ|クロウサギ） */
  nameBreak?: string;
  /** 2 行で止める（line-clamp-2）。省略記号では切らないので、2 行に収まる大きさで使う */
  clamp?: boolean;
  as?: ElementType;
  className?: string;
};

/**
 * 和名（docs/DESIGN_SYSTEM.md §3.5）。
 * BudouX はカタカナの複合語を切れないので、species.nameBreak の | を <wbr> にして、
 * そこでだけ改行できるようにする（.phrase）。nameBreak がない短い名前は途中で改行しない。
 */
export function SpeciesName({ species, name, nameBreak, clamp = true, as: Tag = 'span', className }: Props) {
  const text = nameBreak ?? species?.nameBreak ?? name ?? species?.name ?? '';
  const parts = text.split('|');
  return (
    <Tag className={cn('phrase', clamp && 'line-clamp-2', className)}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {p}
        </Fragment>
      ))}
    </Tag>
  );
}
