import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { LogoMark } from '../components/Brand';
import { Coin, LevelBadge, Ring, Sparkles, Stars, TYPE_META, TypeBadge } from '../components/game';
import {
  IconArrowClockwise,
  IconCarProfileFill,
  IconCheck,
  IconCoinsFill,
  IconCrownSimpleFill,
  IconDiceFive,
  IconDownloadSimple,
  IconFileArrowDown,
  IconFlagBannerFill,
  IconGift,
  IconHandHeart,
  IconKey,
  IconMapPin,
  IconRoadHorizonFill,
  IconScan,
  IconSealCheckFill,
  IconTicket,
  IconTrash,
  IconUser,
  IconUsers,
  IconWarning,
  type IconComponent,
} from '../components/icons';
import { SpeciesPlate } from '../components/SpeciesTile';
import { Button, Chip, ChipRow, cn, ConfirmDialog, Field, Input, Notice, RadioMark, SearchField, Segmented, Sheet, toast } from '../components/ui';
import { demoAdmin } from '../lib/adminDemo';
import { AREA_BY_ID, AREAS } from '../data/areas';
import { REWARDS } from '../data/rewards';
import { SPECIES_BY_ID } from '../data/species';
import {
  adminApi,
  AdminError,
  getAdminKey,
  setAdminKey,
  type AdminAction,
  type AdminPartner,
  type AdminRedemption,
  type AdminRoadReport,
  type AdminSighting,
  type AdminSummary,
  type AdminUser,
  type RedemptionStatus,
  type RoadStatus,
  type SightingFilter,
} from '../lib/adminApi';
import { sfx } from '../lib/sfx';

// 運営（株式会社アマリンク）の管理画面。アプリと同じゲームの UI（docs/DESIGN_SYSTEM.md）。
// 管理キーがない時はデモデータを見せる（操作はこの画面の中だけで、保存しない）。

type Tab = 'home' | 'redemptions' | 'sightings' | 'road' | 'partners' | 'users' | 'log';

const TABS: { id: Tab; label: string; icon: IconComponent }[] = [
  { id: 'home', label: 'ダッシュボード', icon: IconCrownSimpleFill },
  { id: 'redemptions', label: '交換申請', icon: IconGift },
  { id: 'sightings', label: '記録チェック', icon: IconScan },
  { id: 'road', label: '路上レポート', icon: IconRoadHorizonFill },
  { id: 'partners', label: '提携先', icon: IconKey },
  { id: 'users', label: 'ユーザー', icon: IconUsers },
  { id: 'log', label: '操作ログ', icon: IconFlagBannerFill },
];

const REVOKE_REASONS = ['同じ写真・他人の写真の使い回し', '生き物が写っていない', '種の名前が明らかに違う', '不適切な写真', 'その他'];

const ROAD_TYPE: Record<AdminRoadReport['type'], { label: string; cls: string }> = {
  roadkill: { label: '交通事故', cls: 'bg-danger text-on-danger' },
  injured: { label: 'けが', cls: 'bg-warning text-white dark:text-night' },
  'on-road': { label: '路上にいた', cls: 'bg-gold text-[#3d2a00]' },
};
const ROAD_STATUS_LABEL: Record<RoadStatus, string> = { new: '新規', forwarded: '転送済み', closed: '対応済み' };
const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = { requested: '申請中', fulfilled: '発送済み', cancelled: '取り消し' };
const KIND_ICON = { donation: IconHandHeart, coupon: IconTicket, goods: IconGift, lottery: IconDiceFive } as const;
const ACTION_LABEL: Record<string, string> = {
  'redemption.update': '交換申請',
  'sighting.revoke': '記録を取り消し',
  'sighting.restore': '取り消しを戻す',
  'road_report.update': '路上レポート',
  'partner.create': '提携先を追加',
  'partner.delete': '提携先を削除',
};

