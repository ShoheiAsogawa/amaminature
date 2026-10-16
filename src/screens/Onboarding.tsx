import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/Brand';
import { TATSUGO_STYLE } from '../components/CollectibleCard';
import { Coin, MessageWindow, pxCircleClip, Sparkles } from '../components/game';
import { IconCarProfile, IconEyeSlash, IconHandHeart, IconTicket } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { BadgeEmblem, BadgeName, Button, cn, CTA_PADDING, CtaBar, Field, Input, StampSeal } from '../components/ui';
import { PRIVACY_VERSION, TERMS_VERSION } from '../data/legalVersions';
import { api } from '../lib/api';
import { LegalSheet, type LegalKind } from './Legal';
import { BADGES } from '../lib/progress';
import { sfx } from '../lib/sfx';
import { useStore } from '../store/useStore';

// ───────── タイトルのロゴ ─────────

function TitleLogo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* 白い線の瑠璃のドット絵の丸（白い丸に瑠璃の丸を 3px 内側に重ねる）。下の厚みは切り抜かない外側の drop-shadow で落とす */}
      <span className="shrink-0 [filter:drop-shadow(0_3px_0_rgb(var(--c-brand-pressed)))]">
        <span className="relative grid h-[45px] w-[45px] place-items-center bg-white" style={{ clipPath: pxCircleClip(45) }}>
          <span className="absolute inset-[3px] bg-brand-fill" style={{ clipPath: pxCircleClip(39) }} />
          <LogoMark size={26} className="relative text-white" />
        </span>
      </span>
      <div className="leading-none">
        <div className="num text-[24px] tracking-[1px] text-white">
          AMAMI <span className="text-gold">NATURE</span>
        </div>
        <div className="mt-1 text-caption text-white/75">奄美いきもの図鑑クエスト</div>
      </div>
    </div>
  );
}

// ───────── 紹介のページの絵（写真がない間は、アプリの中の物そのものを見せる） ─────────

/**
 * 1 ページ目: 伏せた図鑑カード（裏面の龍郷柄）を 3 枚、扇に広げる。
 * カードは図鑑カードの裏面と同じ形（白い縁 2 ドット、角は 3 段の段々 px-clip-3、柄の面は 1 段の段々）。
 * 切り抜いたカードは自分の影を描けないので、傾けない外側の箱に固い影（下 6px）を付ける（影はまっすぐ下に落ちる）
 */
function CardFan() {
  const card = (rot: number, x: number, y: number, z: number, delay: string) => (
    <div
      className="absolute left-1/2 top-1/2 [filter:drop-shadow(0_6px_0_rgb(0_0_0/.35))]"
      style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, zIndex: z }}
    >
      <div style={{ transform: `rotate(${rot}deg)` }}>
        <div className="px-clip-3 grid h-[214px] w-[152px] animate-float bg-white p-1.5" style={{ animationDelay: delay }}>
          <div className="px-clip-1 grid place-items-center" style={TATSUGO_STYLE}>
            {/* 白い線の紋章（白い丸に瑠璃の丸を 3px 内側に重ねる） */}
            <span className="relative grid h-[63px] w-[63px] place-items-center bg-white" style={{ clipPath: pxCircleClip(63) }}>
              <span className="absolute inset-[3px] bg-brand-pressed" style={{ clipPath: pxCircleClip(57) }} />
              <LogoMark size={32} className="relative text-white" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <div className="relative h-[260px] w-[300px]">
      {card(-12, -64, 16, 1, '0.4s')}
      {card(12, 64, 16, 2, '0.8s')}
      {card(0, 0, 0, 3, '0s')}
      {/* ステッカー（傾きは残す）。切り抜いたタグの下の厚みは、外側の drop-shadow で落とす */}
      <span className="absolute left-1/2 top-[-8px] z-10 -translate-x-1/2 -rotate-6 [filter:drop-shadow(0_3px_0_rgb(var(--c-capture-edge)))]">
        <span className="px-clip-1 num block bg-capture px-3 py-0.5 text-[18px] text-white">62 SPECIES</span>
      </span>
    </div>
  );
}

