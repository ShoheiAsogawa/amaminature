import { motion } from 'framer-motion';
import { Check, Frame, HandHeart, ScanSearch, Sparkles, Volume2, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, Kasuri, PageHeader, Sheet, toast } from '../components/ui';
import { api } from '../lib/api';
import type { PlusPlan } from '../lib/types';
import { isPlusActive, useStore } from '../store/useStore';

const PLANS: { id: PlusPlan; title: string; price: string; note: string; tag?: string }[] = [
  { id: 'trip', title: 'トリップパス', price: '¥480', note: '7日間 · 自動更新なし', tag: '旅行中の方に' },
  { id: 'year', title: '年額プラン', price: '¥3,800', note: '1年間 · 月あたり約¥317', tag: 'いちばんお得' },
  { id: 'month', title: '月額プラン', price: '¥480', note: '1か月ごとに自動更新' },
];

const BENEFITS = [
  { icon: ScanSearch, title: 'AIで名前を調べる', body: '写真から図鑑の候補をAIが提案。無料は1日1回、Plusは1日30回。' },
  { icon: Frame, title: '大島紬の限定カードフレーム', body: '泥染めと絣をモチーフにした、Plusだけのカードデザイン。', soon: true },
  { icon: Volume2, title: '鳴き声ガイド', body: '夜の森で聞こえた声の主を、音で調べられる。', soon: true },
  { icon: WifiOff, title: 'オフライン図鑑', body: '電波の届かない森の中でも、図鑑と解説がすぐ見られる。' },
  { icon: HandHeart, title: '奄美の自然を守る', body: '売上の一部を、ロードキル対策など奄美の保全活動へ寄付します（予定）。' },
];

export default function Plus() {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const activatePlus = useStore((s) => s.activatePlus);
  const [plan, setPlan] = useState<PlusPlan>('trip');
  const [confirm, setConfirm] = useState(false);
  const active = isPlusActive(settings);

  const purchase = async () => {
    if (lineMode) await api.demoPlus(plan).catch(() => undefined);
    activatePlus(plan);
    setConfirm(false);
    toast('AMAMI NATURE+ を有効にしました');
    navigate(-1);
  };

  return (
    <main className="min-h-dvh pb-[calc(130px+var(--safe-bottom))]">
      <PageHeader back label="PREMIUM" title="AMAMI NATURE+" />

      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-[#0B1A2E] via-[#1B2F55] to-lapis p-6 text-white shadow-lift"
        >
          <Kasuri className="text-white/[0.06]" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/30 blur-3xl" />
          <Sparkles className="relative h-8 w-8 text-gold" />
          <h2 className="relative mt-3 font-serif text-[24px] font-bold leading-snug">
            わからない生き物も、
            <br />
            その場で図鑑に。
          </h2>
          <p className="relative mt-2 text-[13px] leading-relaxed text-white/70">AIと一緒に、奄美の森と海をもっと深く楽しもう。</p>
          {active && (
            <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[12px] font-extrabold text-forest-950">
              <Check className="h-3.5 w-3.5" /> {formatDate(settings.plus!.until)} まで有効
            </div>
          )}
        </motion.div>
      </section>

      <section className="mt-6 space-y-2.5 px-4">
        {BENEFITS.map((b) => (
          <div key={b.title} className="card flex gap-3 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ruri/10 text-ruri">
              <b.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 text-[14px] font-bold">
                {b.title}
                {b.soon && <span className="rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[9px] text-ink3">準備中</span>}
              </div>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink2">{b.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-6 space-y-2 px-4">
        <div className="label px-1">PLANS</div>
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlan(p.id)}
            className={`card relative flex w-full items-center gap-3 p-4 text-left transition ${plan === p.id ? 'ring-2 ring-ruri' : ''}`}
          >
            <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${plan === p.id ? 'border-ruri bg-ruri' : 'hairline'}`}>
              {plan === p.id && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-[15px] font-bold">
                {p.title}
                {p.tag && <span className="rounded-full bg-kin/15 px-2 py-0.5 text-[10px] text-kin">{p.tag}</span>}
              </span>
              <span className="text-[11.5px] text-ink3">{p.note}</span>
            </span>
            <span className="font-serif text-[20px] font-extrabold">{p.price}</span>
          </button>
        ))}
        <p className="px-1 pt-1 text-[10.5px] leading-relaxed text-ink3">
          価格は税込の予定価格です。決済はLINE内からカード・各種ペイ（Stripe）で行う予定です。
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-[calc(16px+var(--safe-bottom))] pt-6">
        <button className="btn w-full bg-gradient-to-r from-[#1B2F55] to-lapis py-4 text-[16px] text-white shadow-lift" onClick={() => setConfirm(true)}>
          <Sparkles className="h-5 w-5 text-gold" /> {active ? 'プランを変更する' : 'AMAMI NATURE+ をはじめる'}
        </button>
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="デモ版の確認">
        <p className="text-[13.5px] leading-relaxed text-ink2">
          現在はβ版のため、実際の決済は発生しません。ボタンを押すと「{PLANS.find((p) => p.id === plan)!.title}」を無料で体験できます。
        </p>
        <button className="btn-primary mt-5 w-full" onClick={purchase}>
          体験をはじめる
        </button>
      </Sheet>
    </main>
  );
}
