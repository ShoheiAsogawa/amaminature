import NumberFlow from '@number-flow/react';
import { m, useReducedMotion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_BY_ID } from '../data/areas';
import { SPECIES } from '../data/species';
import type { Quest, Species } from '../data/types';
import type { Badge } from '../lib/progress';
import { renderShareCard, shareCard } from '../lib/share';
import type { Sighting } from '../lib/types';
import { useStore } from '../store/useStore';
import { CollectibleCard, CollectibleCardBack } from './CollectibleCard';
import { IconArrowSquareOut, IconX } from './icons';
import { Phrase } from './Phrase';
import { loadPhotoUrl } from './PhotoImg';
import { BadgeEmblem, BadgeName, Button, formatDateJa, ListRow, Num, SectionHeader, toast } from './ui';

// 図鑑カードの演出とバッジ獲得（docs/DESIGN_SYSTEM.md §8.5・§9 の 1）。
// アプリでただ 1 つの「演出」。黒い舞台（var(--stage)）の上で、裏面のカードが上がってきて 1 回だけ裏返る。

/** 演出の時刻（ms）。全体で 1.6 秒以内（§9） */
const T = {
  rise: 240, // 裏面が 24px 上がりながらフェードイン
  flipAt: 300, // 裏返し始め
  flip: 600, // 裏返し（cubic-bezier(.2,.8,.2,1)）
  textAt: 900, // 文字のフェードイン（200ms）と、ポイントを数え始める（600ms）
  gemStep: 60, // ジェムを 60ms ずつずらす
  buttonsAt: 1300, // ボタンは文字の 400ms 後
} as const;
const EASE_FLIP = [0.2, 0.8, 0.2, 1] as const;

/** 縁に光が 1 回だけ走る（レア度 3 は夜光貝 900ms、4 は金箔 1200ms）。どちらも 1.6 秒までに終える */
const EDGE_LIGHT: Partial<Record<number, { delay: number; duration: number }>> = {
  3: { delay: 0.7, duration: 0.9 },
  4: { delay: 0.4, duration: 1.2 },
};

export function CardReveal(props: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
  isNew: boolean;
  points: number;
  newBadges: Badge[];
  completedQuests: Quest[];
  /** 記録した後の図鑑の種数（新しい種の時に「図鑑 5 → 6/62種」を数える） */
  discovered: number;
  onAgain: () => void;
}) {
  const rescue = props.sighting.roadReport === 'roadkill' || props.sighting.roadReport === 'injured';
  return rescue ? <RescueThanks sighting={props.sighting} points={props.points} /> : <Reveal {...props} />;
}

// ───────── 図鑑カードの演出 ─────────

