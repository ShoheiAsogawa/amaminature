import { Gift, HandHeart, Lock, Ticket, Trophy } from 'lucide-react';
import { useState } from 'react';
import { formatDate, Kasuri, PageHeader, Sheet, toast } from '../components/ui';
import { REWARD_KIND_LABEL, REWARDS, type Reward } from '../data/rewards';
import { api, errorMessage } from '../lib/api';
import { BADGES } from '../lib/progress';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';

const KIND_ICON = { donation: HandHeart, coupon: Ticket, goods: Gift, lottery: Trophy } as const;

export default function Rewards() {
  const { balance, points, badges } = useProgress();
  const redeem = useStore((s) => s.redeem);
  const redemptions = useStore((s) => s.settings.redemptions);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [target, setTarget] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    try {
      if (lineMode) await api.redeem(target.id);
      redeem(target.id, target.points);
      toast(lineMode ? '交換を受け付けました。LINEでお知らせします' : '交換しました（デモ）');
      setTarget(null);
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh pb-[calc(40px+var(--safe-bottom))]">
      <PageHeader back label="REWARDS" title="ポイント交換" />

      <section className="px-4">
        <div className="relative overflow-hidden rounded-4xl bg-kuri p-5 text-washi shadow-lift">
          <Kasuri className="text-white/[0.07]" />
          <div className="relative text-[10px] font-bold tracking-label text-washi/60">AVAILABLE</div>
          <div className="relative font-serif text-[40px] font-extrabold leading-tight">
            {balance.toLocaleString()}
            <span className="ml-1 text-[15px] text-washi/60">pt</span>
          </div>
          <div className="relative text-[11px] text-washi/60">累計 {points.toLocaleString()}pt · 交換済み {(points - balance).toLocaleString()}pt</div>
          <p className="relative mt-3 text-[11.5px] leading-relaxed text-washi/75">
            生き物の記録、路上レポート、セーフドライブ宣言でポイントが貯まります。景品は自治体・協賛企業のみなさまのご協力で提供されます。
          </p>
        </div>
      </section>

      <section className="mt-6 space-y-3 px-4">
        {REWARDS.map((r) => {
          const Icon = KIND_ICON[r.kind];
          const locked = !!r.requiresBadge && !badges.has(r.requiresBadge);
          const short = balance < r.points;
          const badge = r.requiresBadge ? BADGES.find((b) => b.id === r.requiresBadge) : null;
          return (
            <article key={r.id} className="card flex gap-3 p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-kin/10 text-kin">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[9px] font-bold text-ink2">{REWARD_KIND_LABEL[r.kind]}</span>
                  <span className="truncate text-[10px] text-ink3">提供：{r.sponsor}</span>
                </div>
                <h3 className="mt-1 text-[15px] font-bold leading-snug">{r.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink2">{r.description}</p>
                {badge && (
                  <p className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${locked ? 'text-ink3' : 'text-accent'}`}>
                    <Lock className="h-3 w-3" /> 条件：バッジ「{badge.title}」
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-serif text-[18px] font-extrabold">{r.points ? `${r.points.toLocaleString()}pt` : '0pt'}</span>
                  <button className="btn-primary px-4 py-2 text-[13px]" disabled={locked || short} onClick={() => setTarget(r)}>
                    {locked ? '条件未達成' : short ? 'ポイント不足' : '交換する'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        <p className="px-1 pt-2 text-[10.5px] leading-relaxed text-ink3">
          ※ 景品は掲載イメージです。ポイントは購入できず、現金への交換はできません。不正な記録が確認された場合はポイントを取り消すことがあります。
        </p>
      </section>

      {redemptions.length > 0 && (
        <section className="mt-6 px-4">
          <div className="label mb-2 px-1">HISTORY</div>
          <div className="card divide-y divide-[var(--line)]">
            {[...redemptions].reverse().map((h) => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="font-bold">{REWARDS.find((r) => r.id === h.rewardId)?.title ?? h.rewardId}</span>
                <span className="text-ink3">
                  -{h.points}pt · {formatDate(h.at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <Sheet open={!!target} onClose={() => setTarget(null)} title={target ? `「${target.title}」と交換しますか？` : ''}>
        {target && (
          <>
            <p className="text-[13.5px] leading-relaxed text-ink2">
              {target.points.toLocaleString()}pt を使います。交換後の残りは {(balance - target.points).toLocaleString()}pt です。
              {!lineMode && '（デモ版のため実際の景品は届きません）'}
            </p>
            <button className="btn-primary mt-5 w-full" disabled={busy} onClick={confirm}>
              交換する
            </button>
          </>
        )}
      </Sheet>
    </main>
  );
}