const pad = (n: number) => String(n).padStart(2, '0');
function when(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${pad(d.getMinutes())}`;
}
function ago(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 60) return `${m}分前`;
  if (m < 24 * 60) return `${Math.round(m / 60)}時間前`;
  return `${Math.round(m / 1440)}日前`;
}
const areaName = (id: string | null | undefined) => (id ? (AREA_BY_ID[id]?.name ?? id) : '地域なし');
const speciesName = (id: string | null | undefined, custom?: string) => (id ? (SPECIES_BY_ID[id]?.name ?? id) : custom || '図鑑にない生き物');
const userLabel = (displayName?: string | null, nickname?: string | null) => nickname || displayName || '（名前なし）';

// ───────── データの読み込み ─────────

type Data = {
  summary: AdminSummary | null;
  redemptions: AdminRedemption[];
  sightings: AdminSighting[];
  roadReports: AdminRoadReport[];
  partners: AdminPartner[];
  users: AdminUser[];
  actions: AdminAction[];
};

const EMPTY: Data = { summary: null, redemptions: [], sightings: [], roadReports: [], partners: [], users: [], actions: [] };

export default function Admin() {
  const [key, setKey] = useState<string | null>(() => getAdminKey());
  const demo = !key;
  const [tab, setTab] = useState<Tab>('home');
  const [data, setData] = useState<Data>(() => (key ? EMPTY : demoAdmin()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keySheet, setKeySheet] = useState(false);
  const [redemptionStatus, setRedemptionStatus] = useState<RedemptionStatus | 'all'>('requested');
  const [roadStatus, setRoadStatus] = useState<RoadStatus | 'all'>('new');
  const [sightingFilter, setSightingFilter] = useState<SightingFilter>('all');
  /** 記録チェックの続き（1回に60件ずつ。サーバーが受け取った日時の古い方へたどる） */
  const [sightingsMore, setSightingsMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    document.title = '運営ダッシュボード';
  }, []);

  /** キーを消してデモ表示に戻す（ログアウト・キーが無効になった時） */
  function signOut() {
    loadSeq.current++;
    setAdminKey(null);
    setKey(null);
    setData(demoAdmin());
  }

  /** いま開いているタブに要るものを読み込む（デモは最初に全部ある） */
  const loadSeq = useRef(0);
  const load = useCallback(async () => {
    if (!key) return;
    // タブや絞り込みを続けて切り替えた時、遅れて届いた前の結果で上書きしない
    const seq = ++loadSeq.current;
    const latest = () => seq === loadSeq.current;
    setLoading(true);
    setError(null);
    try {
      if (tab === 'home') {
        const [summary, redemptions, roadReports] = await Promise.all([
          adminApi.summary(key),
          adminApi.redemptions(key, 'requested'),
          adminApi.roadReports(key, 'new'),
        ]);
        if (latest()) setData((d) => ({ ...d, summary, redemptions: redemptions.redemptions, roadReports: roadReports.roadReports }));
      } else if (tab === 'redemptions') {
        const r = await adminApi.redemptions(key, redemptionStatus);
        if (latest()) setData((d) => ({ ...d, redemptions: r.redemptions }));
      } else if (tab === 'sightings') {
        const r = await adminApi.sightings(key, sightingFilter);
        if (latest()) {
          setData((d) => ({ ...d, sightings: r.sightings }));
          setSightingsMore(r.sightings.length >= SIGHTINGS_PAGE);
        }
      } else if (tab === 'road') {
        const r = await adminApi.roadReports(key, roadStatus);
        if (latest()) setData((d) => ({ ...d, roadReports: r.roadReports }));
      } else if (tab === 'partners') {
        const r = await adminApi.partners(key);
        if (latest()) setData((d) => ({ ...d, partners: r.partners }));
      } else if (tab === 'users') {
        const r = await adminApi.users(key, userQuery);
        if (latest()) setData((d) => ({ ...d, users: r.users }));
      } else if (tab === 'log') {
        const r = await adminApi.actions(key);
        if (latest()) setData((d) => ({ ...d, actions: r.actions }));
      }
    } catch (e) {
      if (!latest()) return;
      const err = e as AdminError;
      setError(err.message);
      if (err.code === 'unauthorized') signOut();
    } finally {
      if (latest()) setLoading(false);
    }
  }, [key, tab, redemptionStatus, roadStatus, sightingFilter, userQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = () => {
    signOut();
    toast('ログアウトしました（デモデータを表示しています）');
  };

  /** 操作を実行する。デモではこの画面の中だけで反映する */
  const act = async (fn: (k: string) => Promise<unknown>, local: (d: Data) => Data, done: string) => {
    try {
      if (key) await fn(key);
      setData(local);
      sfx('coin');
      toast.success(demo ? `${done}（デモのため保存されません）` : done);
    } catch (e) {
      sfx('error');
      toast.error((e as Error).message);
      // 操作の途中でキーが無効になった（差し替えた）時は、デモ表示に戻してログインし直してもらう
      if ((e as AdminError).code === 'unauthorized') signOut();
    }
  };

  const openRedemptions = demo ? data.redemptions.filter((r) => r.status === 'requested').length : (data.summary?.redemptions.open ?? 0);
  const openRoad = demo ? data.roadReports.filter((r) => r.status === 'new').length : (data.summary?.roadReports.open ?? 0);
  const badges: Partial<Record<Tab, number>> = { redemptions: openRedemptions, road: openRoad };

  return (
    <main className="min-h-dvh pb-[calc(48px+var(--safe-bottom))]">
      {/* ───── ヘッダー（夜空の帯） ───── */}
      <header className="pt-safe relative overflow-hidden bg-night text-white">
        <Sparkles count={5} className="opacity-60" />
        <div className="relative mx-auto flex max-w-[960px] items-center gap-3 px-4 pb-5 pt-5">
          {/* ドット絵の丸：白い丸に瑠璃の丸を 3px 内側に重ねる。切り抜いた丸は影を描けないので、影は外側の箱の filter で落とす */}
          <span className="grid h-11 w-11 shrink-0 self-start [filter:drop-shadow(0_3px_0_rgb(var(--c-brand-pressed)))]">
            <span className="px-circle-m relative grid place-items-center bg-white">
              <span aria-hidden className="px-circle-m absolute inset-[3px] bg-brand-fill" />
              <LogoMark size={24} className="relative text-white" />
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="num truncate text-[11px] tracking-[0.1em] text-gold sm:text-[13px]">AMAMI NATURE · ADMIN</p>
            {/* スマホ幅でも1行に収める */}
            <h1 className="truncate text-headline font-black leading-7 sm:text-title sm:leading-8">運営ダッシュボード</h1>
          </div>
          <span className={cn('px-clip-1 hidden px-3 py-1 text-caption sm:inline-flex', demo ? 'bg-white/15 text-white' : 'bg-xp text-[#0b3d22]')}>
            {demo ? 'デモデータ' : '本番データ'}
          </span>
          {demo ? (
            <Button variant="gold" size="md" className="h-10 px-4" onClick={() => setKeySheet(true)}>
              <IconKey size={18} />
              ログイン
            </Button>
          ) : (
            <Button variant="on-stage" size="md" className="h-10 px-4" onClick={logout}>
              ログアウト
            </Button>
          )}
        </div>
      </header>

      {/* ───── タブ ───── */}
      <nav aria-label="管理メニュー" className="sticky top-0 z-30 border-b-2 border-line bg-page/95 backdrop-blur">
        <div className="mx-auto max-w-[960px]">
          <ChipRow className="py-3">
            {TABS.map((t) => (
              <Chip
                key={t.id}
                selected={tab === t.id}
                icon={t.icon}
                onClick={() => {
                  sfx('tap');
                  setTab(t.id);
                }}
                count={badges[t.id] ? <span className="px-clip-1 bg-capture px-1.5 text-[11px] text-white opacity-100">{badges[t.id]}</span> : undefined}
              >
                {t.label}
              </Chip>
            ))}
          </ChipRow>
        </div>
      </nav>

      <div className="mx-auto max-w-[960px] px-4 pt-5">
        {demo && (
          <Notice className="mx-0 mb-4" kind="info">
            いま表示しているのはデモ用の見本です。管理キーでログインすると、実際の申請・記録・レポートを表示して操作できます。
          </Notice>
        )}
        {error && (
          <Notice className="mx-0 mb-4" kind="danger" title="読み込めませんでした。">
            {error}
          </Notice>
        )}
        {!demo && (
          <div className="mb-3 flex justify-end">
            <Button variant="text" size="hit" onClick={() => void load()} disabled={loading}>
              <IconArrowClockwise size={18} className={cn(loading && 'animate-spin')} />
              {loading ? '読み込み中' : '最新にする'}
            </Button>
          </div>
        )}

        {tab === 'home' && <HomeTab data={data} demo={demo} go={setTab} openRare={() => (setSightingFilter('rare'), setTab('sightings'))} />}
        {tab === 'redemptions' && (
          <RedemptionsTab
            // 対応した申請は状態を書き換え、いまの絞り込みに合わなくなったものは一覧から外す（「すべて」では状態だけ変わる）
            items={data.redemptions.filter((r) => redemptionStatus === 'all' || r.status === redemptionStatus)}
            status={redemptionStatus}
            onStatus={setRedemptionStatus}
            onUpdate={(r, status) =>
              act(
                (k) => adminApi.updateRedemption(k, r.id, { status }),
                (d) => ({
                  ...d,
                  redemptions: d.redemptions.map((x) => (x.id === r.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)),
                }),
                status === 'fulfilled' ? '発送済みにしました' : status === 'cancelled' ? '取り消して、ポイントを戻しました' : '申請中に戻しました',
              )
            }
          />
        )}
        {tab === 'sightings' && (
          <SightingsTab
            adminKey={key}
            items={demo ? data.sightings.filter((s) => matchSighting(s, sightingFilter)) : data.sightings}
            filter={sightingFilter}
            onFilter={setSightingFilter}
            more={!demo && sightingsMore}
            loadingMore={loadingMore}
            onMore={async () => {
              const cursor = data.sightings.at(-1)?.receivedAt;
              if (!key || !cursor) return;
              const seq = loadSeq.current;
              setLoadingMore(true);
              try {
                const r = await adminApi.sightings(key, sightingFilter, cursor);
                if (seq !== loadSeq.current) return;
                setData((d) => {
                  const seen = new Set(d.sightings.map((x) => x.id));
                  return { ...d, sightings: [...d.sightings, ...r.sightings.filter((x) => !seen.has(x.id))] };
                });
                setSightingsMore(r.sightings.length >= SIGHTINGS_PAGE);
              } catch (e) {
                toast.error((e as Error).message);
              } finally {
                setLoadingMore(false);
              }
            }}
            onRevoke={(s, reason) =>
              act(
                (k) => adminApi.revoke(k, s.id, reason),
                (d) => ({ ...d, sightings: d.sightings.map((x) => (x.id === s.id ? { ...x, revokedAt: new Date().toISOString(), revokeReason: reason } : x)) }),
                '記録を取り消しました。この記録のポイントは数えられなくなります',
              )
            }
            onRestore={(s) =>
              act(
                (k) => adminApi.restore(k, s.id),
                (d) => ({ ...d, sightings: d.sightings.map((x) => (x.id === s.id ? { ...x, revokedAt: null, revokeReason: null } : x)) }),
                '取り消しを戻しました',
              )
            }
          />
        )}
        {tab === 'road' && (
          <RoadTab
            items={data.roadReports.filter((r) => roadStatus === 'all' || r.status === roadStatus)}
            status={roadStatus}
            onStatus={setRoadStatus}
            onUpdate={(r, status) =>
              act(
                (k) => adminApi.updateRoadReport(k, r.id, status),
                (d) => ({
                  ...d,
                  roadReports: d.roadReports.map((x) => (x.id === r.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)),
                }),
                `「${ROAD_STATUS_LABEL[status]}」にしました`,
              )
            }
          />
        )}
        {tab === 'partners' && (
          <PartnersTab
            items={data.partners}
            demo={demo}
            onCreate={async (name, scope) => {
              try {
                const created = key
                  ? await adminApi.createPartner(key, name, scope)
                  : {
                      partner: { id: `demo-${data.partners.length + 1}`, name, scope: scope === 'all' ? 'all' : scope.join(','), createdAt: new Date().toISOString() },
                      apiKey: 'pk_DEMO-このキーは見本です',
                    };
                setData((d) => ({ ...d, partners: [created.partner, ...d.partners] }));
                sfx('badge');
                return created.apiKey;
              } catch (e) {
                toast.error((e as Error).message);
                return null;
              }
            }}
            onDelete={(p) =>
              act(
                (k) => adminApi.deletePartner(k, p.id),
                (d) => ({ ...d, partners: d.partners.filter((x) => x.id !== p.id) }),
                `「${p.name}」のキーを無効にしました`,
              )
            }
          />
        )}
        {tab === 'users' && (
          <UsersTab
            items={
              demo
                ? data.users.filter(
                    (u) => !userQuery || `${u.displayName}${u.nickname}`.includes(userQuery) || u.supportCode === userQuery.toUpperCase(),
                  )
                : data.users
            }
            query={userQuery}
            onQuery={setUserQuery}
            onExport={async (u) => {
              try {
                const json = key ? await adminApi.exportUser(key, u.id) : { demo: true, user: u };
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }));
                a.download = `amami-nature-${u.supportCode ?? u.id.slice(0, 8)}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 4000);
                toast.success(demo ? '書き出しました（デモのため見本です）' : '書き出しました。安全な方法で本人に渡してください');
              } catch (e) {
                toast.error((e as Error).message);
                if ((e as AdminError).code === 'unauthorized') signOut();
              }
            }}
            onDelete={(u, reason) =>
              act(
                (k) => adminApi.deleteUser(k, u.id, reason),
                (d) => ({ ...d, users: d.users.filter((x) => x.id !== u.id) }),
                `${u.supportCode ?? 'この利用者'} のデータを消しました`,
              )
            }
          />
        )}
        {tab === 'log' && <LogTab items={data.actions} />}
      </div>

      <KeySheet
        open={keySheet}
        onClose={() => setKeySheet(false)}
        onLogin={async (k) => {
          await adminApi.summary(k);
          setAdminKey(k);
          setKey(k);
          setData(EMPTY);
          setKeySheet(false);
          sfx('get');
          toast.success('ログインしました');
        }}
      />
    </main>
  );
}