/** 2 ページ目: 道路と生き物を守るバッジ（森との約束・セーフドライバー・夜道の見守り隊） */
function GuardBadges() {
  const ids = ['pledge', 'safe-driver', 'road-guardian'];
  return (
    <div className="grid w-full max-w-[340px] grid-cols-3 gap-2">
      {ids.map((id) => {
        const b = BADGES.find((x) => x.id === id)!;
        return (
          <div key={id} className="flex flex-col items-center gap-3">
            <BadgeEmblem badge={b} earned size={88} />
            <span className="text-center text-sub font-black text-white">
              <BadgeName badge={b} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 3 ページ目: 市町村のスタンプと、交換できるものの 1 行 */
function StampsAndReward() {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 864e5);
  return (
    <div className="w-full max-w-[358px] px-4">
      <div className="px-clip-2 grid grid-cols-4 justify-items-center bg-surface py-3">
        <StampSeal name="奄美市" visited date={yesterday} />
        <StampSeal name="龍郷町" visited date={today} />
        <StampSeal name="徳之島町" visited={false} />
        <StampSeal name="与論町" visited={false} />
      </div>
      <div className="panel mt-8 overflow-hidden">
        {[
          { icon: IconTicket, title: '提携ツアー 1,000円引き', points: 300 },
          { icon: IconHandHeart, title: '奄美の自然保護に寄付する', points: 100 },
        ].map((r) => (
          <div key={r.title} className="group/row flex items-center pl-3">
            <r.icon size={20} className="shrink-0 text-fg-2" />
            <span className="ml-3 flex min-h-12 min-w-0 flex-1 items-center gap-3 border-b-2 border-sep py-2.5 pr-3 group-last/row:border-b-0">
              <span className="min-w-0 flex-1 text-callout font-bold text-fg">{r.title}</span>
              <span className="flex shrink-0 items-center gap-1">
                <Coin size={20} />
                <span className="num text-[17px] text-fg">{r.points}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3 ページの紹介（§8.13）。各ページの上に全幅の写真を置く設計だが、写真がまだない間は
 * 写真の領域を省かず、アプリの中の物（図鑑カードの裏面、バッジ、スタンプ）を同じ場所に置く。
 * 写真を用意したら photo に { src, credit } を入れる（絵の代わりに写真が入る）。
 */
const SLIDES: { title: string; body: string; message: string; visual: ReactNode; photo?: { src: string; credit: string } }[] = [
  {
    title: '奄美の生き物を記録して、自分だけの図鑑をつくろう',
    body: '森と海で出会った生き物を撮って、名前をつけて集めましょう。世界自然遺産の島には、ここにしかいない生き物がたくさんいます。',
    message: 'ようこそ、奄美の島へ！ ここには 世界で ここにしか いない 生き物が たくさん いるよ。 撮って あつめて、図鑑を コンプしよう！',
    visual: <CardFan />,
  },
  {
    title: '夜の道は、生き物たちの道でもある',
    body: 'セーフドライブ宣言や路上レポートで、アマミノクロウサギなどの交通事故を減らす取り組みに参加できます。',
    message: '夜の 林道には クロウサギが 出てくるんだ。 ゆっくり 走って 守ってあげてね。 守ると バッジが もらえるよ！',
    visual: <GuardBadges />,
  },
  {
    title: '貯めたポイントで、島の体験と交換しよう',
    body: '記録やレポートでポイントが貯まります。ツアーの割引や島のお店のクーポンと交換したり、自然保護に寄付したりできます。',
    message: '記録すると ポイントが たまるよ。 レアな 生き物ほど たくさん！ ツアーや 島のお店で つかえるんだ。',
    visual: <StampsAndReward />,
  },
];

/** 3 つの約束（番号を付けない。チェックボックスで同意させず、1 つのボタンで約束する） */
const PLEDGES = [
  { icon: IconHandHeart, title: '近づきすぎず、そっと見守ります', body: '採らない、触らない、餌をあげない。生き物との距離を保ちます。' },
  { icon: IconCarProfile, title: '夜の林道はゆっくり走ります', body: '夜の道路には、アマミノクロウサギなどの生き物が出てきます。' },
  { icon: IconEyeSlash, title: '希少な生き物の場所は広めません', body: '場所がわかる写真や投稿を、SNSに載せません。' },
];

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 固定 CTA バー（点のページ表示 ＋ ボタン 50）の分だけ本文の下を空ける */
const INTRO_CTA_PADDING = 'pb-[calc(112px+var(--safe-bottom))]';

function Intro({ onDone }: { onDone: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // ボタンで送っている間は、途中のスクロール位置でページ番号を戻さない
  const target = useRef<number | null>(null);
  const last = index === SLIDES.length - 1;

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    const pos = el.scrollLeft / el.clientWidth;
    if (target.current != null) {
      if (Math.abs(pos - target.current) < 0.02) target.current = null;
      return;
    }
    setIndex(Math.max(0, Math.min(SLIDES.length - 1, Math.round(pos))));
  };

  // 送っている途中で指で動かした時、スクロールが止まった時は、見えているページに合わせ直す（ページ番号が固まらないように）
  const release = () => {
    target.current = null;
  };
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const settle = () => {
      target.current = null;
      if (el.clientWidth) setIndex(Math.max(0, Math.min(SLIDES.length - 1, Math.round(el.scrollLeft / el.clientWidth))));
    };
    el.addEventListener('scrollend', settle);
    return () => el.removeEventListener('scrollend', settle);
  }, []);

  const next = () => {
    const el = scroller.current;
    const current = target.current ?? index;
    if (current >= SLIDES.length - 1) {
      onDone();
      return;
    }
    const to = current + 1;
    setIndex(to);
    if (!el) return;
    target.current = to;
    el.scrollTo({ left: to * el.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="stage relative text-white" style={{ background: 'var(--stage)' }}>
      <Sparkles count={4} className="fixed opacity-60" />
      {/* 最後のページでは［はじめる］と同じ動作になるので出さない */}
      {!last && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[480px] pt-safe">
          <div className="flex h-[60px] items-center justify-end px-3">
            <Button variant="text" size="hit" className="pointer-events-auto text-white/75" onClick={onDone}>
              スキップ ›
            </Button>
          </div>
        </div>
      )}

      <div
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={release}
        onTouchStart={release}
        onWheel={release}
        aria-roledescription="カルーセル"
        className="no-scrollbar flex h-dvh snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {SLIDES.map((s, i) => (
          <section
            key={s.title}
            aria-roledescription="スライド"
            aria-label={`${i + 1} / ${SLIDES.length}`}
            aria-hidden={i !== index}
            className={cn('relative flex h-full w-full shrink-0 snap-start snap-always flex-col overflow-y-auto pt-safe', INTRO_CTA_PADDING)}
          >
            {s.photo ? (
              <figure className="h-[60%] shrink-0">
                <img src={s.photo.src} alt="" className="photo h-full w-full object-cover" draggable={false} />
                <figcaption className="px-4 pt-1 text-right text-caption text-fg-3">© {s.photo.credit}</figcaption>
              </figure>
            ) : (
              <>
                {/* ワードマークは 1 ページ目だけ。ほかのページも同じ高さを空け、絵と見出しの位置をそろえる */}
                <div className="flex h-[60px] shrink-0 items-center px-4">{i === 0 && <TitleLogo />}</div>
                <div aria-hidden className="flex min-h-[280px] flex-1 items-center justify-center overflow-hidden py-4">
                  {s.visual}
                </div>
              </>
            )}
            <div className="shrink-0 px-4 pt-2">
              <h2 className="balance text-title font-black text-white">
                <Phrase text={s.title} />
              </h2>
              <p className="sr-only">{s.body}</p>
              <div className="mt-3 text-left">
                {i === index && <MessageWindow speaker="島のガイド" text={s.message} speed={30} />}
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] px-4 pb-[calc(14px+var(--safe-bottom))] pt-3">
        <div className="mb-3.5 flex justify-center gap-2" aria-hidden>
          {SLIDES.map((_, i) => (
            <span key={i} className={cn('h-[9px] transition-all', i === index ? 'w-[27px] bg-gold' : 'w-[9px] bg-white/30')} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {index + 1} / {SLIDES.length}
        </p>
        <Button
          variant="gold"
          onClick={() => {
            sfx(last ? 'get' : 'tap');
            next();
          }}
        >
          {last ? 'はじめる' : '次へ'}
        </Button>
      </div>
    </div>
  );
}

function Pledge({ onFinish }: { onFinish: (name: string) => void }) {
  const existingName = useStore((s) => s.settings.name);
  const [name, setName] = useState(existingName);
  const [reading, setReading] = useState<LegalKind | null>(null);

  return (
    <main className={cn('min-h-dvh pt-safe', CTA_PADDING)}>
      <section className="px-4 pt-8">
        <p className="num text-[14px] tracking-[1px] text-brand">RANGER OATH</p>
        <h1 className="balance mt-1 text-display text-fg">
          <Phrase text="レンジャーの3つの約束" />
        </h1>
        <p className="mt-2 text-body font-bold text-fg-2">
          <Phrase text="島の生き物を守るための約束です。約束すると、最初のバッジがもらえます。" />
        </p>
      </section>

      <ul className="mt-5 space-y-2.5 px-4">
        {PLEDGES.map((p, i) => (
          <li key={p.title} className="panel flex gap-3 p-2.5">
            {/* 番号は丸の外にはみ出すので、切り抜いた丸の兄弟にする */}
            <span className="relative h-11 w-11 shrink-0">
              <span className="px-circle-m grid h-full w-full place-items-center bg-brand-soft text-brand">
                <p.icon size={24} />
              </span>
              <span className="px-circle-s num absolute -left-1 -top-1 grid h-5 w-5 place-items-center bg-gold text-[12px] leading-none text-[#3d2a00]">{i + 1}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-headline font-black text-fg">
                <Phrase text={p.title} />
              </p>
              <p className="mt-1 text-sub font-bold text-fg-2">
                <Phrase text={p.body} />
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form
        className="mt-8 px-4"
        onSubmit={(e) => {
          e.preventDefault();
          onFinish(name);
        }}
      >
        <Field label="レンジャーネーム（あとで変更できます）">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：しまのりす" maxLength={20} enterKeyHint="done" />
        </Field>
      </form>

      {/* 利用規約・プライバシーポリシーへの同意（ボタン1つで約束と同意をする。同意した版と日時を残す） */}
      <p className="mt-6 px-4 text-sub font-bold text-fg-2">
        ［約束してはじめる］を押すと、
        <button type="button" className="text-brand underline underline-offset-2" onClick={() => setReading('terms')}>
          利用規約
        </button>
        と
        <button type="button" className="text-brand underline underline-offset-2" onClick={() => setReading('privacy')}>
          プライバシーポリシー
        </button>
        <Phrase text="に同意したことになります。未成年の方は、保護者の方と一緒に読んでください。" />
      </p>
      <LegalSheet kind={reading} onClose={() => setReading(null)} />

      <CtaBar>
        <Button
          onClick={() => {
            sfx('badge');
            onFinish(name);
          }}
        >
          約束してはじめる
        </Button>
      </CtaBar>
    </main>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const updateSettings = useStore((s) => s.updateSettings);
  const onboarded = useStore((s) => s.settings.onboarded);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [step, setStep] = useState<'intro' | 'pledge'>('intro');
  // オンボーディングの前に開こうとしていた画面（LINE のトークの「記録する」など）。アプリ内のパスだけ
  const from = (location.state as { from?: unknown } | null)?.from;
  const next = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/onboarding') ? from : '/';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // 終えた時、または LINE で前に誓いを済ませていた（別の端末・データを消した後）とわかった時に先へ進む
  useEffect(() => {
    if (onboarded) navigate(next, { replace: true });
  }, [onboarded, next, navigate]);

  const finish = (raw: string) => {
    const name = raw.trim();
    const consent = { terms: TERMS_VERSION, privacy: PRIVACY_VERSION };
    updateSettings({ onboarded: true, pledged: true, name, consent: { ...consent, at: new Date().toISOString() } });
    // 送れなくても、次の同期で送る（sync.ts の syncConsents）
    if (lineMode) void api.updateMe({ pledged: true, nickname: name, consent }).catch(() => undefined);
  };

  return step === 'intro' ? <Intro onDone={() => setStep('pledge')} /> : <Pledge onFinish={finish} />;
}
