import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Brand';
import { IconCarProfile, IconEyeSlash, IconHandHeart } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { Button, cn, CTA_PADDING, CtaBar, Field, Input } from '../components/ui';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';

/**
 * 3 ページの紹介（§8.13）。各ページの上 60% に全幅の写真を置く設計だが、写真がまだないので
 * 写真の領域を省き、見出しを上に詰めている（写真を用意したら photo に { src, credit } を入れる）。
 */
const SLIDES: { title: string; body: string; photo?: { src: string; credit: string } }[] = [
  {
    title: '奄美の生き物を記録して、自分だけの図鑑をつくろう',
    body: '森と海で出会った生き物を撮って、名前をつけて集めましょう。世界自然遺産の島には、ここにしかいない生き物がたくさんいます。',
  },
  {
    title: '夜の道は、生き物たちの道でもある',
    body: 'セーフドライブ宣言や路上レポートで、アマミノクロウサギなどの交通事故を減らす取り組みに参加できます。',
  },
  {
    title: '貯めたポイントで、島の体験と交換しよう',
    body: '記録やレポートでポイントが貯まり、ツアーの割引や島の協賛店のクーポン、保全活動への寄付と交換できます。',
  },
];

/** 3 つの約束（番号を付けない。チェックボックスで同意させず、1 つのボタンで約束する） */
const PLEDGES = [
  { icon: IconHandHeart, title: '近づきすぎず、そっと見守ります', body: '採らない、触らない、餌をあげない。生き物との距離を保ちます。' },
  { icon: IconCarProfile, title: '夜の林道はゆっくり走ります', body: '夜の道路には、アマミノクロウサギなどの生き物が出てきます。' },
  { icon: IconEyeSlash, title: '希少な生き物の場所は広めません', body: '見つけた場所は、SNSなどに書かずにおきます。' },
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
    <div className="relative">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[480px] pt-safe">
        <div className="flex h-[60px] items-center justify-end px-3">
          <Button variant="text" size="hit" className="pointer-events-auto" onClick={onDone}>
            スキップ
          </Button>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        aria-roledescription="カルーセル"
        className="no-scrollbar flex h-dvh snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {SLIDES.map((s, i) => (
          <section
            key={s.title}
            aria-roledescription="スライド"
            aria-label={`${i + 1} / ${SLIDES.length}`}
            aria-hidden={i !== index}
            className={cn('h-full w-full shrink-0 snap-start snap-always overflow-y-auto pt-safe', INTRO_CTA_PADDING)}
          >
            {s.photo ? (
              <figure className="h-[60%]">
                <img src={s.photo.src} alt="" className="photo h-full w-full object-cover" draggable={false} />
                <figcaption className="px-4 pt-1 text-right text-caption text-fg-3">© {s.photo.credit}</figcaption>
              </figure>
            ) : (
              // ワードマークは 1 ページ目だけ。ほかのページも同じ高さを空け、見出しの位置をそろえる
              <div className="flex h-[60px] items-center px-4">{i === 0 && <Wordmark />}</div>
            )}
            <div className="px-4 pt-8">
              <h2 className="balance text-display text-fg">
                <Phrase text={s.title} />
              </h2>
              <p className="mt-3 text-body text-fg-2">
                <Phrase text={s.body} />
              </p>
            </div>
          </section>
        ))}
      </div>

      <CtaBar>
        <div className="mb-4 flex justify-center gap-2" aria-hidden>
          {SLIDES.map((_, i) => (
            <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i === index ? 'bg-fg' : 'bg-sep')} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {index + 1} / {SLIDES.length}
        </p>
        <Button onClick={next}>{last ? 'はじめる' : '次へ'}</Button>
      </CtaBar>
    </div>
  );
}

function Pledge({ onFinish }: { onFinish: (name: string) => void }) {
  const existingName = useStore((s) => s.settings.name);
  const [name, setName] = useState(existingName);

  return (
    <main className={cn('min-h-dvh pt-safe', CTA_PADDING)}>
      <section className="px-4 pt-10">
        <h1 className="text-title text-fg">3つの約束</h1>
        <p className="mt-2 text-body text-fg-2">
          <Phrase text="はじめる前に、島の生き物を守るための約束をしましょう。" />
        </p>
      </section>

      <ul className="mt-4">
        {PLEDGES.map((p) => (
          <li key={p.title} className="group/row flex pl-4">
            <p.icon size={20} className="mt-[17px] shrink-0 text-fg-2" />
            <div className="ml-3 min-w-0 flex-1 border-b border-sep py-3.5 pr-4 group-last/row:border-b-0">
              <p className="text-headline text-fg">
                <Phrase text={p.title} />
              </p>
              <p className="mt-1 text-body text-fg-2">
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
        <Field label="観察者ネーム（あとで変更できます）">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：しまのりす" maxLength={20} enterKeyHint="done" />
        </Field>
      </form>

      <CtaBar>
        <Button onClick={() => onFinish(name)}>約束してはじめる</Button>
      </CtaBar>
    </main>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const updateSettings = useStore((s) => s.updateSettings);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [step, setStep] = useState<'intro' | 'pledge'>('intro');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const finish = (raw: string) => {
    const name = raw.trim();
    updateSettings({ onboarded: true, pledged: true, name });
    if (lineMode) void api.updateMe({ pledged: true, nickname: name }).catch(() => undefined);
    navigate('/', { replace: true });
  };

  return step === 'intro' ? <Intro onDone={() => setStep('pledge')} /> : <Pledge onFinish={finish} />;
}
