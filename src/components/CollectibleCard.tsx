import type { CSSProperties } from 'react';
import tatsugoUrl from '../art/tatsugo.svg';
import type { Rarity, Species } from '../data/types';
import { cn } from '../lib/cn';
import { LogoMark } from './Brand';
import { usePhotoUrl } from './PhotoImg';
import { SpeciesName } from './SpeciesName';
import { SpeciesPlate, speciesNo } from './SpeciesTile';
import { RarityGems } from './ui';

/**
 * 図鑑カードの縁の素材（§2.6）。レア度 1 は素材なし（1px の sep の枠）。
 * 素材の値は index.css の --mat-*（テーマごとに固定）。図鑑カード以外では使わない。
 */
const MATERIAL: Record<Rarity, { name: string; bg: string } | null> = {
  1: null,
  2: { name: 'dorozome', bg: 'var(--mat-dorozome)' },
  3: { name: 'yakougai', bg: 'var(--mat-yakougai)' },
  4: { name: 'kinpaku', bg: 'var(--mat-kinpaku)' },
};

/** 龍郷柄の地（図鑑カードの裏面）。地は brand-fill、柄は src/art/tatsugo.svg（40×40） */
export const TATSUGO_STYLE: CSSProperties = {
  backgroundColor: 'rgb(var(--c-brand-fill))',
  backgroundImage: `url("${tatsugoUrl}")`,
  backgroundSize: '40px 40px',
  // カードの中心を柄の継ぎ目（四隅の菱形の中）に合わせ、中央のシダが塗りの菱形に重ならないようにする
  backgroundPosition: 'calc(50% + 20px) calc(50% + 20px)',
};

/** カードの記録の行の日付（2026.10.10） */
function dotDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export type CollectibleCardProps = {
  /** 図鑑にない生き物は null（番号とジェムを出さず、name を和名の位置に出す） */
  species: Species | null;
  /** ニックネーム（あれば和名の下に「ルリ太郎」） */
  nickname?: string;
  /** species が null の時の名前（sighting.customName）。なければ「なぞの生き物」 */
  name?: string;
  /** 読み込み済みの写真の URL（記録直後の演出） */
  photoUrl?: string | null;
  /** 利用者の写真の photoId（記録詳細）。photoUrl があればそちらを使う */
  photoId?: string | null;
  /** 観察した日時（ISO）。帯の下に「2026.10.10」と入れ、この記録の 1 枚にする */
  observedAt?: string;
  /** 観察した市町村名。希少種（sensitive）は共有画像と同じく出さない */
  areaName?: string | null;
  /** 縁を大島紬（龍郷柄）にする（AMAMI NATURE+ の限定フレーム） */
  frame?: 'tsumugi';
  /** 黒い舞台の上（演出・バッジ獲得）。shadow-object を付ける。ページの上では付けない */
  onStage?: boolean;
  className?: string;
};

/**
 * 図鑑カード（docs/DESIGN_SYSTEM.md §7.21）。アプリの中で唯一の「カード」で、唯一の大胆な要素。
 * 280×392、rounded-lg。外枠はレア度の素材（パディング 6px の縁。マスク合成は使わない）。
 * 泥染には静止した染めむらの粒子を重ね、縁の外周に 1px の明るい線を引いて素材として見せる。
 * 表面: 上に写真 1:1（角丸なし、写真の上に文字を置かない）。下の帯に、ジェムと右寄せの図鑑番号（num-l）、
 * 和名（title）、ニックネーム、記録の行（日付と市町村）と右下のシダの印。
 * 生の ID（sighting.id）は描画しない。
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
  className,
}: CollectibleCardProps) {
  const rarity: Rarity = species?.rarity ?? 1;
  const material = frame ? { name: 'tsumugi', bg: '' } : MATERIAL[rarity];
  const displayName = species?.name ?? (name?.trim() || 'なぞの生き物');
  // 図鑑にない生き物の写真（species がないので SpeciesPlate を使えない）
  const unknownLoaded = usePhotoUrl(species || photoUrl ? null : photoId, 'full');
  const unknownSrc = species ? null : (photoUrl ?? unknownLoaded);
  const place = species?.sensitive ? null : areaName;

  return (
    <div
      data-rarity={rarity}
      data-material={material?.name}
      className={cn(
        'flex min-h-[392px] w-[280px] shrink-0 flex-col rounded-lg',
        material ? (frame ? 'card-rim p-2.5' : 'card-rim p-1.5') : 'overflow-hidden border border-sep bg-surface',
        onStage && 'shadow-object',
        className,
      )}
      style={frame ? { ['--rim' as string]: 'transparent', ...TATSUGO_STYLE } : material ? { ['--rim' as string]: material.bg } : undefined}
    >
      {/* 帯だけを surface で塗る（内側の角に surface の白がにじまないように）。縁との境に 1px の濃い線を入れて、写真を額に収める */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          material && 'overflow-hidden shadow-[0_0_0_1px_rgb(0_0_0/.22)]',
          material && (frame ? 'rounded-[6px]' : 'rounded-sm'),
        )}
      >
        {species ? (
          <SpeciesPlate species={species} photoUrl={photoUrl} photoId={photoId} photoSize="full" patternSize="large" className="aspect-square w-full" />
        ) : (
          <div className="relative aspect-square w-full bg-fill">
            {unknownSrc && <img src={unknownSrc} alt="" draggable={false} className="photo absolute inset-0 h-full w-full object-cover" />}
          </div>
        )}
        <div className="flex flex-1 flex-col bg-surface px-3.5 pb-2.5 pt-2.5">
          {species && (
            <div className="flex h-[26px] items-center justify-between gap-2">
              <RarityGems rarity={species.rarity} />
              <span className="num text-num-l text-fg-3" aria-label={`No.${speciesNo(species)}`}>
                {speciesNo(species)}
              </span>
            </div>
          )}
          <SpeciesName species={species ?? undefined} name={displayName} className="text-title text-fg" />
          {nickname && <div className="truncate text-sub text-fg-2">「{nickname}」</div>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <span className="num min-w-0 truncate text-caption text-fg-3">
              {observedAt && dotDate(observedAt)}
              {observedAt && place && '　'}
              {place}
            </span>
            <LogoMark size={14} className="text-fg-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 図鑑カードの裏面（§7.21・§6）。brand-fill の地に龍郷柄、中央にブランドの印 48（白、不透明度 70%）。文字はなし。
 */
export function CollectibleCardBack({
  onStage = false,
  markSize = 48,
  legend = false,
  className,
}: {
  onStage?: boolean;
  /** 中央の印の大きさ（小さく見せる時） */
  markSize?: number;
  /** 「幻」の種のカード（内側に 2px の legend の線） */
  legend?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn('grid h-[392px] w-[280px] shrink-0 place-items-center overflow-hidden rounded-lg', onStage && 'shadow-object', className)}
      style={legend ? { ...TATSUGO_STYLE, boxShadow: 'inset 0 0 0 2px rgb(var(--c-legend))' } : TATSUGO_STYLE}
    >
      <LogoMark size={markSize} className="text-white/70" />
    </div>
  );
}
