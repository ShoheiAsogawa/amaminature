#!/usr/bin/env python3
"""PixelMplus12（M+ FONT LICENSE）を、アプリで使う分の woff2 に分ける（docs/DESIGN_SYSTEM.md §3）。

使い方:
  python3 -m venv .venv && .venv/bin/pip install fonttools brotli
  .venv/bin/python scripts/subset-pixel-font.py <PixelMplus12-Regular.ttf のあるフォルダ>

元のフォントは https://github.com/itouhiro/PixelMplus （リリースの PixelMplus-*.zip）。
public/fonts/ に次を書き出す（標準の字形だけ。太字は 12px でも 2〜3 倍でも漢字がつぶれるので使わない）:
  pm12-regular-ui.woff2   … かな・記号・英数字と、アプリの文言（src と index.html）に出てくる漢字
  pm12-regular-more.woff2 … それ以外の漢字（利用者が書いたニックネームなどで使われた時だけ読み込む）
src/styles/pixel-fonts.css に @font-face（unicode-range つき）を書き出す。

元のフォントから直すところ（prepare）:
- ドットの格子が基準線から 0.4 ドット下にずれている（行が y = 50 + 83.33k）。ブラウザは基準線を整数 px に丸めるので、
  そのままだと横の線がすべて 2 行ににじむ。輪郭をドットの格子に合わせて 0.4 ドット上げ、基準線をドットの境目にする。
  上 11 ドット・下 1 ドット（12px で 11px・1px）を ascent / descent にし、行の高さが偶数 px ならドットが整数 px に乗る。
- 数字の 0 は斜線入り（「θ」に見える）なので、O と同じ形にする。
- 「.」「:」の点は 3×3 の十字で、小さいと「2026+10+16」「13+30」に見える。2×2 の四角にする。
- フォントにない「〜」「›」「−」「—」は、形の近い字（～ > - ―）を使う。
"""
import copy
import pathlib
import sys

from fontTools import subset
from fontTools.pens.ttGlyphPen import TTGlyphPen
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


DOT = 1000 / 12
# 基準線から上・下のドット数（12px で 1 ドット = 1px）
ASCENT, DESCENT = 11, 1
# フォントにない字 → 形の近い字
ALIASES = {0x301C: 0xFF5E, 0x203A: 0x3E, 0x2212: 0x2D, 0x2014: 0x2015}


def squares(rects: list[tuple[int, int, int, int]]):
    """ドットの四角（列, 行, 幅, 高さ。行は基準線から上へ数える）を輪郭にする"""
    pen = TTGlyphPen(None)
    for c, r, w, h in rects:
        x0, y0, x1, y1 = (round(v * DOT) for v in (c, r, c + w, r + h))
        pen.moveTo((x0, y0))
        pen.lineTo((x0, y1))
        pen.lineTo((x1, y1))
        pen.lineTo((x1, y0))
        pen.closePath()
    return pen.glyph()


def prepare(font: TTFont) -> TTFont:
    glyf = font['glyf']
    glyf['zero'] = copy.deepcopy(glyf['O'])
    # 輪郭をドットの格子に合わせる（横は x = 83.33k のまま、縦は y = 50 + 83.33k を 83.33(k + 1) に）
    off_grid = []
    for name in font.getGlyphOrder():
        g = glyf[name]
        if g.numberOfContours <= 0:
            continue
        coords = g.coordinates
        snapped = []
        for x, y in coords:
            kx, ky = round(x / DOT), round((y - 50) / DOT)
            if abs(x - kx * DOT) > 3 or abs(y - 50 - ky * DOT) > 3:
                break
            snapped.append((round(kx * DOT), round((ky + 1) * DOT)))
        else:
            for i, p in enumerate(snapped):
                coords[i] = p
            continue
        # ドット絵でない字（.notdef など）は 0.4 ドット上げるだけ
        off_grid.append(name)
        for i, (x, y) in enumerate(coords):
            coords[i] = (x, y + round(DOT - 50))
    if len(off_grid) > 1:
        print(f'ドットの格子に乗らない字: {", ".join(off_grid[:20])}（{len(off_grid)} 字）')
    glyf['period'] = squares([(1, 0, 2, 2)])
    glyf['colon'] = squares([(1, 2, 2, 2), (1, 5, 2, 2)])
    hmtx = font['hmtx']
    for name in font.getGlyphOrder():
        g = glyf[name]
        g.recalcBounds(glyf)
        if g.numberOfContours > 0:
            hmtx[name] = (hmtx[name][0], g.xMin)
    # Safari（ascent-override がない）でも同じ位置になるよう、フォントの値もそろえる
    asc, desc = round(ASCENT * DOT), round(DESCENT * DOT)
    hhea, os2 = font['hhea'], font['OS/2']
    hhea.ascent, hhea.descent, hhea.lineGap = asc, -desc, 0
    os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = asc, -desc, 0
    os2.usWinAscent = max(asc, max(glyf[n].yMax for n in font.getGlyphOrder() if glyf[n].numberOfContours > 0))
    os2.usWinDescent = max(desc, -min(glyf[n].yMin for n in font.getGlyphOrder() if glyf[n].numberOfContours > 0))
    best = font.getBestCmap()
    for table in font['cmap'].tables:
        if table.isUnicode():
            for cp, target in ALIASES.items():
                if cp not in best and target in best:
                    table.cmap[cp] = best[target]
    return font


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
        src = SRC_DIR / f'PixelMplus12-{name}.ttf'
        cmap = set(prepare(TTFont(src)).getBestCmap().keys())
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
            f = prepare(TTFont(src))
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
                f'  ascent-override: {ASCENT / 12 * 100:.4f}%;\n'
                f'  descent-override: {DESCENT / 12 * 100:.4f}%;\n'
                '  line-gap-override: 0%;\n'
                # more は漢字の範囲をまとめて書く（ui が先に選ばれるので、ui にない漢字だけが more に来る）
                f"  unicode-range: {ranges(cps) if key == 'ui' else 'U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF'};\n"
                '}'
            )
            print(f'{dst.name}: {len(cps)} 文字, {dst.stat().st_size // 1024} KB')
    CSS.write_text('\n'.join(css) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
