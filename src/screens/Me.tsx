import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Brand';
import { TATSUGO_STYLE } from '../components/CollectibleCard';
import { Coin, LevelBadge, XPBar } from '../components/game';
import { IconPencilSimple } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { PlayerAvatar } from '../components/Player';
import {
  BadgeEmblem,
  button,
  cn,
  BadgeName,
  BadgeSheet,
  Button,
  ConfirmDialog,
  formatDateJa,
  Group,
  HeaderButton,
  InfoRow,
  Input,
  ListRow,
  Notice,
  Page,
  RadioMark,
  ScreenHeader,
  SectionHeader,
  Sheet,
  toast,
} from '../components/ui';
import { SPECIES, SPECIES_DISCLAIMER } from '../data/species';
import { AiConsentSheet, hasAiConsent, hasRoadConsent, RoadConsentSheet, setAiConsent, setRoadConsent } from '../components/ConsentSheets';
import { DELETE_ACCOUNT } from '../data/consentTexts';
import { api, errorMessage } from '../lib/api';
import { exportBackup, importBackup } from '../lib/db';
import { sfx } from '../lib/sfx';
import { lineLogin, LIFF_ID } from '../lib/liff';
import { BADGES, computeStats, earnedBadges, type Badge } from '../lib/progress';
import type { Settings, Sighting, ThemePref } from '../lib/types';
import { useProgress } from '../store/useProgress';
import { clearSyncQueues, syncNow } from '../store/sync';
import { isPlusActive, dayKey, useStore } from '../store/useStore';

const ADD_FRIEND_URL = (import.meta.env.VITE_LINE_ADD_FRIEND_URL as string | undefined) ?? '';

const THEME_OPTIONS: { value: ThemePref; label: string; note?: string }[] = [
  { value: 'system', label: '自動', note: '端末の設定に合わせます' },
  { value: 'light', label: 'ひるの島' },
  { value: 'dark', label: 'よるの森' },
];

/**
 * バッジを獲得した日時を、記録を古い順にたどって求める（「最近獲得した」の並びと説明シートの獲得日）。
 * 記録で得るバッジは、条件を満たした記録の日時。セーフドライバーは 5 回目の宣言の日。
 * 森との約束（オンボーディングで獲得）は日時がわからないので null（いちばん古い扱い）。
 */
function badgeEarnedTimes(sightings: Sighting[], settings: Settings): Map<string, string | null> {
  const times = new Map<string, string | null>();
  const at = (s: Sighting) => s.createdAt || s.observedAt;
  const ordered = sightings.filter((s) => s.syncState !== 'rejected').sort((a, b) => at(a).localeCompare(at(b)));
  const ctx = { pledged: false, safeDriveDays: 0 };
  // 記録だけで決まるバッジ（約束・宣言の条件を外して数える）
  const bySightings = new Set(earnedBadges(computeStats(ordered), ctx));
  for (let i = 0; i < ordered.length && times.size < bySightings.size; i++) {
    for (const id of earnedBadges(computeStats(ordered.slice(0, i + 1)), ctx)) {
      if (!times.has(id)) times.set(id, at(ordered[i]));
    }
  }
  if (settings.pledged) times.set('pledge', null);
  const days = [...settings.safeDriveDates].sort();
  if (days.length >= 5) times.set('safe-driver', `${days[4]}T00:00:00`);
  return times;
}

/** 紋章と名前（caption、2 行まで）。押すとバッジの説明シートを開く */
function BadgeCell({ badge, earned, size, onOpen }: { badge: Badge; earned: boolean; size: 56 | 64; onOpen: (b: Badge) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(badge)}
      aria-label={`${badge.title}${earned ? '' : '（未獲得）'}`}
      className="pressable flex min-w-0 flex-col items-center gap-1.5 px-0.5 pb-1 pt-1.5"
    >
      <BadgeEmblem badge={badge} earned={earned} size={size} />
      <span aria-hidden className={`line-clamp-2 text-center text-[12px] font-black leading-4 ${earned ? 'text-fg' : 'text-fg-3'}`}>
        <BadgeName badge={badge} />
      </span>
    </button>
  );
}

