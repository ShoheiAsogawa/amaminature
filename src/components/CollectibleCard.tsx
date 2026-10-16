import { useRef, type CSSProperties, type PointerEvent } from 'react';
import tatsugoUrl from '../art/tatsugo.svg';
import type { Rarity, Species } from '../data/types';
import { cn } from '../lib/cn';
import { LogoMark } from './Brand';
import { Stars, TYPE_META, TypeBadge } from './game';
import { usePhotoUrl } from './PhotoImg';
import { SpeciesName } from './SpeciesName';
import { SpeciesPlate, speciesNo } from './SpeciesTile';

/** 龍郷柄の地（図鑑カードの裏面・オンボーディング）。地は brand-fill、柄は src/art/tatsugo.svg（40×40） */
export const TATSUGO_STYLE: CSSProperties = {
  backgroundColor: 'rgb(var(--c-brand-fill))',
  backgroundImage: `url("${tatsugoUrl}")`,
  backgroundSize: '40px 40px',
  backgroundPosition: 'calc(50% + 20px) calc(50% + 20px)',
};

/**
 * カードの枠の地（レア度ごと）。よく見る・ときどきはタイプの色、めずらしいは夜光貝の虹色、幻は金箔。
 * 文字は枠の上に置かないので、色のコントラストは問わない。
 */
const FRAME: Record<Rarity, (typeColor: string) => string> = {
  1: (c) => `linear-gradient(160deg, ${c}, ${c})`,
  2: (c) => `linear-gradient(160deg, color-mix(in srgb, ${c} 70%, white), ${c} 45%, color-mix(in srgb, ${c} 75%, black))`,
  3: () => 'linear-gradient(135deg, #7c3aed, #38bdf8 35%, #a78bfa 55%, #f472b6 80%, #7c3aed)',
  4: () => 'linear-gradient(135deg, #8a5a00, #ffd75e 30%, #fff3c4 45%, #e8a400 62%, #ffe08a 80%, #8a5a00)',
};

const TYPE_VAR: Record<Species['category'], string> = {
  mammal: 'rgb(var(--c-type-mammal))',
  bird: 'rgb(var(--c-type-bird))',
  herp: 'rgb(var(--c-type-herp))',
  insect: 'rgb(var(--c-type-insect))',
  aqua: 'rgb(var(--c-type-aqua))',
  plant: 'rgb(var(--c-type-plant))',
};

/** カードの記録の行の日付（2026.10.10） */
function dotDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export type CollectibleCardProps = {
  /** 図鑑にない生き物は null（番号と星を出さず、name を和名の位置に出す） */
  species: Species | null;
  /** ニックネーム（あれば和名の下に「ルリ太郎」） */
  nickname?: string;
  /** species が null の時の名前（sighting.customName）。なければ「なぞの生き物」 */
  name?: string;
  /** 読み込み済みの写真の URL（記録直後の演出） */
  photoUrl?: string | null;
  /** 利用者の写真の photoId（記録詳細）。photoUrl があればそちらを使う */
  photoId?: string | null;
  /** 観察した日時（ISO） */
  observedAt?: string;
  /** 観察した市町村名。希少種（sensitive）は出さない */
  areaName?: string | null;
  /** 枠を大島紬（龍郷柄）にする（AMAMI NATURE+ の限定フレーム） */
  frame?: 'tsumugi';
  /** 暗い舞台の上（演出）。下の影を付けない（舞台は暗く、裏返る 3D の中では filter を使わない） */
  onStage?: boolean;
  /** 指の動きでカードを傾け、ホロを動かす（めずらしい・幻） */
  tilt?: boolean;
  className?: string;
};

/**
 * 図鑑カード（トレーディングカード風）。280×392、角は 3 段の段々（px-clip-3）。
 * 枠はタイプの色（めずらしいは虹、幻は金）。白い面と写真の窓も段々に切り抜く。上に名前と HP の代わりの図鑑番号、写真の窓、
 * タイプと星、ニックネーム、記録の日付と場所。めずらしい・幻はホロ加工が光る。
 */
