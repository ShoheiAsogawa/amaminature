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
  /** 暗い舞台の上（演出）。影を付ける */
  onStage?: boolean;
  /** 指の動きでカードを傾け、ホロを動かす（めずらしい・幻） */
  tilt?: boolean;
  className?: string;
};

/**
 * 図鑑カード（トレーディングカード風）。280×392、角丸 20。
 * 枠はタイプの色（めずらしいは虹、幻は金）。上に名前と HP の代わりの図鑑番号、写真の窓、
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
    <div
      ref={ref}
      data-rarity={rarity}
      onPointerMove={tilt ? onMove : undefined}
      onPointerLeave={tilt ? onLeave : undefined}
      className={cn(
        'relative flex min-h-[392px] w-[280px] shrink-0 flex-col rounded-[20px] p-2 transition-transform duration-150 ease-out',
        onStage ? 'shadow-object' : 'shadow-[0_6px_0_rgb(0_0_0/.18)]',
        className,
      )}
      style={frameStyle}
    >
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[14px] border-2 border-white/70 bg-surface">
        {/* 名前の帯 */}
        <div className="flex items-center gap-2 px-3 pb-1.5 pt-2">
          <SpeciesName species={species ?? undefined} name={displayName} className="min-w-0 flex-1 text-[19px] font-black leading-6 text-fg" />
          {species && (
            <span className="num shrink-0 text-[18px] leading-6" style={{ color: typeColor }} aria-label={`No.${speciesNo(species)}`}>
              No.{speciesNo(species)}
            </span>
          )}
        </div>
        {/* 写真の窓 */}
        <div className="mx-2.5 overflow-hidden rounded-[10px] border-[3px]" style={{ borderColor: typeColor }}>
          {species ? (
            <SpeciesPlate
              species={species}
              photoUrl={photoUrl}
              photoId={photoId}
              photoSize="full"
              patternSize="large"
              className="aspect-[5/4] w-full"
            />
          ) : (
            <div className="relative aspect-[5/4] w-full bg-fill">
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
          <div className="mx-3 mt-2 truncate rounded-full bg-fill px-3 py-1 text-center text-sub font-black text-fg">「{nickname}」</div>
        )}
        {species && (
          <p className={cn('mx-3 mt-2 border-t-2 border-dashed border-sep pt-1.5 text-[11px] font-bold leading-[16px] text-fg-2', nickname ? 'line-clamp-2' : 'line-clamp-3')}>
            {species.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 px-3 pb-2.5 pt-2">
          <span className="num min-w-0 truncate text-[12px] leading-4 text-fg-3">
            {observedAt && dotDate(observedAt)}
            {observedAt && place && '　'}
            {place && <span className="font-sans font-bold">{place}</span>}
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
  );
}

/**
 * 図鑑カードの裏面。瑠璃の地に龍郷柄、中央に白い円の紋章とブランドの印。文字はなし。
 */
export function CollectibleCardBack({
  onStage = false,
  markSize = 48,
  legend = false,
  className,
}: {
  onStage?: boolean;
  markSize?: number;
  /** 「幻」の種のカード（金の縁） */
  legend?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn('grid h-[392px] w-[280px] shrink-0 place-items-center overflow-hidden rounded-[20px] border-[6px]', legend ? 'border-gold' : 'border-white', onStage && 'shadow-object', className)}
      style={TATSUGO_STYLE}
    >
      <span
        className="grid place-items-center rounded-full border-4 border-white bg-brand-pressed text-white"
        style={{ width: markSize * 2, height: markSize * 2, boxShadow: '0 0 0 6px rgb(255 255 255 / .25)' }}
      >
        <LogoMark size={markSize} className="text-white" />
      </span>
    </div>
  );
}
