import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SpeciesTile } from '../components/SpeciesTile';
import { CategoryIcon, EmptyState, Page, PageHeader, ProgressBar } from '../components/ui';
import { CATEGORY_META, CATEGORY_ORDER, SPECIES, searchSpecies } from '../data/species';
import type { Category } from '../data/types';
import { useCollection } from '../store/useCollection';

type Filter = 'all' | 'found' | 'missing';

export default function Zukan() {
  const [params, setParams] = useSearchParams();
  const category = (params.get('c') as Category | null) ?? null;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const collection = useCollection();

  const list = useMemo(() => {
    return searchSpecies(query).filter((s) => {
      if (category && s.category !== category) return false;
      if (filter === 'found' && !collection.has(s.id)) return false;
      if (filter === 'missing' && collection.has(s.id)) return false;
      return true;
    });
  }, [query, category, filter, collection]);

  const scoped = category ? SPECIES.filter((s) => s.category === category) : SPECIES;
  const foundInScope = scoped.filter((s) => collection.has(s.id)).length;

  const setCategory = (c: Category | null) => {
    const next = new URLSearchParams(params);
    if (c) next.set('c', c);
    else next.delete('c');
    setParams(next, { replace: true });
  };

  return (
    <Page>
      <PageHeader label="FIELD GUIDE" title="奄美いきもの図鑑" />

      <div className="px-4">
        <div className="card p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="label">{category ? CATEGORY_META[category].label : 'すべての生き物'}</div>
              <div className="mt-1 font-serif text-[26px] font-extrabold leading-none">
                {foundInScope}
                <span className="ml-1 text-[14px] font-bold text-ink3">/ {scoped.length} 種</span>
              </div>
            </div>
            <div className="text-right text-[12px] font-bold text-accent">
              {Math.round((foundInScope / Math.max(1, scoped.length)) * 100)}%
            </div>
          </div>
          <ProgressBar value={foundInScope / Math.max(1, scoped.length)} className="mt-3" />
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・学名で探す（例：るりかけす）"
            className="input pl-10"
            inputMode="search"
            aria-label="図鑑を検索"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-ink/10"
              aria-label="検索をクリア"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`chip shrink-0 py-1.5 ${!category ? 'border-transparent bg-primary text-onprimary' : ''}`}
        >
          すべて
        </button>
        {CATEGORY_ORDER.map((c) => {
          const total = SPECIES.filter((s) => s.category === c).length;
          const found = SPECIES.filter((s) => s.category === c && collection.has(s.id)).length;
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(active ? null : c)}
              className={`chip shrink-0 py-1.5 ${active ? 'border-transparent bg-primary text-onprimary' : ''}`}
            >
              <CategoryIcon category={c} className="h-3.5 w-3.5" strokeWidth={2} />
              {CATEGORY_META[c].short}
              <span className={active ? 'text-onprimary/70' : 'text-ink3'}>
                {found}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex gap-4 px-5 text-[12px] font-bold">
        {(
          [
            ['all', 'すべて'],
            ['found', '記録済み'],
            ['missing', '未発見'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`border-b-2 py-1.5 transition ${filter === v ? 'border-accent text-ink' : 'border-transparent text-ink3'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Search} title="見つかりませんでした" body="ひらがなやカタカナ、学名でも探せます。" />
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2.5 px-4">
          {list.map((s, i) => {
            const entry = collection.get(s.id);
            return (
              <SpeciesTile
                key={s.id}
                species={s}
                discovered={!!entry}
                count={entry?.count ?? 0}
                photoId={entry?.photoId}
                index={i}
              />
            );
          })}
        </div>
      )}
    </Page>
  );
}
