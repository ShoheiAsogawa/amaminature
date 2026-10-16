import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Species } from '../data/types';
import { cn } from '../lib/cn';
import { sfx } from '../lib/sfx';
import { Stars, TYPE_META } from './game';
import { usePhotoUrl } from './PhotoImg';
import { HIDDEN_NAME_LABEL, SpeciesName } from './SpeciesName';

// ───────── 図像（§6） ─────────

/**
 * 種のシルエット（src/art/sil/{species.id}.svg、viewBox 0 0 100 100、1 パスの塗り）。
 * 置けば自動で使われる。まだ 1 点もないので、今は番号だけのプレートになる。
 */
const SILHOUETTES = import.meta.glob<string>('../art/sil/*.svg', { eager: true, query: '?url', import: 'default' });

export function silhouetteUrl(speciesId: string): string | null {
  return SILHOUETTES[`../art/sil/${speciesId}.svg`] ?? null;
}

/** 種の参考写真（species.photo = { src, credit }。提携先・環境省・CC BY のもの） */
export function referencePhoto(species: Species): { src: string; credit?: string } | null {
  return species.photo ?? null;
}

/** 図鑑番号（No.005 の 005） */
export function speciesNo(species: Pick<Species, 'no'>): string {
  return String(species.no).padStart(3, '0');
}

// 学名のうち立体（not-italic）にする語。階級の略記（sp. / spp. / subsp. / var. / cf. など）
const SCI_UPRIGHT = /^(spp?\.|subsp\.|ssp\.|var\.|f\.|cf\.|aff\.)$/;

/**
 * 学名（§3.6）。<i lang="la" className="sci"> で書き、属名・種小名はイタリック、
 * 命名者・年・sp. / subsp. / var. / cf. は立体にする。省略記号で切らない。
 * 大きさは className で決める（種詳細 text-callout = 15/22、行 text-sub leading-[18px] = 13/18）。
 */
export function SciName({ sci, className }: { sci: string; className?: string }) {
  const words = sci.trim().split(/\s+/);
  return (
    <i lang="la" className={cn('sci', className)}>
      {words.map((w, i) => {
        // 2 語目以降の大文字で始まる語（命名者）と数字（年）、階級の略記は立体
        const upright = SCI_UPRIGHT.test(w) || /\d/.test(w) || (i > 0 && /^\(?[A-Z]/.test(w));
        return (
          <span key={i}>
            {i > 0 && ' '}
            {upright ? <span className="not-italic">{w}</span> : w}
          </span>
        );
      })}
    </i>
  );
}

/** 「？」の大きさの目安（tile: 図鑑のタイル、thumb: 行のサムネイル 40〜56、large: 図鑑カード・ヒーロー） */
export type PatternSize = 'tile' | 'thumb' | 'large';

const MYSTERY_SIZE: Record<PatternSize, string> = { tile: 'text-[44px]', thumb: 'text-[26px]', large: 'text-[96px]' };

/**
 * まだ見つけていない種のプレート（ゲームの「？」）。灰青の地に白い「？」と、タイプのアイコン。
 * 幻の種は金色の地にして、特別な種だとわかるようにする。
 */
export function FaceDown({
  legend = false,
  size = 'tile',
  category,
  className,
}: {
  legend?: boolean;
  size?: PatternSize;
  category?: Species['category'];
  className?: string;
}) {
  const TypeIcon = category ? TYPE_META[category].icon : null;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 grid place-items-center overflow-hidden',
        legend ? 'bg-gradient-to-br from-gold-soft to-gold/40' : 'bg-gradient-to-br from-fill to-fill-strong',
        className,
      )}
    >
      <span
        className={cn('num leading-none', MYSTERY_SIZE[size], legend ? 'text-gold-edge' : 'text-white dark:text-fg-3')}
        style={{ textShadow: legend ? '0 3px 0 rgb(255 255 255 / .6)' : '0 3px 0 rgb(var(--c-edge))' }}
      >
        ?
      </span>
      {TypeIcon && size !== 'thumb' && (
        <TypeIcon size={size === 'large' ? 28 : 16} className={cn('absolute left-[8%] top-[8%]', legend ? 'text-gold-edge/70' : 'text-fg-3/60')} />
      )}
    </span>
  );
}

