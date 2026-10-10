import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Brand';
import { IconCoins, IconPencilSimple, IconUser } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { usePhotoUrl } from '../components/PhotoImg';
import {
  BadgeEmblem,
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
  Num,
  Page,
  RadioMark,
  SectionHeader,
  Sheet,
  Stat,
  StatRow,
  toast,
} from '../components/ui';
import { SPECIES } from '../data/species';
import { api } from '../lib/api';
import { exportBackup, importBackup } from '../lib/db';
import { lineLogin, LIFF_ID } from '../lib/liff';
import { BADGES, computeStats, earnedBadges, type Badge } from '../lib/progress';
import type { Settings, Sighting, ThemePref } from '../lib/types';
import { useProgress } from '../store/useProgress';
import { isPlusActive, localDateKey, useStore } from '../store/useStore';

const ADD_FRIEND_URL = (import.meta.env.VITE_LINE_ADD_FRIEND_URL as string | undefined) ?? '';

const THEME_OPTIONS: { value: ThemePref; label: string; note?: string }[] = [
  { value: 'system', label: '自動', note: '端末の設定に合わせます' },
  { value: 'light', label: 'ライト' },
  { value: 'dark', label: '夜の森' },
];

/** マイページの「最近獲得したバッジ」に出す数 */
const RECENT_BADGES = 3;

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
      className="flex min-w-0 flex-col items-center gap-2 rounded-sm px-1 pb-1 pt-2 active:opacity-[.72]"
    >
      <BadgeEmblem badge={badge} earned={earned} size={size} />
      <span aria-hidden className={`line-clamp-2 text-center text-caption ${earned ? 'text-fg' : 'text-fg-3'}`}>
        <BadgeName badge={badge} />
      </span>
    </button>
  );
}

