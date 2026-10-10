import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconCheckCircleFill, IconFrameCorners, IconHandHeart, IconMicrophone, IconScan, IconWifiSlash, IconX } from '../components/icons';
import { Phrase } from '../components/Phrase';
import {
  Button,
  CtaBar,
  formatDateJa,
  Group,
  ListRow,
  RadioMark,
  ScreenHeader,
  SectionHeader,
  Sheet,
  toast,
} from '../components/ui';
import { api } from '../lib/api';
import type { PlusPlan } from '../lib/types';
import { isPlusActive, useStore } from '../store/useStore';

const PLANS: { id: PlusPlan; title: string; price: string; note: string; tag?: string }[] = [
  { id: 'trip', title: 'トリップパス', price: '¥480', note: '7日間、自動更新なし', tag: '旅行中の方に' },
  { id: 'year', title: '年額プラン', price: '¥3,800', note: '月あたり約¥317', tag: 'いちばんお得' },
  { id: 'month', title: '月額プラン', price: '¥480', note: '1か月ごとに自動更新' },
];

/** いま使える機能 */
const BENEFITS = [
  { icon: IconScan, title: '写真から名前の候補を表示', body: '1日30回まで。無料では1日1回です' },
  { icon: IconWifiSlash, title: 'オフライン図鑑', body: '電波の届かない森の中でも、図鑑と解説を見られます' },
  { icon: IconHandHeart, title: '奄美の自然を守る', body: '売上の一部を、ロードキル対策など奄美の保全活動へ寄付します（予定）' },
];

/** 近日追加 */
const SOON = [
  { icon: IconMicrophone, title: '鳴き声から調べる' },
  { icon: IconFrameCorners, title: '大島紬の限定カードフレーム' },
];

/** 固定 CTA バー（ボタン 50 ＋ 注記 1 行）の分だけ本文の下を空ける */
const PLUS_CTA_PADDING = 'pb-[calc(116px+var(--safe-bottom))]';

export default function Plus() {
  const navigate = useNavigate();
  const location = useLocation();
  // 直接ひらいた時（履歴がない時）はホームへ戻す
  const close = () => (location.key !== 'default' ? navigate(-1) : navigate('/', { replace: true }));
  const settings = useStore((s) => s.settings);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const activatePlus = useStore((s) => s.activatePlus);
  const [plan, setPlan] = useState<PlusPlan>(settings.plus?.plan ?? 'trip');
  const [confirm, setConfirm] = useState(false);
  const active = isPlusActive(settings);
  const chosen = PLANS.find((p) => p.id === plan)!;

  const purchase = async () => {
    if (lineMode) await api.demoPlus(plan).catch(() => undefined);
    activatePlus(plan);
    setConfirm(false);
    toast.success('AMAMI NATURE+ を有効にしました');
    close();
  };

  return (
    <main className={`min-h-dvh ${PLUS_CTA_PADDING}`}>
      <ScreenHeader
        variant="nav"
        left={
          <button
            type="button"
            onClick={close}
            aria-label="閉じる"
            className="grid h-11 w-11 place-items-center text-fg active:opacity-60"
          >
            <IconX size={24} />
          </button>
        }
      />

      <section className="px-4 pt-2">
        <h1 className="balance text-display text-fg">
          <Phrase text="名前がわからなくても、写真から調べられる" />
        </h1>
        <p className="mt-3 text-body text-fg-2">写真を撮ると、AIが図鑑の中から候補を出します。</p>
        {active && (
          <p className="mt-4 flex items-center gap-2 text-callout text-fg">
            <IconCheckCircleFill size={20} className="shrink-0 text-success" />
            {formatDateJa(settings.plus!.until)}まで有効です
          </p>
        )}
      </section>

      <Group className="mt-6">
        {BENEFITS.map((b) => (
          <ListRow key={b.title} icon={b.icon} title={b.title} subtitle={<Phrase text={b.body} />} />
        ))}
      </Group>

      <SectionHeader title="近日追加" />
      <Group>
        {SOON.map((s) => (
          <ListRow key={s.title} icon={s.icon} title={s.title} disabled trailing={<span className="shrink-0 text-caption text-fg-3">準備中</span>} />
        ))}
      </Group>

      <SectionHeader title="プラン" />
      <Group note={<Phrase text="価格は税込の予定価格です。決済はLINEの中から、カードや各種ペイ（Stripe）で行う予定です。" />}>
        <div role="radiogroup" aria-label="プラン">
          {PLANS.map((p) => (
            <ListRow
              key={p.id}
              role="radio"
              aria-checked={plan === p.id}
              leading={<RadioMark checked={plan === p.id} />}
              title={
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span>{p.title}</span>
                  {p.tag && <span className="text-caption text-brand">{p.tag}</span>}
                </span>
              }
              subtitle={p.note}
              trailing={<span className="num shrink-0 text-callout font-semibold text-fg">{p.price}</span>}
              onClick={() => setPlan(p.id)}
            />
          ))}
        </div>
      </Group>

      <div className="mt-4 flex gap-4 px-3">
        <Button variant="text" size="hit" onClick={() => toast('利用規約は準備中です')}>
          利用規約
        </Button>
        <Button variant="text" size="hit" onClick={() => toast(active ? 'すでに有効です' : 'β版のため、復元する購入はありません')}>
          購入を復元
        </Button>
      </div>

      <CtaBar>
        <Button onClick={() => setConfirm(true)}>{!active ? `${chosen.title}ではじめる` : plan === settings.plus?.plan ? `${chosen.title}を更新する` : `${chosen.title}に変更する`}</Button>
        <p className="mt-2 text-center text-caption text-fg-2">β版のため、決済は発生しません</p>
      </CtaBar>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="β版の確認">
        <p className="text-body text-fg-2">
          <Phrase text={`β版のため、実際の決済は発生しません。ボタンを押すと「${chosen.title}」を無料で体験できます。`} />
        </p>
        <Button className="mt-5" onClick={purchase}>
          体験をはじめる
        </Button>
        <Button variant="text" size="hit" className="mt-2 w-full" onClick={() => setConfirm(false)}>
          やめる
        </Button>
      </Sheet>
    </main>
  );
}