export type SpeciesPlateProps = {
  species: Species;
  /** 利用者の写真（IndexedDB / R2 の photoId） */
  photoId?: string | null;
  /** すでに読み込んだ写真の URL（記録直後の演出など） */
  photoUrl?: string | null;
  /** 記録済みか。未発見なら参考写真は使わず、シルエットか「？」にする */
  discovered?: boolean;
  /** 未発見でも参考写真を使う（記録の名前を選ぶ段階だけ。図鑑・ホーム・種詳細では、未発見の種に参考写真を出さない） */
  showReference?: boolean;
  /** 「？」の大きさ（tile: 図鑑のタイル、thumb: 行のサムネイル 40〜56、large: 図鑑カード・ヒーロー） */
  patternSize?: PatternSize;
  /** 写真の解像度 */
  photoSize?: 'thumb' | 'full';
  /** 写真の代替テキスト。省くと飾り（alt=""）。種詳細のヒーローは、記録済みなら和名、未発見なら「まだ見つけていない生き物」 */
  alt?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * 種のプレート（1:1 の絵の部分）。種タイル、行のサムネイル、図鑑カードで共通。
 * 利用者の写真 → 参考写真 → シルエット（ゲームの影）→「？」の順。
 */
export function SpeciesPlate({
  species,
  photoId,
  photoUrl,
  discovered = true,
  showReference = false,
  patternSize = 'tile',
  photoSize = 'thumb',
  alt = '',
  className,
  style,
  children,
}: SpeciesPlateProps) {
  const loaded = usePhotoUrl(photoUrl ? null : photoId, photoSize);
  const ref = discovered || showReference ? referencePhoto(species) : null;
  const src = photoUrl ?? loaded ?? (photoId ? null : (ref?.src ?? null));
  const waiting = !src && !!photoId; // 利用者の写真を読み込み中
  const sil = !src && !waiting ? silhouetteUrl(species.id) : null;
  const silStyle: CSSProperties | undefined = sil
    ? {
        WebkitMaskImage: `url("${sil}")`,
        maskImage: `url("${sil}")`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }
    : undefined;

  return (
    <div className={cn('relative grid place-items-center overflow-hidden bg-fill', className)} style={style}>
      {src ? (
        <img src={src} alt={alt} draggable={false} className="photo absolute inset-0 h-full w-full object-cover" />
      ) : sil ? (
        <>
          <span aria-hidden className={cn('absolute inset-0', discovered ? TYPE_META[species.category].soft : 'bg-gradient-to-br from-fill to-fill-strong')} />
          <span aria-hidden className={cn('relative block aspect-square w-[72%]', discovered ? TYPE_META[species.category].bg : 'bg-silhouette')} style={silStyle} />
        </>
      ) : waiting ? null : (
        <FaceDown legend={species.rarity === 4} size={patternSize} category={species.category} />
      )}
      {children}
    </div>
  );
}

/**
 * 行のサムネイル（40 / 48 / 56、角は 2 段の段々 px-clip-2）。ListRow の leading に置き、thumbSize に同じ大きさを渡す。
 * 記録の名前を選ぶ段階は showReference（利用者の写真 → 参考写真 → シルエット →「？」の順）。
 */
export function SpeciesThumb({
  species,
  photoId,
  size = 56,
  discovered = true,
  showReference = false,
  className,
}: {
  species: Species;
  photoId?: string | null;
  size?: 40 | 48 | 56;
  discovered?: boolean;
  showReference?: boolean;
  className?: string;
}) {
  return (
    <SpeciesPlate
      species={species}
      photoId={photoId}
      discovered={discovered}
      showReference={showReference}
      patternSize="thumb"
      className={cn('px-clip-2 shrink-0', size === 56 ? 'h-14 w-14' : size === 48 ? 'h-12 w-12' : 'h-10 w-10', className)}
    />
  );
}

// ───────── 種タイル ─────────

/** 記録済みのタイルの枠（線がタイプの色のドット絵の枠）。枠は絵なので、色ごとのクラス名をそのまま書く */
const TILE_FRAME: Record<Species['category'], string> = {
  mammal: 'px-tile-mammal',
  bird: 'px-tile-bird',
  herp: 'px-tile-herp',
  insect: 'px-tile-insect',
  aqua: 'px-tile-aqua',
  plant: 'px-tile-plant',
};

export type SpeciesTileProps = {
  species: Species;
  /** 記録済みの時の利用者の写真 */
  photoId?: string | null;
  /** 記録した回数（読み上げにだけ使う） */
  count?: number;
  discovered: boolean;
  /** 24 時間以内に記録した種（プレートに NEW の札） */
  isNew?: boolean;
  /** @deprecated 出現アニメーションは付けない（無視する） */
  index?: number;
};

/**
 * 図鑑のタイル（ゲームのカード）。白い面にドット絵の枠（線と厚み）。記録済みは線がタイプの色の枠（px-tile-*）、
 * 未発見の幻は金の線（px-tile-legend）になり、めずらしい・幻は光が横切る。未発見は「？」のプレートで、名前は「？？？」（記録すると名前がわかる）。
 */
export function SpeciesTile({ species, photoId, count = 0, discovered, isNew = false }: SpeciesTileProps) {
  const legendary = species.rarity === 4;
  const t = TYPE_META[species.category];
  // まだ見つけていない種は名前を「？？？」にする（記録すると名前がわかる）
  const label = discovered
    ? `No.${speciesNo(species)} ${species.name}${legendary ? '（幻）' : ''}${count > 0 ? ` 記録${count}回` : ' 記録済み'}`
    : `No.${speciesNo(species)} ${HIDDEN_NAME_LABEL}${legendary ? '（幻）' : ''}`;
  return (
    <Link
      to={`/species/${species.id}`}
      aria-label={label}
      onClick={() => sfx('tap')}
      className={cn('pressable block select-none p-0.5', discovered ? TILE_FRAME[species.category] : legendary ? 'px-tile-legend' : 'px-panel')}
    >
      <SpeciesPlate
        species={species}
        photoId={discovered ? photoId : null}
        discovered={discovered}
        className={cn('px-clip-2 aspect-square w-full', discovered && species.rarity >= 3 && 'shine')}
      >
        {isNew && (
          <span aria-hidden className="px-clip-1 absolute right-1 top-1 animate-pop-in bg-capture px-1.5 font-num text-[12px] leading-4 text-white">
            NEW
          </span>
        )}
      </SpeciesPlate>
      <div aria-hidden className="mt-1 flex items-center justify-between gap-1 px-0.5">
        <span className={cn('num text-[12px] leading-4', discovered ? t.text : 'text-fg-3')}>No.{speciesNo(species)}</span>
        <Stars rarity={species.rarity} size={10} />
      </div>
      <div aria-hidden className={cn('line-clamp-2 min-h-8 px-0.5 text-tile', discovered ? 'text-fg' : 'font-bold text-fg-3')}>
        <SpeciesName species={species} hidden={!discovered} clamp={false} />
      </div>
    </Link>
  );
}

/** 種タイルの並び（3 列、間隔 10、左右 16） */
export function SpeciesGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-3 gap-2.5 px-4', className)}>{children}</div>;
}

