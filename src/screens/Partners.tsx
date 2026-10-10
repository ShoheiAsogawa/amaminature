import { Building2, Car, KeyRound, LoaderCircle, MapPin, Table2, Users } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader, Segmented, toast } from '../components/ui';
import { AREA_BY_ID, AREAS } from '../data/areas';
import { SPECIES, SPECIES_BY_ID } from '../data/species';
import { api, errorMessage, type PartnerSummary } from '../lib/api';

// ───────── デモ用の架空データ（決定的に生成） ─────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoSummary(): PartnerSummary {
  const rnd = mulberry32(20261010);
  const weights: Record<string, number> = {
    amami: 1, tatsugo: 0.55, yamato: 0.7, uken: 0.45, setouchi: 0.6, kikai: 0.18,
    tokunoshima: 0.4, amagi: 0.35, isen: 0.25, wadomari: 0.15, china: 0.12, yoron: 0.14,
  };
  const byArea = AREAS.map((a) => {
    const sightings = Math.round(420 * weights[a.id] * (0.85 + rnd() * 0.3));
    const roadReports = ['amami', 'yamato', 'uken', 'setouchi', 'tokunoshima', 'amagi', 'tatsugo'].includes(a.id)
      ? Math.round(sightings * (0.05 + rnd() * 0.05))
      : Math.round(rnd() * 3);
    return { areaId: a.id, sightings, roadReports };
  });
  // 夜行性の生き物が多いので、夜（19〜23時）と朝（6〜9時）にピーク
  const byHour = Array.from({ length: 24 }, (_, h) => {
    const night = Math.exp(-((h - 21) ** 2) / 6) * 120;
    const morning = Math.exp(-((h - 7.5) ** 2) / 4) * 70;
    const day = h >= 9 && h <= 17 ? 30 : 0;
    return { hour: h, sightings: Math.round(night + morning + day + rnd() * 10) };
  });
  const byMonth = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const roadkill = Math.round(4 + 10 * Math.exp(-((m - 11) ** 2) / 5) + 6 * Math.exp(-((m - 1) ** 2) / 3) + rnd() * 3);
    return { month: `2026-${String(m).padStart(2, '0')}`, sightings: Math.round(150 + rnd() * 120), roadkill };
  });
  const topSpecies = ['amami-kurousagi', 'rurikakesu', 'kurosagi', 'amami-yamashigi', 'ryukyu-konohazuku', 'hikagehego'].map((id, i) => ({
    speciesId: id,
    sightings: Math.round(380 / (i + 1.4) + rnd() * 20),
  }));
  const roadReports = Array.from({ length: 6 }, (_, i) => ({
    id: `demo-${i}`,
    type: i % 3 === 0 ? 'injured' : i % 2 ? 'roadkill' : 'on-road',
    speciesId: ['amami-kurousagi', 'amami-yamashigi', 'amami-kurousagi', 'ryukyu-inoshishi', 'iboimori', 'amami-kurousagi'][i],
    areaId: ['yamato', 'amami', 'uken', 'setouchi', 'amami', 'tokunoshima'][i],
    lat: null,
    lng: null,
    observedAt: new Date(Date.now() - (i * 26 + 5) * 3600000).toISOString(),
  }));
  const total = byArea.reduce((s, a) => s + a.sightings, 0);
  return {
    partner: 'デモ表示',
    generatedAt: new Date().toISOString(),
    totals: { sightings: total, users: Math.round(total / 6.3), species: SPECIES.length - 9, roadReports: byArea.reduce((s, a) => s + a.roadReports, 0) },
    byArea,
    byHour,
    byMonth,
    topSpecies,
    roadReports,
  };
}

// ───────── 小さなチャート部品（単一系列なので凡例なし・タイトルが系列名） ─────────

