import { loadDefaultJapaneseParser } from 'budoux';
import { Fragment, useMemo } from 'react';
import { SPECIES } from '../data/species';

// BudouX の日本語モデル（Phrase.tsx と同じ。モジュールの外で 1 回だけ作る）
const parser = loadDefaultJapaneseParser();

/**
 * 本文の中で途中で改行させない生き物の名前（§11 の 15「カタカナの和名の途中で改行しない」）。
 * 図鑑の和名（「の仲間」は除く）に、本文でよく使う短い呼び名を足したもの。長い名前から先に照らし合わせる。
 */
const EXTRA_NAMES = ['クロウサギ', 'カケス', 'ウミガメ', 'クジラ', 'ハブ', 'マングース', 'ネコ', 'ツグミ', 'アカショウビン', 'サンゴ'];

const NAMES = [...new Set([...SPECIES.map((s) => s.name.replace(/の仲間$/, '')), ...EXTRA_NAMES])]
  .filter((n) => n.length >= 2)
  .sort((a, b) => b.length - a.length);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NAME_RE = new RegExp(`(${NAMES.map(escape).join('|')})`, 'g');

/**
 * 複数行の本文（<p className="text-body">）の中身。生き物の名前を whitespace-nowrap で包み、
 * 「カケ／ス」「ウミガ／メ」のような名前の途中の改行を防ぐ。それ以外は BudouX の文節の間でだけ折り返す
 * （ドット文字は字幅が広く、文の途中で折り返しやすい）。最終行の 1 文字の改行は CSS の text-wrap: pretty で防ぐ（index.css）。
 */
export function Prose({ text }: { text: string }) {
  const parts = useMemo(() => text.split(NAME_RE).map((p, i) => (i % 2 === 1 ? [p] : parser.parse(p))), [text]);
  return (
    <span className="phrase">
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Fragment key={i}>
            <wbr />
            <span className="whitespace-nowrap">{p[0]}</span>
            <wbr />
          </Fragment>
        ) : (
          <Fragment key={i}>
            {p.map((ph, j) => (
              <Fragment key={j}>
                {j > 0 && <wbr />}
                {ph}
              </Fragment>
            ))}
          </Fragment>
        ),
      )}
    </span>
  );
}
