export interface ProcessedPhoto {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
  takenAt: Date | null;
  lat: number | null;
  lng: number | null;
}

const FULL_MAX = 1600;
const THUMB_MAX = 480;

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // 一部ブラウザはオプション非対応 → <img> にフォールバック
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function drawScaled(src: ImageBitmap | HTMLImageElement, max: number, quality: number) {
  const w = 'naturalWidth' in src ? src.naturalWidth : src.width;
  const h = 'naturalHeight' in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, cw, ch);
  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve({ blob: b, width: cw, height: ch }) : reject(new Error('画像の変換に失敗しました'))),
      'image/jpeg',
      quality,
    ),
  );
}

async function readExif(file: Blob): Promise<{ takenAt: Date | null; lat: number | null; lng: number | null }> {
  try {
    const { default: exifr } = await import('exifr');
    // latitude / longitude は exifr が GPS の生のタグから計算する値なので、pick には生のタグを書く（書かないと GPS を読まない）
    const data = await exifr.parse(file, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef'],
    });
    const takenAt = data?.DateTimeOriginal ?? data?.CreateDate ?? null;
    return {
      takenAt: takenAt instanceof Date && !isNaN(takenAt.getTime()) ? takenAt : null,
      lat: typeof data?.latitude === 'number' ? data.latitude : null,
      lng: typeof data?.longitude === 'number' ? data.longitude : null,
    };
  } catch {
    return { takenAt: null, lat: null, lng: null };
  }
}

/**
 * 端末内で写真を縮小・再エンコードする。
 * 再エンコードにより元写真のEXIF（GPS座標など）は保存データから取り除かれる。
 */
export async function processPhoto(file: Blob): Promise<ProcessedPhoto> {
  const [exif, bitmap] = await Promise.all([readExif(file), loadBitmap(file)]);
  const full = await drawScaled(bitmap, FULL_MAX, 0.86);
  const thumb = await drawScaled(bitmap, THUMB_MAX, 0.8);
  if ('close' in bitmap) bitmap.close();
  return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height, ...exif };
}

/** AI判定に送るための縮小JPEG（base64, data: プレフィックスなし） */
export async function toAiPayload(blob: Blob, max = 1024): Promise<string> {
  const bitmap = await loadBitmap(blob);
  const { blob: small } = await drawScaled(bitmap, max, 0.82);
  if ('close' in bitmap) bitmap.close();
  const buf = new Uint8Array(await small.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buf.length; i += 0x8000) {
    binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