function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="card p-4">
      <h3 className="text-[14px] font-bold">{title}</h3>
      {sub && <p className="mt-0.5 text-[11px] text-ink3">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 横棒：市町村別の記録数 */
function AreaBars({ data }: { data: PartnerSummary['byArea'] }) {
  const [active, setActive] = useState<string | null>(null);
  const sorted = [...data].sort((a, b) => b.sightings - a.sightings);
  const max = Math.max(1, ...sorted.map((d) => d.sightings));
  return (
    <div role="list" className="space-y-[6px]">
      {sorted.map((d) => {
        const on = active === d.areaId;
        return (
          <button
            key={d.areaId}
            role="listitem"
            onPointerEnter={() => setActive(d.areaId)}
            onPointerLeave={() => setActive(null)}
            onClick={() => setActive(on ? null : d.areaId)}
            className="relative flex w-full items-center gap-2 py-[3px] text-left"
            aria-label={`${AREA_BY_ID[d.areaId]?.name}：記録${d.sightings}件、路上レポート${d.roadReports}件`}
          >
            <span className="w-[58px] shrink-0 truncate text-[11px] font-bold text-ink2">{AREA_BY_ID[d.areaId]?.name}</span>
            <span className="relative h-[14px] flex-1">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px] transition-opacity"
                style={{ width: `${(d.sightings / max) * 86}%`, background: 'var(--chart-1)', opacity: active && !on ? 0.35 : 1 }}
              />
              <span className="absolute inset-y-0 flex items-center pl-1.5 text-[10.5px] font-bold tabular-nums text-ink2" style={{ left: `${(d.sightings / max) * 86}%` }}>
                {d.sightings.toLocaleString()}
              </span>
            </span>
            {on && (
              <span className="absolute -top-8 left-16 z-10 whitespace-nowrap rounded-lg bg-forest-900 px-2.5 py-1.5 text-[11px] font-bold text-washi shadow-lift">
                {AREA_BY_ID[d.areaId]?.name}：記録 {d.sightings.toLocaleString()} · 路上 {d.roadReports}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** 縦棒：時間帯・月別 */
function Columns({
  values,
  labels,
  color,
  unit,
  shade,
  tickEvery = 1,
}: {
  values: number[];
  labels: string[];
  color: string;
  unit: string;
  shade?: (i: number) => boolean;
  tickEvery?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const W = 320;
  const H = 120;
  const max = Math.max(1, ...values);
  const nice = Math.ceil(max / 10) * 10;
  const slot = W / values.length;
  const bar = Math.min(24, slot - 2);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full overflow-visible" role="img" aria-label={`${unit}の推移`}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={0} x2={W} y1={H - H * t} y2={H - H * t} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={W} y={H - H * t - 3} textAnchor="end" className="fill-ink3" fontSize={8}>
              {compact(Math.round(nice * t))}
            </text>
          </g>
        ))}
        {shade &&
          values.map((_, i) =>
            shade(i) ? <rect key={`s${i}`} x={i * slot} y={0} width={slot} height={H} fill="var(--chart-1)" opacity={0.05} /> : null,
          )}
        {values.map((v, i) => {
          const h = (v / nice) * H;
          const x = i * slot + (slot - bar) / 2;
          const r = Math.min(4, bar / 2, h);
          return (
            <g key={i} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} onClick={() => setActive(active === i ? null : i)}>
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              <path
                d={`M${x},${H} L${x},${H - h + r} Q${x},${H - h} ${x + r},${H - h} L${x + bar - r},${H - h} Q${x + bar},${H - h} ${x + bar},${H - h + r} L${x + bar},${H} Z`}
                fill={color}
                opacity={active !== null && active !== i ? 0.4 : 1}
              />
              {i % tickEvery === 0 && (
                <text x={i * slot + slot / 2} y={H + 12} textAnchor="middle" className="fill-ink3" fontSize={8}>
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {active !== null && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-forest-900 px-2.5 py-1.5 text-[11px] font-bold text-washi shadow-lift"
          style={{ left: `${((active + 0.5) / values.length) * 100}%` }}
        >
          {labels[active]}：{values[active].toLocaleString()}
          {unit}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink3">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-[22px] font-bold tabular-nums">{value}</div>
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = { roadkill: 'ロードキル', injured: 'けが', 'on-road': '路上' };

export default function Partners() {
  const [key, setKey] = useState('');
  const [live, setLive] = useState<PartnerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const demo = useMemo(demoSummary, []);
  const data = live ?? demo;

  const connect = async () => {
    setLoading(true);
    try {
      setLive(await api.partnerSummary(key.trim()));
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh pb-[calc(40px+var(--safe-bottom))]">
      <PageHeader back label="FOR PARTNERS" title="自治体・保護団体の方へ" />

      <section className="px-4">
        <div className="rounded-4xl bg-forest-900 p-5 text-washi">
          <Building2 className="h-7 w-7 text-gold" />
          <h2 className="mt-2 font-serif text-[19px] font-bold leading-snug">島じゅうの「出会い」と「路上の危険」を、データで見える化</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-washi/70">
            観光客・住民の記録から、生き物の出現が多い場所・時間帯、ロードキルが多い区間と季節がわかります。注意喚起の看板設置、夜間の速度対策、ガイド事業の企画などにご活用ください。
          </p>
        </div>

        {!live && (
          <div className="mt-3 rounded-2xl border border-dashed border-sango/50 bg-sango/5 p-3 text-[11.5px] font-bold leading-relaxed text-sango">
            下のグラフはデモ用の架空データです。提携先には専用キーを発行し、実データ（正確な位置を含む路上レポート）を表示します。
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="パートナーキー" className="input pl-10" type="password" autoComplete="off" />
          </div>
          <button onClick={connect} disabled={!key.trim() || loading} className="btn-primary shrink-0 px-4">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : '表示'}
          </button>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2 px-4">
        <Stat icon={<MapPin className="h-3.5 w-3.5" />} label="記録数" value={data.totals.sightings.toLocaleString()} />
        <Stat icon={<Users className="h-3.5 w-3.5" />} label="参加者" value={data.totals.users.toLocaleString()} />
        <Stat icon={<Building2 className="h-3.5 w-3.5" />} label="記録された種" value={`${data.totals.species}種`} />
        <Stat icon={<Car className="h-3.5 w-3.5" />} label="路上レポート" value={data.totals.roadReports.toLocaleString()} />
      </section>

      <div className="mt-5 px-4">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'グラフ' },
            { value: 'table', label: '表で見る' },
          ]}
        />
      </div>

      {view === 'chart' ? (
        <div className="mt-4 space-y-3 px-4">
          <ChartCard title="市町村別の記録数" sub="タップで路上レポート件数も表示">
            <AreaBars data={data.byArea} />
          </ChartCard>
          <ChartCard title="時間帯別の記録数" sub="網かけは夜間（18〜5時）。夜行性の生き物の出現が集中する時間帯">
            <Columns
              values={data.byHour.map((d) => d.sightings)}
              labels={data.byHour.map((d) => `${d.hour}時`)}
              color="var(--chart-1)"
              unit="件"
              tickEvery={3}
              shade={(i) => i >= 18 || i <= 5}
            />
          </ChartCard>
          <ChartCard title="月別のロードキル報告" sub="交通事故で死んでいた・けがをしていた生き物の報告数">
            <Columns
              values={data.byMonth.map((d) => d.roadkill)}
              labels={data.byMonth.map((d) => `${Number(d.month.slice(5))}月`)}
              color="var(--chart-2)"
              unit="件"
            />
          </ChartCard>
          <ChartCard title="よく記録される生き物">
            <ol className="space-y-1.5">
              {data.topSpecies.map((t, i) => (
                <li key={t.speciesId} className="flex items-center gap-2 text-[13px]">
                  <span className="w-5 font-latin text-[15px] italic text-ink3">{i + 1}</span>
                  <span className="flex-1 font-bold">{SPECIES_BY_ID[t.speciesId]?.name ?? t.speciesId}</span>
                  <span className="tabular-nums text-ink2">{t.sightings.toLocaleString()}件</span>
                </li>
              ))}
            </ol>
          </ChartCard>
        </div>
      ) : (
        <div className="mt-4 px-4">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 pt-4 text-[13px] font-bold">
              <Table2 className="h-4 w-4 text-ink3" /> 市町村別
            </div>
            <table className="mt-2 w-full text-[12px]">
              <thead className="text-ink3">
                <tr className="border-b hairline">
                  <th className="px-4 py-2 text-left font-bold">市町村</th>
                  <th className="px-4 py-2 text-right font-bold">記録</th>
                  <th className="px-4 py-2 text-right font-bold">路上レポート</th>
                </tr>
              </thead>
              <tbody>
                {data.byArea.map((d) => (
                  <tr key={d.areaId} className="border-b hairline last:border-0">
                    <td className="px-4 py-2 font-bold">{AREA_BY_ID[d.areaId]?.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{d.sightings.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{d.roadReports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <section className="mt-5 px-4">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 pt-4 text-[13px] font-bold">
            <Car className="h-4 w-4 text-sango" /> 最近の路上レポート
          </div>
          <ul className="mt-2 divide-y divide-[var(--line)]">
            {data.roadReports.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-[12px]">
                <span className="min-w-[60px] shrink-0 whitespace-nowrap rounded-full bg-sango/10 px-2 py-0.5 text-center text-[10px] font-bold text-sango">{TYPE_LABEL[r.type] ?? r.type}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{r.speciesId ? SPECIES_BY_ID[r.speciesId]?.name : '不明'}</span>
                  <span className="block text-[10.5px] text-ink3">
                    {r.areaId ? AREA_BY_ID[r.areaId]?.name : '地域不明'} · {new Date(r.observedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </span>
                {r.lat != null && r.lng != null ? (
                  <a className="text-[11px] font-bold text-accent" href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">
                    地図
                  </a>
                ) : (
                  <span className="text-[10px] text-ink3">{live ? '位置なし' : '位置は提携先のみ'}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 px-1 text-[10.5px] leading-relaxed text-ink3">
          正確な位置情報は、データ提供契約を結んだ行政・研究・保護機関にのみ提供します。希少種の生息地点は一般公開しません。
        </p>
      </section>
    </main>
  );
}
