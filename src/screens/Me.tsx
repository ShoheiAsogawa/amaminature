import {
  Building2,
  ChevronRight,
  Cloud,
  FileDown,
  FileUp,
  Gift,
  MessageCircle,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BADGE_ICON, formatDate, Kasuri, Page, PageHeader, ProgressBar, Segmented, Sheet, toast } from '../components/ui';
import { SPECIES } from '../data/species';
import { api } from '../lib/api';
import { exportBackup, importBackup } from '../lib/db';
import { lineLogin, LIFF_ID } from '../lib/liff';
import { BADGES } from '../lib/progress';
import type { ThemePref } from '../lib/types';
import { useProgress } from '../store/useProgress';
import { isPlusActive, useStore } from '../store/useStore';

const ADD_FRIEND_URL = (import.meta.env.VITE_LINE_ADD_FRIEND_URL as string | undefined) ?? '';

function MenuRow({ icon, label, sub, to, onClick }: { icon: ReactNode; label: string; sub?: string; to?: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink/[0.05] text-ink2">{icon}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[14px] font-bold">{label}</span>
        {sub && <span className="block truncate text-[11px] text-ink3">{sub}</span>}
      </span>
      <ChevronRight className="h-4 w-4 text-ink3" />
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3 active:bg-ink/5';
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export default function Me() {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const account = useStore((s) => s.account);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetAll = useStore((s) => s.resetAll);
  const load = useStore((s) => s.load);
  const { stats, points, balance, rank, badges } = useProgress();
  const [nameSheet, setNameSheet] = useState(false);
  const [name, setName] = useState(settings.name);
  const [resetSheet, setResetSheet] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const plus = isPlusActive(settings);

  const doExport = async () => {
    const blob = await exportBackup();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `amami-nature-backup-${formatDate(new Date().toISOString()).replace(/\./g, '')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const doImport = async (file: File) => {
    try {
      const n = await importBackup(file);
      await load();
      toast(`${n}件の記録を読み込みました`);
    } catch (e) {
      toast(e instanceof Error ? e.message : '読み込めませんでした');
    }
  };

  return (
    <Page>
      <PageHeader label="MY PAGE" title="マイページ" />

      {/* プロフィール */}
      <section className="px-4">
        <div className="relative overflow-hidden rounded-4xl bg-forest-900 p-5 text-washi shadow-lift">
          <Kasuri className="text-white/[0.05]" />
          <div className="relative flex items-center gap-4">
            {account.pictureUrl ? (
              <img src={account.pictureUrl} alt="" className="h-16 w-16 rounded-full ring-2 ring-gold/70" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/10 font-serif text-[24px] font-bold ring-2 ring-gold/60">
                {(settings.name || '島')[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <button onClick={() => setNameSheet(true)} className="flex items-center gap-1.5">
                <span className="truncate font-serif text-[20px] font-bold">{settings.name || '観察者さん'}</span>
                <Pencil className="h-3.5 w-3.5 text-washi/50" />
              </button>
              <div className="mt-0.5 text-[12px] text-gold">{rank.current.title}</div>
              {plus && (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold text-forest-950">
                  <Sparkles className="h-3 w-3" /> AMAMI NATURE+
                </span>
              )}
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-4 gap-2 text-center">
            {[
              ['記録', stats.total],
              ['種', `${stats.discovered}/${SPECIES.length}`],
              ['市町村', `${stats.areas.size}/12`],
              ['路上報告', stats.roadReports],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-2xl bg-white/[0.07] py-2.5">
                <div className="font-serif text-[18px] font-extrabold">{v}</div>
                <div className="text-[10px] text-washi/55">{l}</div>
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="flex items-baseline justify-between text-[11px] text-washi/60">
              <span>
                累計 <b className="text-[15px] text-gold">{points.toLocaleString()}</b> pt
              </span>
              <span>{rank.next ? `次のランクまで ${rank.next.min - points}pt` : 'MAX'}</span>
            </div>
            <ProgressBar value={rank.progress} color="#C79A2E" className="mt-1.5 bg-white/10" />
          </div>
        </div>
      </section>

      {/* ポイント */}
      <section className="mt-4 grid grid-cols-2 gap-2 px-4">
        <Link to="/rewards" className="card p-4">
          <Gift className="h-5 w-5 text-kin" />
          <div className="mt-2 text-[11px] font-bold text-ink3">交換できるポイント</div>
          <div className="font-serif text-[22px] font-extrabold">
            {balance.toLocaleString()}
            <span className="text-[12px] text-ink3"> pt</span>
          </div>
        </Link>
        <Link to="/plus" className="card relative overflow-hidden p-4">
          <Sparkles className="h-5 w-5 text-ruri" />
          <div className="mt-2 text-[11px] font-bold text-ink3">AMAMI NATURE+</div>
          <div className="text-[14px] font-bold">{plus ? `${formatDate(settings.plus!.until)}まで` : 'AI判定・限定フレーム'}</div>
        </Link>
      </section>

      {/* バッジ */}
      <section className="mt-8 px-4">
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <div className="label">BADGES</div>
            <h2 className="font-serif text-[18px] font-bold">バッジ</h2>
          </div>
          <span className="text-[12px] font-bold text-ink3">
            {badges.size}/{BADGES.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BADGES.map((b) => {
            const Icon = BADGE_ICON[b.icon];
            const got = badges.has(b.id);
            return (
              <button
                key={b.id}
                onClick={() => toast(`${b.title}：${b.description}${got ? '' : '（未獲得）'}`)}
                className="flex flex-col items-center gap-1.5 rounded-2xl p-2 active:bg-ink/5"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-full ${
                    got ? 'bg-gradient-to-br from-[#E2C46F] to-gold text-forest-950 shadow-glow' : 'border border-dashed hairline text-ink/20'
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <span className={`line-clamp-2 text-center text-[10px] font-bold leading-tight ${got ? 'text-ink' : 'text-ink3'}`}>{b.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* アカウント */}
      <section className="mt-8 px-4">
        <div className="label mb-2 px-1">ACCOUNT</div>
        {account.mode === 'line' ? (
          <div className="card flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#06C755] text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="text-[14px] font-bold">LINEで連携中</div>
              <div className="text-[11px] text-ink3">
                <Cloud className="mr-1 inline h-3 w-3" />
                記録はクラウドに保存されています{account.lastSyncAt ? `（${formatDate(account.lastSyncAt, true)} 同期）` : ''}
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#06C755] text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="text-[14px] font-bold">LINEで使うともっと便利に</div>
                <div className="text-[11px] leading-relaxed text-ink3">クラウド保存・AI判定・ポイント交換・トークで写真を送るだけで記録</div>
              </div>
            </div>
            <button
              className="btn mt-3 w-full bg-[#06C755] text-white"
              onClick={() => {
                if (LIFF_ID) void lineLogin();
                else if (ADD_FRIEND_URL) window.open(ADD_FRIEND_URL, '_blank', 'noopener');
                else toast('LINE公式アカウントは準備中です');
              }}
            >
              {LIFF_ID ? 'LINEでログイン' : 'LINE公式アカウントを友だち追加'}
            </button>
          </div>
        )}
      </section>

      {/* 設定 */}
      <section className="mt-8 px-4">
        <div className="label mb-2 px-1">SETTINGS</div>
        <div className="card p-4">
          <div className="mb-2 text-[13px] font-bold">表示モード</div>
          <Segmented<ThemePref>
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: '自動' },
              { value: 'light', label: 'ライト' },
              { value: 'dark', label: '夜の森' },
            ]}
          />
          <p className="mt-2 text-[11px] text-ink3">「夜の森」はナイトツアー中でも目にやさしい暗い表示です。</p>
        </div>
        <div className="mt-2 card divide-y divide-[var(--line)] overflow-hidden">
          <MenuRow icon={<ShieldCheck className="h-4 w-4" />} label="セーフドライブ宣言" sub="夜の林道はゆっくり。1日1回 +10pt" to="/safe-drive" />
          <MenuRow icon={<Building2 className="h-4 w-4" />} label="自治体・保護団体の方へ" sub="出現傾向・ロードキル報告のダッシュボード" to="/partners" />
          <MenuRow icon={<FileDown className="h-4 w-4" />} label="記録を書き出す" sub="写真つきのバックアップファイル（JSON）" onClick={doExport} />
          <MenuRow icon={<FileUp className="h-4 w-4" />} label="バックアップから読み込む" onClick={() => fileRef.current?.click()} />
          <MenuRow icon={<RotateCcw className="h-4 w-4" />} label="この端末のデータを消去" onClick={() => setResetSheet(true)} />
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
      </section>

      <footer className="mt-10 px-6 text-center text-[10px] leading-relaxed text-ink3">
        AMAMI NATURE β · 運営：株式会社アマリンク（Amalink）
        <br />
        図鑑データは監修前のβ版です。保護区分などは公式情報をご確認ください。
      </footer>

      <Sheet open={nameSheet} onClose={() => setNameSheet(false)} title="観察者ネーム">
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" maxLength={20} placeholder="例：しまのりす" />
        <button
          className="btn-primary mt-4 w-full"
          onClick={() => {
            updateSettings({ name: name.trim() });
            if (account.mode === 'line') void api.updateMe({ nickname: name.trim() }).catch(() => undefined);
            setNameSheet(false);
          }}
        >
          保存する
        </button>
      </Sheet>

      <Sheet open={resetSheet} onClose={() => setResetSheet(false)} title="この端末のデータを消去しますか？">
        <p className="text-[13px] leading-relaxed text-ink2">
          この端末に保存された記録・写真・設定がすべて消えます。
          {account.mode === 'line' ? 'クラウドに同期済みの記録は、次回ひらいたときに再び読み込まれます。' : '先にバックアップを書き出しておくことをおすすめします。'}
        </p>
        <div className="mt-5 grid gap-2">
          <button
            className="btn bg-danger text-white"
            onClick={async () => {
              await resetAll();
              setResetSheet(false);
              navigate('/onboarding', { replace: true });
            }}
          >
            消去する
          </button>
          <button className="btn-ghost" onClick={() => setResetSheet(false)}>
            やめる
          </button>
        </div>
      </Sheet>
    </Page>
  );
}
