import NumberFlow from '@number-flow/react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AREA_BY_ID } from '../data/areas';
import { SPECIES } from '../data/species';
import type { Quest, Species } from '../data/types';
import { cn } from '../lib/cn';
import { confettiBurst } from '../lib/confetti';
import type { Badge } from '../lib/progress';
import { levelFor } from '../lib/progress';
import { buzz, sfx } from '../lib/sfx';
import { renderShareCard, shareCard } from '../lib/share';
import type { Sighting } from '../lib/types';
import { useStore } from '../store/useStore';
import { CollectibleCard, CollectibleCardBack } from './CollectibleCard';
import { Coin, LevelBadge, MessageWindow, Sparkles, XPBar } from './game';
import { IconArrowSquareOut, IconX } from './icons';
import { Phrase } from './Phrase';
import { loadPhotoUrl } from './PhotoImg';
import { BadgeEmblem, BadgeName, Button, formatDateJa, ListRow, Num, SectionHeader, toast, useCanGoBack } from './ui';

// 記録の演出（ゲームの「ゲット！」）。docs/DESIGN_SYSTEM.md
// 夜空の舞台にカードの裏面が落ちてきて、3 回ゆれ、光ってから表に返る。
// そのあとメッセージ窓、ポイントと XP、レベルアップ、バッジの順に見せる。どこで押しても最後まで飛ばせる。

/** 演出の時刻（ms） */
const T = {
  drop: 0,
  shakes: [520, 920, 1320],
  flash: 1720,
  flip: 1780,
  get: 2050,
  message: 2450,
} as const;

type Phase = 'drop' | 'shake' | 'flash' | 'front' | 'message' | 'reward';

export function CardReveal(props: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
  isNew: boolean;
  points: number;
  newBadges: Badge[];
  completedQuests: Quest[];
  /** 記録した後の図鑑の種数 */
  discovered: number;
  /** 記録する前と後の累計ポイント（レベルの計算） */
  pointsBefore: number;
  pointsAfter: number;
  onAgain: () => void;
}) {
  const rescue = props.sighting.roadReport === 'roadkill' || props.sighting.roadReport === 'injured';
  return rescue ? <RescueThanks sighting={props.sighting} points={props.points} /> : <Reveal {...props} />;
}

// ───────── ゲット！ ─────────

