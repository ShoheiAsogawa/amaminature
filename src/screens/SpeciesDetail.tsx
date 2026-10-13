import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExperienceMeta, ExperienceSheet } from '../components/ExperienceCard';
import { Stars, TYPE_META, TypeBadge } from '../components/game';
import { IconCameraFill, IconEyeSlash, IconLightbulb, IconLockSimpleFill, IconMoonStarsFill, IconWarning } from '../components/icons';
import { Prose } from '../components/Prose';
import { MonthBar, referencePhoto, SciName, SpeciesPlate, speciesNo } from '../components/SpeciesTile';
import { HIDDEN_NAME, HIDDEN_NAME_LABEL, SpeciesName } from '../components/SpeciesName';
import {
  button,
  cn,
  EmptyState,
  formatDateJa,
  Group,
  InfoRow,
  ListRow,
  Notice,
  ScreenHeader,
  SectionHeader,
  Sheet,
  useCanGoBack,
  useDocumentTitle,
} from '../components/ui';
import { AREA_BY_ID } from '../data/areas';
import { experiencesForSpecies } from '../data/experiences';
import { CATEGORY_META, SPECIES_BY_ID, SPECIES_DISCLAIMER } from '../data/species';
import type { Experience, Species } from '../data/types';
import { sfx } from '../lib/sfx';
import type { Sighting } from '../lib/types';
import { useCollection } from '../store/useCollection';
import { useStore } from '../store/useStore';

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
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 56), {
      rootMargin: '-56px 0px 0px 0px',
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
  const nameRef = useRef<HTMLHeadingElement>(null);
  const entry = sp ? collection.get(sp.id) : undefined;
  const found = !!entry;
  // まだ見つけていない種は、名前・学名・英名・図鑑の説明・シマの話を「？？？」にする（記録すると読める）。
  // 安全と保全の情報（危険、観察マナー、位置をぼかす注意）と、探すためのヒントは隠さない
  const shownName = sp ? (found ? sp.name : `No.${speciesNo(sp)} ${HIDDEN_NAME}`) : null;
  useDocumentTitle(shownName);
  // 参考写真もゲットするまでは出さない（「？」かシルエット）
  const ref = sp && found ? referencePhoto(sp) : null;
  const userPhoto = entry?.photoId ?? null;
  // 名前がヘッダーの下に隠れたら、ヘッダーに名前を出す
  const navTitleShown = useScrolledPast(nameRef, !!sp);
  const markViewed = useStore((s) => s.markViewed);
  // きょうのミッション「図鑑で 3 種しらべる」
  useEffect(() => {
    if (sp) markViewed(sp.id);
  }, [sp, markViewed]);

  const [exp, setExp] = useState<Experience | null>(null);
  const [recordsOpen, setRecordsOpen] = useState(false);

  const canGoBack = useCanGoBack();
  const back = () => (canGoBack ? navigate(-1) : navigate('/zukan'));

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

  const t = TYPE_META[sp.category];

  return (
    <main className="pb-[calc(40px+var(--safe-bottom))]">
      <ScreenHeader
        variant="nav"
        onBack={back}
        title={
          <span aria-hidden={!navTitleShown} className={cn('transition-opacity duration-150', navTitleShown ? 'opacity-100' : 'opacity-0')}>
            {found ? sp.name : <SpeciesName species={sp} hidden clamp={false} />}
          </span>
        }
      />

      {/* ───── ヒーロー（タイプの色の地に、写真か「？」のカード） ───── */}
      <div className={cn('relative -mt-[calc(56px+var(--safe-top))] overflow-hidden px-4 pb-6 pt-[calc(64px+var(--safe-top))]', t.soft)}>
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_55%,rgb(255_255_255/.65),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_55%,rgb(255_255_255/.08),transparent_70%)]" />
        <div className="relative mx-auto w-[min(240px,64vw)]">
          <div className={cn('rounded-xl border-4 bg-surface p-1.5 shadow-[0_6px_0_rgb(0_0_0/.15)]', found ? t.border : sp.rarity === 4 ? 'border-gold' : 'border-line')}>
            <SpeciesPlate
              species={sp}
              photoId={userPhoto}
              discovered={found}
              showReference={found}
              photoSize="full"
              patternSize="large"
              alt={found ? sp.name : HIDDEN_NAME_LABEL}
              className={cn('aspect-square w-full rounded-[18px]', found && sp.rarity >= 3 && 'shine')}
            />
          </div>
          {found ? (
            <span className="num absolute -right-4 -top-3 rotate-12 rounded-full border-[3px] border-white bg-xp px-3 py-0.5 text-[18px] text-[#0b3d22] shadow-[0_3px_0_rgb(var(--c-xp-edge))]">
              GET!
            </span>
          ) : (
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-line bg-surface px-3 py-1 text-caption text-fg-2 shadow-pop-sm">
              まだ出会っていない
            </span>
          )}
        </div>
        {credit && <p className="relative mt-3 text-center text-caption text-fg-3">© {credit}</p>}
      </div>

      {/* ───── 名前 ───── */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <span className={cn('num text-[20px] leading-6', t.text)}>No.{speciesNo(sp)}</span>
          <Stars rarity={sp.rarity} size={18} withLabel />
        </div>
        <h1 ref={nameRef} className={cn('mt-1 text-display', found ? 'text-fg' : 'text-fg-3')}>
          <SpeciesName species={sp} hidden={!found} />
        </h1>
        <p className="mt-0.5">
          {found ? (
            <SciName sci={sp.sci} className="text-callout" />
          ) : (
            <span className="text-callout font-bold text-fg-3">ゲットすると、名前と説明がわかるよ</span>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {/* 毒のある種は、名前が「？？？」でも最初に危険がわかるように、チップの先頭に出す（詳しい注意は下の Notice） */}
          {sp.danger && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-danger px-2.5 text-caption text-on-danger">
              <IconWarning size={14} aria-hidden />
              毒あり・近づかない
            </span>
          )}
          <TypeBadge category={sp.category} />
          {sp.endemic && (
            <span className="inline-flex h-7 items-center rounded-full bg-gold px-2.5 text-caption text-[#3d2a00]">
              {sp.endemic === 'species' ? '固有種' : '固有亜種'}
            </span>
          )}
          {sp.nocturnal && (
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-night px-2.5 text-caption text-white">
              <IconMoonStarsFill size={13} aria-hidden />
              夜行性
            </span>
          )}
          {sp.protection?.some((p) => p.includes('天然記念物')) && (
            <span className="inline-flex h-7 items-center rounded-full border-2 border-capture/40 bg-surface px-2.5 text-caption text-danger">
              {sp.protection.find((p) => p.includes('特別天然記念物')) ? '特別天然記念物' : '天然記念物'}
            </span>
          )}
        </div>
        <Link to={`/capture?species=${sp.id}`} onClick={() => sfx('tap')} className={cn(button({ variant: 'capture', size: 'lg' }), 'mt-5')}>
          <IconCameraFill size={22} />
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
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-2">
            {records.map((s) => (
              <RecordTile key={s.id} sighting={s} species={sp} />
            ))}
          </div>
        </>
      )}

      {/* ───── 解説（どんな生き物か → いつ・どう探すか → 項目の一覧） ───── */}
      <SectionHeader
        title={
          <>
            どんな生き物<span className="[font-feature-settings:normal]">？</span>
          </>
        }
      />
      {found ? (
        <div className="panel mx-4 px-4 py-3.5">
          <p className="text-body font-bold text-fg">
            <Prose text={sp.description} />
          </p>
        </div>
      ) : (
        <LockedEntry />
      )}

      <SectionHeader title="見られる季節" />
      <div className="panel mx-4 px-3 pb-2.5 pt-3">
        <MonthBar months={sp.months} highlight={month} />
      </div>

      <SectionHeader title="さがしかたのコツ" />
      <div className="mx-4 flex gap-3 rounded-md border-2 border-gold/60 bg-gold-soft/70 p-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-[#3d2a00]">
          <IconLightbulb size={20} />
        </span>
        <p className="min-w-0 flex-1 pt-1 text-body font-bold text-fg">
          <Prose text={sp.tip} />
        </p>
      </div>

      <Group className="mt-8">
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
        <InfoRow label="英名">
          {found ? (
            sp.en
          ) : (
            <>
              <span aria-hidden>{HIDDEN_NAME}</span>
              <span className="sr-only">ゲットするとわかります</span>
            </>
          )}
        </InfoRow>
      </Group>

      {sp.manner && (
        <>
          <SectionHeader title="観察マナー" />
          <div className="panel mx-4 px-4 py-3.5">
            <p className="text-body font-bold text-fg">
              <Prose text={sp.manner} />
            </p>
          </div>
        </>
      )}

      {sp.culture && found && (
        <>
          <SectionHeader title="シマの話" />
          <div className="panel mx-4 px-4 py-3.5">
            <p className="text-body font-bold text-fg">
              <Prose text={sp.culture} />
            </p>
          </div>
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

      <p className="mt-8 px-4 text-sub text-fg-3">{SPECIES_DISCLAIMER}</p>

      <ExperienceSheet exp={exp} onClose={() => setExp(null)} />

      <Sheet open={recordsOpen} onClose={() => setRecordsOpen(false)} title="あなたの記録" snapPoints={[0.55, 1]}>
        <div className="-mx-4">
          {records.map((s) => (
            <ListRow
              key={s.id}
              to={`/sighting/${s.id}`}
              onClick={() => setRecordsOpen(false)}
              leading={<SpeciesPlate species={sp} photoId={s.photoId} patternSize="thumb" className="h-14 w-14 shrink-0 rounded-xs" />}
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

/** まだ見つけていない種の図鑑の説明（鍵のかかったパネル）。説明の長さに合わせた伏せ字の帯を 3 本 */
function LockedEntry() {
  return (
    <div className="panel relative mx-4 overflow-hidden px-4 py-3.5">
      <div aria-hidden className="space-y-2.5 py-1 blur-[1px]">
        <span className="block h-3.5 w-[92%] rounded-full bg-fill-strong" />
        <span className="block h-3.5 w-[78%] rounded-full bg-fill-strong" />
        <span className="block h-3.5 w-[56%] rounded-full bg-fill-strong" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/60">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-night text-gold">
          <IconLockSimpleFill size={18} />
        </span>
        <span className="text-sub font-black text-fg-2">ゲットすると読めるよ</span>
      </div>
    </div>
  );
}

/** あなたの記録の 1 枚（104 のカード）。下にニックネームと日付 */
function RecordTile({ sighting: s, species }: { sighting: Sighting; species: Species }) {
  const date = shortDate(s.observedAt);
  return (
    <Link
      to={`/sighting/${s.id}`}
      aria-label={`${s.nickname || species.name}、${date}`}
      className={cn('pressable block w-[112px] shrink-0 select-none rounded-md border-2 bg-surface p-1.5 shadow-pop-sm', TYPE_META[species.category].border)}
    >
      <SpeciesPlate species={species} photoId={s.photoId} className="aspect-square w-full rounded-[10px]" />
      <span aria-hidden className="mt-1 block px-0.5">
        {s.nickname && <span className="block truncate text-tile text-fg">{s.nickname}</span>}
        <span className="num block text-[12px] text-fg-2">{date}</span>
      </span>
    </Link>
  );
}
