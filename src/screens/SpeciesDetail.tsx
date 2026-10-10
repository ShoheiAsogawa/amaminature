import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExperienceMeta, ExperienceSheet } from '../components/ExperienceCard';
import { IconEyeSlash } from '../components/icons';
import { MonthBar, referencePhoto, SciName, silhouetteUrl, SpeciesPlate, speciesNo } from '../components/SpeciesTile';
import { SpeciesName } from '../components/SpeciesName';
import {
  button,
  cn,
  EmptyState,
  formatDateJa,
  Group,
  InfoRow,
  ListRow,
  Notice,
  RarityGems,
  ScreenHeader,
  SectionHeader,
  Sheet,
  useDocumentTitle,
} from '../components/ui';
import { AREA_BY_ID } from '../data/areas';
import { experiencesForSpecies } from '../data/experiences';
import { CATEGORY_META, SPECIES_BY_ID } from '../data/species';
import type { Experience, Species } from '../data/types';
import type { Sighting } from '../lib/types';
import { useCollection } from '../store/useCollection';

// 種詳細（docs/DESIGN_SYSTEM.md §8.3）

/** 今年なら「10月10日」、それ以外は「2025年10月10日」 */
function shortDate(iso: string): string {
  return formatDateJa(iso, { year: new Date(iso).getFullYear() !== new Date().getFullYear() });
}

/**
 * 遷移ヘッダーのタイトルを、本文の和名（display）がヘッダーの下に隠れてから出す。
 * 画面の先頭で和名が 2 回並ばないようにする。
 */
function useScrolledPast(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 44), {
      rootMargin: '-44px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, enabled]);
  return past;
}

/** 種ごとに状態（開いているシートなど）を作り直す */
export default function SpeciesDetailRoute() {
  const { id = '' } = useParams();
  return <SpeciesDetail key={id} id={id} />;
}

function SpeciesDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const sp: Species | undefined = SPECIES_BY_ID[id];
  const collection = useCollection();
  useDocumentTitle(sp?.name);

  const nameRef = useRef<HTMLHeadingElement>(null);
  const entry = sp ? collection.get(sp.id) : undefined;
  const ref = sp ? referencePhoto(sp) : null;
  const userPhoto = entry?.photoId ?? null;
  // 写真（利用者 → 参考）もシルエットもない時はヒーローを出さず、遷移ヘッダーから始める
  const hasHero = !!sp && (!!userPhoto || !!ref || !!silhouetteUrl(sp.id));
  const navTitleShown = useScrolledPast(nameRef, !!sp && !hasHero);

  const [exp, setExp] = useState<Experience | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/zukan'));

  if (!sp) {
    return (
      <main className="pb-[calc(40px+var(--safe-bottom))]">
        <ScreenHeader variant="nav" title="図鑑" onBack={back} />
        <EmptyState title="この生き物は図鑑にありません" actionLabel="図鑑へ戻る" to="/zukan" />
      </main>
    );
  }

  const exps = experiencesForSpecies(sp.id);
  const month = new Date().getMonth() + 1;
  const records = entry?.sightings ?? [];
  const areas = [...new Set(records.map((s) => (s.areaId ? AREA_BY_ID[s.areaId]?.name : null)).filter((n): n is string => !!n))];
  const credit = !userPhoto && ref?.credit ? ref.credit : null;

  return (
    <main className="pb-[calc(40px+var(--safe-bottom))]">
      {hasHero ? (
        <>
          <ScreenHeader variant="photo" onBack={back} />
          <SpeciesPlate
            species={sp}
            photoId={userPhoto}
            showReference
            photoSize="full"
            numberSize="large"
            alt={sp.name}
            className="aspect-[4/3] w-full rounded-none"
          />
          {credit && <p className="px-4 pt-1 text-right text-caption text-fg-3">© {credit}</p>}
        </>
      ) : (
        <ScreenHeader
          variant="nav"
          onBack={back}
          title={
            <span aria-hidden={!navTitleShown} className={cn('transition-opacity duration-150', navTitleShown ? 'opacity-100' : 'opacity-0')}>
              {sp.name}
            </span>
          }
        />
      )}

      {/* ───── 名前 ───── */}
      <div className={cn('px-4', hasHero ? (credit ? 'pt-2' : 'pt-4') : 'pt-2')}>
        <div className="flex items-center gap-3">
          <span className="num text-caption text-fg-3">No.{speciesNo(sp)}</span>
          <RarityGems rarity={sp.rarity} withLabel />
        </div>
        <h1 ref={nameRef} className="mt-1 text-display text-fg">
          <SpeciesName species={sp} />
        </h1>
        <p className="mt-0.5">
          <SciName sci={sp.sci} className="text-callout" />
        </p>
        <Link to={`/capture?species=${sp.id}`} className={cn(button({ variant: 'primary', size: 'lg' }), 'mt-5')}>
          この生き物を記録する
        </Link>
      </div>

      {/* ───── あなたの記録 ───── */}
      {records.length > 0 && (
        <>
          <SectionHeader
            title={
              <>
                あなたの記録
                <span className="ml-2">
                  <span className="num">{records.length}</span>件
                </span>
              </>
            }
            note={areas.length > 0 ? `${areas.join('、')}で記録` : undefined}
            onAction={records.length > 3 ? () => setRecordsOpen(true) : undefined}
          />
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
            {records.map((s) => (
              <RecordTile key={s.id} sighting={s} species={sp} />
            ))}
          </div>
        </>
      )}

      {/* ───── 解説 ───── */}
      <SectionHeader title="どんな生き物？" />
      <p className="px-4 text-body text-fg">{sp.description}</p>

      <Group className="mt-6">
        <InfoRow label="分類">{CATEGORY_META[sp.category].label}</InfoRow>
        {sp.endemic && <InfoRow label="固有性">{sp.endemic === 'species' ? '固有種' : '固有亜種'}</InfoRow>}
        {sp.protection && sp.protection.length > 0 && (
          <InfoRow label="保護">
            {sp.protection.map((p) => (
              <span key={p} className="block">
                {p}
              </span>
            ))}
          </InfoRow>
        )}
        {sp.category !== 'plant' && <InfoRow label="活動する時間">{sp.nocturnal ? '夜' : '昼'}</InfoRow>}
        <InfoRow label="生息環境">
          <span className="flex flex-wrap gap-x-3">
            {sp.habitat.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </span>
        </InfoRow>
        <InfoRow label="分布">{sp.range}</InfoRow>
        <InfoRow label="英名">{sp.en}</InfoRow>
      </Group>

      <SectionHeader title="見られる季節" />
      <div className="px-4">
        <MonthBar months={sp.months} highlight={month} />
      </div>

      <SectionHeader title="観察のコツ" />
      <p className="px-4 text-body text-fg">{sp.tip}</p>

      {sp.manner && (
        <>
          <SectionHeader title="観察マナー" />
          <p className="px-4 text-body text-fg">{sp.manner}</p>
        </>
      )}

      {sp.culture && (
        <>
          <SectionHeader title="シマの話" />
          <p className="px-4 text-body text-fg">{sp.culture}</p>
        </>
      )}

      {(sp.danger || sp.sensitive) && (
        <div className="mt-8 space-y-4">
          {sp.danger && <Notice kind="caution">{sp.danger}</Notice>}
          {sp.sensitive && (
            <Notice kind="info" icon={IconEyeSlash}>
              希少種のため位置を自動でぼかします
            </Notice>
          )}
        </div>
      )}

      {/* ───── 体験 ───── */}
      {exps.length > 0 && (
        <>
          <SectionHeader title="この生き物に会える体験" />
          <div>
            {exps.map((e) => (
              <ListRow key={e.id} title={e.title} subtitle={<ExperienceMeta exp={e} />} chevron onClick={() => setExp(e)} />
            ))}
          </div>
        </>
      )}

      <p className="mt-8 px-4 text-sub text-fg-3">解説は監修前のβ版データです。保護区分は公開前に最新の公式情報で確認します。</p>

      <ExperienceSheet exp={exp} onClose={() => setExp(null)} />

      <Sheet open={recordsOpen} onClose={() => setRecordsOpen(false)} title="あなたの記録" snapPoints={[0.55, 1]}>
        <div className="-mx-4">
          {records.map((s) => (
            <ListRow
              key={s.id}
              to={`/sighting/${s.id}`}
              onClick={() => setRecordsOpen(false)}
              leading={<SpeciesPlate species={sp} photoId={s.photoId} numberSize="tile" className="h-14 w-14 shrink-0 rounded-xs" />}
              thumbSize={56}
              title={s.nickname || sp.name}
              phrase={false}
              subtitle={
                <span className="flex flex-wrap gap-x-3">
                  <span>{formatDateJa(s.observedAt, { time: true })}</span>
                  {s.areaId && AREA_BY_ID[s.areaId] && <span>{AREA_BY_ID[s.areaId].name}</span>}
                </span>
              }
              chevron
            />
          ))}
        </div>
      </Sheet>
    </main>
  );
}

/** あなたの記録の 1 枚（96、rounded-xs）。下にニックネーム（sub）と日付（caption） */
function RecordTile({ sighting: s, species }: { sighting: Sighting; species: Species }) {
  const date = shortDate(s.observedAt);
  return (
    <Link
      to={`/sighting/${s.id}`}
      aria-label={`${s.nickname || species.name}、${date}`}
      className="block w-24 shrink-0 select-none active:opacity-[.72]"
    >
      <SpeciesPlate species={species} photoId={s.photoId} className="h-24 w-24 rounded-xs" />
      <span aria-hidden className="mt-1.5 block">
        {s.nickname && <span className="block truncate text-sub text-fg">{s.nickname}</span>}
        <span className="block text-caption text-fg-2">{date}</span>
      </span>
    </Link>
  );
}
