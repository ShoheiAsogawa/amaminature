import { motion } from 'framer-motion';
import { Camera, ChevronRight, CloudOff, Gift, Moon, RefreshCw, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Wordmark } from '../components/Brand';
import { ExperienceCard } from '../components/ExperienceCard';
import { PhotoImg } from '../components/PhotoImg';
import { CategoryIcon, EmptyState, Kasuri, Page, ProgressBar, ProgressRing, RarityGems, SectionHeader } from '../components/ui';
import { EXPERIENCES } from '../data/experiences';
import { CATEGORY_META, SPECIES, SPECIES_BY_ID, speciesInSeason } from '../data/species';
import { SEASON_LABEL, seasonOf } from '../lib/progress';
import { useCollection } from '../store/useCollection';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';

export const MONTH_THEME: Record<number, string> = {
  1: 'ザトウクジラの季節',
  2: '冬の森とクジラ',
  3: '森が芽吹く早春',
  4: '夏鳥が帰ってくる',
  5: 'イジュの花咲く森',
  6: '梅雨の森',
  7: 'ウミガメの夏',
  8: '夏の夜の森',
  9: 'クワガタの季節',
  10: 'サシバの渡り',
  11: 'アサギマダラの旅',
  12: 'クジラがやってくる',
};

const MANNER_TIPS = [
  '夜の林道は時速20〜30kmでゆっくり。クロウサギの交通事故を防ごう。',
  '希少な生き物の場所はSNSで広めない。このアプリは自動で位置をぼかします。',
  '生き物には触らない・追いかけない・餌をあげない。',
  'ハブに注意。夜はライトで足元を照らし、草むらに手を入れない。',
  '金作原は認定ガイドの同行がルール。安全に深い森を楽しもう。',
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return '夜の森は静かに';
  if (h < 11) return 'おはようございます';
  if (h < 17) return 'こんにちは';
  return 'こんばんは';
}

