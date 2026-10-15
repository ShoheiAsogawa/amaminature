import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { IconCircleNotch, IconMapPin } from '../components/icons';
import { SpeciesName } from '../components/SpeciesName';
import {
  Button,
  button,
  cn,
  formatDateJa,
  Group,
  InfoRow,
  Input,
  ListRow,
  Notice,
  ScreenHeader,
  SectionHeader,
  Segmented,
  Sheet,
  toast,
} from '../components/ui';
import { AREA_BY_ID, AREAS } from '../data/areas';
import { SPECIES, SPECIES_BY_ID } from '../data/species';
import { api, ApiError, errorMessage, type PartnerSummary } from '../lib/api';

// 自治体・保護団体の方へ（docs/DESIGN_SYSTEM.md §8.12、列幅は最大 960px）。
// グラフは 1 系列 1 色（凡例なし。見出しが系列名）、系列 1（記録）= --chart-1、系列 2（ロードキル）= --chart-2。
// 補助線は --chart-grid、軸ラベルは 12px の fg-2。値は棒の先と表で読めるので、ツールチップは補助。

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

// ───────── 書式 ─────────

const fmt = (n: number) => n.toLocaleString('ja-JP');

/** 目盛りの数字（1万以上は「1.2万」） */
function tick(n: number) {
  return n >= 10000 ? `${Number((n / 10000).toFixed(1))}万` : fmt(n);
}

/** 縦軸の上端（0・半分・上端の 3 本の補助線が切りのよい数になるように） */
function niceMax(v: number) {
  if (v <= 2) return 2;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
  return m * p;
}

const areaName = (id: string | null) => (id ? (AREA_BY_ID[id]?.name ?? id) : '地域不明');

/** 夜間の帯（§2.8。index.css の --chart-band は、グラフのグループ（fill）の上で見える fill-strong） */
const BAND = 'var(--chart-band)';

// ───────── ツールチップ（値が先、名前が後） ─────────

type TipRow = { value: number; unit: string; label: string };

function Tip({ rows, style, className }: { rows: TipRow[]; style?: CSSProperties; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'px-toast pointer-events-none absolute z-10 flex flex-col whitespace-nowrap px-2 py-0.5 text-sub text-toast-fg',
        className,
      )}
      style={style}
    >
      {rows.map((r) => (
        <span key={r.label}>
          <span className="num font-semibold">{fmt(r.value)}</span>
          {r.unit}
          <span className="ml-2 opacity-80">{r.label}</span>
        </span>
      ))}
    </span>
  );
}

/** マウスを重ねた時とキーボードで選んだ時だけツールチップを出す（タッチの押下では出さない） */
function hoverHandlers(set: () => void, clear: () => void) {
  return {
    onPointerEnter: (e: { pointerType: string }) => {
      if (e.pointerType === 'mouse') set();
    },
    onPointerLeave: clear,
    onFocus: (e: { currentTarget: HTMLElement }) => {
      if (e.currentTarget.matches(':focus-visible')) set();
    },
    onBlur: clear,
  };
}

// ───────── 横棒（多い順） ─────────

type HBarDatum = { id: string; label: ReactNode; value: number; aria: string; tip: TipRow[] };

