import { motion } from 'framer-motion';
import { Camera, ChevronLeft, EyeOff, Landmark, Lightbulb, MapPin, Moon, ShieldAlert, Sparkles, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExperienceCard } from '../components/ExperienceCard';
import { PhotoImg } from '../components/PhotoImg';
import { MonthBar } from '../components/SpeciesTile';
import { CategoryIcon, EmptyState, formatDate, Kasuri, RarityGems, RARITY_COLOR } from '../components/ui';
import { AREA_BY_ID } from '../data/areas';
import { experiencesForSpecies } from '../data/experiences';
import { CATEGORY_META, RARITY_META, SPECIES_BY_ID } from '../data/species';
import { useCollection } from '../store/useCollection';

function Block({ icon, title, children, tone = 'text-accent' }: { icon: ReactNode; title: string; children: ReactNode; tone?: string }) {
  return (
    <section className="border-t hairline px-5 py-5">
      <h2 className={`mb-2 flex items-center gap-2 text-[13px] font-bold ${tone}`}>
        {icon}
        {title}
      </h2>
      <div className="text-[14.5px] leading-[1.9] text-ink">{children}</div>
    </section>
  );
}

export default function SpeciesDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const sp = SPECIES_BY_ID[id];
  const collection = useCollection();

  if (!sp) {
    return <EmptyState title="この生き物は図鑑にありません" action={<Link to="/zukan" className="btn-ghost">図鑑へ戻る</Link>} />;
  }

  const entry = collection.get(sp.id);
  const color = CATEGORY_META[sp.category].color;
  const exps = experiencesForSpecies(sp.id);
  const month = new Date().getMonth() + 1;
  const photos = entry?.sightings.filter((s) => s.photoId) ?? [];

  return (
    <main className="pb-[calc(120px+var(--safe-bottom))]">
      {/* ───── ヒーロー ───── */}
      <div className="relative h-[54vh] min-h-[340px] overflow-hidden text-white" style={{ background: color }}>
        {entry?.photoId ? (
          <PhotoImg photoId={entry.photoId} size="full" alt={sp.name} className="absolute inset-0 h-full w-full" />
        ) : (
          <>
            <Kasuri className="text-white/[0.08]" size={34} />
            <motion.div
              className="absolute inset-0 grid place-items-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CategoryIcon category={sp.category} className="h-28 w-28 text-white/30 animate-floaty" strokeWidth={1} />
            </motion.div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/zukan'))}
          className="pt-safe absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/30 backdrop-blur"
          aria-label="戻る"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="absolute inset-x-5 bottom-5">
          <div className="flex items-center gap-2 font-latin text-[15px] italic text-white/80">
            No.{String(sp.no).padStart(3, '0')}
            <span className="h-px w-6 bg-white/40" />
            <span className="font-sans text-[11px] not-italic font-bold tracking-label">{CATEGORY_META[sp.category].label}</span>
          </div>
          <h1 className="mt-1 font-serif text-[32px] font-extrabold leading-tight">{sp.name}</h1>
          <div className="sci text-[17px] text-white/80">{sp.sci}</div>
          <div className="text-[12px] text-white/60">{sp.en}</div>
        </div>
        {!entry && (
          <div className="absolute right-4 top-4 pt-safe">
            <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-bold backdrop-blur">未発見</span>
          </div>
        )}
      </div>

      {/* ───── タグ ───── */}
      <div className="flex flex-wrap gap-1.5 px-5 pt-4">
        <span className="chip" style={{ color: RARITY_COLOR[sp.rarity] }}>
          <RarityGems rarity={sp.rarity} size={6} /> {RARITY_META[sp.rarity].label}
        </span>
        {sp.endemic && (
          <span className="chip text-kuri">
            <Sparkles className="h-3 w-3" />
            {sp.endemic === 'species' ? '固有種' : '固有亜種'}
          </span>
        )}
        {sp.nocturnal && (
          <span className="chip text-ruri">
            <Moon className="h-3 w-3" /> 夜行性
          </span>
        )}
        {sp.protection?.map((p) => (
          <span key={p} className="chip text-accent">
            <Landmark className="h-3 w-3" /> {p}
          </span>
        ))}
        {sp.sensitive && (
          <span className="chip">
            <EyeOff className="h-3 w-3" /> 位置を自動でぼかします
          </span>
        )}
      </div>

      {sp.danger && (
        <div className="mx-4 mt-4 flex gap-3 rounded-2xl bg-danger/10 p-4 text-danger">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-[13px] font-bold leading-relaxed">{sp.danger}</p>
        </div>
      )}

      {/* ───── 記録状況 ───── */}
      <div className="mx-4 mt-4 card flex items-center justify-between p-4">
        <div>
          <div className="label">MY RECORD</div>
          {entry ? (
            <div className="mt-1 text-[14px] font-bold">
              {entry.count}回記録 <span className="text-[12px] font-normal text-ink3">· 初記録 {formatDate(entry.sightings[entry.sightings.length - 1].observedAt)}</span>
            </div>
          ) : (
            <div className="mt-1 text-[14px] font-bold text-ink2">まだ出会っていません</div>
          )}
        </div>
        <Link to={`/capture?species=${sp.id}`} className="btn-primary px-4 py-2.5 text-[13px]">
          <Camera className="h-4 w-4" /> 記録する
        </Link>
      </div>

      {photos.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
          {photos.map((s) => (
            <Link key={s.id} to={`/sighting/${s.id}`} className="w-28 shrink-0">
              <PhotoImg photoId={s.photoId} alt={s.nickname || sp.name} className="aspect-square rounded-2xl" />
              <div className="mt-1 truncate text-[11px] font-bold">{s.nickname || formatDate(s.observedAt)}</div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5">
        <Block icon={<Sparkles className="h-4 w-4" />} title="どんな生き物？">
          {sp.description}
        </Block>
        <Block icon={<MapPin className="h-4 w-4" />} title="分布と見られる季節">
          <p>{sp.range}</p>
          <p className="mt-1 text-[12.5px] text-ink2">生息環境：{sp.habitat.join('・')}</p>
          <div className="mt-3">
            <MonthBar months={sp.months} highlight={month} />
          </div>
        </Block>
        <Block icon={<Lightbulb className="h-4 w-4" />} title="観察のコツ" tone="text-kin">
          {sp.tip}
        </Block>
        {sp.manner && (
          <Block icon={<ShieldAlert className="h-4 w-4" />} title="観察マナー" tone="text-sango">
            {sp.manner}
          </Block>
        )}
        {sp.culture && (
          <Block icon={<Landmark className="h-4 w-4" />} title="シマの話" tone="text-kuri">
            {sp.culture}
          </Block>
        )}
      </div>

      {exps.length > 0 && (
        <section className="mt-2 border-t hairline pt-6">
          <div className="mb-3 px-5">
            <div className="label">MEET THEM</div>
            <h2 className="font-serif text-[18px] font-bold">この生き物に会えるかもしれない体験</h2>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
            {exps.map((e) => (
              <div key={e.id} className="w-[290px] shrink-0">
                <ExperienceCard exp={e} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {entry && entry.sightings.some((s) => s.areaId) && (
        <p className="mt-6 px-5 text-[11px] text-ink3">
          記録した地域：
          {[...new Set(entry.sightings.map((s) => (s.areaId ? AREA_BY_ID[s.areaId]?.name : null)).filter(Boolean))].join('・')}
        </p>
      )}
      <p className="mt-2 px-5 text-[10px] leading-relaxed text-ink3">
        解説は監修前のβ版データです。保護区分は公開前に最新の公式情報で確認します。
      </p>
    </main>
  );
}
