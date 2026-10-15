import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ring, Sparkles, TYPE_META } from '../components/game';
import { IconSlidersHorizontal } from '../components/icons';
import { SpeciesGrid, SpeciesTile } from '../components/SpeciesTile';
import {
  Button,
  Chip,
  ChipRow,
  cn,
  EmptyState,
  Group,
  HeaderButton,
  ListRow,
  Page,
  RadioMark,
  ScreenHeader,
  SearchField,
  Segmented,
  Sheet,
} from '../components/ui';
import { CATEGORY_META, CATEGORY_ORDER, SPECIES, searchZukan } from '../data/species';
import type { Category } from '../data/types';
import { useCollection, type CollectionEntry } from '../store/useCollection';

// 図鑑（docs/DESIGN_SYSTEM.md §8.2）
// 発見状態と並び順はフィルターのシートで選ぶ。カテゴリ（c）・発見状態（f）・並び順（s）は URL に持たせ、
// 種詳細から戻っても条件が残るようにする。

type Status = 'all' | 'found' | 'missing';
type Sort = 'no' | 'rarity' | 'recent';

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'found', label: '記録済み' },
  { value: 'missing', label: '未発見' },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'no', label: '番号順' },
  { value: 'rarity', label: 'レア度順' },
  { value: 'recent', label: '最近記録した順' },
];

const STATUS_LABEL: Record<Status, string> = { all: 'すべて', found: '記録済み', missing: '未発見' };

const CATEGORIES = new Set<string>(CATEGORY_ORDER);

/**
 * 選んでいるタイプのチップの枠（タイプの色の面のドット絵の枠）。枠は絵なので、色ごとのクラス名をそのまま書く。
 * pixel-frames.css では px-type-* が px-chip-on より後にあるので、Chip の selected の枠より優先される
 */
const TYPE_CHIP: Record<Category, string> = {
  mammal: 'px-type-mammal',
  bird: 'px-type-bird',
  herp: 'px-type-herp',
  insect: 'px-type-insect',
  aqua: 'px-type-aqua',
  plant: 'px-type-plant',
};
const DAY = 24 * 60 * 60 * 1000;

/** その種を最後に記録した時刻（ms）。24 時間以内なら番号の後ろに点を付け、「最近記録した順」にも使う */
function lastRecordedAt(entry: CollectionEntry | undefined): number {
  if (!entry) return 0;
  let t = 0;
  for (const s of entry.sightings) {
    const v = Date.parse(s.createdAt || s.observedAt);
    if (Number.isFinite(v) && v > t) t = v;
  }
  return t;
}