function HBars({
  data,
  color,
  labelWidth,
  onSelect,
}: {
  data: HBarDatum[];
  color: string;
  /** 項目名の列の幅（px） */
  labelWidth: number;
  /** 押した時（省くと、押すたびにツールチップを出し入れする） */
  onSelect?: (id: string) => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="relative">
      {/* 棒の基線 */}
      <span aria-hidden className="absolute inset-y-0 w-px" style={{ left: labelWidth + 12, background: 'var(--chart-grid)' }} />
      <ul className="relative flex flex-col gap-1">
        {data.map((d, i) => {
          const on = active === d.id;
          const below = i < data.length - 2;
          return (
            <li key={d.id} className="relative">
              <button
                type="button"
                aria-label={d.aria}
                onClick={() => (onSelect ? onSelect(d.id) : setActive(on ? null : d.id))}
                {...hoverHandlers(
                  () => setActive(d.id),
                  () => setActive((cur) => (cur === d.id ? null : cur)),
                )}
                className="flex min-h-8 w-full items-center gap-3 text-left"
              >
                <span className="shrink-0 text-caption text-fg-2" style={{ width: labelWidth }}>
                  {d.label}
                </span>
                <span className="flex min-w-0 flex-1 items-center transition-opacity" style={{ opacity: active && !on ? 0.4 : 1 }}>
                  <span className="h-3 shrink-0" style={{ width: `${(d.value / max) * 80}%`, background: color }} />
                  <span className="num ml-2 shrink-0 text-caption text-fg-2">{fmt(d.value)}</span>
                </span>
              </button>
              {on && <Tip rows={d.tip} style={{ left: labelWidth + 12, ...(below ? { top: '100%' } : { bottom: '100%' }) }} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ───────── 縦棒（時間帯・月） ─────────

const PLOT_H = 120;
const GUTTER = 40;

function Columns({
  values,
  labels,
  axisLabels,
  tickEvery = 1,
  color,
  unit,
  band,
}: {
  values: number[];
  /** ツールチップと読み上げに使う名前（21時、10月） */
  labels: string[];
  /** 横軸に出すラベル（省くと labels） */
  axisLabels?: ReactNode[];
  /** 横軸のラベルを何本おきに出すか */
  tickEvery?: number;
  color: string;
  unit: string;
  /** 夜間の帯をかける列 */
  band?: (i: number) => boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = niceMax(Math.max(0, ...values));
  const n = values.length;
  const peak = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
  const axis = axisLabels ?? labels;

  // ツールチップの位置（棒の上。端の列では内側に寄せて、グループの端で切れないようにする）
  let tipStyle: CSSProperties | undefined;
  if (active !== null) {
    const x = (active + 0.5) / n;
    const h = (values[active] / top) * PLOT_H;
    tipStyle = {
      left: `${x * 100}%`,
      bottom: Math.min(h + 6, PLOT_H - 8),
      transform: x < 0.2 ? 'translateX(-12px)' : x > 0.8 ? 'translateX(calc(-100% + 12px))' : 'translateX(-50%)',
    };
  }

  return (
    <div>
      <div className="relative mt-5" style={{ height: PLOT_H, marginLeft: GUTTER }}>
        {band && (
          <div aria-hidden className="absolute inset-0 flex">
            {values.map((_, i) => (
              <span key={i} className="h-full min-w-0 flex-1" style={band(i) ? { background: BAND } : undefined} />
            ))}
          </div>
        )}
        {[0, 0.5, 1].map((t) => (
          <div key={t} aria-hidden className="absolute inset-x-0 h-px" style={{ bottom: `${t * 100}%`, background: 'var(--chart-grid)' }}>
            <span className="num absolute top-1/2 -translate-y-1/2 pr-2 text-right text-caption text-fg-2" style={{ right: '100%', width: GUTTER }}>
              {tick(top * t)}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 flex">
          {values.map((v, i) => {
            const h = (v / top) * 100;
            return (
              <button
                key={i}
                type="button"
                aria-label={`${labels[i]} ${fmt(v)}${unit}`}
                onClick={() => setActive(active === i ? null : i)}
                {...hoverHandlers(
                  () => setActive(i),
                  () => setActive((cur) => (cur === i ? null : cur)),
                )}
                className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <span
                  className="block w-[72%] max-w-6 transition-opacity"
                  style={{ height: `${h}%`, background: color, opacity: active !== null && active !== i ? 0.4 : 1 }}
                />
                {/* 値を書くのは最大の 1 本だけ。ほかは目盛り・ツールチップ・表で読む */}
                {i === peak && v > 0 && (
                  <span aria-hidden className="num absolute left-1/2 -translate-x-1/2 whitespace-nowrap pb-0.5 text-caption text-fg-2" style={{ bottom: `${h}%` }}>
                    {fmt(v)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {active !== null && tipStyle && <Tip rows={[{ value: values[active], unit, label: labels[active] }]} style={tipStyle} />}
      </div>
      <div aria-hidden className="mt-1.5 flex" style={{ marginLeft: GUTTER }}>
        {axis.map((l, i) => (
          <span key={i} className="flex min-w-0 flex-1 justify-center whitespace-nowrap text-caption text-fg-2">
            {i % tickEvery === 0 ? l : null}
          </span>
        ))}
      </div>
    </div>
  );
}

// ───────── 表 ─────────

function DataTable({ caption, head, numeric, rows }: { caption: string; head: string[]; numeric: boolean[]; rows: ReactNode[][] }) {
  return (
    <div className="pl-4">
      <table className="w-full border-collapse text-callout">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={cn('border-b border-sep py-2.5 pr-4 text-sub font-normal text-fg-2', numeric[i] ? 'text-right' : 'text-left')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="[&:last-child>td]:border-b-0">
              {r.map((c, ci) => (
                <td key={ci} className={cn('border-b border-sep py-2.5 pr-4 text-fg', numeric[ci] ? 'num text-right' : 'text-left')}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ───────── 路上レポート ─────────

const REPORT_TYPE: Record<string, { label: string; dot: string }> = {
  roadkill: { label: 'ロードキル', dot: 'bg-danger' },
  injured: { label: 'けが', dot: 'bg-warning' },
  'on-road': { label: '路上にいた', dot: 'bg-success' },
};

/** 状態は 6px の点と文字（ピル型にしない） */
function ReportType({ type }: { type: string }) {
  const t = REPORT_TYPE[type] ?? { label: type, dot: 'bg-fg-3' };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0', t.dot)} />
      {t.label}
    </span>
  );
}

function ReportRow({ r, live }: { r: PartnerSummary['roadReports'][number]; live: boolean }) {
  const sp = r.speciesId ? SPECIES_BY_ID[r.speciesId] : undefined;
  const hasPos = r.lat != null && r.lng != null;
  return (
    <ListRow
      title={sp ? <SpeciesName species={sp} /> : '種類不明'}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3">
          <ReportType type={r.type} />
          <span>{areaName(r.areaId)}</span>
          <span>{formatDateJa(r.observedAt, { time: true, year: false })}</span>
        </span>
      }
      trailing={
        hasPos ? (
          <a
            href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
            target="_blank"
            rel="noreferrer"
            className={cn(button({ variant: 'text', size: 'hit' }), '-my-2 gap-1')}
          >
            <IconMapPin size={16} className="shrink-0" />
            地図
          </a>
        ) : live ? (
          <span className="shrink-0 text-caption text-fg-3">位置なし</span>
        ) : null
      }
    />
  );
}

// ───────── 画面 ─────────

type View = 'chart' | 'table';

export default function Partners() {
  const [view, setView] = useState<View>('chart');
  const [live, setLive] = useState<PartnerSummary | null>(null);
  const [keyOpen, setKeyOpen] = useState(false);
  const [areaId, setAreaId] = useState<string | null>(null);
  const demo = useMemo(demoSummary, []);
  const data = live ?? demo;

  return (
    <main className="min-h-dvh pb-[calc(40px+var(--safe-bottom))]">
      <ScreenHeader variant="nav" title="自治体・保護団体の方へ" />

      <div className="flex items-center gap-3 px-4 pt-4">
        <h2 className="min-w-0 flex-1 text-title text-fg">ダッシュボード</h2>
        <Segmented<View>
          aria-label="表示の形式"
          className="w-40 shrink-0"
          value={view}
          onChange={setView}
          options={[
            { value: 'chart', label: 'グラフ' },
            { value: 'table', label: '表' },
          ]}
        />
      </div>
      <p className="mt-2 max-w-[640px] px-4 text-body text-fg-2">
        観光客と島民の記録から、生き物がよく見られる場所と時間帯、ロードキルが多い地域と季節がわかります。注意喚起の看板設置、夜間の速度対策、ガイド事業の企画などにご活用ください。
      </p>

      {live ? (
        <Notice className="mt-4">
          <>
            {live.partner}のデータを表示しています。{formatDateJa(live.generatedAt, { time: true })}時点の集計です。
          </>
        </Notice>
      ) : (
        <Notice
          boxed
          className="mt-4"
          action={
            <Button variant="text" size="hit" onClick={() => setKeyOpen(true)}>
              キーを入力
            </Button>
          }
        >
          デモデータを表示しています
        </Notice>
      )}

      <Kpis totals={data.totals} />

      {view === 'chart' ? <Charts data={data} onSelectArea={setAreaId} /> : <Tables data={data} />}

      <SectionHeader title="最近の路上レポート" />
      {data.roadReports.length ? (
        <div>
          {data.roadReports.map((r) => (
            <ReportRow key={r.id} r={r} live={!!live} />
          ))}
        </div>
      ) : (
        <p className="px-4 text-callout text-fg-2">路上レポートはまだありません</p>
      )}
      <Notice className="mt-4">
        <>正確な位置は、データ提供契約を結んだ行政・研究・保護機関にだけ提供します。希少種の生息地点は一般に公開しません。</>
      </Notice>

      <KeySheet open={keyOpen} onClose={() => setKeyOpen(false)} onLoaded={setLive} />
      <AreaSheet areaId={areaId} data={data} live={!!live} onClose={() => setAreaId(null)} />
    </main>
  );
}

/** KPI（2×2、640px 以上は 4×1）。ラベル sub fg-2、値 num-kpi。ロードキルの値も fg（数字を赤くしない） */
function Kpis({ totals }: { totals: PartnerSummary['totals'] }) {
  const items = [
    { label: '記録数', value: totals.sightings },
    { label: '路上レポート', value: totals.roadReports },
    { label: '参加者', value: totals.users },
    { label: '記録された種', value: totals.species },
  ];
  return (
    <Group className="mt-6">
      {/* 区切りの線は、格子の地（sep）を 1px のすき間から見せる。パネルの面はドット絵の枠が塗るので、地は内側の格子に敷く */}
      <div className="grid grid-cols-2 gap-px bg-sep sm:grid-cols-4">
        {items.map((k) => (
          <div key={k.label} className="bg-fill px-4 pb-3.5 pt-3">
            <div className="text-sub text-fg-2">{k.label}</div>
            <div className="num mt-1 text-num-kpi text-fg">{fmt(k.value)}</div>
          </div>
        ))}
      </div>
    </Group>
  );
}

function Charts({ data, onSelectArea }: { data: PartnerSummary; onSelectArea: (id: string) => void }) {
  const areas: HBarDatum[] = [...data.byArea]
    .sort((a, b) => b.sightings - a.sightings)
    .map((d) => {
      const name = areaName(d.areaId);
      return {
        id: d.areaId,
        label: name,
        value: d.sightings,
        aria: `${name}　記録${fmt(d.sightings)}件、路上レポート${fmt(d.roadReports)}件。押すと路上レポートを表示`,
        tip: [
          { value: d.sightings, unit: '件', label: '記録' },
          { value: d.roadReports, unit: '件', label: '路上レポート' },
        ],
      };
    });
  const species: HBarDatum[] = data.topSpecies.map((t) => {
    const sp = SPECIES_BY_ID[t.speciesId];
    const name = sp?.name ?? t.speciesId;
    return {
      id: t.speciesId,
      label: sp ? <SpeciesName species={sp} /> : name,
      value: t.sightings,
      aria: `${name}　記録${fmt(t.sightings)}件`,
      tip: [{ value: t.sightings, unit: '件', label: '記録' }],
    };
  });
  const months = data.byMonth.map((d) => Number(d.month.slice(5)));

  return (
    <>
      <SectionHeader title="市町村別の記録" note="多い順。押すとその市町村の路上レポートを表示します" />
      <Group boxClassName="p-3">
        <HBars data={areas} color="var(--chart-1)" labelWidth={56} onSelect={onSelectArea} />
      </Group>

      <div className="md:grid md:grid-cols-2">
        <div>
          <SectionHeader title="時間帯別の記録" note="網かけは夜間（18時〜翌5時）" />
          <Group boxClassName="p-3">
            <Columns
              values={data.byHour.map((d) => d.sightings)}
              labels={data.byHour.map((d) => `${d.hour}時`)}
              tickEvery={3}
              color="var(--chart-1)"
              unit="件"
              band={(i) => i >= 18 || i <= 5}
            />
          </Group>
        </div>
        <div>
          <SectionHeader title="月別のロードキル報告" note="事故で死んでいた、またはけがをしていた生き物" />
          <Group boxClassName="p-3">
            <Columns
              values={data.byMonth.map((d) => d.roadkill)}
              labels={months.map((m) => `${m}月`)}
              axisLabels={months.map((m) => (
                <span key={m}>
                  <span className="num">{m}</span>
                  <span className="hidden sm:inline">月</span>
                </span>
              ))}
              color="var(--chart-2)"
              unit="件"
            />
          </Group>
        </div>
      </div>

      <SectionHeader title="よく記録される生き物" />
      <Group boxClassName="p-3">
        <HBars data={species} color="var(--chart-1)" labelWidth={116} />
      </Group>
    </>
  );
}

function Tables({ data }: { data: PartnerSummary }) {
  return (
    <>
      <SectionHeader title="市町村別の記録" />
      <Group>
        <DataTable
          caption="市町村別の記録と路上レポート"
          head={['市町村', '記録', '路上レポート']}
          numeric={[false, true, true]}
          rows={data.byArea.map((d) => [areaName(d.areaId), fmt(d.sightings), fmt(d.roadReports)])}
        />
      </Group>

      <div className="md:grid md:grid-cols-2">
        <div>
          <SectionHeader title="時間帯別の記録" />
          <Group>
            <DataTable
              caption="時間帯別の記録"
              head={['時間帯', '記録']}
              numeric={[false, true]}
              rows={data.byHour.map((d) => [`${d.hour}時台`, fmt(d.sightings)])}
            />
          </Group>
        </div>
        <div>
          <SectionHeader title="月別の記録とロードキル報告" />
          <Group>
            <DataTable
              caption="月別の記録とロードキル報告"
              head={['月', '記録', 'ロードキル']}
              numeric={[false, true, true]}
              rows={data.byMonth.map((d) => [`${d.month.slice(0, 4)}年${Number(d.month.slice(5))}月`, fmt(d.sightings), fmt(d.roadkill)])}
            />
          </Group>
        </div>
      </div>

      <SectionHeader title="よく記録される生き物" />
      <Group>
        <DataTable
          caption="よく記録される生き物"
          head={['順位', '生き物', '記録']}
          numeric={[true, false, true]}
          rows={data.topSpecies.map((t, i) => {
            const sp = SPECIES_BY_ID[t.speciesId];
            return [i + 1, sp ? <SpeciesName species={sp} /> : t.speciesId, fmt(t.sightings)];
          })}
        />
      </Group>
    </>
  );
}

/** キーで読み込めなかった時の文言（何が起きたかと直し方。API の共通文言は利用者のログイン向けなので言い換える） */
function keyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'offline') return err.message;
    if (err.status === 401 || err.status === 403) return 'キーを確認できませんでした。発行されたキーをもう一度入力してください';
    return 'データを読み込めませんでした。時間をおいて、もう一度表示してください';
  }
  return errorMessage(err);
}

/** パートナーキーの入力（入力欄と［表示する］だけ） */
function KeySheet({ open, onClose, onLoaded }: { open: boolean; onClose: () => void; onLoaded: (s: PartnerSummary) => void }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!key.trim() || loading) return;
    setLoading(true);
    try {
      const summary = await api.partnerSummary(key.trim());
      onLoaded(summary);
      onClose();
      toast.success('データを表示しました');
    } catch (err) {
      toast.error(keyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="パートナーキー" keyboard>
      <form onSubmit={submit}>
        <p className="text-body text-fg-2">いま表示しているのはデモ用の架空データです。提携先に発行したキーを入力すると、正確な位置を含む実データを表示します。</p>
        <Input
          className="mt-4"
          type="password"
          autoComplete="off"
          enterKeyHint="go"
          placeholder="パートナーキー"
          aria-label="パートナーキー"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <Button type="submit" className="mt-4" disabled={!key.trim() || loading} aria-busy={loading}>
          {loading ? (
            <>
              <IconCircleNotch size={20} className="shrink-0 animate-spin" />
              <span className="sr-only">読み込み中</span>
            </>
          ) : (
            '表示する'
          )}
        </Button>
      </form>
    </Sheet>
  );
}

/** 市町村の棒を押した時のシート（記録数、路上レポートの件数、その市町村の最近の路上レポート） */
function AreaSheet({ areaId, data, live, onClose }: { areaId: string | null; data: PartnerSummary; live: boolean; onClose: () => void }) {
  // 閉じるアニメーションの間も中身を残す
  const [shown, setShown] = useState(areaId);
  useEffect(() => {
    if (areaId) setShown(areaId);
  }, [areaId]);
  const id = areaId ?? shown;
  const row = id ? data.byArea.find((d) => d.areaId === id) : undefined;
  const reports = id ? data.roadReports.filter((r) => r.areaId === id) : [];

  return (
    <Sheet open={!!areaId} onClose={onClose} title={id ? `${areaName(id)}の路上レポート` : undefined}>
      {row && (
        <div className="-mx-4">
          <Group>
            <InfoRow label="記録">
              <span className="num">{fmt(row.sightings)}</span>件
            </InfoRow>
            <InfoRow label="路上レポート">
              <span className="num">{fmt(row.roadReports)}</span>件
            </InfoRow>
          </Group>
          <h3 className="mt-6 px-4 text-headline text-fg">最近の路上レポート</h3>
          {reports.length ? (
            <div className="mt-1">
              {reports.map((r) => (
                <ReportRow key={r.id} r={r} live={live} />
              ))}
            </div>
          ) : (
            <p className="mt-1 px-4 text-callout text-fg-2">最近の路上レポートはありません</p>
          )}
        </div>
      )}
    </Sheet>
  );
}