/**
 * オン・オフのスイッチ（行の trailing。行全体が role="switch"）。ドット絵の溝：線の色の段々（px-clip-2）に、面の色の段々（px-clip-1）を 3px 内側に重ねる。
 * つまみは 20px の白い四角（px-clip-1）で、溝の面の中に 3px あけて置く（オフ left 6px、オン left 26px）。影は切り抜かない外側の drop-shadow
 */
function Switch({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn('px-clip-2 relative h-8 w-[52px] shrink-0 transition-colors', on ? 'bg-xp-edge' : 'bg-line')}>
      <span className={cn('px-clip-1 absolute inset-[3px] transition-colors', on ? 'bg-xp' : 'bg-fill-strong')} />
      <span className={cn('absolute top-[6px] h-5 w-5 transition-[left] [filter:drop-shadow(0_3px_0_rgb(0_0_0/.2))]', on ? 'left-[26px]' : 'left-[6px]')}>
        <span className="px-clip-1 block h-full w-full bg-white" />
      </span>
    </span>
  );
}

export default function Me() {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const account = useStore((s) => s.account);
  const sightings = useStore((s) => s.sightings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const load = useStore((s) => s.load);
  const { stats, balance, rank, badges, level } = useProgress();
  const plus = isPlusActive(settings);
  const lineMode = account.mode === 'line';

  const [nameSheet, setNameSheet] = useState(false);
  const [name, setName] = useState(settings.name);
  const [themeSheet, setThemeSheet] = useState(false);
  const [lineSheet, setLineSheet] = useState(false);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [roadSheet, setRoadSheet] = useState(false);
  const [aiConsentSheet, setAiConsentSheet] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const roadAgreed = hasRoadConsent(settings.roadConsent);
  const aiAgreed = hasAiConsent(settings.aiConsent);

  /** 退会：クラウドのデータを消し、ログインを外し、この端末のデータも消す */
  const leave = async () => {
    setLeaving(true);
    try {
      await api.deleteAccount();
      api.logout();
      clearSyncQueues();
      await resetAll();
      useStore.getState().setAccount({ mode: 'demo', me: null, pictureUrl: null });
      setLeaveOpen(false);
      toast.success(DELETE_ACCOUNT.done);
      navigate('/onboarding', { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLeaving(false);
    }
  };
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameSheet) setName(settings.name);
  }, [nameSheet, settings.name]);

  const earnedAt = useMemo(() => badgeEarnedTimes(sightings, settings), [sightings, settings]);
  const pending = sightings.filter((s) => s.syncState === 'pending').length;
  const themeLabel = THEME_OPTIONS.find((o) => o.value === settings.theme)?.label ?? '自動';
  const displayName = settings.name || 'レンジャー';

  const doExport = async () => {
    try {
      const blob = await exportBackup();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amami-nature-backup-${dayKey().replace(/-/g, '')}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast.success('記録を書き出しました');
    } catch {
      toast.error('書き出せませんでした。端末の空き容量を確かめて、もう一度お試しください');
    }
  };

  const doImport = async (file: File) => {
    try {
      const n = await importBackup(file);
      await load();
      // LINE モードでは、読み込んだ端末だけの記録もクラウドへ送る
      if (useStore.getState().account.mode === 'line') {
        await useStore.getState().markAllLocalPending();
        void syncNow();
      }
      toast.success(`${n}件の記録を読み込みました`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '読み込めませんでした');
    }
  };

  const saveName = () => {
    updateSettings({ name: name.trim() });
    if (lineMode) void api.updateMe({ nickname: name.trim() }).catch(() => undefined);
    setNameSheet(false);
  };

  const addFriend = () => {
    if (ADD_FRIEND_URL) window.open(ADD_FRIEND_URL, '_blank', 'noopener');
    else toast('LINE公式アカウントは準備中です');
  };

  // LIFF があって未ログインの時は、LINE 連携の行を［LINEでログイン］に替える（§8.8）
  const showLogin = !lineMode && !!LIFF_ID;

  return (
    <Page>
      <ScreenHeader variant="tab" title="マイページ" right={<HeaderButton icon={IconPencilSimple} label="レンジャーネームを変更" onClick={() => setNameSheet(true)} />} />

      {/* レンジャーカード（トレーナーカード）。龍郷柄の地にドット絵の枠 px-night（面を描かない枠なので、地の柄とグラデーションが見える） */}
      <section aria-label="レンジャーカード" className="px-night relative mx-4 overflow-hidden text-white" style={TATSUGO_STYLE}>
        <div className="relative bg-gradient-to-br from-brand-fill/95 via-brand-fill/85 to-brand-pressed/95 p-3">
          <div className="flex items-center justify-between">
            <span className="num text-[12px] tracking-[1px] text-white/80">RANGER CARD</span>
            <span className="px-clip-1 num bg-white/15 px-2 text-[12px] leading-5 text-gold">AMAMI NATURE</span>
          </div>
          <div className="mt-3 flex items-center gap-3.5">
            <span className="relative shrink-0">
              <PlayerAvatar size={72} />
              <LevelBadge level={level.level} size={38} className="absolute -bottom-2 -right-2" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-title font-black">{displayName}</h1>
              <p className="px-clip-1 mt-1 inline-flex bg-gold px-2.5 py-[1px] text-caption text-[#3d2a00]">{rank.current.title}</p>
            </div>
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <span className="num shrink-0 text-[12px]">Lv.{level.level}</span>
            <XPBar value={level.progress} id="me-xp" label="次のレベルまで" className="flex-1" />
            <span className="shrink-0 text-caption text-white/80">{level.next ? `あと${level.toNext}pt` : 'MAX'}</span>
          </div>
          <div className="mt-3.5 grid grid-cols-4 gap-1.5">
            {[
              { v: stats.total, l: '記録' },
              { v: `${stats.discovered}`, l: `図鑑/${SPECIES.length}` },
              { v: `${stats.areas.size}`, l: '市町村/12' },
              { v: badges.size, l: 'バッジ' },
            ].map((x) => (
              <div key={x.l} className="px-clip-2 bg-white/[.14] px-1 py-2 text-center">
                <div className="num text-[22px] leading-6">{x.v}</div>
                <div className="mt-0.5 text-[12px] font-black leading-3 text-white/80">{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ポイント（コイン） */}
      <Link
        to="/rewards"
        className="px-pill-gold pressable mx-4 mt-4 flex items-center gap-3 p-2.5"
      >
        <Coin size={40} />
        <span className="min-w-0 flex-1">
          <span className="block text-sub font-black text-fg-2">もっているポイント</span>
          <span className="num block text-[28px] leading-8 text-fg">
            {balance.toLocaleString()}
            <span className="ml-1 text-sub text-fg-2">pt</span>
          </span>
        </span>
        <span className={cn(button({ variant: 'gold', size: 'md' }), 'pointer-events-none h-10 px-4')}>こうかん</span>
      </Link>

      {/* バッジケース */}
      <SectionHeader
        title="バッジケース"
        action={
          <span className="px-clip-1 num bg-fill-strong px-2.5 py-0.5 text-[14px] text-fg-2" aria-label={`${BADGES.length}個中${badges.size}個`}>
            {badges.size}/{BADGES.length}
          </span>
        }
      />
      {/* 夜空のグラデーションのケース（ドット絵の枠 px-night）に、段々に切り抜いた白い台（px-clip-2） */}
      <div className="px-night mx-4 bg-gradient-to-b from-night to-night-2 p-1.5">
        <div className="px-clip-2 grid grid-cols-4 gap-1 bg-surface/95 p-1.5 dark:bg-surface">
          {BADGES.map((b) => (
            <BadgeCell key={b.id} badge={b} earned={badges.has(b.id)} size={56} onOpen={setBadge} />
          ))}
        </div>
      </div>

      {/* アカウント */}
      <SectionHeader title="アカウント" />
      {showLogin && (
        <div className="mb-6 px-4">
          <Button variant="line" onClick={() => void lineLogin()}>
            LINEでログイン
          </Button>
          <p className="mt-2 text-sub text-fg-2">ログインすると、記録をクラウドに保存でき、トークに写真を送るだけで記録できます</p>
        </div>
      )}
      <Group>
        {lineMode && (
          <ListRow title="LINE 連携" value={account.me?.displayName || '連携中'} chevron onClick={() => setLineSheet(true)} />
        )}
        <ListRow title="レンジャーネーム" value={settings.name || '未設定'} chevron onClick={() => setNameSheet(true)} />
      </Group>

      {!lineMode && <Notice className="mt-6">デモモードです。記録はこの端末にだけ保存されます。</Notice>}

      {/* 設定 */}
      <SectionHeader title="設定" />
      <Group>
        <ListRow
          title="効果音・バイブ"
          role="switch"
          aria-checked={settings.sound}
          onClick={() => {
            updateSettings({ sound: !settings.sound });
            if (!settings.sound) window.setTimeout(() => sfx('coin'), 50);
          }}
          trailing={<Switch on={settings.sound} />}
        />
        <ListRow title="表示モード" value={themeLabel} chevron onClick={() => setThemeSheet(true)} />
        <ListRow title="セーフドライブ宣言" chevron to="/safe-drive" />
        <ListRow
          title="路上レポートの位置の提供"
          value={roadAgreed ? '同意している' : settings.roadConsent ? '送らない' : '未設定'}
          chevron
          onClick={() => setRoadSheet(true)}
        />
        <ListRow
          title="AI判定の写真の送信"
          value={aiAgreed ? '同意している' : settings.aiConsent ? '送らない' : '未設定'}
          chevron
          onClick={() => setAiConsentSheet(true)}
        />
      </Group>

      {/* データ */}
      <SectionHeader title="データ" />
      <Group note="書き出したファイルには写真も含まれます">
        <ListRow title="記録を書き出す" chevron onClick={doExport} />
        <ListRow title="バックアップから読み込む" chevron onClick={() => fileRef.current?.click()} />
        <ListRow title={<span className="text-danger">この端末のデータを消去</span>} onClick={() => setResetOpen(true)} />
        {lineMode && <ListRow title={<span className="text-danger">退会（クラウドのデータを消す）</span>} onClick={() => setLeaveOpen(true)} />}
      </Group>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void doImport(f);
        }}
      />

      {/* その他 */}
      <SectionHeader title="その他" />
      <Group>
        <ListRow title="自治体・保護団体の方へ" chevron to="/partners" />
        <ListRow title="AMAMI NATURE+" value={plus ? `${formatDateJa(settings.plus!.until, { year: false })}まで` : undefined} chevron to="/plus" />
        <ListRow title="お問い合わせ" value={account.me?.supportCode} chevron to="/contact" />
        <ListRow title="利用規約" chevron to="/terms" />
        <ListRow title="プライバシーポリシー" chevron to="/privacy" />
      </Group>

      {!showLogin && (
        <div className="mt-8 px-4">
          <Button variant="line" onClick={addFriend}>
            LINEで友だち追加
          </Button>
        </div>
      )}

      <footer className="mt-8 px-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Wordmark size="sm" />
          <span className="text-caption text-fg-3">β版　運営：株式会社アマリンク</span>
        </div>
        <p className="mt-2 text-caption text-fg-3">
          <Phrase text={SPECIES_DISCLAIMER} />
        </p>
      </footer>

      {/* 観察者ネーム */}
      <Sheet open={nameSheet} onClose={() => setNameSheet(false)} title="レンジャーネーム" keyboard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="例：しまのりす" aria-label="レンジャーネーム" enterKeyHint="done" />
          <Button type="submit" className="mt-4">
            保存する
          </Button>
        </form>
      </Sheet>

      {/* 表示モード */}
      <Sheet open={themeSheet} onClose={() => setThemeSheet(false)} title="表示モード">
        <Group className="-mx-4" note={<Phrase text="「よるの森」は、ナイトツアー中でも目にやさしい暗い表示です" />}>
          <div role="radiogroup" aria-label="表示モード">
            {THEME_OPTIONS.map((o) => (
              <ListRow
                key={o.value}
                role="radio"
                aria-checked={settings.theme === o.value}
                leading={<RadioMark checked={settings.theme === o.value} />}
                title={o.label}
                subtitle={o.note}
                onClick={() => {
                  updateSettings({ theme: o.value });
                  setThemeSheet(false);
                }}
              />
            ))}
          </div>
        </Group>
      </Sheet>

      {/* LINE 連携 */}
      <Sheet open={lineSheet} onClose={() => setLineSheet(false)} title="LINE 連携">
        <Group className="-mx-4" note="記録はクラウドに保存されています">
          <InfoRow label="LINE の名前">{account.me?.displayName || '連携中'}</InfoRow>
          <InfoRow label="同期">
            {account.syncing ? '同期しています' : pending > 0 ? `未同期 ${pending}件` : '同期済み'}
          </InfoRow>
          <InfoRow label="最後の同期">{account.lastSyncAt ? formatDateJa(account.lastSyncAt, { time: true }) : 'まだ同期していません'}</InfoRow>
        </Group>
      </Sheet>

      <BadgeSheet badge={badge} earned={!!badge && badges.has(badge.id)} earnedAt={badge ? earnedAt.get(badge.id) : null} onClose={() => setBadge(null)} />

      {/* 路上レポートの位置の提供（同意・撤回） */}
      <RoadConsentSheet
        open={roadSheet}
        settings={{ agreed: roadAgreed }}
        onClose={() => setRoadSheet(false)}
        onDecide={(agree) => {
          setRoadConsent(agree);
          setRoadSheet(false);
          toast(agree ? '路上レポートの正確な位置を送ります' : 'これからの路上レポートは、位置を市町村までにします');
        }}
      />

      {/* AI判定で写真を米国の事業者に送ること（同意・撤回） */}
      <AiConsentSheet
        open={aiConsentSheet}
        settings={{ agreed: aiAgreed }}
        onClose={() => setAiConsentSheet(false)}
        onDecide={(agree) => {
          void setAiConsent(agree);
          setAiConsentSheet(false);
          toast(agree ? 'AI判定を使えるようにしました' : 'AI判定に写真を送らないようにしました');
        }}
      />

      {/* 退会（クラウドのデータを消す） */}
      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={DELETE_ACCOUNT.title}
        body={<span className="whitespace-pre-line">{DELETE_ACCOUNT.body}</span>}
        confirmLabel={DELETE_ACCOUNT.confirm}
        busy={leaving}
        onConfirm={() => void leave()}
      />

      {/* この端末のデータを消去 */}
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="この端末のデータを消去しますか？"
        body={
          <>
            この端末に保存された記録、写真、設定がすべて消えます。
            {lineMode ? 'クラウドに同期済みの記録は、次にひらいた時にまた読み込まれます。' : '先にバックアップを書き出しておくことをおすすめします。'}
          </>
        }
        busy={resetting}
        onConfirm={async () => {
          setResetting(true);
          try {
            await resetAll();
            setResetOpen(false);
            navigate('/onboarding', { replace: true });
          } finally {
            setResetting(false);
          }
        }}
      />
    </Page>
  );
}