export default function Zukan() {
  const [params, setParams] = useSearchParams();
  const rawC = params.get('c');
  const category = rawC && CATEGORIES.has(rawC) ? (rawC as Category) : null;
  const rawF = params.get('f');
  const status: Status = rawF === 'found' || rawF === 'missing' ? rawF : 'all';
  const rawS = params.get('s');
  const sort: Sort = rawS === 'rarity' || rawS === 'recent' ? rawS : 'no';

  const [query, setQuery] = useState('');
  const [now] = useState(() => Date.now());
  const collection = useCollection();

  const recorded = useMemo(() => {
    const m = new Map<string, number>();
    for (const [id, e] of collection) m.set(id, lastRecordedAt(e));
    return m;
  }, [collection]);

  const list = useMemo(() => {
    // 名前で探せるのはゲットした種だけ（まだ見つけていない種は「？？？」なので、No. の番号で探す）
    const filtered = searchZukan(query, new Set(collection.keys())).filter((s) => {
      if (category && s.category !== category) return false;
      if (status === 'found' && !collection.has(s.id)) return false;
      if (status === 'missing' && collection.has(s.id)) return false;
      return true;
    });
    if (sort === 'rarity') return [...filtered].sort((a, b) => b.rarity - a.rarity || a.no - b.no);
    if (sort === 'recent') return [...filtered].sort((a, b) => (recorded.get(b.id) ?? 0) - (recorded.get(a.id) ?? 0) || a.no - b.no);
    return filtered;
  }, [query, category, status, sort, collection, recorded]);

  const total = SPECIES.length;
  const found = SPECIES.filter((s) => collection.has(s.id)).length;
  const pct = Math.round((found / Math.max(1, total)) * 100);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const setCategory = (c: Category | null) => update({ c });
  const clearAll = () => {
    setQuery('');
    update({ c: null, f: null });
  };

  // フィルターのシート（［この条件で表示］を押すまで反映しない）
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<Status>(status);
  const [draftSort, setDraftSort] = useState<Sort>(sort);
  const openSheet = () => {
    setDraftStatus(status);
    setDraftSort(sort);
    setSheetOpen(true);
  };
  const apply = () => {
    update({ f: draftStatus === 'all' ? null : draftStatus, s: draftSort === 'no' ? null : draftSort });
    setSheetOpen(false);
  };
  const conditioned = status !== 'all' || sort !== 'no';

  // ?c=plant などで開いた時、選択中のカテゴリのチップが画面の外にあれば見える位置まで送る（最初の 1 回だけ）
  const chipsRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scroller = chipsRef.current?.firstElementChild as HTMLElement | null;
    if (!scroller || !category) return;
    const chip = scroller.children[(status !== 'all' ? 1 : 0) + 1 + CATEGORY_ORDER.indexOf(category)] as HTMLElement | undefined;
    if (chip && chip.offsetLeft + chip.offsetWidth > scroller.clientWidth - 16) scroller.scrollLeft = chip.offsetLeft - 16;
  }, []);

  return (
    <Page>
      <ScreenHeader variant="tab" title="アマミ図鑑" />
      {/* コンプ率のパネル（夜空の地にドット絵の枠 px-night） */}
      <div className="px-night relative mx-4 overflow-hidden bg-night p-3 text-white">
        <Sparkles count={4} className="opacity-60" />
        <div className="relative flex items-center gap-4">
          <Ring value={found / Math.max(1, total)} size={84} stroke={10} color="rgb(var(--c-gold))" track="rgb(255 255 255 / .15)">
            <span className="num text-[22px] leading-none">{pct}%</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-sub font-black text-white/70">ゲットした生き物</p>
            <p className="mt-0.5 leading-none">
              <span className="num text-[40px]">{found}</span>
              <span className="num text-[20px] text-white/60"> / {total}</span>
            </p>
            <p className="mt-1.5 text-caption text-gold">{found >= total ? 'コンプリート！ おめでとう！' : `コンプまで あと ${total - found} 種`}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pl-4 pr-2">
        <SearchField value={query} onChange={setQuery} placeholder="名前・No.で探す" aria-label="図鑑を検索" className="flex-1" />
        <HeaderButton
          icon={IconSlidersHorizontal}
          label={conditioned ? '表示の条件（変更あり）' : '表示の条件'}
          onClick={openSheet}
          className={cn(conditioned && 'text-brand')}
        />
      </div>

      <div ref={chipsRef}>
        <ChipRow className="mt-3 pt-0.5">
          {status !== 'all' && (
            <Chip selected removable onClick={() => update({ f: null })} aria-label={`${STATUS_LABEL[status]}の絞り込みを解除`}>
              {STATUS_LABEL[status]}
            </Chip>
          )}
          <Chip selected={!category} onClick={() => setCategory(null)}>
            すべて
          </Chip>
          {CATEGORY_ORDER.map((c) => {
            const inCat = SPECIES.filter((s) => s.category === c);
            const foundInCat = inCat.filter((s) => collection.has(s.id)).length;
            const active = category === c;
            const t = TYPE_META[c];
            return (
              <Chip
                key={c}
                selected={active}
                icon={t.icon}
                count={`${foundInCat}/${inCat.length}`}
                onClick={() => setCategory(active ? null : c)}
                className={cn(active && TYPE_CHIP[c])}
                aria-label={`${CATEGORY_META[c].label}（${foundInCat}/${inCat.length}）`}
              >
                {t.label}
              </Chip>
            );
          })}
        </ChipRow>
      </div>

      {list.length === 0 ? (
        <EmptyState
          className="mt-2"
          title="該当する生き物はいません"
          body={query ? 'ゲットした生き物は名前で、まだの生き物は No. の番号で探せます' : undefined}
          actionLabel="条件を解除"
          onAction={clearAll}
        />
      ) : (
        <SpeciesGrid className="mt-4">
          {list.map((s) => {
            const entry = collection.get(s.id);
            const at = recorded.get(s.id) ?? 0;
            return (
              <SpeciesTile
                key={s.id}
                species={s}
                discovered={!!entry}
                count={entry?.count ?? 0}
                photoId={entry?.photoId}
                isNew={!!entry && at > 0 && now - at < DAY}
              />
            );
          })}
        </SpeciesGrid>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="表示の条件">
        <p className="mb-1.5 text-sub font-black text-fg-2" id="zukan-status-label">
          表示
        </p>
        <Segmented options={STATUS_OPTIONS} value={draftStatus} onChange={setDraftStatus} aria-label="表示" />

        <p className="mb-1.5 mt-6 text-sub font-black text-fg-2" id="zukan-sort-label">
          並び順
        </p>
        <Group boxClassName="mx-0">
          <div role="radiogroup" aria-labelledby="zukan-sort-label">
            {SORT_OPTIONS.map((o) => (
              <ListRow
                key={o.value}
                role="radio"
                aria-checked={draftSort === o.value}
                leading={<RadioMark checked={draftSort === o.value} />}
                title={o.label}
                onClick={() => setDraftSort(o.value)}
              />
            ))}
          </div>
        </Group>

        <Button className="mt-6" onClick={apply}>
          この条件で表示
        </Button>
      </Sheet>
    </Page>
  );
}
