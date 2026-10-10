import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CATEGORY_META } from '../data/species';
import type { Species } from '../data/types';
import { CategoryIcon, Kasuri, RarityGems, RARITY_COLOR } from './ui';
import { PhotoImg } from './PhotoImg';

export function SpeciesTile({
  species,
  photoId,
  count,
  discovered,
  index = 0,
}: {
  species: Species;
  photoId?: string | null;
  count: number;
  discovered: boolean;
  index?: number;
}) {
  const color = CATEGORY_META[species.category].color;
  const legendary = species.rarity === 4;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 18) * 0.025, duration: 0.3 }}
    >
      <Link
        to={`/species/${species.id}`}
        className={`group relative block aspect-[3/4] overflow-hidden rounded-2xl ${
          discovered ? 'shadow-card' : 'border hairline bg-card'
        } ${discovered && legendary ? 'foil ring-1 ring-gold/70' : ''}`}
      >
        {discovered ? (
          <>
            {photoId ? (
              <PhotoImg photoId={photoId} alt={species.name} className="absolute inset-0 h-full w-full" />
            ) : (
              <div className="absolute inset-0 grid place-items-center" style={{ background: color }}>
                <Kasuri className="text-white/10" />
                <CategoryIcon category={species.category} className="relative h-10 w-10 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/25" />
            <div className="absolute left-2 top-2 font-latin text-[12px] font-semibold italic text-white/85">
              No.{String(species.no).padStart(3, '0')}
            </div>
            {count > 1 && (
              <div className="absolute right-2 top-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                ×{count}
              </div>
            )}
            <div className="absolute inset-x-2 bottom-2">
              <RarityGems rarity={species.rarity} light size={5} />
              <div className="mt-1 line-clamp-2 font-serif text-[12.5px] font-bold leading-tight text-white">
                {species.name}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.5]" style={{ color }}>
              <Kasuri className="opacity-[0.12]" size={22} />
            </div>
            <div className="absolute left-2 top-2 font-latin text-[12px] font-semibold italic text-ink3">
              No.{String(species.no).padStart(3, '0')}
            </div>
            <div className="absolute inset-0 grid place-items-center pb-6">
              <CategoryIcon category={species.category} className="h-9 w-9 text-ink/15" strokeWidth={1.4} />
            </div>
            <div className="absolute inset-x-2 bottom-2">
              <span
                className="inline-block h-[5px] w-[5px] rotate-45 rounded-[1px]"
                style={{ background: RARITY_COLOR[species.rarity], opacity: 0.6 }}
              />
              <div className="mt-1 line-clamp-2 font-serif text-[12.5px] font-bold leading-tight text-ink3">
                {species.name}
              </div>
            </div>
          </>
        )}
      </Link>
    </motion.div>
  );
}

/** 12か月の見ごろカレンダー */
export function MonthBar({ months, highlight }: { months: number[]; highlight?: number }) {
  return (
    <div>
      <div className="grid grid-cols-12 gap-[3px]">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <div
            key={m}
            className={`h-6 rounded-[5px] ${months.includes(m) ? 'bg-accent' : 'bg-ink/[0.07]'} ${
              m === highlight ? 'ring-2 ring-sango ring-offset-1 ring-offset-card' : ''
            }`}
            style={months.includes(m) ? { opacity: 0.55 + (m === highlight ? 0.45 : 0.25) } : undefined}
          />
        ))}
      </div>
      <div className="mt-1 grid grid-cols-12 gap-[3px] text-center text-[9px] font-bold text-ink3">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>
    </div>
  );
}
