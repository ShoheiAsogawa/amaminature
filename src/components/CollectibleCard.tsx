import { m, type Transition } from 'framer-motion';
import type { CSSProperties } from 'react';
import tatsugoUrl from '../art/tatsugo.svg';
import type { Rarity, Species } from '../data/types';
import { cn } from '../lib/cn';
import { IconAmamiFern } from './icons';
import { usePhotoUrl } from './PhotoImg';
import { SpeciesName } from './SpeciesName';
import { SpeciesPlate, speciesNo } from './SpeciesTile';
import { RarityGems } from './ui';

/**
 * 図鑑カードの縁の素材（§2.6）。レア度 1 は素材なし（1px の sep の枠）。
 * 素材の値は index.css の --mat-*（テーマごとに固定）。図鑑カード以外では使わない。
 */
const MATERIAL: Record<Rarity, string | null> = {
  1: null,
  2: 'var(--mat-dorozome)',
  3: 'var(--mat-yakougai)',
  4: 'var(--mat-kinpaku)',
};

/** 龍郷柄の地（図鑑カードの裏面）。地は brand-fill、柄は src/art/tatsugo.svg（40×40） */
export const TATSUGO_STYLE: CSSProperties = {
  backgroundColor: 'rgb(var(--c-brand-fill))',
  backgroundImage: `url("${tatsugoUrl}")`,
  backgroundSize: '40px 40px',
  // カードの中心を柄の継ぎ目（四隅の菱形の中）に合わせ、中央のシダが塗りの菱形に重ならないようにする
  backgroundPosition: 'calc(50% + 20px) calc(50% + 20px)',
};

export type CollectibleCardProps = {
  /** 図鑑にない生き物は null（番号とジェムを出さず、name を和名の位置に出す） */
  species: Species | null;
  /** ニックネーム（あれば 3 行目に「ルリ太郎」） */
  nickname?: string;
  /** species が null の時の名前（sighting.customName）。なければ「なぞの生き物」 */
  name?: string;
  /** 読み込み済みの写真の URL（記録直後の演出） */
  photoUrl?: string | null;
  /** 利用者の写真の photoId（記録詳細）。photoUrl があればそちらを使う */
  photoId?: string | null;
  /** 黒い舞台の上（演出・バッジ獲得）。shadow-object を付ける。ページの上では付けない */
  onStage?: boolean;
  className?: string;
};

/**
 * 図鑑カード（docs/DESIGN_SYSTEM.md §7.21）。アプリの中で唯一の「カード」で、唯一の大胆な要素。
 * 280×392、rounded-lg。外枠はレア度の素材（パディング 4px の縁。マスク合成は使わない）。
 * 表面: 上に写真 1:1（角丸なし、写真の上に文字を置かない）、下の帯に No.005 とジェム／和名（title）／ニックネーム。
 * 生の ID（sighting.id）は描画しない。
 */
export function CollectibleCard({ species, nickname, name, photoUrl, photoId, onStage = false, className }: CollectibleCardProps) {
  const rarity: Rarity = species?.rarity ?? 1;
  const material = MATERIAL[rarity];
  const displayName = species?.name ?? (name?.trim() || 'なぞの生き物');
  // 図鑑にない生き物の写真（species がないので SpeciesPlate を使えない）
  const unknownLoaded = usePhotoUrl(species || photoUrl ? null : photoId, 'full');
  const unknownSrc = species ? null : (photoUrl ?? unknownLoaded);

  return (
    <div
      data-rarity={rarity}
      className={cn(
        'flex min-h-[392px] w-[280px] shrink-0 flex-col rounded-lg',
        material ? 'p-1' : 'overflow-hidden border border-sep bg-surface',
        onStage && 'shadow-object',
        className,
      )}
      style={material ? { background: material } : undefined}
    >
      <div className={cn('flex flex-1 flex-col bg-surface', material && 'overflow-hidden rounded-md')}>
        {species ? (
          <SpeciesPlate species={species} photoUrl={photoUrl} photoId={photoId} photoSize="full" numberSize="large" className="aspect-square w-full" />
        ) : (
          <div className="relative aspect-square w-full bg-fill">
            {unknownSrc && <img src={unknownSrc} alt="" draggable={false} className="photo absolute inset-0 h-full w-full object-cover" />}
          </div>
        )}
        <div className="flex flex-1 flex-col justify-center gap-1 px-3.5 py-3">
          {species && (
            <div className="flex items-center gap-2">
              <span className="num text-caption text-fg-3">No.{speciesNo(species)}</span>
              <RarityGems rarity={species.rarity} />
            </div>
          )}
          <SpeciesName species={species ?? undefined} name={displayName} className="text-title text-fg" />
          {nickname && <div className="truncate text-sub text-fg-2">「{nickname}」</div>}
        </div>
      </div>
    </div>
  );
}

/**
 * 図鑑カードの裏面（§7.21・§6）。brand-fill の地に龍郷柄、中央に amami:fern 48（白、不透明度 70%）。文字はなし。
 */
export function CollectibleCardBack({ onStage = false, className }: { onStage?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('grid h-[392px] w-[280px] shrink-0 place-items-center overflow-hidden rounded-lg', onStage && 'shadow-object', className)}
      style={TATSUGO_STYLE}
    >
      <IconAmamiFern size={48} className="text-white/70" />
    </div>
  );
}

export type CollectibleCardFlipProps = CollectibleCardProps & {
  /** 見せる面。'back' → 'front' に変えると Y 軸で 1 回裏返る（600ms、cubic-bezier(.2,.8,.2,1)。§9） */
  side: 'front' | 'back';
  /** 裏返しの動きを差し替える時 */
  transition?: Transition;
  /** 裏返し終わった時 */
  onFlipped?: () => void;
};

/**
 * 表と裏を重ねた図鑑カード（記録時の演出用）。side を変えると裏返る。
 * 動きを減らす設定では framer-motion（MotionConfig reducedMotion="user"）が回転を止め、すぐに切り替わる。
 */
export function CollectibleCardFlip({ side, transition, onFlipped, className, ...card }: CollectibleCardFlipProps) {
  return (
    <div className={cn('w-[280px]', className)} style={{ perspective: 1200 }}>
      <m.div
        className="relative [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: side === 'back' ? 180 : 0 }}
        transition={transition ?? { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        onAnimationComplete={onFlipped}
      >
        <div className="[backface-visibility:hidden]" aria-hidden={side === 'back'}>
          <CollectibleCard {...card} />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CollectibleCardBack onStage={card.onStage} className="h-full" />
        </div>
      </m.div>
    </div>
  );
}
