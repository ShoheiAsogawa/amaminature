import NumberFlow from '@number-flow/react';
import { useState } from 'react';
import { Coin, Sparkles } from '../components/game';
import { IconDiceFive, IconGift, IconHandHeart, IconLockSimpleFill, IconTicket } from '../components/icons';
import { Phrase } from '../components/Phrase';
import {
  Button,
  ButtonNote,
  cn,
  formatDateJa,
  Group,
  ListRow,
  Notice,
  Num,
  ScreenHeader,
  SectionHeader,
  Sheet,
  toast,
} from '../components/ui';
import { REWARDS, type Reward } from '../data/rewards';
import { api, errorMessage } from '../lib/api';
import { confettiBurst } from '../lib/confetti';
import { sfx } from '../lib/sfx';
import { BADGES } from '../lib/progress';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';

/** 先頭のアイコンは種類で決める（§8.9）: 寄付 hand-heart、クーポン ticket、品物 gift、抽選 dice-five */
const KIND_ICON = { donation: IconHandHeart, coupon: IconTicket, goods: IconGift, lottery: IconDiceFive } as const;
/** 種類ごとのアイコンの地 */
const KIND_TILE = {
  donation: 'bg-type-soft-plant text-type-plant',
  coupon: 'bg-brand-soft text-brand',
  goods: 'bg-type-soft-bird text-type-bird',
  lottery: 'bg-gold-soft text-gold-edge',
} as const;

const pt = (n: number) => <Num value={n.toLocaleString()} unit="pt" />;

