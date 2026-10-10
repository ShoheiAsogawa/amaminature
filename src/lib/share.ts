import { AREA_BY_ID } from '../data/areas';
import type { Rarity, Species } from '../data/types';
import { LIGHT, MATERIALS, type ColorStop } from '../styles/palette';
import { api } from './api';
import { shareToLine } from './liff';
import type { Sighting } from './types';

// 共有画像（docs/DESIGN_SYSTEM.md §8.15）。1080×1350、白地、テーマに関係なく常にライトの色。
// canvas は CSS 変数を読めないので、色は src/styles/palette.ts の値を使う。

const W = 1080;
const H = 1350;
/** 写真の位置と大きさ（60, 60 に 960×960、角丸 24） */
const PHOTO = { x: 60, y: 60, size: 960, radius: 24 } as const;
/** レア度 2〜4 の外周の素材の幅 */
const EDGE = 16;

const FONT_JP = '"IBM Plex Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
const FONT_NUM = '"IBM Plex Sans", "IBM Plex Sans JP", "Hiragino Sans", sans-serif';

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

function applyStops(g: CanvasGradient, stops: readonly ColorStop[]) {
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

/** CSS の linear-gradient(<deg>) と同じ向きの、W×H 全体にかかるグラデーション */
function cssLinearGradient(ctx: CanvasRenderingContext2D, deg: number, stops: readonly ColorStop[]) {
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  const cx = W / 2;
  const cy = H / 2;
  return applyStops(ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half), stops);
}

/** 外周の素材（§2.1 のライト）。泥染は単色、夜光貝は createConicGradient、金箔は createLinearGradient */
function materialFill(ctx: CanvasRenderingContext2D, rarity: Rarity): string | CanvasGradient | null {
  const m = MATERIALS.light;
  if (rarity === 2) return m.dorozome;
  if (rarity === 3) {
    // CSS の conic-gradient は 12 時の方向が 0deg、canvas は 3 時の方向が 0 なので 90deg ずらす
    if (typeof ctx.createConicGradient === 'function') {
      const start = ((m.yakougai.fromDeg - 90) * Math.PI) / 180;
      return applyStops(ctx.createConicGradient(start, W / 2, H / 2), m.yakougai.stops);
    }
    return cssLinearGradient(ctx, m.yakougai.fromDeg, m.yakougai.stops);
  }
  if (rarity === 4) return cssLinearGradient(ctx, m.kinpaku.deg, m.kinpaku.stops);
  return null;
}

