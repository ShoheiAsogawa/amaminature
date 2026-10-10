import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Species } from '../data/types';
import { cn } from '../lib/cn';
import { usePhotoUrl } from './PhotoImg';
import { SpeciesName } from './SpeciesName';
import { RarityGems } from './ui';

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

export type SpeciesPlateProps = {
  species: Species;
  /** 利用者の写真（IndexedDB / R2 の photoId） */
  photoId?: string | null;
  /** すでに読み込んだ写真の URL（記録直後の演出など） */
  photoUrl?: string | null;
  /** 記録済みか。未発見なら参考写真は使わず、シルエットか番号にする */
  discovered?: boolean;
  /** 未発見でも参考写真を使う（ホームの季節の種の行のサムネイル） */
  showReference?: boolean;
  /** 番号の文字の大きさ。tile は num-l（タイル・サムネイル 56）、small はサムネイル 40〜48、large は図鑑カード */
  numberSize?: 'tile' | 'small' | 'large';
  /** 写真の解像度 */
  photoSize?: 'thumb' | 'full';
  /** 写真の代替テキスト。省くと飾り（alt=""）。種詳細のヒーローは和名を渡す */
  alt?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * 種のプレート（1:1 の絵の部分）。種タイル、行のサムネイル、図鑑カードで共通（§7.10・§6）。
 * 利用者の写真 → 参考写真 → シルエット（幅 64%、silhouette 色）→ 番号だけ（num-l、fg-3、50%）の順。
 * 角丸・大きさは className で決める（タイルは rounded-xs）。枠線・模様・影は付けない。
 */
export function SpeciesPlate({
  species,
  photoId,
  photoUrl,
  discovered = true,
  showReference = false,
  numberSize = 'tile',
  photoSize = 'thumb',
  alt = '',
  className,
  style,
  children,
}: SpeciesPlateProps) {
  const loaded = usePhotoUrl(photoUrl ? null : photoId, photoSize);
  const ref = discovered || showReference ? referencePhoto(species) : null;
  const src = photoUrl ?? loaded ?? (photoId ? null : (ref?.src ?? null));
  const waiting = !src && !!photoId; // 利用者の写真を読み込み中（静止した fill のまま待つ）
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
        <span aria-hidden className="block aspect-square w-[64%] bg-silhouette" style={silStyle} />
      ) : waiting ? null : (
        <span
          aria-hidden
          className={cn(
            'num text-fg-3 opacity-50',
            numberSize === 'large' ? 'text-num-xl' : numberSize === 'small' ? 'text-sub font-semibold' : 'text-num-l',
          )}
        >
          {speciesNo(species)}
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * 行のサムネイル（40 / 48 / 56、rounded-xs）。ListRow の leading に置き、thumbSize に同じ大きさを渡す。
 * 季節の種の行は showReference（利用者の写真 → 参考写真 → シルエット → 番号の順）。
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
      numberSize={size === 56 ? 'tile' : 'small'}
      className={cn('shrink-0 rounded-xs', size === 56 ? 'h-14 w-14' : size === 48 ? 'h-12 w-12' : 'h-10 w-10', className)}
    />
  );
}

// ───────── 種タイル（§7.10） ─────────

export type SpeciesTileProps = {
  species: Species;
  /** 記録済みの時の利用者の写真 */
  photoId?: string | null;
  /** 記録した回数（読み上げにだけ使う） */
  count?: number;
  discovered: boolean;
  /** 24 時間以内に記録した種（番号の後ろに 6px の brand-fill の点） */
  isNew?: boolean;
  /** @deprecated 出現アニメーションは付けない（無視する） */
  index?: number;
};

/**
 * 種タイル。3 列（SpeciesGrid）。プレート 1:1 の下 6px にキャプション:
 * 1 行目 No.001（caption、.num、fg-3）と右寄せのジェム、2 行目 和名（tile、2 行まで）。
 * 幻は 2px の legend の内側の線と、和名の後ろに「幻」。押下は不透明度 72%。
 */
export function SpeciesTile({ species, photoId, count = 0, discovered, isNew = false }: SpeciesTileProps) {
  const legendary = species.rarity === 4;
  const label = `No.${speciesNo(species)} ${species.name}${legendary ? '（幻）' : ''}${discovered ? (count > 0 ? ` 記録${count}回` : ' 記録済み') : ' 未発見'}`;
  return (
    <Link to={`/species/${species.id}`} aria-label={label} className="block select-none active:opacity-[.72]">
      <SpeciesPlate species={species} photoId={discovered ? photoId : null} discovered={discovered} className="aspect-square w-full rounded-xs">
        {legendary && (
          <span
            aria-hidden
            className={cn('pointer-events-none absolute inset-0 rounded-xs', !discovered && 'opacity-50')}
            style={{ boxShadow: 'inset 0 0 0 2px rgb(var(--c-legend))' }}
          />
        )}
      </SpeciesPlate>
      <div aria-hidden className="mt-1.5 flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="num text-caption text-fg-3">No.{speciesNo(species)}</span>
          {isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-fill" />}
        </span>
        <RarityGems rarity={species.rarity} />
      </div>
      <div aria-hidden className={cn('mt-0.5 line-clamp-2 text-tile', discovered ? 'text-fg' : 'font-normal text-fg-3')}>
        <SpeciesName species={species} clamp={false} />
        {legendary && <span className="ml-1 text-caption font-semibold text-legend">幻</span>}
      </div>
    </Link>
  );
}

/** 種タイルの並び（3 列、列の間隔 8、行の間隔 16、左右 16） */
export function SpeciesGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-3 gap-x-2 gap-y-4 px-4', className)}>{children}</div>;
}

// ───────── 見られる季節（§8.3） ─────────

/**
 * 12 か月の見頃のバー。12 本、高さ 24、間隔 2、rounded-bar。見頃は brand、それ以外は fill。
 * 月の数字は caption の fg-3、今月だけ「10月」を fg の 600。通年の種はバーを出さず「一年中見られます」。
 */
export function MonthBar({ months, highlight }: { months: number[]; highlight?: number }) {
  if (months.length >= 12) return <p className="text-callout text-fg">一年中見られます</p>;
  const all = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div role="img" aria-label={`見頃は${months.map((m) => `${m}月`).join('、')}`}>
      <div className="grid grid-cols-12 gap-0.5" aria-hidden>
        {all.map((m) => (
          <div key={m} className={cn('h-6 rounded-bar', months.includes(m) ? 'bg-brand' : 'bg-fill')} />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-12 gap-0.5 text-center" aria-hidden>
        {all.map((m) => (
          <span key={m} className={cn('num whitespace-nowrap text-caption', m === highlight ? 'font-semibold text-fg' : 'text-fg-3')}>
            {m === highlight ? `${m}月` : m}
          </span>
        ))}
      </div>
    </div>
  );
}