export function CollectibleCard({
  species,
  nickname,
  name,
  photoUrl,
  photoId,
  observedAt,
  areaName,
  frame,
  onStage = false,
  tilt = false,
  className,
}: CollectibleCardProps) {
  const rarity: Rarity = species?.rarity ?? 1;
  const displayName = species?.name ?? (name?.trim() || 'なぞの生き物');
  const unknownLoaded = usePhotoUrl(species || photoUrl ? null : photoId, 'full');
  const unknownSrc = species ? null : (photoUrl ?? unknownLoaded);
  const place = species?.sensitive ? null : areaName;
  const typeColor = species ? TYPE_VAR[species.category] : 'rgb(var(--c-fg-3))';
  const holo = !!species && rarity >= 3;
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!tilt || !el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.transform = `perspective(900px) rotateY(${(x - 0.5) * 16}deg) rotateX(${(0.5 - y) * 16}deg)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  };

  // color-mix() が使えない古い端末では backgroundImage が無効になり、タイプの単色の枠になる
  const frameStyle: CSSProperties = frame ? TATSUGO_STYLE : { backgroundColor: typeColor, backgroundImage: FRAME[rarity](typeColor) };

  return (
    // 切り抜いたカードは自分の影を描けないので、外側の箱に段々に沿った固い影（下 6px）を付ける
    <div className={cn('shrink-0', !onStage && '[filter:drop-shadow(0_6px_0_rgb(0_0_0/.18))]')}>
      <div
        ref={ref}
        data-rarity={rarity}
        onPointerMove={tilt ? onMove : undefined}
        onPointerLeave={tilt ? onLeave : undefined}
        className={cn('px-clip-3 relative flex min-h-[392px] w-[280px] shrink-0 flex-col p-1.5 transition-transform duration-150 ease-out', className)}
        style={frameStyle}
      >
        {/* 白い面の縁（1 ドット。枠の色に白を 70% 重ねた明るい線）。カードの段々の 2 ドット内側に、1 段の段々で重ねて枠の太さをそろえる */}
        <div className="px-clip-1 flex flex-1 flex-col bg-white/70 p-[3px]">
          <div className="relative flex flex-1 flex-col overflow-hidden bg-surface">
            {/* 名前の帯 */}
            <div className="flex items-center gap-2 px-3 pb-1.5 pt-2">
              <SpeciesName species={species ?? undefined} name={displayName} className="min-w-0 flex-1 text-[16px] font-black leading-6 text-fg" />
              {species && (
                <span className="num shrink-0 text-[18px] leading-6" style={{ color: typeColor }} aria-label={`No.${speciesNo(species)}`}>
                  No.{speciesNo(species)}
                </span>
              )}
            </div>
            {/* 写真の窓（タイプの色の 1 ドットの線。外側の段々に内側の段々を重ねて、線の太さをそろえる） */}
            <div className="px-clip-2 mx-2.5 p-[3px]" style={{ backgroundColor: typeColor }}>
              {species ? (
                <SpeciesPlate
                  species={species}
                  photoUrl={photoUrl}
                  photoId={photoId}
                  photoSize="full"
                  patternSize="large"
                  className="px-clip-1 h-[189px] w-full"
                />
              ) : (
                <div className="px-clip-1 relative h-[189px] w-full bg-fill">
                  {unknownSrc && <img src={unknownSrc} alt="" draggable={false} className="photo absolute inset-0 h-full w-full object-cover" />}
                </div>
              )}
            </div>
            {/* タイプと星 */}
            <div className="flex items-center justify-between gap-2 px-3 pt-2.5">
              {species ? <TypeBadge category={species.category} size="sm" /> : <span className="text-caption text-fg-3">図鑑にない生き物</span>}
              {species && <Stars rarity={species.rarity} size={15} />}
            </div>
            {nickname && (
              <div className="px-clip-1 mx-3 mt-2 truncate bg-fill px-3 py-1 text-center text-sub font-black text-fg">「{nickname}」</div>
            )}
            {species && (
              <p className={cn('mx-3 mt-2 border-t-2 border-dashed border-sep pt-1.5 text-[12px] font-bold leading-[16px] text-fg-2', nickname ? 'line-clamp-2' : 'line-clamp-3')}>
                {species.description}
              </p>
            )}
            <div className="mt-auto flex items-end justify-between gap-2 px-3 pb-2.5 pt-2">
              <span className="num min-w-0 truncate text-[12px] leading-4 text-fg-3">
                {observedAt && dotDate(observedAt)}
                {observedAt && place && '　'}
                {place && <span>{place}</span>}
              </span>
              <LogoMark size={16} className={species ? TYPE_META[species.category].text : 'text-fg-3'} />
            </div>
            {holo && (
              <>
                <span aria-hidden className="holo" />
                <span aria-hidden className="holo-sparkle" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 紋章の丸の大きさ（直径）ごとのドット絵の丸 */
function emblemCircle(d: number): string {
  return d >= 76 ? 'px-circle-xl' : d >= 52 ? 'px-circle-l' : 'px-circle-m';
}

/**
 * 図鑑カードの裏面。瑠璃の地に龍郷柄、中央に白い円の紋章とブランドの印。文字はなし。
 * 角は表と同じ 3 段の段々（px-clip-3）。縁（白、幻は金）は 2 ドットで、柄の面は 1 段の段々（表の白い面と同じ形）。
 * 紋章はドット絵の丸を重ねる（半透明の光の輪、白い線、瑠璃の中）。
 */
export function CollectibleCardBack({
  markSize = 48,
  legend = false,
  className,
}: {
  /** 暗い舞台の上（演出）。表と同じく、影は付けない（裏返る 3D の中では filter を使わない） */
  onStage?: boolean;
  markSize?: number;
  /** 「幻」の種のカード（金の縁） */
  legend?: boolean;
  className?: string;
}) {
  const d = markSize * 2;
  return (
    <div aria-hidden className={cn('px-clip-3 grid h-[392px] w-[280px] shrink-0 p-1.5', legend ? 'bg-gold' : 'bg-white', className)}>
      <div className="px-clip-1 grid place-items-center overflow-hidden" style={TATSUGO_STYLE}>
        <span className="relative grid place-items-center text-white" style={{ width: d, height: d }}>
          {/* 光の輪（外へ 2 ドット）、白い線（1 ドット）、瑠璃の中 */}
          <span className={cn('absolute -inset-[6px] bg-white/25', emblemCircle(d + 12))} />
          <span className={cn('absolute inset-0 bg-white', emblemCircle(d))} />
          <span className={cn('absolute inset-[3px] bg-brand-pressed', emblemCircle(d - 6))} />
          <LogoMark size={markSize} className="relative text-white" />
        </span>
      </div>
    </div>
  );
}