function Reveal({
  sighting,
  species,
  photoUrl,
  isNew,
  points,
  newBadges,
  completedQuests,
  discovered,
  onAgain,
}: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
  isNew: boolean;
  points: number;
  newBadges: Badge[];
  completedQuests: Quest[];
  discovered: number;
  onAgain: () => void;
}) {
  const navigate = useNavigate();
  const lineMode = useStore((s) => s.account.mode === 'line');
  // 動きを減らす設定: 150ms のクロスフェードだけ（裏返し・光・数え上げは止める）
  const reduce = useReducedMotion() ?? false;
  const [side, setSide] = useState<'back' | 'front'>(reduce ? 'front' : 'back');
  const [shownPoints, setShownPoints] = useState(reduce ? points : 0);
  // 図鑑の種数（新しい種の時だけ 1 つ前の数から数える）
  const before = isNew ? Math.max(0, discovered - 1) : discovered;
  const [shownCount, setShownCount] = useState(reduce ? discovered : before);
  const [sharing, setSharing] = useState(false);
  /** 閉じる操作の後に見せている新しいバッジ（null はカードの画面） */
  const [badgeIndex, setBadgeIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const rarity = species?.rarity ?? 1;
  const light = reduce ? undefined : EDGE_LIGHT[rarity];

  useEffect(() => {
    if (reduce) return;
    const a = window.setTimeout(() => setSide('front'), T.flipAt);
    const b = window.setTimeout(() => {
      setShownPoints(points);
      setShownCount(discovered);
    }, T.textAt);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [reduce, points, discovered]);

  // カードの大きさ（和名が 2 行になると高さが伸びる）。縁の光の線をこの大きさで描く
  useLayoutEffect(() => {
    const el = frontRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ジェムを 60ms ずつずらして出す（CollectibleCard の中の RarityGems の 4 つの菱形）
  useLayoutEffect(() => {
    const el = frontRef.current;
    if (reduce || !el || typeof Element.prototype.animate !== 'function') return;
    const gems = el.querySelectorAll<HTMLElement>('[data-gem]');
    const anims = Array.from(gems).map((g, i) =>
      g.animate([{ opacity: 0, scale: '0.4' }, { opacity: 1, scale: '1' }], {
        duration: 180,
        delay: T.textAt + i * T.gemStep,
        easing: 'cubic-bezier(.2,.8,.2,1)',
        fill: 'backwards',
      }),
    );
    return () => anims.forEach((a) => a.cancel());
  }, [reduce]);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = photoUrl ?? (sighting.photoId ? await loadPhotoUrl(sighting.photoId, 'full') : null);
      const card = await renderShareCard({ sighting, species, photoUrl: url });
      const how = await shareCard({ card, species, lineMode });
      if (how === 'download') toast('カード画像を保存しました');
    } catch {
      toast('共有できませんでした');
    } finally {
      setSharing(false);
    }
  };

  const leave = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  };
  const openZukan = () => navigate(species ? `/species/${species.id}` : `/sighting/${encodeURIComponent(sighting.id)}`, { replace: true });

  /** 閉じる操作。新しいバッジがあれば 1 つずつ見せ終えてから、元の操作をする（「LINEで送る」では閉じない） */
  const close = (action: () => void) => {
    if (newBadges.length === 0) {
      action();
      return;
    }
    setPending(() => action);
    setBadgeIndex(0);
  };
  const nextBadge = () => {
    if (badgeIndex == null) return;
    if (badgeIndex + 1 < newBadges.length) setBadgeIndex(badgeIndex + 1);
    else pending?.();
  };

  const badge = badgeIndex == null ? null : newBadges[badgeIndex];
  const fade = (delayMs: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.15 } }
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: delayMs / 1000 } };

  return (
    <div className="stage fixed inset-0 z-50 overflow-y-auto overscroll-contain text-white" style={{ background: 'var(--stage)' }}>
      <div className="pt-safe mx-auto flex min-h-full w-full max-w-[480px] flex-col">
        {badge ? (
          // ───── バッジ獲得（同じ舞台で 1 つずつ） ─────
          <m.div
            key={badge.id}
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0.15 : 0.2 }}
          >
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <BadgeEmblem badge={badge} earned size={120} />
              <h1 className="balance mt-6 text-title text-white">
                <BadgeName badge={badge} />
              </h1>
              <p className="mt-2 text-body text-white/70">
                <Phrase text={badge.description} />
              </p>
              <p className="mt-3 text-caption text-white/[.55]">{formatDateJa(sighting.createdAt)}に獲得</p>
            </div>
            <div className="px-4 pb-[calc(16px+var(--safe-bottom))]">
              <Button onClick={nextBadge}>OK</Button>
            </div>
          </m.div>
        ) : (
          <>
            <div className="flex h-11 shrink-0 items-center justify-end px-1">
              <button
                type="button"
                onClick={() => close(leave)}
                aria-label="閉じる"
                className="grid h-11 w-11 place-items-center text-white active:opacity-60"
              >
                <IconX size={24} />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-2">
              {/* 裏面が 24px 上がりながら現れ、Y 軸で 1 回だけ裏返る */}
              <m.div
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0.15 : T.rise / 1000, ease: 'easeOut' }}
                style={{ perspective: 1200 }}
              >
                <m.div
                  className="relative [transform-style:preserve-3d]"
                  initial={false}
                  animate={{ rotateY: side === 'back' ? 180 : 0 }}
                  transition={{ duration: T.flip / 1000, ease: EASE_FLIP }}
                >
                  <div ref={frontRef} className="relative [backface-visibility:hidden]" aria-hidden={side === 'back'}>
                    <CollectibleCard
                      species={species}
                      nickname={sighting.nickname}
                      name={sighting.customName}
                      photoUrl={photoUrl}
                      photoId={sighting.photoId}
                      observedAt={sighting.observedAt}
                      areaName={sighting.areaId ? AREA_BY_ID[sighting.areaId]?.name : null}
                      onStage
                    />
                    {light && size && <EdgeLight w={size.w} h={size.h} {...light} />}
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <CollectibleCardBack onStage className="h-full" />
                  </div>
                </m.div>
              </m.div>

              <m.div className="mt-6 w-full text-center" {...fade(T.textAt)}>
                <h1 className="text-headline text-white">{isNew ? '図鑑に登録しました' : '記録しました'}</h1>
                {points > 0 && (
                  <p className="mt-1 text-num-l text-white">
                    {/* 数え上げの数字は読み上げない（下の sr-only で読む） */}
                    <span aria-hidden className="num">
                      <NumberFlow
                        value={shownPoints}
                        prefix="+"
                        animated={!reduce}
                        transformTiming={{ duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' }}
                        spinTiming={{ duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' }}
                      />
                      <span className="ml-[0.15em]">pt</span>
                    </span>
                    <span className="sr-only">+{points}pt</span>
                  </p>
                )}
                {/* 新しい種の時は、図鑑が 1 種増えたことを見せる（数字を 1 つ数え、バーを 1 回だけ伸ばす） */}
                {isNew && species && (
                  <div className="mx-auto mt-4 w-full max-w-[240px]">
                    <p className="flex items-baseline justify-center gap-2 text-sub text-white/80">
                      <span>図鑑</span>
                      <span className="text-callout font-semibold text-white">
                        <span aria-hidden className="num">
                          <NumberFlow
                            value={shownCount}
                            animated={!reduce}
                            spinTiming={{ duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' }}
                          />
                          /{SPECIES.length}
                        </span>
                        <span aria-hidden>種</span>
                        <span className="sr-only">
                          {discovered}/{SPECIES.length}種
                        </span>
                      </span>
                    </p>
                    <div aria-hidden className="mt-2 h-1 overflow-hidden rounded-bar bg-white/[.16]">
                      <div
                        className="h-full rounded-bar bg-white transition-[width] duration-[600ms] ease-out"
                        style={{ width: `${(shownCount / SPECIES.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {completedQuests.map((q) => (
                  <p key={q.id} className="mx-auto mt-3 max-w-[358px] text-sub text-white/80">
                    <Phrase text={`クエスト「${q.title}」を達成`} />
                    <span className="whitespace-nowrap">
                      {'　'}
                      <span className="num">+{q.reward}</span>
                      <span className="ml-[0.15em]">pt</span>
                    </span>
                  </p>
                ))}
              </m.div>
            </div>

            {/* 主な操作は共有の 1 つだけ。続けて記録・図鑑で見るは文字のボタンにして、カードを埋もれさせない */}
            <m.div className="px-4 pb-[calc(8px+var(--safe-bottom))]" {...fade(T.buttonsAt)}>
              {/* LINE の中では LINE で送る。LINE の外（デモ）では LINE グリーンを使わない（§1 の 5） */}
              <Button variant={lineMode ? 'line' : 'primary'} onClick={share} aria-busy={sharing}>
                {lineMode ? 'LINEで送る' : '画像を共有'}
              </Button>
              <div className="mt-1 grid grid-cols-2">
                <Button variant="text" size="hit" className="text-white/80" onClick={() => close(onAgain)}>
                  続けて記録
                </Button>
                <Button variant="text" size="hit" className="text-white/80" onClick={() => close(openZukan)}>
                  {species ? '図鑑で見る' : '記録を見る'}
                </Button>
              </div>
            </m.div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 素材の縁を 1 回だけ走る光（§9 の 1-4）。縁（パディング 4px）の中心に 4px の線を引き、短い区間だけを 1 周させる。
 * マスク合成は使わない（縁と同じ太さの線なので、写真や帯には掛からない）。
 */
function EdgeLight({ w, h, delay, duration }: { w: number; h: number; delay: number; duration: number }) {
  const r = 14; // 外側 16 と内側 12 の中間
  const iw = w - 4;
  const ih = h - 4;
  const perimeter = 2 * (iw + ih) - 8 * r + 2 * Math.PI * r;
  const seg = 56;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <m.rect
        x={2}
        y={2}
        width={iw}
        height={ih}
        rx={r}
        fill="none"
        stroke="white"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`${seg} ${perimeter - seg}`}
        initial={{ strokeDashoffset: 0, opacity: 0 }}
        animate={{ strokeDashoffset: -perimeter, opacity: [0, 0.9, 0.9, 0] }}
        transition={{ duration, delay, ease: 'linear', opacity: { duration, delay, times: [0, 0.12, 0.8, 1] } }}
      />
    </svg>
  );
}

// ───────── 路上レポート（交通事故・けが）のお礼 ─────────

/** 奄美野生生物保護センター（環境省）の案内ページ */
const WILDLIFE_CENTER_URL = 'https://www.env.go.jp/nature/kisho/wildlifecenter/amami.html';

/** お礼の画面。紙吹雪なし。けがをした動物の連絡先をリストで出す（§8.4） */
function RescueThanks({ sighting, points }: { sighting: Sighting; points: number }) {
  const navigate = useNavigate();
  const area = sighting.areaId ? AREA_BY_ID[sighting.areaId] : null;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="pt-safe min-h-dvh bg-page pb-[calc(32px+var(--safe-bottom))]">
      <div className="px-4 pt-12">
        <h1 className="balance text-title text-fg">
          <Phrase text="報告ありがとうございます" />
        </h1>
        <p className="mt-2 text-body text-fg-2">
          <Phrase text="この報告は、提携する行政・保護機関と共有し、ロードキル対策（注意喚起・標識・速度対策）に役立てます。" />
        </p>
        {points > 0 && (
          <p className="mt-4 flex items-baseline gap-3 text-callout text-fg">
            <span>保全ポイント</span>
            <Num value={`+${points}`} unit="pt" className="font-semibold" />
          </p>
        )}
      </div>

      <SectionHeader title="けがをした動物を見つけたら" />
      <p className="px-4 pb-2 text-body text-fg-2">
        <Phrase text="安全な場所に停車し、無理に触らずに、次の窓口へ連絡してください。" />
      </p>
      <div>
        <ListRow
          href={WILDLIFE_CENTER_URL}
          title="奄美野生生物保護センター（環境省）"
          subtitle="大和村"
          trailing={<IconArrowSquareOut size={16} className="shrink-0 text-fg-3" />}
        />
        <ListRow title={area ? `${area.name}の役場` : '見つけた場所の市町村役場'} />
      </div>

      <div className="px-4 pt-8">
        <Button onClick={() => navigate('/', { replace: true })}>ホームへ</Button>
      </div>
    </main>
  );
}
