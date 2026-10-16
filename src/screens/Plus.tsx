import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CollectibleCard } from '../components/CollectibleCard';
import { IconCheckCircleFill, IconMicrophone, IconScan, IconWifiSlash, IconX } from '../components/icons';
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
import { api, errorMessage } from '../lib/api';
import { countsForCollection } from '../lib/progress';
import type { PlusPlan } from '../lib/types';
import { SPECIES_BY_ID } from '../data/species';
import { isPlusActive, useStore } from '../store/useStore';

// 金額は本文と同じく「円」で書く（¥ は使わない）
const PLANS: { id: PlusPlan; title: string; price: string; note: string; tag?: string }[] = [
  { id: 'trip', title: 'トリップパス', price: '480円', note: '7日間、自動更新なし', tag: '旅行中の方に' },
  { id: 'year', title: '年額プラン', price: '3,800円', note: '月あたり約317円', tag: 'いちばんお得' },
  { id: 'month', title: '月額プラン', price: '480円', note: '1か月ごとに自動更新' },
];

/** いま使える機能（寄付は約束できる段階になってから足す） */
const BENEFITS = [
  { icon: IconScan, title: '写真から名前の候補を表示', body: '1日30回まで（無料版は1日1回）' },
  { icon: IconWifiSlash, title: 'オフライン図鑑', body: '電波の届かない森の中でも、図鑑と解説を見られます' },
];

/** 近日追加（大島紬のフレームは、画面の先頭のカードで見せる） */
const SOON = [{ icon: IconMicrophone, title: '鳴き声から調べる' }];

/**
 * 先頭のカード: 最近の記録（写真つき）を大島紬のフレームで。
 * 記録がなければ、図鑑の種ではない見本（図鑑の「？？？」の種の名前や説明を見せないため）
 */
function FramePreview() {
  // 交通事故・けがの路上レポートや対象外になった記録の写真は見本にしない
  const latest = useStore((s) =>
    s.sightings.find((x) => x.speciesId && x.photoId && SPECIES_BY_ID[x.speciesId] && countsForCollection(x) && x.syncState !== 'rejected'),
  );
  const sp = latest?.speciesId ? (SPECIES_BY_ID[latest.speciesId] ?? null) : null;
  return (
    <figure className="bg-fill px-4 pb-5 pt-6">
      {/* ドット絵の枠は縮小・傾きでにじむので、カードはそのままの大きさで見せる */}
      <div className="mx-auto w-[280px]" aria-hidden>
        <CollectibleCard
          species={sp}
          name={latest ? undefined : 'あなたが撮った生き物'}
          nickname={latest ? latest.nickname : '見本'}
          photoId={latest?.photoId}
          observedAt={latest?.observedAt}
          frame="tsumugi"
        />
      </div>
      <figcaption className="mt-1 text-center text-sub text-fg-2">大島紬の限定フレーム（近日追加）</figcaption>
    </figure>
  );
}

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
  const setAccount = useStore((s) => s.setAccount);
  const [plan, setPlan] = useState<PlusPlan>(settings.plus?.plan ?? 'trip');
  const [confirm, setConfirm] = useState(false);
  const active = isPlusActive(settings);
  const chosen = PLANS.find((p) => p.id === plan)!;

  const [busy, setBusy] = useState(false);

  const purchase = async () => {
    if (busy) return;
    if (lineMode) {
      // LINE モードではサーバーの Plus を正とする（AI判定の回数はサーバーが数える）
      setBusy(true);
      try {
        const me = await api.demoPlus(plan);
        setAccount({ me });
      } catch (e) {
        toast.error(errorMessage(e));
        return;
      } finally {
        setBusy(false);
      }
    }
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

      <FramePreview />

      <section className="px-4 pt-6">
        <h1 className="balance text-title text-fg">
          <Phrase text="名前がわからなくても、写真から調べられる" />
        </h1>
        <p className="mt-3 text-body text-fg-2">
          <Phrase text="写真を撮ると、AIが図鑑の中から候補を出します。" />
        </p>
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
      <Group note="表示価格は税込です。">
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
              trailing={<span className="num shrink-0 text-[18px] leading-6 text-fg">{p.price}</span>}
              onClick={() => setPlan(p.id)}
            />
          ))}
        </div>
      </Group>

      <div className="mt-4 flex gap-4 px-3">
        <Button variant="text" size="hit" onClick={() => navigate('/terms')}>
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
        <Button className="mt-5" disabled={busy} onClick={purchase}>
          体験をはじめる
        </Button>
        <Button variant="text" size="hit" className="mt-2 w-full" onClick={() => setConfirm(false)}>
          やめる
        </Button>
      </Sheet>
    </main>
  );
}