export default function Home() {
  const navigate = useNavigate();
  const sightings = useStore((s) => s.sightings);
  const settings = useStore((s) => s.settings);
  const account = useStore((s) => s.account);
  const collection = useCollection();
  const { stats, points, rank, quests, month } = useProgress();

  const seasonal = speciesInSeason(month).sort((a, b) => b.rarity - a.rarity);
  const activeQuests = quests.filter((q) => q.active && !q.done).slice(0, 3);
  const recent = sightings.slice(0, 6);
  const tip = MANNER_TIPS[new Date().getDate() % MANNER_TIPS.length];
  const exp = EXPERIENCES.filter((e) => e.months.includes(month) && e.months.length < 12)[0] ?? EXPERIENCES[0];
  const pending = sightings.filter((s) => s.syncState === 'pending').length;
  const isNight = new Date().getHours() >= 17 || new Date().getHours() < 5;

  return (
    <Page>
      <header className="pt-safe px-5">
        <div className="flex h-16 items-center justify-between">
          <Wordmark />
          {account.mode === 'line' ? (
            <div className="flex items-center gap-2">
              {account.syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin text-ink3" aria-label="同期中" />
              ) : pending > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-ink3">
                  <CloudOff className="h-3.5 w-3.5" /> 未送信 {pending}
                </span>
              ) : null}
              {account.pictureUrl ? (
                <img src={account.pictureUrl} alt="" className="h-9 w-9 rounded-full ring-2 ring-card" />
              ) : null}
            </div>
          ) : (
            <span className="chip">デモ</span>
          )}
        </div>
      </header>

      {/* ───── ヒーロー：図鑑の進み具合 ───── */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-4xl bg-forest-900 p-5 text-washi shadow-lift"
        >
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(42,79,163,.55),transparent_60%),radial-gradient(90%_70%_at_0%_100%,rgba(43,103,80,.7),transparent_60%)]" />
          <Kasuri className="text-white/[0.05]" />
          <div className="relative">
            <div className="text-[10px] font-bold tracking-label text-forest-300">
              {month}月 · {SEASON_LABEL[seasonOf(month)]} — {MONTH_THEME[month]}
            </div>
            <p className="mt-2 font-serif text-[20px] font-bold leading-snug">
              {greeting()}
              {settings.name ? `、${settings.name}さん` : ''}
            </p>
            <div className="mt-5 flex items-center gap-5">
              <ProgressRing value={stats.discovered / SPECIES.length} size={116} stroke={9} color="#C79A2E">
                <div className="text-center leading-none">
                  <div className="font-serif text-[30px] font-extrabold">{stats.discovered}</div>
                  <div className="mt-1 text-[11px] text-washi/60">/ {SPECIES.length} 種</div>
                </div>
              </ProgressRing>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold tracking-label text-washi/50">RANK</div>
                <div className="font-serif text-[19px] font-bold">{rank.current.title}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-[24px] font-extrabold text-gold">{points.toLocaleString()}</span>
                  <span className="text-[11px] text-washi/60">pt</span>
                </div>
                <ProgressBar value={rank.progress} color="#C79A2E" className="mt-2 bg-white/10" />
                <div className="mt-1.5 text-[10px] text-washi/55">
                  {rank.next ? `次の「${rank.next.title}」まで ${rank.next.min - points}pt` : '最高ランクに到達'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ───── クイックアクション ───── */}
      <section className="mt-4 grid grid-cols-4 gap-2 px-4">
        {[
          { label: '記録する', icon: Camera, to: '/capture', tone: 'bg-accent/10 text-accent' },
          { label: '路上レポート', icon: TriangleAlert, to: '/capture?mode=road', tone: 'bg-sango/10 text-sango' },
          { label: 'セーフドライブ', icon: ShieldCheck, to: '/safe-drive', tone: 'bg-ruri/10 text-ruri' },
          { label: 'ポイント交換', icon: Gift, to: '/rewards', tone: 'bg-kin/10 text-kin' },
        ].map((a) => (
          <Link key={a.label} to={a.to} className="card relative flex flex-col items-center gap-1.5 px-1 py-3 active:scale-[0.97]">
            <span className={`grid h-10 w-10 place-items-center rounded-2xl ${a.tone}`}>
              <a.icon className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <span className="text-[10.5px] font-bold text-ink2">{a.label}</span>
          </Link>
        ))}
      </section>

      {isNight && (
        <section className="mt-4 px-4">
          <Link to="/safe-drive" className="flex items-center gap-3 rounded-3xl bg-[#101B33] p-4 text-washi shadow-card">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">
              <Moon className="h-5 w-5 text-gold" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold">夜の運転の前に、セーフドライブ宣言</div>
              <div className="text-[11px] text-washi/60">林道はゆっくり。宣言で +10pt（1日1回）</div>
            </div>
            <ChevronRight className="h-5 w-5 text-washi/40" />
          </Link>
        </section>
      )}

      {/* ───── 今月出会えるかも ───── */}
      <section className="mt-8">
        <SectionHeader
          label="IN SEASON"
          title={`${month}月に出会えるかも`}
          action={
            <Link to="/zukan" className="text-[12px] font-bold text-accent">
              図鑑へ
            </Link>
          }
        />
        <div className="no-scrollbar flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
          {seasonal.map((sp) => {
            const found = collection.has(sp.id);
            return (
              <Link
                key={sp.id}
                to={`/species/${sp.id}`}
                className="card relative w-[148px] shrink-0 snap-start overflow-hidden"
              >
                <div className="relative h-24" style={{ background: CATEGORY_META[sp.category].color }}>
                  {found && collection.get(sp.id)?.photoId ? (
                    <PhotoImg photoId={collection.get(sp.id)!.photoId} alt={sp.name} className="absolute inset-0 h-full w-full" />
                  ) : (
                    <>
                      <Kasuri className="text-white/10" size={20} />
                      <CategoryIcon category={sp.category} className="absolute bottom-3 right-3 h-9 w-9 text-white/70" strokeWidth={1.4} />
                    </>
                  )}
                  {found && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-forest-900">
                      記録済み
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <RarityGems rarity={sp.rarity} size={5} />
                  <div className="mt-1 line-clamp-1 font-serif text-[14px] font-bold">{sp.name}</div>
                  <div className="sci line-clamp-1 text-[12px] text-ink3">{sp.sci}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───── クエスト ───── */}
      {activeQuests.length > 0 && (
        <section className="mt-8">
          <SectionHeader label="QUESTS" title="開催中のクエスト" />
          <div className="space-y-3 px-4">
            {activeQuests.map(({ quest, current, target }) => (
              <div key={quest.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="h-4 w-4 shrink-0 text-kin" />
                      <span className="truncate">{quest.title}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink2">{quest.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-kin/10 px-2 py-1 text-[11px] font-bold text-kin">+{quest.reward}pt</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={current / target} className="flex-1" />
                  <span className="text-[11px] font-bold tabular-nums text-ink2">
                    {current}/{target}
                  </span>
                </div>
                {quest.sponsor && <div className="mt-2 text-[10px] text-ink3">協賛：{quest.sponsor}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───── 最近の記録 ───── */}
      <section className="mt-8">
        <SectionHeader label="FIELD NOTES" title="最近の記録" />
        {recent.length === 0 ? (
          <div className="mx-4 card">
            <EmptyState
              icon={Camera}
              title="最初の1枚を撮りに行こう"
              body="見つけた生き物を撮って名前をつけると、図鑑が埋まっていきます。"
              action={
                <button className="btn-primary" onClick={() => navigate('/capture')}>
                  <Camera className="h-4 w-4" /> 記録をはじめる
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 px-4">
            {recent.map((s) => {
              const sp = s.speciesId ? SPECIES_BY_ID[s.speciesId] : null;
              return (
                <Link key={s.id} to={`/sighting/${s.id}`} className="relative aspect-square overflow-hidden rounded-xl">
                  {s.photoId ? (
                    <PhotoImg photoId={s.photoId} alt={sp?.name ?? s.customName ?? ''} className="h-full w-full" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-ink/[0.06]">
                      {sp ? <CategoryIcon category={sp.category} className="h-7 w-7 text-ink3" /> : null}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-5">
                    <div className="truncate text-[10.5px] font-bold text-white">{s.nickname || sp?.name || s.customName}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ───── おすすめ体験 ───── */}
      <section className="mt-8">
        <SectionHeader
          label="EXPERIENCE"
          title="今の季節のおすすめ体験"
          action={
            <Link to="/explore" className="text-[12px] font-bold text-accent">
              すべて
            </Link>
          }
        />
        <div className="px-4">
          <ExperienceCard exp={exp} />
        </div>
      </section>

      {/* ───── マナー ───── */}
      <section className="mt-8 px-4">
        <Link to="/explore?tab=manner" className="relative block overflow-hidden rounded-3xl bg-kuri/10 p-5">
          <div className="label text-kuri">FOR THE ISLAND</div>
          <p className="mt-2 font-serif text-[16px] font-bold leading-relaxed text-ink">{tip}</p>
          <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-kuri">
            観察マナーを読む <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </section>

      <footer className="mt-10 px-6 text-center text-[10px] leading-relaxed text-ink3">
        AMAMI NATURE β — operated by Amalink
        <br />
        解説データは監修前のβ版です
      </footer>
    </Page>
  );
}
