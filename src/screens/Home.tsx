import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../components/Brand';
import { ExperienceItem, ExperienceSheet } from '../components/ExperienceCard';
import { Coin, Ring, Sparkles, Stars, TYPE_META, TypeBadge, XPBar } from '../components/game';
import {
  IconArrowClockwise,
  IconBookOpenTextFill,
  IconCameraFill,
  IconCarProfileFill,
  IconCaretRight,
  IconCheck,
  IconCheckCircleFill,
  IconCloudSlash,
  IconFireFill,
  IconFlagBannerFill,
  IconTrophyFill,
  type IconComponent,
} from '../components/icons';
import { Phrase } from '../components/Phrase';
import { usePhotoUrl } from '../components/PhotoImg';
import { PlayerHud } from '../components/Player';
import { HIDDEN_NAME_LABEL, SpeciesName } from '../components/SpeciesName';
import { SpeciesPlate, speciesNo, SpeciesThumb } from '../components/SpeciesTile';
import { button, cn, Group, InfoRow, ListRow, Num, Page, RarityGems, SectionHeader, Sheet, toast } from '../components/ui';
import { EXPERIENCES } from '../data/experiences';
import { CATEGORY_ORDER, SPECIES, SPECIES_BY_ID, speciesInSeason } from '../data/species';
import type { Species } from '../data/types';
import { confettiBurst } from '../lib/confetti';
import type { Mission } from '../lib/missions';
import type { QuestProgress } from '../lib/progress';
import { sfx } from '../lib/sfx';
import type { Sighting } from '../lib/types';
import { useCollection, type CollectionEntry } from '../store/useCollection';
import { useMissions, useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';

/** 画面の左上の小さなロゴ（瑠璃のドット絵の丸。下の厚みは切り抜かない外側の drop-shadow で落とす） */
function Brand() {
  return (
    <span className="flex items-center gap-2" aria-label="AMAMI NATURE">
      <span className="shrink-0 [filter:drop-shadow(0_3px_0_rgb(var(--c-brand-pressed)))]">
        <span className="px-circle-m grid h-9 w-9 place-items-center bg-brand-fill text-white">
          <LogoMark size={22} className="text-white" />
        </span>
      </span>
      <span aria-hidden className="num text-[19px] leading-none tracking-[1px] text-fg">
        AMAMI <span className="text-brand">NATURE</span>
      </span>
    </span>
  );
}

/**
 * 月ごとの季節の一文と、その月の注目種（docs/DESIGN_SYSTEM.md §8.1）。
 * 注目種は「会えるかも」の先頭に置き、参考写真がある時だけ写真を出す。
 */
const SEASON_NOTE: Record<number, { text: string; speciesId: string }> = {
  1: { text: 'ザトウクジラが子育てのため、奄美の海にやってきています', speciesId: 'zatoukujira' },
  2: { text: '冬の森は静かです。沖ではザトウクジラの潮吹きが見られます', speciesId: 'zatoukujira' },
  3: { text: '森が芽吹き、アマミセイシカの花が咲きはじめます', speciesId: 'amami-seishika' },
  4: { text: 'リュウキュウアカショウビンなどの夏鳥が、南から帰ってきます', speciesId: 'ryukyu-akashobin' },
  5: { text: '森のあちこちで、イジュの白い花が咲きます', speciesId: 'iju' },
  6: { text: '梅雨の雨で森が潤い、夜はカエルの声でにぎやかです', speciesId: 'otton-gaeru' },
  7: { text: 'ウミガメが夜の砂浜に上がり、卵を産みます', speciesId: 'akaumigame' },
  8: { text: '夏の夜の森では、夜行性の生き物たちが活発に動きます', speciesId: 'otton-gaeru' },
  9: { text: '夜の森で、アマミマルバネクワガタが動きはじめます', speciesId: 'amami-marubane' },
  10: { text: 'サシバが南へ渡る途中、奄美で羽を休めます', speciesId: 'sashiba' },
  11: { text: 'アサギマダラが海を越えて、南へ旅していきます', speciesId: 'asagimadara' },
  12: { text: 'ザトウクジラが、冬の奄美の海にやってきます', speciesId: 'zatoukujira' },
};

/** バナーの上の英字の月 */
const MONTH_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** ホームに出す行の数（季節の種・クエスト） */
const ROWS = 3;
/** 最近の記録の横スクロールに出す数 */
const RECENT = 10;

type SheetKind = 'season' | 'quests' | 'quest' | 'records' | 'experience';

/** 夜（18:00〜翌5:59）か。夜の道路の注意を出す */
function isNightNow(): boolean {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

/** 開催月を「10月〜11月」にする。続いていなければ「4月、6月」 */
function monthRange(months: number[]): string {
  const set = new Set(months);
  if (set.size >= 12) return '一年中';
  const starts = months.filter((m) => !set.has(m === 1 ? 12 : m - 1));
  if (starts.length === 1) {
    let end = starts[0];
    while (set.has(end === 12 ? 1 : end + 1)) end = end === 12 ? 1 : end + 1;
    return end === starts[0] ? `${end}月` : `${starts[0]}月〜${end}月`;
  }
  return [...set]
    .sort((a, b) => a - b)
    .map((m) => `${m}月`)
    .join('、');
}

/** 記録の名前（ニックネーム → 和名 → わかる範囲の名前） */
function sightingName(s: Sighting): string {
  const sp = s.speciesId ? SPECIES_BY_ID[s.speciesId] : null;
  return s.nickname.trim() || sp?.name || s.customName || 'なぞの生き物';
}

export default function Home() {
  const sightings = useStore((s) => s.sightings);
  const markCelebrated = useStore((s) => s.markCelebrated);
  const collection = useCollection();
  const { stats, quests, month } = useProgress();
  const { missions, done, allDone, celebrated, streak } = useMissions();

  const [sheet, setSheet] = useState<SheetKind | null>(null);
  // 閉じるアニメーションの間も中身を残すため、選んだクエストは閉じても消さない
  const [questId, setQuestId] = useState<string | null>(null);
  const close = () => setSheet(null);

  const note = SEASON_NOTE[month];
  const featured = note ? SPECIES_BY_ID[note.speciesId] : undefined;

  // 注目種を先頭に、あとはレア度の高い順（同じなら図鑑番号順）
  const seasonal = speciesInSeason(month).sort(
    (a, b) => Number(b.id === featured?.id) - Number(a.id === featured?.id) || b.rarity - a.rarity || a.no - b.no,
  );
  const activeQuests = quests.filter((q) => q.active && !q.done);
  const recent = sightings.slice(0, RECENT);
  const exp = EXPERIENCES.filter((e) => e.months.includes(month) && e.months.length < 12)[0] ?? EXPERIENCES[0];
  const night = isNightNow();
  const selectedQuest = quests.find((q) => q.quest.id === questId) ?? null;
  const rate = stats.discovered / SPECIES.length;

  // きょうのミッションを全部達成したら、その日 1 回だけお祝いする
  useEffect(() => {
    if (!allDone || celebrated) return;
    const t = window.setTimeout(() => {
      markCelebrated();
      sfx('mission');
      void confettiBurst('mission');
      toast.success('ミッションコンプリート！ また明日も来てね');
    }, 600);
    return () => window.clearTimeout(t);
  }, [allDone, celebrated, markCelebrated]);

  return (
    <Page>
      {/* ───── ステータス ───── */}
      <header className="pt-safe px-4">
        <div className="flex items-center gap-2 pb-3 pt-3">
          <Brand />
          <span className="flex-1" />
          <SyncStatus />
          {streak > 0 && (
            <span
              className="px-panel flex h-9 items-center gap-1 pl-1 pr-2"
              aria-label={`${streak}日連続でプレイ中`}
            >
              <IconFireFill size={18} className="text-capture" aria-hidden />
              <span className="num text-[16px] leading-none text-capture" aria-hidden>
                {streak}
              </span>
              <span className="text-caption text-fg-2" aria-hidden>
                日連続
              </span>
            </span>
          )}
        </div>
        <PlayerHud />
      </header>

      {/* ───── 季節のバナー（いまの奄美。夜空の地にドット絵の枠 px-night） ───── */}
      <section className="px-night mx-4 mt-4 overflow-hidden bg-night text-white" aria-labelledby="home-season-title">
        <div className="relative px-3 pb-3 pt-2.5" style={{ background: 'radial-gradient(120% 140% at 100% 0%, rgb(var(--c-night-2)) 0%, transparent 60%)' }}>
          <Sparkles count={4} className="opacity-70" />
          <p className="num text-[12px] tracking-[1px] text-gold">
            {MONTH_EN[month - 1]} · {night ? 'NIGHT MODE' : 'DAY MODE'}
          </p>
          <h1 id="home-season-title" className="mt-0.5 text-title font-black">
            {month}月の奄美
          </h1>
          {note && (
            <p className="mt-1 text-sub font-bold text-white/80">
              <Phrase text={note.text} />
            </p>
          )}
          <Link to="/capture" onClick={() => sfx('tap')} className={cn(button({ variant: 'capture' }), 'relative mt-4')}>
            <IconCameraFill size={24} />
            {sightings.length === 0 ? 'さいしょの1枚を撮りにいく' : 'いきものを さがしにいく'}
          </Link>
        </div>
      </section>

      {/* ───── きょうのミッション ───── */}
      <section aria-labelledby="home-missions">
        <SectionHeader
          id="home-missions"
          title="きょうのミッション"
          action={
            <span className="px-clip-1 num bg-fill-strong px-2.5 py-0.5 text-[14px] text-fg-2" aria-label={`${missions.length}つ中${done}つ達成`}>
              {done}/{missions.length}
            </span>
          }
        />
        <div className="panel mx-4 overflow-hidden">
          {missions.map((mi) => (
            <MissionRow key={mi.id} mission={mi} />
          ))}
          {/* 地の色はパネルと同じ（ドット絵の枠の内側の 1 ドットが白いので、色の帯にすると縁が浮く）。区切り線で分ける */}
          <div className={cn('flex items-center gap-2 border-t-2 border-sep px-4 py-2.5 text-sub font-black', allDone ? 'text-legend' : 'text-fg-3')}>
            <IconTrophyFill size={18} className={allDone ? 'text-gold-edge' : 'text-fg-3'} aria-hidden />
            {allDone ? 'コンプリート！ また明日も来てね' : `全部クリアで、連続記録をのばそう`}
          </div>
        </div>
      </section>

      {/* ───── 図鑑のコンプ率 ───── */}
      <Link to="/zukan" onClick={() => sfx('tap')} className="panel pressable mx-4 mt-7 flex items-center gap-4 p-3">
        <Ring value={rate} size={78} stroke={10}>
          <span className="num text-[20px] leading-none text-fg">{Math.round(rate * 100)}%</span>
        </Ring>
        <span className="min-w-0 flex-1">
          <span className="block text-section font-black text-fg">アマミ図鑑</span>
          <span className="mt-0.5 block text-sub font-bold text-fg-2">
            <span className="num text-[18px] text-brand">{stats.discovered}</span>
            <span className="num text-[14px]"> / {SPECIES.length}</span> 種 ゲット
          </span>
          <span className="mt-2 flex gap-1" aria-hidden>
            {CATEGORY_ORDER.map((c) => {
              const v = stats.byCategory[c];
              return (
                <span key={c} className="h-[9px] flex-1 overflow-hidden bg-fill-strong">
                  <span className={cn('block h-full', TYPE_META[c].bg)} style={{ width: `${(v.found / v.total) * 100}%` }} />
                </span>
              );
            })}
          </span>
        </span>
        <IconCaretRight size={20} className="shrink-0 text-fg-3" />
      </Link>

      {/* ───── いま会えるかも ───── */}
      {seasonal.length > 0 && (
        <section aria-labelledby="home-season">
          <SectionHeader id="home-season" title={`${month}月に会えるかも`} onAction={() => setSheet('season')} />
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4 pb-2">
            {seasonal.map((sp) => (
              <SeasonCard key={sp.id} species={sp} entry={collection.get(sp.id)} featured={sp.id === featured?.id} />
            ))}
          </div>
        </section>
      )}

      {/* ───── イベントクエスト ───── */}
      {activeQuests.length > 0 && (
        <section aria-labelledby="home-quests">
          <SectionHeader id="home-quests" title="イベントクエスト" onAction={() => setSheet('quests')} />
          <div className="space-y-2.5 px-4">
            {activeQuests.slice(0, ROWS).map((qp) => (
              <button
                key={qp.quest.id}
                type="button"
                onClick={() => {
                  sfx('tap');
                  setQuestId(qp.quest.id);
                  setSheet('quest');
                }}
                className="panel pressable block w-full overflow-hidden text-left"
              >
                <span className="flex items-center gap-3 px-3 pb-2 pt-2">
                  <span className="px-circle-m grid h-10 w-10 shrink-0 place-items-center bg-gold-soft text-gold-edge">
                    <IconFlagBannerFill size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-headline font-black text-fg">
                      <Phrase text={qp.quest.title} />
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-caption text-fg-2">
                      ほうしゅう <Coin size={14} />
                      <span className="num text-[12px] text-legend">+{qp.quest.reward}</span>
                    </span>
                  </span>
                  <span className="num shrink-0 text-[18px] text-fg-2">
                    {qp.current}/{qp.target}
                  </span>
                </span>
                <span className="block px-3 pb-2.5">
                  <XPBar value={qp.current / qp.target} tone="gold" height={12} label="クエストの進み具合" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ───── さいきんのゲット ───── */}
      {recent.length > 0 && (
        <section aria-labelledby="home-recent">
          <SectionHeader id="home-recent" title="さいきんのゲット" onAction={() => setSheet('records')} />
          <div className="no-scrollbar flex items-start gap-2.5 overflow-x-auto px-4 pb-2">
            {recent.map((s) => (
              <RecentTile key={s.id} sighting={s} />
            ))}
          </div>
        </section>
      )}

      {/* ───── 夜だけ：夜の道路の注意 ───── */}
      {night && (
        <Link
          to="/safe-drive"
          className="px-night pressable mx-4 mt-7 flex items-center gap-3 bg-night p-3 text-white"
        >
          <span className="px-circle-m grid h-11 w-11 shrink-0 place-items-center bg-gold text-night">
            <IconCarProfileFill size={24} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-headline font-black">夜のパトロール中は安全運転</span>
            <span className="mt-0.5 block text-sub font-bold text-white/75">夜の道路ではクロウサギが飛び出します</span>
          </span>
          <IconCaretRight size={20} className="shrink-0 text-white/70" />
        </Link>
      )}

      {/* ───── おすすめの体験 ───── */}
      <section aria-labelledby="home-experience">
        <SectionHeader id="home-experience" title="おすすめの体験" />
        <ExperienceItem exp={exp} onOpen={() => setSheet('experience')} />
      </section>

      <footer className="mt-10 px-4 text-caption text-fg-3">β版　運営：株式会社アマリンク</footer>

      {/* ───── シート ───── */}
      <Sheet open={sheet === 'season'} onClose={close} title={`${month}月に会えるかも`} snapPoints={[0.55, 1]}>
        <div className="-mx-4">
          {seasonal.map((sp) => (
            <SpeciesRow key={sp.id} species={sp} entry={collection.get(sp.id)} />
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === 'quests'} onClose={close} title="クエスト" snapPoints={[0.55, 1]}>
        <QuestList quests={quests} />
      </Sheet>

      <Sheet open={sheet === 'quest'} onClose={close} title={selectedQuest?.quest.title}>
        {selectedQuest && <QuestDetail qp={selectedQuest} />}
      </Sheet>

      <Sheet open={sheet === 'records'} onClose={close} title="これまでの記録" snapPoints={[0.55, 1]}>
        <div className="-mx-4">
          {sightings.map((s) => (
            <RecordRow key={s.id} sighting={s} />
          ))}
        </div>
      </Sheet>

      <ExperienceSheet exp={sheet === 'experience' ? exp : null} onClose={close} />
    </Page>
  );
}

// ───────── ミッション ─────────

const MISSION_ICON: Record<Mission['id'], IconComponent> = {
  record: IconCameraFill,
  study: IconBookOpenTextFill,
  safe: IconCarProfileFill,
};

function MissionRow({ mission }: { mission: Mission }) {
  const Icon = MISSION_ICON[mission.id];
  return (
    <Link
      to={mission.to}
      onClick={() => sfx('tap')}
      className="group/row flex items-center gap-3 border-b-2 border-sep px-4 py-3 active:bg-fill"
      aria-label={`${mission.title}${mission.done ? '（達成）' : `（${mission.current}/${mission.target}）`}`}
    >
      <span className={cn('px-circle-m grid h-10 w-10 shrink-0 place-items-center', mission.done ? 'bg-xp text-white' : 'bg-brand-soft text-brand')}>
        {mission.done ? <IconCheck size={22} /> : <Icon size={22} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-callout font-black', mission.done ? 'text-fg-3' : 'text-fg')}>{mission.title}</span>
        {mission.target > 1 && (
          <span className="mt-1.5 flex items-center gap-2">
            <XPBar value={mission.current / mission.target} height={10} className="flex-1" />
            <span className="num text-[12px] text-fg-2">
              {mission.current}/{mission.target}
            </span>
          </span>
        )}
      </span>
      {mission.done ? (
        <span className="px-clip-1 num shrink-0 animate-pop-in bg-xp px-2.5 py-0.5 text-[12px] text-[#0b3d22]">CLEAR</span>
      ) : (
        <IconCaretRight size={18} className="shrink-0 text-fg-3" />
      )}
    </Link>
  );
}

// ───────── 季節の種のカード ─────────

/** 記録した種のカードの枠（線がタイプの色のドット絵の枠）。枠は絵なので、色ごとのクラス名をそのまま書く */
const TILE_FRAME: Record<Species['category'], string> = {
  mammal: 'px-tile-mammal',
  bird: 'px-tile-bird',
  herp: 'px-tile-herp',
  insect: 'px-tile-insect',
  aqua: 'px-tile-aqua',
  plant: 'px-tile-plant',
};

/** 「いま会えるかも」の横スクロールのカード（ゲームのキャラクターカード）。ゲットした種は線がタイプの色の枠 */
function SeasonCard({ species, entry, featured }: { species: Species; entry?: CollectionEntry; featured: boolean }) {
  const found = !!entry;
  return (
    <Link
      to={`/species/${species.id}`}
      onClick={() => sfx('tap')}
      className={cn('pressable relative block w-[132px] shrink-0 p-0.5', found ? TILE_FRAME[species.category] : 'px-panel')}
      aria-label={found ? `${species.name}（ゲット済み）` : `No.${speciesNo(species)} ${HIDDEN_NAME_LABEL}（${TYPE_META[species.category].label}）`}
    >
      {/* まだ見つけていない種は参考写真も出さない（名前と同じく、ゲットするまでのお楽しみ） */}
      <SpeciesPlate species={species} photoId={entry?.photoId} discovered={found} showReference={found} className="px-clip-2 aspect-square w-full">
        {featured && (
          <span className="px-clip-1 absolute left-1 top-1 bg-capture px-1.5 font-num text-[12px] leading-4 text-white">PICK UP</span>
        )}
        {found && (
          <span className="px-clip-1 absolute bottom-1 right-1 bg-xp px-1.5 font-num text-[12px] leading-4 text-[#0b3d22]">GET</span>
        )}
      </SpeciesPlate>
      <span className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
        <TypeBadge category={species.category} size="sm" />
        <Stars rarity={species.rarity} size={10} />
      </span>
      <span className={cn('mt-1 line-clamp-2 min-h-8 px-0.5 text-tile', found ? 'text-fg' : 'text-fg-3')}>
        <SpeciesName species={species} hidden={!found} clamp={false} />
      </span>
    </Link>
  );
}

// ───────── 同期の状態（LINE 連携中だけ） ─────────

/** 見出しの右に、同期中・未送信の件数を小さく出す。何もなければ出さない */
function SyncStatus() {
  const mode = useStore((s) => s.account.mode);
  const syncing = useStore((s) => s.account.syncing);
  const pending = useStore((s) => s.sightings.filter((x) => x.syncState === 'pending').length);
  if (mode !== 'line') return null;
  if (syncing) {
    return (
      <span role="status" className="flex h-9 shrink-0 items-center gap-1.5 pt-[2px] text-caption text-fg-2">
        <IconArrowClockwise size={16} className="shrink-0" />
        同期中
      </span>
    );
  }
  if (pending === 0) return null;
  return (
    <span role="status" className="flex h-9 shrink-0 items-center gap-1.5 pt-[2px] text-caption text-fg-2">
      <IconCloudSlash size={16} className="shrink-0 text-warning" />
      <span>
        未送信 <span className="num">{pending}</span>件
      </span>
    </span>
  );
}

// ───────── 種の行 ─────────

/** 季節の種の行。サムネイルは利用者の写真 → 参考写真 → シルエット →「？」。まだ見つけていない種は名前を「？？？」にする */
function SpeciesRow({ species, entry }: { species: Species; entry?: CollectionEntry }) {
  const found = !!entry;
  return (
    <ListRow
      to={`/species/${species.id}`}
      leading={<SpeciesThumb species={species} photoId={entry?.photoId} discovered={found} showReference={found} size={56} />}
      thumbSize={56}
      title={found ? <SpeciesName species={species} /> : <SpeciesName species={species} hidden className="text-fg-3" />}
      subtitle={<RarityGems rarity={species.rarity} withLabel />}
      checked={found}
    />
  );
}

// ───────── 記録 ─────────

/** 記録の絵。図鑑の種はプレート（写真 → 参考写真 → シルエット → 番号）、図鑑にない生き物は写真か fill */
function RecordPlate({ sighting, className, small = false }: { sighting: Sighting; className?: string; small?: boolean }) {
  const sp = sighting.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  if (sp) return <SpeciesPlate species={sp} photoId={sighting.photoId} patternSize={small ? 'thumb' : 'tile'} className={className} />;
  return <CustomPlate photoId={sighting.photoId} className={className} />;
}

function CustomPlate({ photoId, className }: { photoId: string | null; className?: string }) {
  const url = usePhotoUrl(photoId, 'thumb');
  return (
    <div className={cn('relative overflow-hidden bg-fill', className)}>
      {url && <img src={url} alt="" draggable={false} className="photo absolute inset-0 h-full w-full object-cover" />}
    </div>
  );
}

/** さいきんのゲットのタイル（104px のカード）。下に名前を 1 行 */
function RecentTile({ sighting }: { sighting: Sighting }) {
  const sp = sighting.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  const nickname = sighting.nickname.trim();
  return (
    <Link
      to={`/sighting/${sighting.id}`}
      onClick={() => sfx('tap')}
      className={cn('pressable block w-[112px] shrink-0 select-none p-0.5', sp ? TILE_FRAME[sp.category] : 'px-panel')}
    >
      <RecordPlate sighting={sighting} className="px-clip-2 aspect-square w-full" />
      <span className="mt-1 block px-0.5 text-tile text-fg">
        {nickname ? (
          <span className="block truncate">{nickname}</span>
        ) : sp ? (
          <SpeciesName species={sp} />
        ) : (
          <span className="block truncate">{sighting.customName || 'なぞの生き物'}</span>
        )}
      </span>
    </Link>
  );
}

/** すべての記録のシートの行 */
function RecordRow({ sighting }: { sighting: Sighting }) {
  const sp = sighting.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  const sameYear = new Date(sighting.observedAt).getFullYear() === new Date().getFullYear();
  const d = new Date(sighting.observedAt);
  const date = `${sameYear ? '' : `${d.getFullYear()}年`}${d.getMonth() + 1}月${d.getDate()}日`;
  return (
    <ListRow
      to={`/sighting/${sighting.id}`}
      leading={<RecordPlate sighting={sighting} small className="px-clip-2 h-12 w-12 shrink-0" />}
      thumbSize={48}
      title={sighting.nickname.trim() || !sp ? sightingName(sighting) : <SpeciesName species={sp} />}
      subtitle={
        <span className="flex flex-wrap gap-x-3">
          <span>{date}</span>
          {sighting.nickname.trim() && sp && <span>{sp.name}</span>}
        </span>
      }
      chevron
    />
  );
}

// ───────── クエスト ─────────

/** クエストの中身（説明、進み具合、報酬・期間・協賛）。1 つのクエストのシートで使う */
function QuestDetail({ qp }: { qp: QuestProgress }) {
  const { quest, current, target, done } = qp;
  return (
    <div>
      <p className="text-body text-fg">
        <Phrase text={quest.description} />
      </p>
      <div className="mt-4 flex items-center gap-3">
        <XPBar value={current / target} tone="gold" label="クエストの進み具合" className="flex-1" />
        {done ? (
          <span className="flex shrink-0 items-center gap-1 text-sub text-fg-2">
            <IconCheckCircleFill size={16} className="text-success" />
            達成
          </span>
        ) : (
          <span className="num shrink-0 text-[18px] text-fg">
            {current}/{target}
          </span>
        )}
      </div>
      <div className="-mx-4 mt-6">
        <Group>
          <InfoRow label="報酬">
            <Num value={`+${quest.reward}`} unit="pt" />
          </InfoRow>
          <InfoRow label="期間">{quest.months ? monthRange(quest.months) : 'いつでも'}</InfoRow>
          {quest.sponsor && <InfoRow label="協賛">{quest.sponsor}</InfoRow>}
        </Group>
      </div>
    </div>
  );
}

/** すべてのクエスト（開催中 → 期間外）。行を押さなくても説明まで読めるようにする */
function QuestList({ quests }: { quests: QuestProgress[] }) {
  const active = quests.filter((q) => q.active).sort((a, b) => Number(a.done) - Number(b.done));
  const later = quests.filter((q) => !q.active);
  return (
    <div className="-mx-4">
      {active.length > 0 && <QuestGroup heading="開催中" items={active} />}
      {later.length > 0 && <QuestGroup heading="期間外" items={later} />}
    </div>
  );
}

function QuestGroup({ heading, items }: { heading: string; items: QuestProgress[] }) {
  return (
    <section className="mb-4">
      <h3 className="px-4 pb-1 pt-2 text-sub font-black text-fg-2">{heading}</h3>
      <ul>
        {items.map(({ quest, current, target, done, active }) => (
          <li key={quest.id} className="group/row flex pl-4">
            <div className="min-w-0 flex-1 border-b-2 border-sep py-3 pr-4 group-last/row:border-b-0">
              <div className="flex items-start gap-3">
                <span className="min-w-0 flex-1 text-headline font-black text-fg">
                  <Phrase text={quest.title} />
                </span>
                {done ? (
                  <>
                    <IconCheckCircleFill size={20} className="shrink-0 text-success" />
                    <span className="sr-only">達成</span>
                  </>
                ) : (
                  <span className="num shrink-0 text-callout text-fg-2">
                    {current}/{target}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sub text-fg-2">
                <Phrase text={quest.description} />
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-sub text-fg-2">
                <Num value={`+${quest.reward}`} unit="pt" />
                {quest.months && <span>{active ? `${monthRange(quest.months)}に開催中` : `${monthRange(quest.months)}に開催`}</span>}
                {quest.sponsor && <span>協賛：{quest.sponsor}</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
