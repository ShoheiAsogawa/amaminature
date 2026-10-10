import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Experience } from '../data/types';
import { cn } from '../lib/cn';
import { IconArrowSquareOut, IconHeart, IconHeartFill } from './icons';
import { Phrase } from './Phrase';
import { button, Button, ButtonNote, Group, InfoRow, ListRow, PhotoButton, Sheet, toast } from './ui';

// 体験の一覧と詳細シート（docs/DESIGN_SYSTEM.md §8.7）。
// 写真がある体験は 16:9 の写真＋タイトル＋メタ、ない体験はプレーンリストの行にする。
// 一覧には説明文と予約ボタンを置かない。行を押すと詳細シート（説明、所要時間、料金、事業者）を開く。

// ───────── 保存（写真の右上のハート）。この端末の中だけで覚える ─────────

const SAVED_KEY = 'amami-nature:saved-experiences';

function readSaved(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

let saved: string[] = typeof window === 'undefined' ? [] : readSaved();
const listeners = new Set<() => void>();

function subscribeSaved(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function toggleSaved(id: string): boolean {
  const on = !saved.includes(id);
  saved = on ? [...saved, id] : saved.filter((x) => x !== id);
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  } catch {
    // 保存できない環境（プライベートモードなど）では、この画面を開いている間だけ覚える
  }
  listeners.forEach((l) => l());
  return on;
}

/** 保存した体験の ID（この端末だけ） */
export function useSavedExperiences(): string[] {
  return useSyncExternalStore(
    subscribeSaved,
    () => saved,
    () => saved,
  );
}

// ───────── 一覧 ─────────

/** 体験の写真（事業者から提供。ない体験は null） */
export function experienceImage(exp: Experience): { src: string; credit?: string } | null {
  return exp.image ?? null;
}

/** 体験のメタ 1 行（所要時間、場所、料金を 12px あけて並べる。中黒でつながない） */
export function ExperienceMeta({ exp, className }: { exp: Experience; className?: string }) {
  return (
    <span className={cn('flex flex-wrap gap-x-3', className)}>
      <span>{exp.duration}</span>
      <span>{exp.area}</span>
      {exp.priceFrom != null && (
        <span>
          <span className="num">{exp.priceFrom.toLocaleString('ja-JP')}</span>円から
        </span>
      )}
    </span>
  );
}

/** 中立のタグ「認定ガイド」（caption、fill、高さ 24、rounded-full、左右 8） */
function CertifiedTag() {
  return <span className="mt-2 inline-flex h-6 items-center rounded-full bg-fill px-2 pt-[2px] text-caption text-fg-2">認定ガイド</span>;
}

/**
 * 体験の一覧の 1 件。写真があれば 16:9 の写真（右上に保存ボタン）、写真の下にタイトルとメタ。
 * 写真がなければプレーンリストの行（タイトル、メタ、caret-right）。押すと onOpen（詳細シート）。
 * 行は兄弟要素として並べること（最後の行の区切り線を消すため）。
 */
export function ExperienceItem({ exp, onOpen }: { exp: Experience; onOpen: () => void }) {
  const savedIds = useSavedExperiences();
  const image = experienceImage(exp);

  if (!image) {
    return (
      <ListRow
        title={exp.title}
        subtitle={
          <>
            <ExperienceMeta exp={exp} />
            {exp.certifiedGuide && <CertifiedTag />}
          </>
        }
        chevron
        onClick={onOpen}
      />
    );
  }

  const isSaved = savedIds.includes(exp.id);
  return (
    <div className="relative px-4 py-3">
      <button type="button" onClick={onOpen} className="block w-full text-left active:opacity-[.72]">
        <img src={image.src} alt="" draggable={false} loading="lazy" className="photo aspect-video w-full rounded-md bg-fill object-cover" />
        {image.credit && <span className="mt-1 block text-right text-caption text-fg-3">© {image.credit}</span>}
        <span className="mt-2 block text-headline text-fg">
          <Phrase text={exp.title} />
        </span>
        <span className="mt-0.5 block text-sub text-fg-2">
          <ExperienceMeta exp={exp} />
        </span>
        {exp.certifiedGuide && <CertifiedTag />}
      </button>
      <PhotoButton
        icon={isSaved ? IconHeartFill : IconHeart}
        label={isSaved ? `「${exp.title}」の保存を解除する` : `「${exp.title}」を保存する`}
        pressed={isSaved}
        onClick={() => toast(toggleSaved(exp.id) ? '保存しました' : '保存を解除しました')}
        className="absolute right-5 top-4"
      />
    </div>
  );
}

// ───────── 詳細シート ─────────

/** 体験の詳細シートの中身（説明、所要時間、料金、事業者、予約ボタン） */
export function ExperienceDetail({ exp }: { exp: Experience }) {
  return (
    <div>
      <p className="text-body text-fg">{exp.summary}</p>
      <div className="-mx-4 mt-4">
        <Group>
          <InfoRow label="所要時間">{exp.duration}</InfoRow>
          <InfoRow label="場所">{exp.area}</InfoRow>
          <InfoRow label="料金">
            {exp.priceFrom != null ? (
              <>
                <span className="num">{exp.priceFrom.toLocaleString('ja-JP')}</span>円から（1人あたりの目安）
              </>
            ) : (
              exp.priceNote
            )}
          </InfoRow>
          {exp.certifiedGuide && <InfoRow label="ガイド">認定ガイドが同行します</InfoRow>}
          <InfoRow label="事業者">{exp.provider}</InfoRow>
        </Group>
      </div>
      <div className="mt-6">
        {exp.url ? (
          <>
            <a href={exp.url} target="_blank" rel="noopener noreferrer" className={button({ variant: 'primary', size: 'lg' })}>
              事業者のサイトで予約する
            </a>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sub text-fg-2">
              <IconArrowSquareOut size={16} className="shrink-0" />
              外部サイトが開きます
            </p>
          </>
        ) : (
          <>
            <Button disabled>事業者のサイトで予約する</Button>
            <ButtonNote>予約ページは準備中です（掲載イメージ）</ButtonNote>
          </>
        )}
      </div>
      <p className="mt-6 text-sub text-fg-2">
        掲載内容は提携前の掲載イメージです。料金は公開されている相場を参考にした目安です。実際の料金や予約条件は、各事業者の情報をご確認ください。
      </p>
    </div>
  );
}

/** 体験の詳細シート。exp を null にすると閉じる（閉じるアニメーションの間も中身を残す） */
export function ExperienceSheet({ exp, onClose }: { exp: Experience | null; onClose: () => void }) {
  const [shown, setShown] = useState(exp);
  useEffect(() => {
    if (exp) setShown(exp);
  }, [exp]);
  const e = exp ?? shown;
  return (
    <Sheet open={!!exp} onClose={onClose} title={e?.title}>
      {e && <ExperienceDetail exp={e} />}
    </Sheet>
  );
}
