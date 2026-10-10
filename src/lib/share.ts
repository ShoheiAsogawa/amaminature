import { AREA_BY_ID } from '../data/areas';
import { CATEGORY_META, RARITY_META } from '../data/species';
import type { Species } from '../data/types';
import { api } from './api';
import { shareToLine } from './liff';
import type { Sighting } from './types';

const W = 1080;
const H = 1350;

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

/**
 * SNS・LINE共有用の図鑑カード画像を作る。
 * 位置情報（座標）は載せない。希少種は市町村名も載せない。
 */
export async function renderShareCard(opts: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
}): Promise<Blob> {
  const { sighting, species, photoUrl } = opts;
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = '#0E2A20';
  ctx.fillRect(0, 0, W, H);

  // 写真（カバー）
  const px = 60;
  const py = 60;
  const pw = W - 120;
  const ph = 1000;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 36);
  ctx.clip();
  if (photoUrl) {
    const img = await loadImage(photoUrl);
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = species ? CATEGORY_META[species.category].color : '#1E4D3A';
    ctx.fillRect(px, py, pw, ph);
  }
  const grad = ctx.createLinearGradient(0, py + ph * 0.45, 0, py + ph);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();

  // 金の枠（幻）
  if (species?.rarity === 4) {
    ctx.strokeStyle = '#C79A2E';
    ctx.lineWidth = 6;
    roundRect(ctx, px, py, pw, ph, 36);
    ctx.stroke();
  }

  // 種名・ニックネーム
  const name = species?.name ?? sighting.customName ?? 'なぞの生き物';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = 'italic 600 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(species ? `No.${String(species.no).padStart(3, '0')}  ${species.sci}` : 'Unknown', px + 48, py + ph - 200);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 76px "Shippori Mincho", serif';
  ctx.fillText(name, px + 48, py + ph - 110);
  if (sighting.nickname) {
    ctx.font = '700 40px "Zen Kaku Gothic New", sans-serif';
    ctx.fillStyle = '#F2D58A';
    ctx.fillText(`「${sighting.nickname}」`, px + 36, py + ph - 48);
  }

  // フッター
  const d = new Date(sighting.observedAt);
  const area = sighting.areaId && !species?.sensitive ? AREA_BY_ID[sighting.areaId]?.name : null;
  ctx.fillStyle = '#F6F1E7';
  ctx.font = '700 30px "Zen Kaku Gothic New", sans-serif';
  ctx.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}${area ? `  ·  ${area}` : '  ·  奄美群島'}`, 60, 1150);
  if (species) {
    ctx.fillStyle = '#C79A2E';
    ctx.font = '700 28px "Zen Kaku Gothic New", sans-serif';
    ctx.fillText(`${RARITY_META[species.rarity].en} · ${RARITY_META[species.rarity].label}`, 60, 1200);
  }
  ctx.fillStyle = 'rgba(246,241,231,0.9)';
  ctx.font = '700 30px "Zen Kaku Gothic New", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('AMAMI NATURE', W - 60, 1150);
  ctx.fillStyle = 'rgba(246,241,231,0.55)';
  ctx.font = '500 24px "Zen Kaku Gothic New", sans-serif';
  ctx.fillText('#奄美いきものコレクション', W - 60, 1200);
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