export default function Rewards() {
  const { balance, points, badges } = useProgress();
  const redeem = useStore((s) => s.redeem);
  const redemptions = useStore((s) => s.settings.redemptions);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [open, setOpen] = useState(false);
  // 閉じるアニメーションの間も中身を残すため、選んだ景品は閉じても消さない
  const [target, setTarget] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);

  const status = (r: Reward) => {
    const badge = r.requiresBadge ? BADGES.find((b) => b.id === r.requiresBadge) : undefined;
    const locked = !!r.requiresBadge && !badges.has(r.requiresBadge);
    const short = Math.max(0, r.points - balance);
    return { badge, locked, short, ok: !locked && short === 0 };
  };

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      if (lineMode) await api.redeem(target.id);
      redeem(target.id, target.points);
      sfx('coin');
      void confettiBurst('mission');
      toast.success(lineMode ? '交換しました。LINEでお知らせします' : '交換しました');
      setOpen(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const t = target ? status(target) : null;

  return (
    <main className="min-h-dvh pb-[calc(40px+var(--safe-bottom))]">
      <ScreenHeader variant="nav" title="ポイントこうかんじょ" />

      {/* もっているコイン */}
      <section className="relative mx-4 mt-1 overflow-hidden rounded-xl border-2 border-gold-edge/60 bg-gradient-to-br from-gold-soft to-gold/60 p-4 shadow-[0_4px_0_rgb(var(--c-gold-edge)/.7)]">
        <Sparkles count={2} className="opacity-80" />
        <p className="relative text-sub font-black text-[#5c3d00]">もっているポイント</p>
        <p className="relative mt-1 flex items-center gap-2 text-[#2b1d00]" aria-label={`交換できるポイント ${balance}pt`}>
          <Coin size={40} />
          <NumberFlow value={balance} locales="ja-JP" className="num text-num-xl" aria-hidden />
          <span className="mt-3 text-sub font-black" aria-hidden>
            pt
          </span>
        </p>
        <p className="relative mt-1 text-caption text-[#5c3d00]">
          これまでに{pt(points)}獲得
          {points - balance > 0 ? <>、{pt(points - balance)}交換しました</> : 'しました'}
        </p>
      </section>

      <SectionHeader title="こうかんできるもの" />
      <div className="grid grid-cols-2 gap-2.5 px-4">
        {REWARDS.map((r) => {
          const Icon = KIND_ICON[r.kind];
          const s = status(r);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                sfx('tap');
                setTarget(r);
                setOpen(true);
              }}
              className={cn('panel pressable relative flex flex-col p-3 text-left', !s.ok && 'opacity-[.92]')}
            >
              <span className={cn('grid h-12 w-12 place-items-center rounded-md', KIND_TILE[r.kind])}>
                <Icon size={28} />
              </span>
              {s.locked && (
                <span className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-fill-strong text-fg-3" aria-label="バッジが必要">
                  <IconLockSimpleFill size={15} />
                </span>
              )}
              <span className="mt-2 line-clamp-2 min-h-10 text-callout font-black leading-5 text-fg">
                <Phrase text={r.title} />
              </span>
              {r.note && <span className="mt-1 line-clamp-2 text-caption text-fg-2">{r.note}</span>}
              {s.badge && s.locked && <span className="mt-1 text-caption text-fg-3">「{s.badge.title}」バッジが必要</span>}
              <span className="mt-auto pt-2.5">
                {r.points === 0 ? (
                  // バッジで受け取る記念品はポイントを使わないので、0 pt とは出さない
                  <span className={cn('inline-flex h-8 items-center rounded-full px-3 text-caption', s.ok ? 'bg-xp text-[#0b3d22]' : 'bg-fill-strong text-fg-3')}>
                    {s.ok ? 'うけとれる！' : 'バッジで解放'}
                  </span>
                ) : (
                  <span className={cn('inline-flex h-8 items-center gap-1 rounded-full pl-1 pr-3', s.ok ? 'bg-gold-soft' : 'bg-fill')}>
                    <Coin size={22} />
                    <span className={cn('num text-[17px]', s.ok ? 'text-fg' : 'text-fg-3')}>{r.points.toLocaleString()}</span>
                  </span>
                )}
                {!s.locked && s.short > 0 && r.points > 0 && <span className="mt-1 block text-caption text-fg-3">あと{s.short}pt</span>}
              </span>
            </button>
          );
        })}
      </div>

      {redemptions.length > 0 && (
        <>
          <SectionHeader title="交換履歴" />
          <div>
            {[...redemptions].reverse().map((h) => (
              <ListRow
                key={h.id}
                title={REWARDS.find((r) => r.id === h.rewardId)?.title ?? h.rewardId}
                subtitle={formatDateJa(h.at)}
                value={pt(h.points)}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-8 space-y-3">
        <Notice>ポイントは、生き物の記録、路上レポート、セーフドライブ宣言で貯まります。</Notice>
        <Notice>ポイントに換金性はありません。購入もできません。β版のため、景品の内容は変わることがあります。不正な記録が確認された場合は、ポイントを取り消すことがあります。</Notice>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={target?.title}>
        {target && t && (
          <>
            <p className="text-body text-fg-2">
              <Phrase text={target.description} />
            </p>
            <Group className="-mx-4 mt-4">
              <ListRow title="必要なポイント" value={pt(target.points)} />
              {t.ok ? <ListRow title="交換後の残り" value={pt(balance - target.points)} /> : <ListRow title="いまのポイント" value={pt(balance)} />}
            </Group>
            {!lineMode && <p className="mt-3 text-sub text-fg-2">デモ版のため、実際の景品は届きません</p>}
            <Button variant="gold" className="mt-5" disabled={busy || !t.ok} onClick={confirm}>
              こうかんする
            </Button>
            {!t.ok && (
              <ButtonNote>
                {t.locked && t.badge ? `「${t.badge.title}」バッジを獲得すると交換できます` : <>あと{pt(t.short)}</>}
              </ButtonNote>
            )}
            <Button variant="text" size="hit" className="mt-2 w-full" onClick={() => setOpen(false)}>
              やめる
            </Button>
          </>
        )}
      </Sheet>
    </main>
  );
}
