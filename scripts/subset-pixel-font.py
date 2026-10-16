#!/usr/bin/env python3
"""PixelMplus12（M+ FONT LICENSE）を、アプリで使う分の woff2 に分ける（docs/DESIGN_SYSTEM.md §3）。

使い方:
  python3 -m venv .venv && .venv/bin/pip install fonttools brotli
  .venv/bin/python scripts/subset-pixel-font.py <PixelMplus12-Regular.ttf のあるフォルダ>

元のフォントは https://github.com/itouhiro/PixelMplus （リリースの PixelMplus-*.zip）。
public/fonts/ に次を書き出す（標準の字形だけ。太字は 12px でも 2〜3 倍でも漢字がつぶれるので使わない）:
  pm12-regular-ui.woff2   … かな・記号・英数字と、アプリの文言（src と index.html）に出てくる漢字
  pm12-regular-more.woff2 … それ以外の漢字（利用者が書いたニックネームなどで使われた時だけ読み込む）
数字の 0 は斜線入り（「θ」に見える）なので、O と同じ形に置き換える。
src/styles/pixel-fonts.css に @font-face（unicode-range つき）を書き出す。
ドットの格子は基準線から 0.4 ドット下にずれているので、ascent / descent を指定して、行の高さが偶数 px の時に
ドットが画面の整数 px に乗るようにする（12px で上 10.4px・下 1.6px）。
"""
import copy
import pathlib
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_DIR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / '.fonts'
OUT = ROOT / 'public' / 'fonts'
CSS = ROOT / 'src' / 'styles' / 'pixel-fonts.css'


def app_chars() -> set[int]:
    text = []
    for p in list((ROOT / 'src').rglob('*.ts')) + list((ROOT / 'src').rglob('*.tsx')) + [ROOT / 'index.html']:
        text.append(p.read_text(encoding='utf-8'))
    return {ord(c) for c in ''.join(text) if ord(c) > 0x7F}


def ranges(cps: list[int]) -> str:
    cps = sorted(cps)
    out, start, prev = [], None, None
    for c in cps:
        if start is None:
            start = prev = c
        elif c == prev + 1:
            prev = c
        else:
            out.append((start, prev))
            start = prev = c
    if start is not None:
        out.append((start, prev))
    return ', '.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in out)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    used = app_chars()
    css = ['/* このファイルは scripts/subset-pixel-font.py が作る。手で直さない */',
           '/* PixelMplus12 (c) M+ FONTS PROJECT / itouhiro, M+ FONT LICENSE（public/fonts/LICENSE-PixelMplus.txt） */']
    for name in ['Regular']:
        font = TTFont(SRC_DIR / f'PixelMplus12-{name}.ttf')
        cmap = set(font.getBestCmap().keys())
        def is_base(c: int) -> bool:
            # かな・記号・英字（漢字以外）はいつも使う
            return not (0x3400 <= c <= 0x9FFF or 0xF900 <= c <= 0xFAFF)
        ui = sorted(c for c in cmap if is_base(c) or c in used)
        more = sorted(c for c in cmap if c not in set(ui))
        slices = [('more', more), ('ui', ui)]  # 後に書いた方（ui）が先に選ばれる
        for key, cps in slices:
            dst = OUT / f'pm12-{name.lower()}-{key}.woff2'
            opts = subset.Options()
            opts.flavor = 'woff2'
            opts.layout_features = []
            opts.name_IDs = ['*']
            opts.notdef_outline = True
            sub = subset.Subsetter(opts)
            f = TTFont(SRC_DIR / f'PixelMplus12-{name}.ttf')
            # 斜線入りの 0 を、O と同じ形にする
            glyf = f['glyf']
            glyf['zero'] = copy.deepcopy(glyf['O'])
            sub.populate(unicodes=cps)
            sub.subset(f)
            f.flavor = 'woff2'
            f.save(dst)
            css.append(
                '@font-face {\n'
                "  font-family: 'PixelMplus12';\n"
                f"  src: url('/fonts/{dst.name}') format('woff2');\n"
                # 太字を指定されても標準の字形を使う（合成もしない）
                '  font-weight: 100 900;\n'
                '  font-style: normal;\n'
                '  font-display: swap;\n'
                '  ascent-override: 86.6667%;\n'
                '  descent-override: 13.3333%;\n'
                '  line-gap-override: 0%;\n'
                # more は漢字の範囲をまとめて書く（ui が先に選ばれるので、ui にない漢字だけが more に来る）
                f"  unicode-range: {ranges(cps) if key == 'ui' else 'U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF'};\n"
                '}'
            )
            print(f'{dst.name}: {len(cps)} 文字, {dst.stat().st_size // 1024} KB')
    CSS.write_text('\n'.join(css) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