function matchSighting(s: AdminSighting, f: SightingFilter): boolean {
  if (f === 'revoked') return !!s.revokedAt;
  if (f === 'road') return !!s.roadReport;
  if (f === 'photo') return s.hasPhoto && !s.revokedAt;
  if (f === 'rare') return !!s.speciesId && (SPECIES_BY_ID[s.speciesId]?.rarity ?? 0) >= 3 && !s.revokedAt;
  return true;
}

// ───────── 共通の部品 ─────────

function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between gap-3 first:mt-0">
      <h2 className="flex items-center gap-2 text-section text-fg">
        <span aria-hidden className="h-5 w-1.5 bg-brand-fill" />
        {children}
      </h2>
      {right}
    </div>
  );
}

function Empty({ icon: Icon = IconSealCheckFill, title, body }: { icon?: IconComponent; title: string; body?: string }) {
  return (
    <div className="panel flex flex-col items-center px-4 py-7 text-center">
      <span className="px-circle-l grid h-14 w-14 place-items-center bg-xp/15 text-xp">
        <Icon size={30} />
      </span>
      <p className="mt-3 text-headline font-black text-fg">{title}</p>
      {body && <p className="mt-1 text-sub font-bold text-fg-2">{body}</p>}
    </div>
  );
}

function StatusPill({ children, tone }: { children: ReactNode; tone: 'open' | 'done' | 'muted' | 'danger' }) {
  return (
    <span
      className={cn(
        'px-clip-1 inline-flex h-6 shrink-0 items-center px-2.5 text-caption',
        tone === 'open' && 'bg-capture text-white',
        tone === 'done' && 'bg-xp text-[#0b3d22]',
        tone === 'muted' && 'bg-fill-strong text-fg-2',
        tone === 'danger' && 'bg-danger text-on-danger',
      )}
    >
      {children}
    </span>
  );
}

// ───────── ダッシュボード ─────────

