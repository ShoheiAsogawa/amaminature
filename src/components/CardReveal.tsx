import { motion } from 'framer-motion';
import { BookOpen, Camera, HandHeart, House, Share2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_META, RARITY_META } from '../data/species';
import type { Species } from '../data/types';
import type { Badge } from '../lib/progress';
import type { Quest } from '../data/types';
import { renderShareCard, shareCard } from '../lib/share';
import type { Sighting } from '../lib/types';
import { useStore } from '../store/useStore';
import { loadPhotoUrl } from './PhotoImg';
import { BADGE_ICON, CategoryIcon, Kasuri, RarityGems, RARITY_COLOR, toast } from './ui';

const GLOW: Record<number, string> = {
  1: 'rgba(156,200,176,.35)',
  2: 'rgba(46,139,110,.55)',
  3: 'rgba(58,98,196,.65)',
  4: 'rgba(199,154,46,.75)',
};

export function CardReveal({
  sighting,
  species,
  photoUrl,
  isNew,
  points,
  newBadges,
  completedQuests,
  onAgain,
}: {
  sighting: Sighting;
  species: Species | null;
  photoUrl: string | null;
  isNew: boolean;
  points: number;
  newBadges: Badge[];
  completedQuests: Quest[];
  onAgain: () => void;
}) {
  const navigate = useNavigate();
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [sharing, setSharing] = useState(false);
  const rescue = sighting.roadReport === 'roadkill' || sighting.roadReport === 'injured';
  const rarity = species?.rarity ?? 1;
  const color = species ? CATEGORY_META[species.category].color : '#1E4D3A';

  const share = async () => {
    setSharing(true);
    try {
      const url = photoUrl ?? (sighting.photoId ? await loadPhotoUrl(sighting.photoId, 'full') : null);
      const card = await renderShareCard({ sighting, species, photoUrl: url });
      const how = await shareCard({ card, species, lineMode });
      if (how === 'download') toast('カード画像を保存しました');
    } catch {
      toast('共有できませんでした');
    } finally {
      setSharing(false);
    }
  };

  if (rescue) {
    return (
      <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col bg-forest-950 px-6 pt-[calc(48px+var(--safe-top))] text-washi">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/10">
          <HandHeart className="h-9 w-9 text-gold" />
        </motion.div>
        <h1 className="mt-6 text-center font-serif text-[24px] font-bold">報告ありがとうございます</h1>
        <p className="mt-3 text-center text-[14px] leading-relaxed text-washi/75">
          この報告は、提携する行政・保護機関と共有し、
          <br />
          ロードキル対策（注意喚起・標識・速度対策）に役立てます。
        </p>
        <div className="mt-6 rounded-3xl bg-white/[0.06] p-5 text-[13px] leading-relaxed text-washi/85">
          <p className="font-bold text-gold">けがをした動物を見つけたら</p>
          <p className="mt-1">
            安全な場所に停車し、無理に触らずに、奄美野生生物保護センター（環境省）や地元の市町村へ連絡してください。
          </p>
        </div>
        <div className="mt-6 text-center font-serif text-[28px] font-extrabold text-gold">+{points}pt</div>
        <div className="text-center text-[11px] text-washi/50">保全ポイント</div>
        <div className="mt-auto grid gap-2 pb-[calc(24px+var(--safe-bottom))]">
          <button className="btn bg-washi text-forest-900" onClick={() => navigate('/', { replace: true })}>
            <House className="h-4 w-4" /> ホームへ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col overflow-y-auto bg-forest-950 text-washi">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(70% 45% at 50% 34%, ${GLOW[rarity]}, transparent 70%)` }} />
      {rarity >= 3 &&
        Array.from({ length: 14 }).map((_, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute h-1.5 w-1.5 rotate-45 rounded-[1px]"
            style={{ background: RARITY_COLOR[rarity], left: `${8 + ((i * 53) % 84)}%`, top: '34%' }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], y: -120 - (i % 5) * 40, x: ((i % 7) - 3) * 18, scale: [0, 1.4, 0.6] }}
            transition={{ delay: 0.7 + i * 0.04, duration: 1.6 }}
          />
        ))}

      <div className="relative px-6 pt-[calc(28px+var(--safe-top))] text-center">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-[11px] font-bold tracking-[0.3em] text-washi/60">
          {isNew ? 'NEW DISCOVERY' : 'RECORDED'}
        </motion.div>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-1 font-serif text-[22px] font-bold">
          {isNew ? '図鑑に新しいページが増えました' : 'フィールドノートに記録しました'}
        </motion.h1>
      </div>

      {/* カード */}
      <motion.div
        className="relative mx-auto mt-6 w-[76%] max-w-[320px]"
        initial={{ rotateY: 100, scale: 0.7, opacity: 0 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 110, delay: 0.35 }}
        style={{ perspective: 1000 }}
      >
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-[22px] bg-washi p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] ${rarity === 4 ? 'foil' : ''}`}
          style={{ boxShadow: rarity === 4 ? '0 0 0 2px #C79A2E, 0 30px 80px -20px rgba(199,154,46,.6)' : undefined }}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[16px]" style={{ background: color }}>
            {photoUrl ? (
              <img src={photoUrl} alt={species?.name ?? ''} className="h-full w-full object-cover" />
            ) : (
              <>
                <Kasuri className="text-white/10" />
                <div className="absolute inset-0 grid place-items-center">
                  {species && <CategoryIcon category={species.category} className="h-20 w-20 text-white/60" strokeWidth={1.2} />}
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            {isNew && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: -8 }}
                transition={{ delay: 0.9, type: 'spring', stiffness: 260 }}
                className="absolute right-3 top-3 rounded-md bg-sango px-2 py-1 text-[11px] font-extrabold tracking-wider text-white shadow"
              >
                NEW!
              </motion.div>
            )}
            {species && (
              <div className="absolute left-3 top-3 font-latin text-[14px] italic text-white/85">No.{String(species.no).padStart(3, '0')}</div>
            )}
            <div className="absolute inset-x-3 bottom-3 text-left">
              {species && <RarityGems rarity={species.rarity} light size={7} />}
              <div className="mt-1.5 font-serif text-[22px] font-extrabold leading-tight text-white">{species?.name ?? sighting.customName ?? 'なぞの生き物'}</div>
              {sighting.nickname && <div className="mt-0.5 text-[13px] font-bold text-[#F2D58A]">「{sighting.nickname}」</div>}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="relative mt-6 text-center">
        <div className="font-serif text-[34px] font-extrabold text-gold">+{points}pt</div>
        {species && (
          <div className="text-[12px] text-washi/60">
            {RARITY_META[species.rarity].en} · {RARITY_META[species.rarity].label}
          </div>
        )}
      </motion.div>

      {(newBadges.length > 0 || completedQuests.length > 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="relative mx-6 mt-5 space-y-2">
          {newBadges.map((b) => {
            const Icon = BADGE_ICON[b.icon];
            return (
              <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold text-forest-950">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-left">
                  <div className="text-[10px] font-bold tracking-label text-gold">NEW BADGE</div>
                  <div className="text-[14px] font-bold">{b.title}</div>
                </div>
              </div>
            );
          })}
          {completedQuests.map((q) => (
            <div key={q.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
                <Sparkles className="h-5 w-5 text-gold" />
              </span>
              <div className="text-left">
                <div className="text-[10px] font-bold tracking-label text-gold">QUEST CLEAR · +{q.reward}pt</div>
                <div className="text-[14px] font-bold">{q.title}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="relative mt-auto grid gap-2 px-6 pb-[calc(24px+var(--safe-bottom))] pt-8">
        <button className="btn bg-gold text-forest-950" onClick={share} disabled={sharing}>
          <Share2 className="h-4 w-4" /> {lineMode ? 'LINEで友だちに見せる' : 'カードをシェア'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn border border-white/15 bg-white/5 text-washi" onClick={onAgain}>
            <Camera className="h-4 w-4" /> 続けて記録
          </button>
          <button
            className="btn border border-white/15 bg-white/5 text-washi"
            onClick={() => navigate(species ? `/species/${species.id}` : `/sighting/${sighting.id}`, { replace: true })}
          >
            <BookOpen className="h-4 w-4" /> {species ? '図鑑で見る' : '記録を見る'}
          </button>
        </div>
      </div>
    </div>
  );
}