// ───────── 見られる季節（§8.3） ─────────

/**
 * 12 か月の見頃のバー。12 本、高さ 24、間隔 2、角は 1 段の段々（px-clip-1）。見頃は brand、それ以外は fill。
 * 今月のバーは金の四角い線で囲む（切り抜くと線も消えるので、線は外側の箱の outline で描く）。
 * 月の数字は caption の fg-3、今月だけ「10月」を fg の 600。通年の種はバーを出さず「一年中見られます」。
 */
export function MonthBar({ months, highlight }: { months: number[]; highlight?: number }) {
  if (months.length >= 12) return <p className="text-callout font-bold text-fg">一年中見られます</p>;
  const all = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div role="img" aria-label={`見頃は${months.map((m) => `${m}月`).join('、')}`}>
      <div className="grid grid-cols-12 gap-0.5" aria-hidden>
        {all.map((m) => (
          <div key={m} className={cn(m === highlight && 'outline outline-2 outline-offset-2 outline-gold')}>
            <div className={cn('px-clip-1 h-7', months.includes(m) ? 'stripes bg-brand-fill' : 'bg-fill-strong')} />
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-12 gap-0.5 text-center" aria-hidden>
        {all.map((m) => (
          <span key={m} className={cn('num whitespace-nowrap text-caption', m === highlight ? 'text-fg' : 'text-fg-3')}>
            {m === highlight ? `${m}月` : m}
          </span>
        ))}
      </div>
    </div>
  );
}