/** 写真がない時のプレート: fill の上にシルエット（幅 64%、silhouette 色）、なければ番号 */
async function drawPlate(ctx: CanvasRenderingContext2D, species: Species | null) {
  const { x, y, size } = PHOTO;
  ctx.fillStyle = LIGHT.fill;
  ctx.fillRect(x, y, size, size);
  if (!species) return;

  const silUrl = SILHOUETTES[`../art/sil/${species.id}.svg`];
  if (silUrl) {
    try {
      const img = await loadImage(silUrl);
      const s = Math.round(size * 0.64);
      // シルエットは currentColor の 1 色。別の canvas で silhouette 色に塗り替えてから重ねる
      const tmp = document.createElement('canvas');
      tmp.width = s;
      tmp.height = s;
      const t = tmp.getContext('2d')!;
      t.drawImage(img, 0, 0, s, s);
      t.globalCompositeOperation = 'source-in';
      t.fillStyle = LIGHT.silhouette;
      t.fillRect(0, 0, s, s);
      ctx.drawImage(tmp, x + (size - s) / 2, y + (size - s) / 2);
      return;
    } catch {
      // 読めなければ番号にする
    }
  }
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = LIGHT.fg3;
  ctx.font = `600 240px ${FONT_NUM}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(species.no).padStart(3, '0'), x + size / 2, y + size / 2);
  ctx.restore();
}

/** レア度ジェム（菱形 4 つ）。塗りは fg-2（幻は legend）、空きは sep の輪郭 */
function drawGems(ctx: CanvasRenderingContext2D, rarity: Rarity, x: number, cy: number) {
  const side = 14; // 正方形の一辺（45° 回して菱形にする）
  const half = (side * Math.SQRT2) / 2;
  const step = half * 2 + 7;
  for (let i = 0; i < 4; i++) {
    const cx = x + half + i * step;
    ctx.beginPath();
    ctx.moveTo(cx, cy - half);
    ctx.lineTo(cx + half, cy);
    ctx.lineTo(cx, cy + half);
    ctx.lineTo(cx - half, cy);
    ctx.closePath();
    if (i < rarity) {
      ctx.fillStyle = rarity === 4 ? LIGHT.legend : LIGHT.fg2;
      ctx.fill();
    } else {
      ctx.strokeStyle = LIGHT.sep;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

/** 和名は 64px、入らなければ 52px。図鑑にない生き物の名前はさらに縮め、それでも入らなければ末尾を省く */
function fitName(ctx: CanvasRenderingContext2D, name: string, isSpecies: boolean): string {
  const max = W - 120;
  for (const px of isSpecies ? [64, 52] : [64, 52, 44, 40]) {
    ctx.font = `600 ${px}px ${FONT_JP}`;
    if (ctx.measureText(name).width <= max) return name;
  }
  if (isSpecies) return name; // 和名は省略記号で切らない（62 種はすべて 52px で収まる）
  let s = name;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}

/** 2026年10月10日 */
function dateJa(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * SNS・LINE 共有用の図鑑カード画像を作る（§8.15）。
 * 位置情報（座標）は載せない。希少種は市町村名も載せない。ハッシュタグは画像に入れず、共有テキストに入れる。
 */
export async function renderShareCard(opts: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
}): Promise<Blob> {
  const { sighting, species, photoUrl } = opts;
  const rarity: Rarity = species?.rarity ?? 1;
  const name = species?.name ?? (sighting.customName?.trim() || 'なぞの生き物');
  const no = species ? `No.${String(species.no).padStart(3, '0')}` : '';
  const nickname = sighting.nickname?.trim() ? `「${sighting.nickname.trim()}」` : '';
  const area = sighting.areaId && !species?.sensitive ? AREA_BY_ID[sighting.areaId]?.name : null;
  const meta = `${area ?? '奄美群島'}　${dateJa(sighting.observedAt)}`;
  const brand = 'AMAMI NATURE';

  await loadFonts([
    [`600 30px ${FONT_NUM}`, `${no}${brand}`],
    [`600 64px ${FONT_JP}`, name],
    [`400 36px ${FONT_JP}`, nickname],
    [`400 28px ${FONT_JP}`, meta],
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 地は白。レア度 2〜4 は外周 16px を素材で塗る
  const material = materialFill(ctx, rarity);
  if (material) {
    ctx.fillStyle = material;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = LIGHT.page;
  ctx.fillRect(material ? EDGE : 0, material ? EDGE : 0, material ? W - EDGE * 2 : W, material ? H - EDGE * 2 : H);

  // 写真（1:1 に切り抜く）。なければシルエット、それもなければ番号
  ctx.save();
  roundRect(ctx, PHOTO.x, PHOTO.y, PHOTO.size, PHOTO.size, PHOTO.radius);
  ctx.clip();
  let drewPhoto = false;
  if (photoUrl) {
    try {
      const img = await loadImage(photoUrl);
      const scale = Math.max(PHOTO.size / img.naturalWidth, PHOTO.size / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, PHOTO.x + (PHOTO.size - dw) / 2, PHOTO.y + (PHOTO.size - dh) / 2, dw, dh);
      drewPhoto = true;
    } catch {
      // 読めなければプレートにする
    }
  }
  if (!drewPhoto) await drawPlate(ctx, species);
  ctx.restore();

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // No.005 とジェム
  if (species) {
    ctx.fillStyle = LIGHT.fg3;
    ctx.font = `600 30px ${FONT_NUM}`;
    ctx.fillText(no, 60, 1080);
    drawGems(ctx, species.rarity, 60 + ctx.measureText(no).width + 20, 1080 - 11);
  }

  // 和名
  ctx.fillStyle = LIGHT.fg;
  const shownName = fitName(ctx, name, !!species);
  ctx.fillText(shownName, 60, 1160);

  // ニックネーム
  if (nickname) {
    ctx.fillStyle = LIGHT.fg2;
    ctx.font = `400 36px ${FONT_JP}`;
    ctx.fillText(nickname, 60, 1220);
  }

  // 市町村と日付（希少種は市町村名を出さない）
  ctx.fillStyle = LIGHT.fg3;
  ctx.font = `400 28px ${FONT_JP}`;
  ctx.fillText(meta, 60, 1290);

  // ワードマーク（右下）
  ctx.fillStyle = LIGHT.brand;
  ctx.font = `600 28px ${FONT_NUM}`;
  ctx.textAlign = 'right';
  ctx.fillText(brand, W - 60, 1290);
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
