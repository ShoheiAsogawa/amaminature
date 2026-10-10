import { motion } from 'framer-motion';
import { Car, Check, Gauge, Lightbulb, Moon, Smartphone, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Kasuri, PageHeader, toast } from '../components/ui';
import { api } from '../lib/api';
import { SAFE_DRIVE_POINTS } from '../lib/progress';
import { localDateKey, useStore } from '../store/useStore';

const CHECKS = [
  { icon: Gauge, text: '林道では時速20〜30km程度でゆっくり走ります' },
  { icon: Lightbulb, text: '生き物を見つけてもライトを当て続けず、すぐに通り過ぎます' },
  { icon: Smartphone, text: '運転中はスマホを操作しません（記録は停車してから・同乗者が）' },
  { icon: TriangleAlert, text: '路上の生き物には、後続車に注意して停車・徐行で道をゆずります' },
];

export default function SafeDrive() {
  const navigate = useNavigate();
  const declared = useStore((s) => s.settings.safeDriveDates.includes(localDateKey()));
  const total = useStore((s) => s.settings.safeDriveDates.length);
  const declareSafeDrive = useStore((s) => s.declareSafeDrive);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => declared));
  const all = checked.every(Boolean);

  const declare = async () => {
    if (lineMode) await api.safeDrive().catch(() => undefined);
    if (declareSafeDrive()) toast(`セーフドライブ宣言！ +${SAFE_DRIVE_POINTS}pt`);
    navigate(-1);
  };

  return (
    <main className="min-h-dvh pb-[calc(120px+var(--safe-bottom))]">
      <PageHeader back label="SAFE DRIVE" title="セーフドライブ宣言" />
      <section className="px-4">
        <div className="relative overflow-hidden rounded-4xl bg-[#0B1A2E] p-6 text-washi shadow-lift">
          <Kasuri className="text-white/[0.05]" />
          <div className="absolute right-5 top-5 h-12 w-12 rounded-full bg-gold/90 shadow-[0_0_40px_10px_rgba(199,154,46,.35)]" />
          <Moon className="relative h-7 w-7 text-gold" />
          <h2 className="relative mt-3 font-serif text-[22px] font-bold leading-snug">
            夜の道は、
            <br />
            生き物たちの道でもある。
          </h2>
          <p className="relative mt-3 text-[12.5px] leading-relaxed text-washi/70">
            奄美大島・徳之島では、アマミノクロウサギの交通事故が毎年多く確認されています。ゆっくり走れば、事故を防げるだけでなく、生き物に出会えるチャンスも増えます。
          </p>
          <div className="relative mt-4 flex items-center gap-2 text-[12px] text-washi/60">
            <Car className="h-4 w-4" /> これまでの宣言：<b className="text-gold">{total}回</b>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-2 px-4">
        <div className="label px-1">出発前のチェック</div>
        {CHECKS.map((c, i) => (
          <button
            key={c.text}
            onClick={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
            className={`card flex w-full items-center gap-3 p-4 text-left transition ${checked[i] ? 'ring-2 ring-accent' : ''}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ruri/10 text-ruri">
              <c.icon className="h-5 w-5" />
            </span>
            <span className="flex-1 text-[13.5px] font-bold leading-snug">{c.text}</span>
            <motion.span
              animate={{ scale: checked[i] ? 1 : 0.8 }}
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${checked[i] ? 'border-accent bg-accent text-onprimary' : 'hairline'}`}
            >
              {checked[i] && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </motion.span>
          </button>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-[calc(16px+var(--safe-bottom))] pt-6">
        <button className="btn-primary w-full py-4 text-[16px]" disabled={!all || declared} onClick={declare}>
          {declared ? '今日は宣言済みです' : all ? `宣言して出発する（+${SAFE_DRIVE_POINTS}pt）` : 'すべてチェックしてください'}
        </button>
      </div>
    </main>
  );
}