function HomeTab({ data, demo, go, openRare }: { data: Data; demo: boolean; go: (t: Tab) => void; openRare: () => void }) {
  const s = data.summary;
  if (!s) return <Empty icon={IconArrowClockwise} title="読み込んでいます" />;
  const openRedemptions = demo ? data.redemptions.filter((r) => r.status === 'requested').length : s.redemptions.open;
  const openRoad = demo ? data.roadReports.filter((r) => r.status === 'new').length : s.roadReports.open;
  const todos = [
    { id: 'redemptions' as Tab, icon: IconGift, title: '景品の交換申請に対応する', n: openRedemptions, unit: '件', sub: `${s.redemptions.openPoints.toLocaleString()} pt 分` },
    { id: 'road' as Tab, icon: IconRoadHorizonFill, title: '新しい路上レポートを行政・保護機関へ転送する', n: openRoad, unit: '件', sub: '交通事故・けがは早めに' },
    { id: 'sightings' as Tab, icon: IconScan, title: '今週のレアな記録を確認する', n: s.sightings.rareWeek, unit: '件', sub: 'めずらしい・幻の記録' },
  ];
  const max = Math.max(1, ...s.daily.map((d) => d.sightings));
  const topMax = Math.max(1, ...s.topSpecies.map((t) => t.n));
  const done = todos.filter((t) => t.n === 0).length;

  return (
    <>
      {/* きょうのやること（ミッション） */}
      <SectionTitle right={<span className="num px-clip-1 bg-fill-strong px-2.5 py-0.5 text-[14px] text-fg-2">{done}/{todos.length}</span>}>
        きょうのやること
      </SectionTitle>
      <div className="panel overflow-hidden">
        {todos.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              sfx('tap');
              if (t.id === 'sightings') openRare();
              else go(t.id);
            }}
            className="flex w-full items-center gap-3 border-b-2 border-sep px-4 py-3 text-left last:border-b-0 active:bg-fill"
          >
            <span className={cn('px-circle-m grid h-11 w-11 shrink-0 place-items-center', t.n === 0 ? 'bg-xp text-white' : 'bg-brand-soft text-brand')}>
              {t.n === 0 ? <IconCheck size={22} /> : <t.icon size={22} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-callout font-black', t.n === 0 ? 'text-fg-3 line-through decoration-2' : 'text-fg')}>{t.title}</span>
              <span className="mt-0.5 block text-caption text-fg-2">{t.sub}</span>
            </span>
            {t.n === 0 ? (
              <span className="num px-clip-1 bg-xp px-2.5 py-0.5 text-[13px] text-[#0b3d22]">CLEAR</span>
            ) : (
              <span className="num px-clip-1 shrink-0 bg-capture px-3 py-0.5 text-[18px] text-white">{t.n}</span>
            )}
          </button>
        ))}
      </div>

      {/* 数字 */}
      <SectionTitle>アプリの今</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi icon={IconUsers} label="ユーザー" value={s.users.total} sub={`今週 +${s.users.new7}`} tone="brand" />
        <Kpi icon={IconUser} label="今週あそんだ人" value={s.users.active7} sub={`${Math.round((s.users.active7 / Math.max(1, s.users.total)) * 100)}%`} tone="xp" />
        <Kpi icon={IconScan} label="きょうの記録" value={s.sightings.today} sub={`今週 ${s.sightings.week} / 累計 ${s.sightings.total.toLocaleString()}`} tone="brand" />
        <Kpi icon={IconRoadHorizonFill} label="路上レポート" value={s.roadReports.total} sub={`未対応 ${s.roadReports.open}`} tone="capture" />
        <Kpi icon={IconSealCheckFill} label="LINE友だち" value={s.users.friends} sub={`登録率 ${Math.round((s.users.friends / Math.max(1, s.users.total)) * 100)}%`} tone="xp" />
        <Kpi icon={IconCrownSimpleFill} label="Plus 会員" value={s.users.plus} sub="有料プラン" tone="gold" />
        <Kpi icon={IconScan} label="AI判定（きょう）" value={s.aiToday} sub="OpenAI による判定" tone="brand" />
        <Kpi icon={IconCoinsFill} label="交換で使われた pt" value={s.redemptions.fulfilledPoints} sub={`取り消し済みの記録 ${s.sightings.revoked}`} tone="gold" />
      </div>

      {/* 14 日の記録 */}
      <SectionTitle>この2週間の記録</SectionTitle>
      <div className="panel px-3 pb-2 pt-3">
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label={`この2週間の記録数。${s.daily.map((d) => `${d.day.slice(5)} ${d.sightings}件`).join('、')}`}>
          {s.daily.map((d) => (
            <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="num text-[11px] text-fg-2">{d.sightings}</span>
              <div className="stripes w-full bg-brand-fill" style={{ height: `${Math.max(4, (d.sightings / max) * 120)}px` }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5 border-t-2 border-sep pt-1.5" aria-hidden>
          {s.daily.map((d, i) => (
            <span key={d.day} className="num min-w-0 flex-1 text-center text-[10px] text-fg-3">
              {i % 2 === 1 ? '' : `${Number(d.day.slice(5, 7))}/${Number(d.day.slice(8))}`}
            </span>
          ))}
        </div>
      </div>

      {/* 人気の生き物 */}
      <SectionTitle>30日間の人気の生き物</SectionTitle>
      <div className="panel overflow-hidden">
        {s.topSpecies.length === 0 && <p className="px-4 py-4 text-sub font-bold text-fg-2">まだ記録がありません</p>}
        {s.topSpecies.map((t, i) => {
          const sp = SPECIES_BY_ID[t.speciesId];
          return (
            <div key={t.speciesId} className="flex items-center gap-3 border-b-2 border-sep px-4 py-2.5 last:border-b-0">
              <span className={cn('num w-7 shrink-0 text-center text-[18px]', i < 3 ? 'text-gold-edge' : 'text-fg-3')}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-callout font-black text-fg">{speciesName(t.speciesId)}</span>
                  {sp && <Stars rarity={sp.rarity} size={11} />}
                </span>
                <span className="mt-1 block h-2.5 overflow-hidden bg-fill-strong">
                  <span className={cn('block h-full', sp ? TYPE_META[sp.category].bg : 'bg-fg-3')} style={{ width: `${(t.n / topMax) * 100}%` }} />
                </span>
              </span>
              <span className="num shrink-0 text-[17px] text-fg">{t.n}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-caption text-fg-3">更新 {when(s.generatedAt)}</p>
    </>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: IconComponent; label: string; value: number; sub: string; tone: 'brand' | 'xp' | 'gold' | 'capture' }) {
  const toneCls = { brand: 'bg-brand-soft text-brand', xp: 'bg-xp/15 text-success', gold: 'bg-gold-soft text-gold-edge', capture: 'bg-capture/10 text-capture' }[tone];
  return (
    <div className="panel p-2.5">
      <div className="flex items-center gap-2">
        <span className={cn('px-circle-m grid h-8 w-8 shrink-0 place-items-center', toneCls)}>
          <Icon size={18} />
        </span>
        <span className="min-w-0 truncate text-caption text-fg-2">{label}</span>
      </div>
      <p className="num mt-2 text-[30px] leading-8 text-fg">{value.toLocaleString()}</p>
      <p className="mt-0.5 truncate text-caption text-fg-3">{sub}</p>
    </div>
  );
}

// ───────── 交換申請 ─────────

function RedemptionsTab({
  items,
  status,
  onStatus,
  onUpdate,
}: {
  items: AdminRedemption[];
  status: RedemptionStatus | 'all';
  onStatus: (s: RedemptionStatus | 'all') => void;
  onUpdate: (r: AdminRedemption, s: RedemptionStatus) => void;
}) {
  const [cancel, setCancel] = useState<AdminRedemption | null>(null);
  return (
    <>
      <Segmented
        aria-label="申請の状態"
        value={status}
        onChange={onStatus}
        options={[
          { value: 'requested', label: '申請中' },
          { value: 'fulfilled', label: '発送済み' },
          { value: 'cancelled', label: '取り消し' },
          { value: 'all', label: 'すべて' },
        ]}
      />
      <div className="mt-4 space-y-2.5">
        {items.length === 0 && <Empty title={status === 'requested' ? '対応待ちの申請はありません' : '申請はありません'} body={status === 'requested' ? 'ぜんぶ対応済み！' : undefined} />}
        {items.map((r) => {
          const reward = REWARDS.find((x) => x.id === r.rewardId);
          const Icon = reward ? KIND_ICON[reward.kind] : IconGift;
          return (
            <div key={r.id} className="panel flex flex-wrap items-center gap-3 p-2.5">
              <span className="px-clip-2 grid h-12 w-12 shrink-0 place-items-center bg-gold-soft text-gold-edge">
                <Icon size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-callout font-black text-fg">{r.rewardTitle || reward?.title || r.rewardId}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-caption text-fg-2">
                  <span>{userLabel(r.displayName, r.nickname)}</span>
                  <span>{when(r.createdAt)}（{ago(r.createdAt)}）</span>
                  {!r.isFriend && <span className="text-warning">LINE友だち未登録</span>}
                </p>
                {r.note && <p className="mt-0.5 text-caption text-fg-3">メモ: {r.note}</p>}
              </div>
              <span className="flex items-center gap-1">
                <Coin size={22} />
                <span className="num text-[18px] text-fg">{r.points}</span>
              </span>
              <StatusPill tone={r.status === 'requested' ? 'open' : r.status === 'fulfilled' ? 'done' : 'muted'}>{REDEMPTION_STATUS_LABEL[r.status]}</StatusPill>
              <div className="flex w-full gap-2 sm:w-auto">
                {r.status === 'requested' ? (
                  <>
                    <Button variant="gold" size="md" className="flex-1 sm:flex-none" onClick={() => onUpdate(r, 'fulfilled')}>
                      発送済みにする
                    </Button>
                    <Button variant="secondary" size="md" className="flex-1 text-danger sm:flex-none" onClick={() => setCancel(r)}>
                      取り消す
                    </Button>
                  </>
                ) : r.status === 'fulfilled' ? (
                  <Button variant="secondary" size="md" className="flex-1 sm:flex-none" onClick={() => onUpdate(r, 'requested')}>
                    申請中に戻す
                  </Button>
                ) : (
                  // 取り消した申請はポイントを返してあるので戻せない（もう一度申請してもらう）
                  <p className="text-caption text-fg-3">取り消し済み・ポイントは返しました</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        open={!!cancel}
        onClose={() => setCancel(null)}
        title="この申請を取り消しますか？"
        body={cancel ? `「${cancel.rewardTitle || cancel.rewardId}」の申請を取り消し、${cancel.points} pt を ${userLabel(cancel.displayName, cancel.nickname)} さんに戻します。` : ''}
        confirmLabel="取り消す"
        onConfirm={() => {
          if (cancel) onUpdate(cancel, 'cancelled');
          setCancel(null);
        }}
      />
    </>
  );
}

// ───────── 記録チェック ─────────

/** 管理キーで写真を読み込む。null は読み込み中（または写真なし）、'failed' は読めなかった */
function useAdminPhoto(adminKey: string | null, id: string, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!adminKey || !enabled) return;
    let alive = true;
    let made: string | null = null;
    adminApi
      .photo(adminKey, id)
      .then((blob) => {
        if (!alive) return;
        made = URL.createObjectURL(blob);
        setUrl(made);
      })
      .catch(() => alive && setUrl('failed'));
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [adminKey, id, enabled]);
  return url;
}

/** 記録チェックの1回に読む件数（worker/src/admin.ts の既定と同じ） */
const SIGHTINGS_PAGE = 60;

function SightingsTab({
  adminKey,
  items,
  filter,
  onFilter,
  more,
  loadingMore,
  onMore,
  onRevoke,
  onRestore,
}: {
  adminKey: string | null;
  items: AdminSighting[];
  filter: SightingFilter;
  onFilter: (f: SightingFilter) => void;
  more: boolean;
  loadingMore: boolean;
  onMore: () => void;
  onRevoke: (s: AdminSighting, reason: string) => void;
  onRestore: (s: AdminSighting) => void;
}) {
  const [target, setTarget] = useState<AdminSighting | null>(null);
  const [reason, setReason] = useState(REVOKE_REASONS[0]);
  const FILTERS: { id: SightingFilter; label: string }[] = [
    { id: 'all', label: 'すべて' },
    { id: 'rare', label: 'めずらしい・幻' },
    { id: 'photo', label: '写真あり' },
    { id: 'road', label: '路上レポート' },
    { id: 'revoked', label: '取り消し済み' },
  ];
  return (
    <>
      <ChipRow className="-mx-4">
        {FILTERS.map((f) => (
          <Chip key={f.id} selected={filter === f.id} onClick={() => onFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </ChipRow>
      <p className="mt-2 text-caption text-fg-2">不正な記録（写真の使い回し・生き物が写っていないなど）を取り消すと、その記録はポイント・図鑑・提携先の集計に数えられなくなります。記録と写真は残ります。</p>
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Empty title="該当する記録はありません" />
          </div>
        )}
        {items.map((s) => (
          <SightingCard key={s.id} s={s} adminKey={adminKey} onRevoke={() => (setReason(REVOKE_REASONS[0]), setTarget(s))} onRestore={() => onRestore(s)} />
        ))}
      </div>
      {more && (
        <Button variant="secondary" className="mx-auto mt-4 sm:w-auto sm:px-8" onClick={onMore} disabled={loadingMore}>
          {loadingMore ? '読み込んでいます' : 'もっと見る（古い記録）'}
        </Button>
      )}
      <Sheet open={!!target} onClose={() => setTarget(null)} title="記録を取り消す">
        {target && (
          <>
            <p className="text-body font-bold text-fg-2">
              {userLabel(target.displayName, target.userNickname)} さんの「{speciesName(target.speciesId, target.customName)}」の記録を取り消します。理由を選んでください。
            </p>
            <div className="panel mt-4 overflow-hidden" role="radiogroup" aria-label="取り消しの理由">
              {REVOKE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={reason === r}
                  onClick={() => setReason(r)}
                  className="flex w-full items-center gap-3 border-b-2 border-sep px-4 py-3 text-left text-callout font-bold text-fg last:border-b-0 active:bg-fill"
                >
                  <RadioMark checked={reason === r} />
                  {r}
                </button>
              ))}
            </div>
            <Button
              variant="danger"
              className="mt-5"
              onClick={() => {
                onRevoke(target, reason);
                setTarget(null);
              }}
            >
              取り消す
            </Button>
            <Button variant="text" size="hit" className="mt-2 w-full" onClick={() => setTarget(null)}>
              やめる
            </Button>
          </>
        )}
      </Sheet>
    </>
  );
}

function SightingCard({ s, adminKey, onRevoke, onRestore }: { s: AdminSighting; adminKey: string | null; onRevoke: () => void; onRestore: () => void }) {
  const sp = s.speciesId ? SPECIES_BY_ID[s.speciesId] : null;
  const photo = useAdminPhoto(adminKey, s.id, s.hasPhoto);
  return (
    // 取り消した記録は、赤い線の枠（px-panel-danger）にする
    <div className={cn('flex flex-col overflow-hidden p-1', s.revokedAt ? 'px-panel-danger' : 'panel')}>
      <div className="relative">
        {photo === 'failed' ? (
          <div className="px-clip-2 grid aspect-[4/3] w-full place-items-center bg-fill text-sub font-bold text-fg-3">写真を読み込めませんでした</div>
        ) : photo ? (
          <img src={photo} alt="" className="px-clip-2 aspect-[4/3] w-full object-cover" />
        ) : s.hasPhoto && adminKey ? (
          // 写真を読み込んでいる間は、写真と同じ大きさの枠を出す（あとから縦にずれない）
          <div className="px-clip-2 aspect-[4/3] w-full animate-pulse bg-fill" />
        ) : sp ? (
          // 写真のない記録は確かめる写真がないので、低い帯にする
          <SpeciesPlate species={sp} discovered className="px-clip-2 h-24 w-full" />
        ) : (
          <div className="px-clip-2 h-24 w-full bg-fill" />
        )}
        <span className="absolute left-2 top-2 flex flex-wrap gap-1">
          {sp && sp.rarity >= 3 && <span className="num px-clip-1 bg-rare-3 px-2 text-[11px] leading-5 text-white">{sp.rarity === 4 ? 'LEGEND' : 'RARE'}</span>}
          {s.roadReport && <span className="px-clip-1 bg-danger px-2 text-[11px] font-black leading-5 text-on-danger">路上</span>}
          {!s.hasPhoto && <span className="px-clip-1 bg-fill-strong px-2 text-[11px] font-black leading-5 text-fg-2">写真なし</span>}
        </span>
        {s.revokedAt && (
          <span className="px-clip-2 absolute inset-0 grid place-items-center bg-night/60">
            {/* 傾けたスタンプ：白い段々の四角に、赤い段々の四角を 3px 内側に重ねる */}
            <span className="px-clip-2 rotate-[-8deg] bg-white p-[3px]">
              <span className="px-clip-1 block bg-danger px-4 py-1 text-headline font-black text-white">取り消し済み</span>
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
        <div className="flex items-center gap-2">
          {sp && <TypeBadge category={sp.category} size="sm" />}
          {sp && <Stars rarity={sp.rarity} size={11} />}
        </div>
        <p className="mt-1 truncate text-headline font-black text-fg">
          {speciesName(s.speciesId, s.customName)}
          {s.nickname && <span className="ml-1 text-sub text-fg-2">「{s.nickname}」</span>}
        </p>
        <p className="mt-0.5 text-caption text-fg-2">
          {userLabel(s.displayName, s.userNickname)} ・ {areaName(s.areaId)} ・ {when(s.observedAt)}
        </p>
        {s.locationProtected && <p className="mt-0.5 text-caption text-fg-3">希少種のため位置は保存していません</p>}
        {s.memo && <p className="mt-1 line-clamp-2 text-caption text-fg-3">メモ: {s.memo}</p>}
        {s.revokedAt && <p className="mt-1 text-caption text-danger">理由: {s.revokeReason}（{when(s.revokedAt)}）</p>}
        <div className="mt-auto pt-3">
          {s.revokedAt ? (
            <Button variant="secondary" size="md" className="w-full" onClick={onRestore}>
              取り消しを戻す
            </Button>
          ) : (
            <Button variant="secondary" size="md" className="w-full text-danger" onClick={onRevoke}>
              <IconWarning size={18} />
              不正として取り消す
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────── 路上レポート ─────────

/**
 * CSV の1つのセル。利用者が書いたメモが表計算ソフトで数式として動かないよう、
 * = + - @ タブ 改行 で始まる文字は先頭に ' を付ける（数値はそのまま）
 */
function csvCell(v: unknown): string {
  if (typeof v === 'number') return String(v);
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function RoadTab({
  items,
  status,
  onStatus,
  onUpdate,
}: {
  items: AdminRoadReport[];
  status: RoadStatus | 'all';
  onStatus: (s: RoadStatus | 'all') => void;
  onUpdate: (r: AdminRoadReport, s: RoadStatus) => void;
}) {
  /** 行政・保護機関への転送用の CSV（正確な位置を含むので、扱いに注意）。運営が取り消したレポートは入れない */
  const download = () => {
    const rows = [
      ['種類', '生き物', '市町村', '日時', '緯度', '経度', '地図', '状態', 'メモ'],
      ...items.filter((r) => !r.revokedAt).map((r) => [
        ROAD_TYPE[r.type].label,
        speciesName(r.speciesId, '不明'),
        areaName(r.areaId),
        new Date(r.observedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        r.lat ?? '',
        r.lng ?? '',
        r.lat != null && r.lng != null ? `https://www.google.com/maps?q=${r.lat},${r.lng}` : '',
        ROAD_STATUS_LABEL[r.status],
        r.memo ?? '',
      ]),
    ];
    const blob = new Blob([`﻿${rows.map((r) => r.map(csvCell).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `road-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  return (
    <>
      <Segmented
        aria-label="対応の状態"
        value={status}
        onChange={onStatus}
        options={[
          { value: 'new', label: '新規' },
          { value: 'forwarded', label: '転送済み' },
          { value: 'closed', label: '対応済み' },
          { value: 'all', label: 'すべて' },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-fg-2">正確な位置は、行政・保護機関への連絡のためだけに使います。外部に公開しないでください。</p>
        <Button variant="secondary" size="md" className="h-10" onClick={download} disabled={items.length === 0}>
          <IconFileArrowDown size={18} />
          CSVで書き出す
        </Button>
      </div>
      <div className="mt-4 space-y-2.5">
        {items.length === 0 && <Empty icon={IconCarProfileFill} title={status === 'new' ? '新しい路上レポートはありません' : 'レポートはありません'} />}
        {items.map((r) => (
          <div key={r.id} className={cn('panel p-2.5', r.revokedAt && 'opacity-60')}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('px-clip-1 inline-flex h-7 items-center px-3 text-caption', ROAD_TYPE[r.type].cls)}>{ROAD_TYPE[r.type].label}</span>
              <span className="text-headline font-black text-fg">{speciesName(r.speciesId, '種類不明')}</span>
              <span className="ml-auto">
                <StatusPill tone={r.status === 'new' ? 'open' : r.status === 'forwarded' ? 'muted' : 'done'}>{ROAD_STATUS_LABEL[r.status]}</StatusPill>
              </span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sub font-bold text-fg-2">
              <span>{areaName(r.areaId)}</span>
              <span>{when(r.observedAt)}（{ago(r.observedAt)}）</span>
              {r.lat != null && r.lng != null ? (
                <a href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand underline-offset-2 hover:underline">
                  <IconMapPin size={16} />
                  <span className="num text-[13px]">
                    {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                  </span>
                </a>
              ) : (
                <span className="text-fg-3">位置なし</span>
              )}
              {r.revokedAt && <span className="text-danger">記録は取り消し済み</span>}
            </p>
            {r.memo && <p className="mt-1 text-caption text-fg-3">メモ: {r.memo}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== 'forwarded' && (
                <Button variant={r.status === 'new' ? 'primary' : 'secondary'} size="md" onClick={() => onUpdate(r, 'forwarded')}>
                  転送済みにする
                </Button>
              )}
              {r.status !== 'closed' && (
                <Button variant="secondary" size="md" onClick={() => onUpdate(r, 'closed')}>
                  対応済みにする
                </Button>
              )}
              {r.status !== 'new' && (
                <Button variant="text" size="hit" onClick={() => onUpdate(r, 'new')}>
                  新規に戻す
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ───────── 提携先 ─────────

function scopeLabel(scope: string): string {
  if (scope === 'all') return 'すべての市町村';
  return scope
    .split(',')
    .map((a) => AREA_BY_ID[a]?.name ?? a)
    .join('、');
}

function PartnersTab({
  items,
  demo,
  onCreate,
  onDelete,
}: {
  items: AdminPartner[];
  demo: boolean;
  onCreate: (name: string, scope: string[] | 'all') => Promise<string | null>;
  onDelete: (p: AdminPartner) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [all, setAll] = useState(true);
  const [areas, setAreas] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [remove, setRemove] = useState<AdminPartner | null>(null);

  const reset = () => {
    setName('');
    setAll(true);
    setAreas([]);
    setIssued(null);
  };
  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!name.trim() || (!all && areas.length === 0)) return;
    setBusy(true);
    const key = await onCreate(name.trim(), all ? 'all' : areas);
    setBusy(false);
    if (key) setIssued(key);
  };

  return (
    <>
      <SectionTitle
        right={
          <Button variant="primary" size="md" className="h-10" onClick={() => (reset(), setOpen(true))}>
            提携先を追加
          </Button>
        }
      >
        提携先のキー
      </SectionTitle>
      <p className="-mt-1 mb-3 text-caption text-fg-2">自治体・保護機関がダッシュボード（/partners）を見るためのキーです。キーごとに見られる市町村を決められます。</p>
      <div className="space-y-2.5">
        {items.length === 0 && <Empty icon={IconKey} title="提携先はまだありません" />}
        {items.map((p) => (
          <div key={p.id} className="panel flex items-center gap-3 p-2.5">
            <span className="px-circle-m grid h-11 w-11 shrink-0 place-items-center bg-brand-soft text-brand">
              <IconKey size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-callout font-black text-fg">{p.name}</p>
              <p className="mt-0.5 text-caption text-fg-2">
                {scopeLabel(p.scope)} ・ 発行 {when(p.createdAt)}
              </p>
            </div>
            <Button variant="secondary" size="md" className="h-10 px-3 text-danger" onClick={() => setRemove(p)} aria-label={`${p.name}のキーを無効にする`}>
              <IconTrash size={18} />
            </Button>
          </div>
        ))}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={issued ? 'キーを発行しました' : '提携先を追加'} keyboard>
        {issued ? (
          <>
            <div className="px-notice-caution relative overflow-hidden p-3">
              <Sparkles count={3} />
              <p className="text-sub font-black text-fg">このキーは、この画面でしか表示されません</p>
              <p className="px-clip-2 mt-2 break-all bg-surface px-3 py-2 font-mono text-[14px] font-bold text-fg">{issued}</p>
            </div>
            <Button
              variant="gold"
              className="mt-4"
              onClick={() => {
                void navigator.clipboard?.writeText(issued).then(
                  () => toast.success('コピーしました'),
                  () => toast('コピーできませんでした。手で選んでコピーしてください'),
                );
              }}
            >
              キーをコピー
            </Button>
            <p className="mt-3 text-caption text-fg-2">提携先には、メールではなく安全な方法で渡してください。なくした時は、このキーを無効にして新しく発行します。{demo && '（デモのため実際には発行されていません）'}</p>
            <Button variant="text" size="hit" className="mt-2 w-full" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </>
        ) : (
          <form onSubmit={submit}>
            <Field label="提携先の名前">
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="例：〇〇市 環境課" />
            </Field>
            <p className="mb-1.5 mt-5 text-sub font-black text-fg-2">見られる市町村</p>
            <ChipRow className="-mx-4 flex-wrap overflow-visible">
              <Chip selected={all} onClick={() => setAll(true)}>
                すべて
              </Chip>
              <Chip selected={!all} onClick={() => setAll(false)}>
                選ぶ
              </Chip>
            </ChipRow>
            {!all && (
              <div className="mt-3 flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <Chip key={a.id} onFill selected={areas.includes(a.id)} onClick={() => setAreas((xs) => (xs.includes(a.id) ? xs.filter((x) => x !== a.id) : [...xs, a.id]))}>
                    {a.name}
                  </Chip>
                ))}
              </div>
            )}
            <Button type="submit" className="mt-6" disabled={busy || !name.trim() || (!all && areas.length === 0)}>
              キーを発行する
            </Button>
          </form>
        )}
      </Sheet>

      <ConfirmDialog
        open={!!remove}
        onClose={() => setRemove(null)}
        title="このキーを無効にしますか？"
        body={remove ? `「${remove.name}」はダッシュボードを見られなくなります。元に戻すには、新しいキーを発行します。` : ''}
        confirmLabel="無効にする"
        onConfirm={() => {
          if (remove) onDelete(remove);
          setRemove(null);
        }}
      />
    </>
  );
}

// ───────── ユーザー ─────────

function UsersTab({
  items,
  query,
  onQuery,
  onExport,
  onDelete,
}: {
  items: AdminUser[];
  query: string;
  onQuery: (q: string) => void;
  onExport: (u: AdminUser) => void;
  onDelete: (u: AdminUser, reason: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(query);
  const [removing, setRemoving] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => onQuery(draft.trim()), 350);
    return () => window.clearTimeout(t);
  }, [draft, onQuery]);
  return (
    <>
      <SearchField value={draft} onChange={setDraft} placeholder="名前・番号（AN-…）で探す" aria-label="ユーザーを探す" />
      <p className="mt-2 text-caption text-fg-2">
        最近ひらいた順。ポイントは取り消した記録を除いて、サーバーで計算した値です。開示・削除の請求は、お問い合わせ番号（AN-…）で本人を確かめてから対応します（docs/OPERATIONS.md）。
      </p>
      <div className="mt-4 space-y-2.5">
        {items.length === 0 && <Empty icon={IconUsers} title="ユーザーが見つかりません" />}
        {items.map((u) => (
          <div key={u.id} className="panel flex flex-wrap items-center gap-3 p-2.5">
            {/* アバター：ドット絵の丸を 3 枚重ねる（外に line の線 3px、白い縁 3px、写真）。レベルは切り抜かない兄弟に置く */}
            <span className="relative h-12 w-12 shrink-0">
              <span aria-hidden className="px-circle-m absolute -inset-[3px] bg-line" />
              <span aria-hidden className="px-circle-m absolute inset-0 bg-white" />
              {u.pictureUrl ? (
                <img src={u.pictureUrl} alt="" className="px-circle-m absolute left-[3px] top-[3px] h-[42px] w-[42px] object-cover" />
              ) : (
                <span className="px-circle-m absolute inset-[3px] grid place-items-center bg-brand-soft text-brand">
                  <IconUser size={24} />
                </span>
              )}
              <LevelBadge level={u.level} size={32} className="absolute -bottom-1.5 -right-2.5" />
            </span>
            <div className="min-w-0 flex-1 pl-1">
              <p className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-callout font-black text-fg">{u.nickname || u.displayName || '（名前なし）'}</span>
                {u.nickname && u.displayName && u.nickname !== u.displayName && <span className="text-caption text-fg-3">LINE: {u.displayName}</span>}
                {u.plus && <span className="num px-clip-1 bg-gold px-2 text-[11px] leading-5 text-[#3d2a00]">PLUS</span>}
                {u.isFriend && <span className="px-clip-1 bg-line-green px-2 text-[11px] font-black leading-5 text-white">友だち</span>}
              </p>
              <p className="mt-0.5 text-caption text-fg-2">
                記録 {u.sightings} ・ {u.species} 種 ・ 最終 {ago(u.lastSeenAt ?? u.createdAt)}
              </p>
              <p className="mt-0.5 text-caption text-fg-3">
                <span className="num tracking-[0.04em]">{u.supportCode ?? '番号なし'}</span>
                {' ・ '}規約 {u.termsVersion ? '同意済み' : '未同意'}
                {' ・ '}路上の位置 {u.roadConsentVersion ? '同意' : 'なし'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Ring value={u.species / 62} size={44} stroke={6}>
                <span className="num text-[11px] text-fg-2">{Math.round((u.species / 62) * 100)}%</span>
              </Ring>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1">
                  <Coin size={18} />
                  <span className="num text-[18px] text-fg">{u.balance.toLocaleString()}</span>
                </p>
                <p className="text-caption text-fg-3">累計 {u.points.toLocaleString()} pt</p>
              </div>
            </div>
            <div className="flex w-full gap-2 border-t-2 border-sep pt-2.5">
              <Button variant="secondary" size="md" className="h-10 flex-1 px-3" onClick={() => onExport(u)} aria-label="データを書き出す（開示の請求）">
                <IconDownloadSimple size={18} />
                書き出す
              </Button>
              <Button variant="secondary" size="md" className="h-10 flex-1 px-3 text-danger" onClick={() => setRemoving(u)}>
                <IconTrash size={18} />
                データを消す
              </Button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title="この利用者のデータを消しますか？"
        body={
          removing
            ? `${removing.nickname || removing.displayName || '（名前なし）'}（${removing.supportCode ?? '番号なし'}）の、アカウント・記録・写真・路上レポート・共有画像を消します。交換の記録は、利用者と結びつかない形で残します。元に戻せません。本人からの削除の請求であることを、お問い合わせ番号で確かめてから消してください。`
            : ''
        }
        confirmLabel="消す"
        busy={busy}
        onConfirm={async () => {
          if (!removing) return;
          setBusy(true);
          try {
            await onDelete(removing, '本人からの削除の請求');
            setRemoving(null);
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

// ───────── 操作ログ ─────────

function LogTab({ items }: { items: AdminAction[] }) {
  const sorted = useMemo(() => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items]);
  return (
    <>
      <SectionTitle>最近の操作</SectionTitle>
      <div className="panel overflow-hidden">
        {sorted.length === 0 && <p className="px-4 py-4 text-sub font-bold text-fg-2">まだ操作はありません</p>}
        {sorted.map((a, i) => (
          <div key={`${a.createdAt}-${i}`} className="flex items-start gap-3 border-b-2 border-sep px-4 py-3 last:border-b-0">
            <span className="num mt-0.5 w-20 shrink-0 text-[13px] text-fg-3">{when(a.createdAt)}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-callout font-black text-fg">{ACTION_LABEL[a.action] ?? a.action}</span>
              <span className="mt-0.5 block break-all text-caption text-fg-2">
                {a.detail} <span className="text-fg-3">（{a.targetId.slice(0, 8)}）</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

// ───────── ログイン ─────────

function KeySheet({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: (key: string) => Promise<void> }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setValue('');
      setErr(null);
    }
  }, [open]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await onLogin(value.trim());
    } catch (e2) {
      sfx('error');
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title="管理キーでログイン" keyboard>
      <form onSubmit={submit}>
        <p className="mb-4 text-body font-bold text-fg-2">運営スタッフに配布した管理キーを入れてください。キーはこのタブを閉じると消えます。</p>
        <Field label="管理キー" note={err ?? undefined}>
          <Input type="password" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} placeholder="ak_…" aria-invalid={!!err} />
        </Field>
        <Button type="submit" className="mt-5" disabled={busy || !value.trim()}>
          {busy ? '確かめています' : 'ログイン'}
        </Button>
      </form>
    </Sheet>
  );
}
