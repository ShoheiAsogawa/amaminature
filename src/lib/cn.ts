import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * クラスの結合と衝突解決（docs/DESIGN_SYSTEM.md §7.1）。
 * このシステム独自の文字サイズ・角丸・影のトークンを tailwind-merge に登録する。
 * 登録しないと text-sub（大きさ）と text-fg-2（色）が同じ種類とみなされて片方が消える。
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'title', 'section', 'headline', 'body', 'callout', 'input', 'sub', 'tile', 'caption', 'tab', 'num-xl', 'num-kpi', 'num-l'] }],
      rounded: [{ rounded: ['bar', 'xs', 'thumb', 'sm', 'md', 'lg'] }],
      shadow: [{ shadow: ['sheet', 'toast', 'thumb', 'object'] }],
    },
  },
});

export const cn = (...c: ClassValue[]) => twMerge(clsx(c));
