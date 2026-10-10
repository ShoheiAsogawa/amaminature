import NumberFlow from '@number-flow/react';
import { useState } from 'react';
import { IconDiceFive, IconGift, IconHandHeart, IconTicket } from '../components/icons';
import { Phrase } from '../components/Phrase';
import {
  Button,
  ButtonNote,
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
import { BADGES } from '../lib/progress';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';

/** 先頭のアイコンは種類で決める（§8.9）: 寄付 hand-heart、クーポン ticket、品物 gift、抽選 dice-five */
const KIND_ICON = { donation: IconHandHeart, coupon: IconTicket, goods: IconGift, lottery: IconDiceFive } as const;

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
      <ScreenHeader variant="nav" title="ポイント交換" />

      <section className="px-4 pt-2">
        <p className="flex items-baseline text-fg" aria-label={`交換できるポイント ${balance}pt`}>
          <NumberFlow value={balance} locales="ja-JP" className="num text-num-xl" aria-hidden />
          <span className="ml-[0.15em] text-sub text-fg-2" aria-hidden>
            pt
          </span>
        </p>
        <p className="mt-1 text-sub text-fg-2">
          これまでに{pt(points)}獲得
          {points - balance > 0 ? <>、{pt(points - balance)}交換しました</> : 'しました'}
        </p>
      </section>

      <SectionHeader title="交換できるもの" />
      <div>
        {REWARDS.map((r) => {
          const Icon = KIND_ICON[r.kind];
          const s = status(r);
          return (
            <ListRow
              key={r.id}
              icon={Icon}
              title={r.title}
              subtitle={
                r.note || (s.badge && r.requiresBadge) ? (
                  <>
                    {r.note && <span className="block">{r.note}</span>}
                    {s.badge && s.locked && <span className="block">「{s.badge.title}」バッジが必要</span>}
                  </>
                ) : undefined
              }
              trailing={
                r.points === 0 ? (
                  // バッジで受け取る記念品はポイントを使わないので、0 pt とは出さない
                  s.ok ? <span className="shrink-0 text-sub text-brand">受け取れます</span> : null
                ) : s.ok ? (
                  <span className="shrink-0 text-callout font-semibold text-brand">{pt(r.points)}</span>
                ) : s.short > 0 ? (
                  <span className="shrink-0 text-sub text-fg-3">あと{pt(s.short)}</span>
                ) : (
                  <span className="shrink-0 text-sub text-fg-3">{pt(r.points)}</span>
                )
              }
              onClick={() => {
                setTarget(r);
                setOpen(true);
              }}
            />
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
            <Button className="mt-5" disabled={busy || !t.ok} onClick={confirm}>
              交換する
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
