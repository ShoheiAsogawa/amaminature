#!/usr/bin/env python3
"""PixelMplus12（M+ FONT LICENSE）を、アプリで使う分の woff2 に分ける（docs/DESIGN_SYSTEM.md §3）。

使い方:
  python3 -m venv .venv && .venv/bin/pip install fonttools brotli
  .venv/bin/python scripts/subset-pixel-font.py <PixelMplus12-Regular.ttf のあるフォルダ>

元のフォントは https://github.com/itouhiro/PixelMplus （リリースの PixelMplus-*.zip）。
public/fonts/ に次を書き出す（数字 0〜9 は入れない。点のある 0 が「θ」に見えるので、数字はほかの書体で出す）:
  pm12-{regular,bold}-ui.woff2   … かな・記号・英字と、アプリの文言（src と index.html）に出てくる漢字
  pm12-{regular,bold}-more.woff2 … それ以外の漢字（利用者が書いたニックネームなどで使われた時だけ読み込む）
src/styles/pixel-fonts.css に @font-face（unicode-range つき）を書き出す。
"""
import pathlib
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC_DIR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / '.fonts'
OUT = ROOT / 'public' / 'fonts'
CSS = ROOT / 'src' / 'styles' / 'pixel-fonts.css'
DIGITS = set(range(0x30, 0x3A))


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
    for weight, name in [(400, 'Regular'), (700, 'Bold')]:
        font = TTFont(SRC_DIR / f'PixelMplus12-{name}.ttf')
        cmap = set(font.getBestCmap().keys()) - DIGITS
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
            sub.populate(unicodes=cps)
            sub.subset(f)
            f.flavor = 'woff2'
            f.save(dst)
            # 小さい文字用の 'PixelMplus12 Text' は、太字を指定されても標準の字形を使う（12px の太字は漢字がつぶれる）
            families = [('PixelMplus12', str(weight))] + ([('PixelMplus12 Text', '100 900')] if weight == 400 else [])
            for family, wdesc in families:
              css.append(
                '@font-face {\n'
                f"  font-family: '{family}';\n"
                f"  src: url('/fonts/{dst.name}') format('woff2');\n"
                f'  font-weight: {wdesc};\n'
                '  font-style: normal;\n'
                '  font-display: swap;\n'
                # more は漢字の範囲をまとめて書く（ui が先に選ばれるので、ui にない漢字だけが more に来る）
                f"  unicode-range: {ranges(cps) if key == 'ui' else 'U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF'};\n"
                '}'
            )
            print(f'{dst.name}: {len(cps)} 文字, {dst.stat().st_size // 1024} KB')
    CSS.write_text('\n'.join(css) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
