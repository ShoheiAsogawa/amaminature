import { AREA_BY_ID } from '../data/areas';
import type { Category, Rarity, Species } from '../data/types';
import { GAME, LIGHT, type ColorStop } from '../styles/palette';
import { api } from './api';
import { shareToLine } from './liff';
import type { Sighting } from './types';

// 共有画像（トレーディングカード風）。1080×1350。テーマに関係なく常にひるの島の色。
// アプリの図鑑カード（CollectibleCard）と同じ作り：タイプの色の枠、名前と番号、写真の窓、タイプと星、GET! のシール。
// canvas は CSS 変数を読めないので、色は src/styles/palette.ts の値を使う。

const W = 1080;
const H = 1350;
/** 枠の太さと、白い面の角丸 */
const FRAME = 40;
const INNER_R = 44;
/** 写真の窓（5:4） */
const PHOTO = { x: 84, y: 200, w: 912, h: 730, radius: 30, border: 12 } as const;

const FONT_JP = '"M PLUS Rounded 1c", "Hiragino Maru Gothic ProN", "Hiragino Sans", sans-serif';
const FONT_NUM = '"Lilita One", "M PLUS Rounded 1c", "Hiragino Sans", sans-serif';

const TYPE_LABEL: Record<Category, string> = {
  mammal: 'けもの',
  bird: 'とり',
  herp: 'は虫・両生',
  insect: 'むし',
  aqua: 'うみ・みず',
  plant: 'しょくぶつ',
};

// 種のシルエット（src/art/sil/{species.id}.svg）。SpeciesTile.tsx と同じ置き場所を読む
const SILHOUETTES = import.meta.glob<string>('../art/sil/*.svg', { eager: true, query: '?url', import: 'default' });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

/** 描く文字に必要なフォントのスライスを読み込む（Google Fonts は unicode-range で分かれている） */
async function loadFonts(specs: [font: string, text: string][]) {
  if (!document.fonts?.load) return;
  await Promise.all(specs.filter(([, t]) => t).map(([f, t]) => document.fonts.load(f, t).catch(() => [])));
  await document.fonts.ready;
}

function linear(ctx: CanvasRenderingContext2D, stops: readonly ColorStop[]) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** 枠の地（よく見る・ときどきはタイプの色、めずらしいは虹、幻は金） */
function frameFill(ctx: CanvasRenderingContext2D, species: Species | null): string | CanvasGradient {
  if (!species) return LIGHT.fg3;
  if (species.rarity === 3) return linear(ctx, GAME.frame3);
  if (species.rarity === 4) return linear(ctx, GAME.frame4);
  return GAME.type[species.category];
}