function Reveal({
  sighting,
  species,
  photoUrl,
  isNew,
  points,
  newBadges,
  completedQuests,
  discovered,
  pointsBefore,
  pointsAfter,
  onAgain,
}: Parameters<typeof CardReveal>[0]) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const lineMode = useStore((s) => s.account.mode === 'line');
  const reduce = useReducedMotion() ?? false;
  const rarity = species?.rarity ?? 1;
  const displayName = sighting.nickname.trim() || species?.name || sighting.customName || 'なぞの生き物';
  const [phase, setPhase] = useState<Phase>(reduce ? 'reward' : 'drop');
  const [shake, setShake] = useState(0);
  const [flash, setFlash] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [badgeIndex, setBadgeIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const timers = useRef<number[]>([]);
  const before = levelFor(pointsBefore);
  const after = levelFor(pointsAfter);
  const leveledUp = after.level > before.level;
  const [xp, setXp] = useState(reduce ? after.progress : before.progress);
  const [shownLevel, setShownLevel] = useState(reduce ? after.level : before.level);
  const [shownPoints, setShownPoints] = useState(reduce ? points : 0);
  // 動きを減らす設定でも、レベルが上がったことは結果として見せる（演出を飛ばすだけ）
  const [levelPop, setLevelPop] = useState(reduce && leveledUp);
  const front = phase === 'front' || phase === 'message' || phase === 'reward';

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  const celebrate = useCallback(() => {
    sfx(rarity >= 3 ? 'rare' : 'get');
    buzz([30, 40, 70]);
    void confettiBurst(rarity === 4 ? 'legend' : rarity === 3 ? 'rare' : 'get');
  }, [rarity]);

  // 演出の流れ
  useEffect(() => {
    if (reduce) return;
    sfx('whoosh');
    T.shakes.forEach((ms, i) =>
      at(ms, () => {
        setPhase('shake');
        setShake(i + 1);
        sfx('shake');
        buzz(18);
      }),
    );
    at(T.flash, () => {
      setFlash(true);
      setPhase('flash');
      sfx('burst');
    });
    at(T.flip, () => setPhase('front'));
    at(T.flash + 260, () => setFlash(false));
    at(T.get, celebrate);
    at(T.message, () => setPhase('message'));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  /** ポイントと XP（メッセージを出し終えたら） */
  const toReward = useCallback(() => {
    clearTimers();
    setFlash(false);
    setPhase('reward');
    at(150, () => {
      setShownPoints(points);
      if (points > 0) sfx('coin');
    });
    if (leveledUp) {
      at(400, () => setXp(1));
      at(1150, () => {
        setShownLevel(after.level);
        setXp(0);
        setLevelPop(true);
        sfx('levelup');
        buzz([40, 30, 40, 30, 90]);
        void confettiBurst('level');
      });
      at(1300, () => setXp(after.progress));
    } else {
      at(400, () => setXp(after.progress));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, leveledUp, after.level, after.progress]);

  /** スキップ（演出を飛ばして、結果の画面へ） */
  const skip = () => {
    if (phase === 'reward') return;
    clearTimers();
    setFlash(false);
    if (!front) celebrate();
    toReward();
  };

  useEffect(() => clearTimers, []);

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
    if (canGoBack) navigate(-1);
    else navigate('/', { replace: true });
  };
  const openZukan = () => navigate(species ? `/species/${species.id}` : `/sighting/${encodeURIComponent(sighting.id)}`, { replace: true });

  /** 閉じる操作。新しいバッジがあれば 1 つずつ見せ終えてから、元の操作をする */
  const close = (action: () => void) => {
    if (newBadges.length === 0) {
      action();
      return;
    }
    setPending(() => action);
    setBadgeIndex(0);
    sfx('badge');
    void confettiBurst('mission');
  };
  const nextBadge = () => {
    if (badgeIndex == null) return;
    if (badgeIndex + 1 < newBadges.length) {
      setBadgeIndex(badgeIndex + 1);
      sfx('badge');
    } else pending?.();
  };

  const badge = badgeIndex == null ? null : newBadges[badgeIndex];
  const message = !species
    ? `${displayName}を きろくした！`
    : rarity === 4 && isNew
      ? `すごい！ まぼろしの ${species.name}を ゲットした！`
      : isNew
        ? `やったね！ ${species.name}を ゲットした！`
        : `${species.name}を また きろくした！`;

  return (
    <div className="stage fixed inset-0 z-50 overflow-y-auto overscroll-contain text-white" style={{ background: 'var(--stage)' }}>
      {/* 回る光の筋と星（飾り） */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={cn('absolute left-1/2 top-[38%] h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700', front ? 'opacity-100' : 'opacity-0')}
        >
          <div
            className="h-full w-full animate-spin-slow"
            style={{
              background:
                rarity === 4
                  ? 'repeating-conic-gradient(from 0deg, rgb(255 210 90 / .22) 0deg 8deg, transparent 8deg 22deg)'
                  : 'repeating-conic-gradient(from 0deg, rgb(255 255 255 / .09) 0deg 8deg, transparent 8deg 22deg)',
            }}
          />
        </div>
        <Sparkles count={8} className={cn('transition-opacity duration-700', front ? 'opacity-100' : 'opacity-40')} />
      </div>
      {/* 光る一瞬 */}
      <div aria-hidden className={cn('pointer-events-none fixed inset-0 z-10 bg-white transition-opacity', flash ? 'opacity-100 duration-75' : 'opacity-0 duration-300')} />

      <div className="pt-safe relative mx-auto flex min-h-full w-full max-w-[480px] flex-col">
        {badge ? (
          // ───── バッジ ゲット！ ─────
          <m.div key={badge.id} className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
              <p className="num animate-pop-in text-[34px] leading-10 text-gold [text-shadow:0_3px_0_#7a4b00]">BADGE GET!</p>
              <m.div
                className="relative mt-6"
                initial={reduce ? false : { scale: 0.3, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                <BadgeEmblem badge={badge} earned size={140} />
              </m.div>
              <h1 className="balance mt-6 text-title text-white">
                <BadgeName badge={badge} />
              </h1>
              <p className="mt-2 text-body font-bold text-white/80">
                <Phrase text={badge.description} />
              </p>
              <p className="mt-3 text-caption text-white/60">{formatDateJa(sighting.createdAt)}に獲得</p>
            </div>
            <div className="px-4 pb-[calc(16px+var(--safe-bottom))]">
              <Button variant="gold" onClick={nextBadge}>
                やったー！
              </Button>
            </div>
          </m.div>
        ) : (
          <>
            <div className="flex h-12 shrink-0 items-center justify-between px-2">
              {phase !== 'reward' ? (
                <button type="button" onClick={skip} className="h-11 rounded-full px-3 text-sub font-black text-white/70 active:opacity-60">
                  スキップ ›
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => close(leave)}
                aria-label="閉じる"
                className="grid h-11 w-11 place-items-center text-white active:opacity-60"
              >
                <IconX size={24} />
              </button>
            </div>

            {/* カード（押すと演出を飛ばす） */}
            <div className="flex flex-col items-center px-4 pt-1" onClick={skip} role="presentation">
              <div className="relative h-[52px]">
                <AnimatePresence>
                  {front && (
                    <m.p
                      key="get"
                      initial={reduce ? false : { scale: 0.2, opacity: 0, rotate: -12 }}
                      animate={{ scale: 1, opacity: 1, rotate: -4 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                      className={cn(
                        'num text-[46px] leading-[52px]',
                        rarity === 4 ? 'text-gold' : 'text-white',
                        '[text-shadow:0_4px_0_rgb(var(--c-capture)),0_0_24px_rgb(255_255_255/.4)]',
                      )}
                    >
                      {species ? (isNew ? 'GET!' : 'NICE!') : 'NICE!'}
                    </m.p>
                  )}
                </AnimatePresence>
              </div>
              <m.div
                initial={reduce ? false : { y: -320, scale: 0.6, opacity: 0 }}
                animate={{ y: 0, scale: front ? 1 : 0.78, opacity: 1, rotate: phase === 'shake' ? (shake % 2 ? -9 : 9) : 0 }}
                transition={
                  phase === 'shake'
                    ? { rotate: { type: 'spring', stiffness: 900, damping: 8 }, default: { duration: 0.2 } }
                    : { type: 'spring', stiffness: 220, damping: 18 }
                }
                style={{ perspective: 1200 }}
                className="mt-1"
              >
                <m.div
                  className="relative [transform-style:preserve-3d]"
                  initial={false}
                  animate={{ rotateY: front ? 0 : 180 }}
                  transition={{ duration: reduce ? 0 : 0.55, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <div className="relative [backface-visibility:hidden]" aria-hidden={!front}>
                    <CollectibleCard
                      species={species}
                      nickname={sighting.nickname}
                      name={sighting.customName}
                      photoUrl={photoUrl}
                      photoId={sighting.photoId}
                      observedAt={sighting.observedAt}
                      areaName={sighting.areaId ? AREA_BY_ID[sighting.areaId]?.name : null}
                      onStage
                      tilt
                    />
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <CollectibleCardBack onStage legend={rarity === 4} className="h-full" />
                  </div>
                </m.div>
              </m.div>
            </div>

            <div className="mt-5 flex-1 px-4">
              {!front && (
                <p aria-live="polite" className="animate-pulse text-center font-pixel text-[18px] tracking-[0.08em] text-white/85">
                  {shake < 3 ? 'なにが でるかな……？' : 'もうすこし……！'}
                </p>
              )}
              {(phase === 'message' || phase === 'reward') && (
                <MessageWindow text={message} onDone={phase === 'message' ? toReward : undefined} speed={42} />
              )}

              {phase === 'reward' && (
                <m.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-3 space-y-2.5">
                  {/* ポイントと XP */}
                  <div className="rounded-lg border-2 border-white/15 bg-white/[.08] p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <LevelBadge level={shownLevel} size={52} />
                        {levelPop && (
                          <m.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="num absolute -right-3 -top-3 rounded-full bg-gold px-2 text-[12px] leading-5 text-[#3d2a00] shadow-[0_2px_0_rgb(var(--c-gold-edge))]"
                          >
                            UP!
                          </m.span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sub font-black text-white/80">{levelPop ? 'レベルアップ！' : 'けいけんち'}</span>
                          {points > 0 && (
                            <span className="flex items-center gap-1.5 text-[22px] leading-7 text-gold">
                              <Coin size={20} />
                              <span aria-hidden className="num">
                                <NumberFlow value={shownPoints} prefix="+" animated={!reduce} />
                              </span>
                              <span className="sr-only">+{points}ポイント</span>
                            </span>
                          )}
                        </div>
                        <XPBar value={xp} label="次のレベルまで" className="mt-1.5" />
                        <p className="mt-1 text-right text-caption text-white/60">
                          {after.next ? (
                            <>
                              次のレベルまで <span className="num text-[13px] text-white">{after.toNext}</span> pt
                            </>
                          ) : (
                            'レベル MAX！'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isNew && species && (
                    <div className="flex items-center gap-3 rounded-lg border-2 border-white/15 bg-white/[.08] px-3.5 py-2.5">
                      <span className="rounded-full bg-capture px-2 pt-[1px] font-num text-[12px] leading-5 text-white">NEW</span>
                      <span className="flex-1 text-sub font-black">図鑑に とうろく！</span>
                      <span className="num text-[20px] leading-6">
                        {discovered}
                        <span className="text-[14px] text-white/60">/{SPECIES.length}</span>
                      </span>
                    </div>
                  )}
                  {completedQuests.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 rounded-lg border-2 border-gold/50 bg-gold/15 px-3.5 py-2.5">
                      <span className="num rounded-full bg-gold px-2 text-[12px] leading-5 text-[#3d2a00]">CLEAR</span>
                      <span className="min-w-0 flex-1 text-sub font-black">
                        <Phrase text={`クエスト「${q.title}」`} />
                      </span>
                      <span className="num shrink-0 text-gold">+{q.reward}</span>
                    </div>
                  ))}
                </m.div>
              )}
            </div>

            {phase === 'reward' && (
              <m.div
                className="px-4 pb-[calc(12px+var(--safe-bottom))] pt-5"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.5 }}
              >
                <Button variant={lineMode ? 'line' : 'gold'} onClick={share} aria-busy={sharing}>
                  {lineMode ? 'LINEで自慢する' : 'カード画像をシェア'}
                </Button>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Button variant="on-stage" size="md" onClick={() => close(onAgain)}>
                    つづけてさがす
                  </Button>
                  <Button variant="on-stage" size="md" onClick={() => close(openZukan)}>
                    {species ? '図鑑で見る' : '記録を見る'}
                  </Button>
                </div>
              </m.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ───────── 路上レポート（交通事故・けが）のお礼 ─────────

/** 奄美野生生物保護センター（環境省）の案内ページ */
const WILDLIFE_CENTER_URL = 'https://www.env.go.jp/nature/kisho/wildlifecenter/amami.html';

/** お礼の画面。紙吹雪なし。けがをした動物の連絡先をリストで出す */
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
          <p className="mt-4 flex items-baseline gap-3 text-callout font-bold text-fg">
            <span>保全ポイント</span>
            <Num value={`+${points}`} unit="pt" className="font-semibold" />
          </p>
        )}
      </div>

      <SectionHeader title="けがをした動物を見つけたら" />
      <p className="px-4 pb-3 text-body text-fg-2">
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