/** アバター: 利用者の最初の記録の写真。なければ LINE のプロフィール画像、それもなければ fill の円に user 32 */
function Avatar({ photoId, pictureUrl }: { photoId: string | null; pictureUrl: string | null }) {
  const url = usePhotoUrl(photoId, 'thumb');
  const src = url ?? (photoId ? null : pictureUrl);
  if (src) return <img src={src} alt="" className="photo h-16 w-16 shrink-0 rounded-full object-cover" draggable={false} />;
  return (
    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-fill text-fg-3">
      <IconUser size={32} />
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
  const { stats, points, balance, rank, badges } = useProgress();
  const plus = isPlusActive(settings);
  const lineMode = account.mode === 'line';

  const [nameSheet, setNameSheet] = useState(false);
  const [name, setName] = useState(settings.name);
  const [themeSheet, setThemeSheet] = useState(false);
  const [lineSheet, setLineSheet] = useState(false);
  const [allBadges, setAllBadges] = useState(false);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nameSheet) setName(settings.name);
  }, [nameSheet, settings.name]);

  // 最初の記録（写真つき）。sightings は新しい順
  const firstPhotoId = useMemo(() => {
    for (let i = sightings.length - 1; i >= 0; i--) if (sightings[i].photoId) return sightings[i].photoId;
    return null;
  }, [sightings]);

  const earnedAt = useMemo(() => badgeEarnedTimes(sightings, settings), [sightings, settings]);
  const recent = useMemo(
    () =>
      BADGES.filter((b) => badges.has(b.id))
        .map((b) => ({ b, t: earnedAt.get(b.id) ?? '' }))
        .sort((x, y) => y.t.localeCompare(x.t))
        .slice(0, RECENT_BADGES)
        .map((x) => x.b),
    [badges, earnedAt],
  );

  const pending = sightings.filter((s) => s.syncState === 'pending').length;
  const themeLabel = THEME_OPTIONS.find((o) => o.value === settings.theme)?.label ?? '自動';
  const displayName = settings.name || '観察者さん';

  const doExport = async () => {
    try {
      const blob = await exportBackup();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amami-nature-backup-${localDateKey().replace(/-/g, '')}.json`;
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
      {/* プロフィール */}
      <header className="pt-safe">
        <div className="flex items-center gap-4 px-4 pb-2 pt-4">
          <Avatar photoId={firstPhotoId} pictureUrl={account.pictureUrl} />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-title text-fg">{displayName}</h1>
            <p className="text-sub text-fg-2">{rank.current.title}</p>
          </div>
          <HeaderButton icon={IconPencilSimple} label="観察者ネームを変更" onClick={() => setNameSheet(true)} className="-mr-2 self-start" />
        </div>
      </header>

      <StatRow className="mt-4">
        <Stat value={stats.total} label="記録" />
        <Stat value={`${stats.discovered}/${SPECIES.length}`} unit="種" label="図鑑" className="flex-[1.35]" />
        <Stat value={`${stats.areas.size}/12`} label="市町村" />
        <Stat value={badges.size} label="バッジ" />
      </StatRow>

      <Group className="mt-6">
        <ListRow
          icon={IconCoins}
          title="ポイント"
          subtitle={rank.next ? `次の「${rank.next.title}」まで${rank.next.min - points}pt` : undefined}
          value={<Num value={balance.toLocaleString()} unit="pt" />}
          chevron
          to="/rewards"
        />
      </Group>

      {/* バッジ */}
      <SectionHeader title="最近獲得したバッジ" onAction={() => setAllBadges(true)} />
      {recent.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 px-4">
          {recent.map((b) => (
            <BadgeCell key={b.id} badge={b} earned size={64} onOpen={setBadge} />
          ))}
        </div>
      ) : (
        <p className="px-4 text-sub text-fg-2">生き物を記録すると、バッジがもらえます</p>
      )}

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
        <ListRow title="観察者ネーム" value={settings.name || '未設定'} chevron onClick={() => setNameSheet(true)} />
      </Group>

      {!lineMode && <Notice className="mt-6">デモモードです。記録はこの端末にだけ保存されます</Notice>}

      {/* 設定 */}
      <SectionHeader title="設定" />
      <Group>
        <ListRow title="表示モード" value={themeLabel} chevron onClick={() => setThemeSheet(true)} />
        <ListRow title="セーフドライブ宣言" chevron to="/safe-drive" />
      </Group>

      {/* データ */}
      <SectionHeader title="データ" />
      <Group note="書き出したファイルには写真も含まれます">
        <ListRow title="記録を書き出す" chevron onClick={doExport} />
        <ListRow title="バックアップから読み込む" chevron onClick={() => fileRef.current?.click()} />
        <ListRow title={<span className="text-danger">この端末のデータを消去</span>} onClick={() => setResetOpen(true)} />
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
          <Phrase text="図鑑データは監修前のβ版です。保護区分などは公式情報をご確認ください。" />
        </p>
      </footer>

      {/* 観察者ネーム */}
      <Sheet open={nameSheet} onClose={() => setNameSheet(false)} title="観察者ネーム" keyboard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="例：しまのりす" aria-label="観察者ネーム" enterKeyHint="done" />
          <Button type="submit" className="mt-4">
            保存する
          </Button>
        </form>
      </Sheet>

      {/* 表示モード */}
      <Sheet open={themeSheet} onClose={() => setThemeSheet(false)} title="表示モード">
        <Group className="-mx-4" note={<Phrase text="「夜の森」は、ナイトツアー中でも目にやさしい暗い表示です" />}>
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

      {/* バッジ（すべて） */}
      <Sheet open={allBadges} onClose={() => setAllBadges(false)} title="バッジ">
        <p className="-mt-2 text-sub text-fg-2">
          {BADGES.length}個のうち<span className="num">{badges.size}</span>個を獲得しました
        </p>
        <div className="-mx-1 mt-3 grid grid-cols-4 gap-x-1 gap-y-3">
          {BADGES.map((b) => (
            <BadgeCell key={b.id} badge={b} earned={badges.has(b.id)} size={56} onOpen={setBadge} />
          ))}
        </div>
        <BadgeSheet badge={allBadges ? badge : null} earned={!!badge && badges.has(badge.id)} earnedAt={badge ? earnedAt.get(badge.id) : null} onClose={() => setBadge(null)} />
      </Sheet>
      <BadgeSheet badge={allBadges ? null : badge} earned={!!badge && badges.has(badge.id)} earnedAt={badge ? earnedAt.get(badge.id) : null} onClose={() => setBadge(null)} />

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