/** 写真がない時のプレート: 淡い地にシルエット（タイプの色）、なければ「？」 */
async function drawPlate(ctx: CanvasRenderingContext2D, species: Species | null) {
  const { x, y, w, h } = PHOTO;
  ctx.fillStyle = LIGHT.fill;
  ctx.fillRect(x, y, w, h);
  if (!species) return;
  const silUrl = SILHOUETTES[`../art/sil/${species.id}.svg`];
  if (silUrl) {
    try {
      const img = await loadImage(silUrl);
      const s = Math.round(h * 0.8);
      const tmp = document.createElement('canvas');
      tmp.width = s;
      tmp.height = s;
      const t = tmp.getContext('2d')!;
      t.drawImage(img, 0, 0, s, s);
      t.globalCompositeOperation = 'source-in';
      t.fillStyle = GAME.type[species.category];
      t.fillRect(0, 0, s, s);
      ctx.drawImage(tmp, x + (w - s) / 2, y + (h - s) / 2);
      return;
    } catch {
      // 読めなければ「？」にする
    }
  }
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `400 360px ${FONT_NUM}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', x + w / 2, y + h / 2 + 20);
  ctx.restore();
}

/** 5 つの角の星 */
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.48;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** レア度の星 4 つ（右端を x にそろえる） */
function drawStars(ctx: CanvasRenderingContext2D, rarity: Rarity, right: number, cy: number) {
  const r = 26;
  const step = 58;
  for (let i = 0; i < 4; i++) {
    const cx = right - r - (3 - i) * step;
    star(ctx, cx, cy, r);
    ctx.fillStyle = i < rarity ? GAME.rare[rarity] : LIGHT.fillStrong;
    ctx.fill();
  }
}

/** 角丸の札（タイプ・ニックネーム）を描いて、幅を返す */
function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, h: number, bg: string, fg: string, font: string, padX = 30) {
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h / 2 + 2);
  ctx.textBaseline = 'alphabetic';
  return w;
}

/** 文章を max 幅で折り返す（文字単位。句読点を行頭に置かない）。maxLines を超えたら末尾を … にする */
function wrapText(ctx: CanvasRenderingContext2D, text: string, max: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of Array.from(text)) {
    if (ctx.measureText(line + ch).width > max && line && !/[、。」）！？]/.test(ch)) {
      lines.push(line);
      line = ch;
      if (lines.length === maxLines) break;
    } else {
      line += ch;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > max) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

/** 名前は 64px、入らなければ縮める。図鑑にない生き物の名前は最後に末尾を省く */
function fitName(ctx: CanvasRenderingContext2D, name: string, max: number): string {
  for (const px of [64, 56, 48, 42]) {
    ctx.font = `900 ${px}px ${FONT_JP}`;
    if (ctx.measureText(name).width <= max) return name;
  }
  let s = name;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}

/** 2026.10.10 */
function dotDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * SNS・LINE 共有用の図鑑カード画像を作る。
 * 位置情報（座標）は載せない。希少種は市町村名も載せない。ハッシュタグは画像に入れず、共有テキストに入れる。
 */
export async function renderShareCard(opts: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
}): Promise<Blob> {
  const { sighting, species, photoUrl } = opts;
  const name = species?.name ?? (sighting.customName?.trim() || 'なぞの生き物');
  const no = species ? `No.${String(species.no).padStart(3, '0')}` : '';
  const nickname = sighting.nickname?.trim() ? `「${sighting.nickname.trim()}」` : '';
  const area = sighting.areaId && !species?.sensitive ? AREA_BY_ID[sighting.areaId]?.name : null;
  const date = dotDate(sighting.observedAt);
  const brand = 'AMAMI NATURE';
  const typeColor = species ? GAME.type[species.category] : LIGHT.fg3;
  const typeLabel = species ? TYPE_LABEL[species.category] : '図鑑にない生き物';

  await loadFonts([
    [`400 56px ${FONT_NUM}`, `${no}${brand}${date}GET!`],
    [`900 64px ${FONT_JP}`, name],
    [`900 40px ${FONT_JP}`, `${nickname}${typeLabel}`],
    [`800 32px ${FONT_JP}`, area ?? '奄美群島'],
    [`800 31px ${FONT_JP}`, species?.description ?? ''],
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 枠と白い面
  ctx.fillStyle = frameFill(ctx, species);
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, FRAME, FRAME, W - FRAME * 2, H - FRAME * 2, INNER_R);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // 名前と番号
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `400 56px ${FONT_NUM}`;
  const noWidth = no ? ctx.measureText(no).width : 0;
  ctx.fillStyle = LIGHT.fg;
  const shown = fitName(ctx, name, W - 84 * 2 - noWidth - 30);
  ctx.fillText(shown, 84, 160);
  if (no) {
    ctx.fillStyle = typeColor;
    ctx.font = `400 56px ${FONT_NUM}`;
    ctx.textAlign = 'right';
    ctx.fillText(no, W - 84, 158);
    ctx.textAlign = 'left';
  }

  // 写真の窓（タイプの色の枠）
  roundRect(ctx, PHOTO.x - PHOTO.border, PHOTO.y - PHOTO.border, PHOTO.w + PHOTO.border * 2, PHOTO.h + PHOTO.border * 2, PHOTO.radius + PHOTO.border);
  ctx.fillStyle = typeColor;
  ctx.fill();
  ctx.save();
  roundRect(ctx, PHOTO.x, PHOTO.y, PHOTO.w, PHOTO.h, PHOTO.radius);
  ctx.clip();
  let drewPhoto = false;
  if (photoUrl) {
    try {
      const img = await loadImage(photoUrl);
      const scale = Math.max(PHOTO.w / img.naturalWidth, PHOTO.h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, PHOTO.x + (PHOTO.w - dw) / 2, PHOTO.y + (PHOTO.h - dh) / 2, dw, dh);
      drewPhoto = true;
    } catch {
      // 読めなければプレートにする
    }
  }
  if (!drewPhoto) await drawPlate(ctx, species);
  ctx.restore();

  // GET! のシール（写真の右上、少し傾ける）
  ctx.save();
  ctx.translate(W - 150, PHOTO.y + 20);
  ctx.rotate((10 * Math.PI) / 180);
  roundRect(ctx, -110, -46, 220, 92, 46);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  roundRect(ctx, -100, -36, 200, 72, 36);
  ctx.fillStyle = GAME.xp;
  ctx.fill();
  ctx.fillStyle = GAME.xpInk;
  ctx.font = `400 52px ${FONT_NUM}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GET!', 0, 4);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // タイプと星
  const rowY = PHOTO.y + PHOTO.h + 52;
  pill(ctx, typeLabel, 84, rowY, 64, typeColor, '#FFFFFF', `900 34px ${FONT_JP}`);
  if (species) drawStars(ctx, species.rarity, W - 84, rowY + 32);

  // ニックネーム
  if (nickname) {
    ctx.font = `900 40px ${FONT_JP}`;
    roundRect(ctx, 84, rowY + 90, W - 168, 76, 38);
    ctx.fillStyle = LIGHT.fill;
    ctx.fill();
    ctx.fillStyle = LIGHT.fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nickname, W / 2, rowY + 130);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // 図鑑の説明（カードのフレーバーテキスト）
  if (species) {
    const top = rowY + (nickname ? 196 : 104);
    const lines = nickname ? 1 : 3;
    ctx.strokeStyle = LIGHT.sep;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(84, top);
    ctx.lineTo(W - 84, top);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `800 31px ${FONT_JP}`;
    ctx.fillStyle = LIGHT.fg2;
    wrapText(ctx, species.description, W - 168, lines).forEach((l, i) => ctx.fillText(l, 84, top + 52 + i * 46));
  }

  // 日付と市町村（希少種は市町村名を出さない）、右下にブランド
  const footY = H - FRAME - 44;
  ctx.fillStyle = LIGHT.fg3;
  ctx.font = `400 34px ${FONT_NUM}`;
  ctx.fillText(date, 84, footY);
  const dw = ctx.measureText(date).width;
  ctx.font = `800 32px ${FONT_JP}`;
  ctx.fillText(area ?? '奄美群島', 84 + dw + 24, footY);
  ctx.fillStyle = LIGHT.brand;
  ctx.font = `400 34px ${FONT_NUM}`;
  ctx.textAlign = 'right';
  ctx.fillText(brand, W - 84, footY);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('画像の作成に失敗しました'))), 'image/jpeg', 0.9),
  );
}

/** LINE（友だちに送る）→ Web Share → 画像保存 の順に試す */
export async function shareCard(opts: {
  card: Blob;
  species: Species | null;
  lineMode: boolean;
}): Promise<'line' | 'web' | 'download'> {
  const { card, species, lineMode } = opts;
  const title = species ? `奄美で${species.name}に出会った！` : '奄美で生き物に出会った！';
  if (lineMode) {
    try {
      const { url } = await api.createShare(card);
      if (await shareToLine(url, title, species ? `/species/${species.id}` : '/')) return 'line';
    } catch {
      // 失敗時は次の方法へ
    }
  }
  const file = new File([card], 'amami-nature.jpg', { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: `${title} #奄美いきものコレクション` });
      return 'web';
    } catch {
      // キャンセル時はダウンロードにフォールバック
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(card);
  a.download = 'amami-nature.jpg';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'download';
}
