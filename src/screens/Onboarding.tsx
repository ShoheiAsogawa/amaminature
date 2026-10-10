import { AnimatePresence, motion } from 'framer-motion';
import { Bird, Camera, Check, Gift, Leaf, Moon, Rabbit, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/Brand';
import { Kasuri } from '../components/ui';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';

const SLIDES = [
  {
    label: 'COLLECT',
    title: '出会った生き物を、\nあなたの図鑑に。',
    body: '奄美の森と海で見つけた生き物を撮って、名前をつけて、集めよう。世界自然遺産の島には、ここにしかいない生き物がたくさん。',
  },
  {
    label: 'PROTECT',
    title: '夜の道は、\n生き物たちの道でもある。',
    body: 'セーフドライブ宣言や路上レポートで、アマミノクロウサギなどの交通事故を減らす取り組みに参加できます。',
  },
  {
    label: 'REWARD',
    title: '貯めたポイントで、\n島の体験と交換。',
    body: '記録やレポートでポイントが貯まり、ツアー割引や島の協賛店クーポン、保全活動への寄付と交換できます。',
  },
];

const PLEDGES = ['採らない・触らない・餌をあげない', '希少な生き物の場所を広めない', '夜の林道はゆっくり走る'];

function Illustration({ index }: { index: number }) {
  if (index === 0) {
    const cards = [
      { icon: Leaf, bg: '#2B6750', rot: -14, x: -70 },
      { icon: Bird, bg: '#2A4FA3', rot: 10, x: 70 },
      { icon: Rabbit, bg: '#8A4B2A', rot: 0, x: 0 },
    ];
    return (
      <div className="relative h-64 w-full">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ y: 40, opacity: 0, rotate: 0 }}
            animate={{ y: 0, opacity: 1, rotate: c.rot }}
            transition={{ delay: 0.1 + i * 0.12, type: 'spring', damping: 14 }}
            className="absolute left-1/2 top-4 h-52 w-36 overflow-hidden rounded-3xl border-4 border-washi shadow-lift"
            style={{ background: c.bg, marginLeft: -72 + c.x }}
          >
            <Kasuri className="text-white/10" size={22} />
            <c.icon className="absolute inset-0 m-auto h-14 w-14 text-white/80" strokeWidth={1.3} />
            {i === 2 && <div className="absolute right-2 top-2 rounded bg-sango px-1.5 py-0.5 text-[10px] font-extrabold text-white">NEW!</div>}
          </motion.div>
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="relative grid h-64 w-full place-items-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute right-12 top-6 h-16 w-16 rounded-full bg-gold shadow-[0_0_60px_18px_rgba(199,154,46,.35)]" />
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="grid h-36 w-36 place-items-center rounded-full bg-white/10">
          <Moon className="h-16 w-16 text-washi" strokeWidth={1.2} />
        </motion.div>
        <div className="absolute bottom-6 left-1/2 h-1 w-56 -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(90deg,rgba(246,241,231,.6)_0_18px,transparent_18px_32px)]" />
      </div>
    );
  }
  return (
    <div className="relative grid h-64 w-full place-items-center">
      <motion.div initial={{ rotate: -20, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="grid h-36 w-36 place-items-center rounded-full bg-gradient-to-br from-[#E2C46F] to-gold shadow-glow">
        <Gift className="h-16 w-16 text-forest-950" strokeWidth={1.4} />
      </motion.div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const updateSettings = useStore((s) => s.updateSettings);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const existingName = useStore((s) => s.settings.name);
  const [index, setIndex] = useState(0);
  const [checks, setChecks] = useState([false, false, false]);
  const [name, setName] = useState(existingName);
  const pledgeStep = index === SLIDES.length;

  const finish = () => {
    updateSettings({ onboarded: true, pledged: true, name: name.trim() });
    if (lineMode) void api.updateMe({ pledged: true, nickname: name.trim() }).catch(() => undefined);
    navigate('/', { replace: true });
  };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden bg-forest-950 text-washi">
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_25%,rgba(43,103,80,.75),transparent_70%),radial-gradient(70%_50%_at_100%_100%,rgba(42,79,163,.45),transparent_70%)]" />
      <Kasuri className="text-white/[0.04]" />

      <div className="relative flex items-center justify-between px-6 pt-[calc(20px+var(--safe-top))]">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-[12px] font-bold tracking-[0.22em]">AMAMI NATURE</span>
        </div>
        {!pledgeStep && (
          <button onClick={() => setIndex(SLIDES.length)} className="text-[12px] font-bold text-washi/60">
            スキップ
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!pledgeStep ? (
          <motion.div key={index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="relative flex flex-1 flex-col px-7">
            <div className="mt-8">
              <Illustration index={index} />
            </div>
            <div className="mt-6 text-[11px] font-bold tracking-[0.3em] text-gold">{SLIDES[index].label}</div>
            <h1 className="mt-2 whitespace-pre-line font-serif text-[27px] font-bold leading-[1.45]">{SLIDES[index].title}</h1>
            <p className="mt-3 text-[13.5px] leading-[1.9] text-washi/70">{SLIDES[index].body}</p>
          </motion.div>
        ) : (
          <motion.div key="pledge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-1 flex-col px-6">
            <div className="mt-10 grid h-16 w-16 place-items-center rounded-full bg-white/10">
              <ShieldCheck className="h-8 w-8 text-gold" />
            </div>
            <h1 className="mt-5 font-serif text-[25px] font-bold leading-snug">奄美の森との、3つの約束</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-washi/65">はじめる前に、島の生き物を守るための約束をしましょう。</p>
            <div className="mt-6 space-y-2.5">
              {PLEDGES.map((p, i) => (
                <button
                  key={p}
                  onClick={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${checks[i] ? 'border-gold/70 bg-white/10' : 'border-white/15 bg-white/[0.04]'}`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${checks[i] ? 'border-gold bg-gold text-forest-950' : 'border-white/30'}`}>
                    {checks[i] && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="text-[14.5px] font-bold">{p}</span>
                </button>
              ))}
            </div>
            <label className="mt-6 block">
              <span className="text-[11px] font-bold tracking-label text-washi/50">観察者ネーム（あとで変更できます）</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：しまのりす"
                maxLength={20}
                className="mt-2 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-[15px] text-washi placeholder:text-washi/30 focus:border-gold/60 focus:outline-none"
              />
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative px-6 pb-[calc(28px+var(--safe-bottom))] pt-6">
        {!pledgeStep && (
          <div className="mb-5 flex justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-gold' : 'w-1.5 bg-white/25'}`} />
            ))}
          </div>
        )}
        {pledgeStep ? (
          <button className="btn w-full bg-gold py-4 text-[16px] text-forest-950" disabled={!checks.every(Boolean)} onClick={finish}>
            <Camera className="h-5 w-5" /> 約束してはじめる
          </button>
        ) : (
          <button className="btn w-full bg-washi py-4 text-[16px] text-forest-900" onClick={() => setIndex((i) => i + 1)}>
            つぎへ
          </button>
        )}
      </div>
    </div>
  );
}
