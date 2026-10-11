import { Fragment, type ElementType } from 'react';
import { cn } from '../lib/cn';

type NameSource = { name: string; nameBreak?: string };

/** まだ見つけていない種の名前（ゲームの図鑑の「？？？」） */
export const HIDDEN_NAME = '？？？';
/** 「？？？」の読み上げ */
export const HIDDEN_NAME_LABEL = 'まだ見つけていない生き物';

type Props = {
  /** 種（name と nameBreak を読む） */
  species?: NameSource;
  /** まだ見つけていない種。名前を「？？？」にする（記録すると名前がわかる） */
  hidden?: boolean;
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
 * 和名（docs/DESIGN_SYSTEM.md §3）。hidden の時は「？？？」。
 * BudouX はカタカナの複合語を切れないので、species.nameBreak の | を <wbr> にして、
 * そこでだけ改行できるようにする（.phrase）。nameBreak がない短い名前は途中で改行しない。
 */
export function SpeciesName({ species, name, nameBreak, hidden = false, clamp = true, as: Tag = 'span', className }: Props) {
  if (hidden) {
    return (
      <Tag className={cn('whitespace-nowrap tracking-[0.08em]', className)}>
        <span aria-hidden>{HIDDEN_NAME}</span>
        <span className="sr-only">{HIDDEN_NAME_LABEL}</span>
      </Tag>
    );
  }
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
