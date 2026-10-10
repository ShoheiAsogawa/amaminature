import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExperienceItem, ExperienceSheet } from '../components/ExperienceCard';
import { IconArrowClockwise, IconCamera, IconCaretRight, IconCheckCircleFill, IconCloudSlash } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { usePhotoUrl } from '../components/PhotoImg';
import { SpeciesName } from '../components/SpeciesName';
import { referencePhoto, SpeciesPlate, SpeciesThumb } from '../components/SpeciesTile';
import {
  button,
  cn,
  EmptyState,
  Group,
  InfoRow,
  ListRow,
  Notice,
  Num,
  Page,
  ProgressBar,
  RarityGems,
  SectionHeader,
  Sheet,
} from '../components/ui';
import { EXPERIENCES } from '../data/experiences';
import { SPECIES, SPECIES_BY_ID, speciesInSeason } from '../data/species';
import type { Species } from '../data/types';
import type { QuestProgress } from '../lib/progress';
import type { Sighting } from '../lib/types';
import { useCollection, type CollectionEntry } from '../store/useCollection';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';

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
  const collection = useCollection();
  const { stats, points, rank, quests, month } = useProgress();

  const [sheet, setSheet] = useState<SheetKind | null>(null);
  // 閉じるアニメーションの間も中身を残すため、選んだクエストは閉じても消さない
  const [questId, setQuestId] = useState<string | null>(null);
  const close = () => setSheet(null);

  const note = SEASON_NOTE[month];
  const featured = note ? SPECIES_BY_ID[note.speciesId] : undefined;
  const featuredPhoto = featured ? referencePhoto(featured) : null;

  // 注目種を先頭に、あとはレア度の高い順（同じなら図鑑番号順）
  const seasonal = speciesInSeason(month).sort(
    (a, b) => Number(b.id === featured?.id) - Number(a.id === featured?.id) || b.rarity - a.rarity || a.no - b.no,
  );
  const activeQuests = quests.filter((q) => q.active && !q.done);
  const recent = sightings.slice(0, RECENT);
  const exp = EXPERIENCES.filter((e) => e.months.includes(month) && e.months.length < 12)[0] ?? EXPERIENCES[0];
  const night = isNightNow();
  const selectedQuest = quests.find((q) => q.quest.id === questId) ?? null;
  // 注目種の写真がない時は、利用者の写真（最近の記録）を季節の一文のすぐ下に置き、画面の最初の色にする
  const recentFirst = !featuredPhoto && recent.length > 0;

  const recentSection = recent.length > 0 && (
    <section aria-labelledby="home-recent">
      <SectionHeader id="home-recent" title="最近の記録" onAction={() => setSheet('records')} first={recentFirst} className={recentFirst ? 'pt-5' : undefined} />
      <div className="no-scrollbar flex items-start gap-2 overflow-x-auto px-4 pb-1">
        {recent.map((s) => (
          <RecentTile key={s.id} sighting={s} />
        ))}
      </div>
    </section>
  );

  return (
    <Page>
      {/* ───── 季節の見出し（ヒーローは置かない） ───── */}
      <header className="pt-safe px-4">
        <div className="flex items-start gap-3 pt-4">
          <h1 className="min-w-0 flex-1 text-display text-fg">{month}月の奄美</h1>
          <SyncStatus />
        </div>
        {note && (
          <p className="mt-1 text-callout text-fg-2">
            <Phrase text={note.text} />
          </p>
        )}
      </header>

      {featured && featuredPhoto && (
        <figure className="mx-4 mt-4">
          <Link to={`/species/${featured.id}`} className="block active:opacity-[.72]">
            <img
              src={featuredPhoto.src}
              alt={featured.name}
              draggable={false}
              className="photo aspect-[4/3] w-full rounded-md bg-fill object-cover"
            />
          </Link>
          {featuredPhoto.credit && <figcaption className="mt-1.5 text-right text-caption text-fg-3">© {featuredPhoto.credit}</figcaption>}
        </figure>
      )}

      {recentFirst && recentSection}

      {/* ───── 図鑑の進み具合（行全体で /zukan へ） ───── */}
      <Link to="/zukan" className={cn('block px-4 py-3 active:bg-fill', recentFirst ? 'mt-4' : 'mt-5')}>
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 text-headline font-normal text-fg">図鑑</span>
          <span className="text-headline text-fg">
            <span className="num">
              {stats.discovered}/{SPECIES.length}
            </span>
            種
          </span>
          <IconCaretRight size={16} className="shrink-0 text-fg-3" />
        </span>
        <ProgressBar id="zukan" value={stats.discovered / SPECIES.length} label="図鑑の進み具合" className="mt-2" />
        <span className="mt-2 flex flex-wrap gap-x-3 text-sub text-fg-2">
          <span>{rank.current.title}</span>
          <Num value={points.toLocaleString('ja-JP')} unit="pt" />
        </span>
      </Link>

      {/* ───── はじめての人へ（記録がまだない時だけ） ───── */}
      {sightings.length === 0 && (
        <EmptyState
          icon={IconCamera}
          title="最初の1枚を撮ろう"
          body="近くで見られる生き物から始められます"
          action={
            <Link to="/capture" className={button({ variant: 'secondary', size: 'md' })}>
              記録する
            </Link>
          }
          className="pb-2"
        />
      )}

      {/* ───── 今月会えるかもしれない種 ───── */}
      {seasonal.length > 0 && (
        <section aria-labelledby="home-season">
          <SectionHeader
            id="home-season"
            title={`${month}月に会えるかも`}
            onAction={seasonal.length > ROWS ? () => setSheet('season') : undefined}
            // 図鑑の行の下 12px の押下領域と合わせて、見出しの上を 32px にする
            className="pt-5"
          />
          <div>
            {seasonal.slice(0, ROWS).map((sp) => (
              <SpeciesRow key={sp.id} species={sp} entry={collection.get(sp.id)} />
            ))}
          </div>
        </section>
      )}

      {/* ───── クエスト ───── */}
      {activeQuests.length > 0 && (
        <section aria-labelledby="home-quests">
          <SectionHeader id="home-quests" title="開催中のクエスト" onAction={() => setSheet('quests')} />
          <div>
            {activeQuests.slice(0, ROWS).map((qp) => (
              <ListRow
                key={qp.quest.id}
                title={qp.quest.title}
                subtitle={<Num value={`+${qp.quest.reward}`} unit="pt" />}
                value={
                  <span className="num">
                    {qp.current}/{qp.target}
                  </span>
                }
                onClick={() => {
                  setQuestId(qp.quest.id);
                  setSheet('quest');
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ───── 最近の記録（記録がある時だけ。注目種の写真がない時は上に置く） ───── */}
      {!recentFirst && recentSection}

      {/* ───── おすすめの体験 ───── */}
      <section aria-labelledby="home-experience">
        <SectionHeader id="home-experience" title="おすすめの体験" />
        <ExperienceItem exp={exp} onOpen={() => setSheet('experience')} />
      </section>

      {/* ───── 夜だけ：夜の道路の注意 ───── */}
      {night && (
        <Notice
          kind="night"
          className="mt-8"
          action={
            <Link to="/safe-drive" className={cn(button({ variant: 'text', size: 'hit' }), 'gap-0.5')}>
              セーフドライブ
              <IconCaretRight size={14} />
            </Link>
          }
        >
          夜の道路ではクロウサギが飛び出します
        </Notice>
      )}

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

/** 季節の種の行。サムネイルは利用者の写真 → 参考写真 → シルエット → 番号 */
function SpeciesRow({ species, entry }: { species: Species; entry?: CollectionEntry }) {
  const found = !!entry;
  return (
    <ListRow
      to={`/species/${species.id}`}
      leading={<SpeciesThumb species={species} photoId={entry?.photoId} discovered={found} showReference size={56} />}
      thumbSize={56}
      title={<SpeciesName species={species} />}
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

/** 最近の記録のタイル（96px、rounded-xs）。下に名前を 1 行（ニックネームは省略記号可、和名は省略しない） */
function RecentTile({ sighting }: { sighting: Sighting }) {
  const sp = sighting.speciesId ? SPECIES_BY_ID[sighting.speciesId] : null;
  const nickname = sighting.nickname.trim();
  return (
    <Link to={`/sighting/${sighting.id}`} className="block w-24 shrink-0 select-none active:opacity-[.72]">
      <RecordPlate sighting={sighting} className="h-24 w-24 rounded-xs" />
      <span className="mt-1.5 block text-sub text-fg">
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
      leading={<RecordPlate sighting={sighting} small className="h-12 w-12 shrink-0 rounded-xs" />}
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
        <ProgressBar value={current / target} label="クエストの進み具合" className="flex-1" />
        {done ? (
          <span className="flex shrink-0 items-center gap-1 text-sub text-fg-2">
            <IconCheckCircleFill size={16} className="text-success" />
            達成
          </span>
        ) : (
          <span className="num shrink-0 text-callout font-semibold text-fg">
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
      <h3 className="px-4 pb-1 pt-2 text-sub font-semibold text-fg-2">{heading}</h3>
      <ul>
        {items.map(({ quest, current, target, done, active }) => (
          <li key={quest.id} className="group/row flex pl-4">
            <div className="min-w-0 flex-1 border-b border-sep py-3 pr-4 group-last/row:border-b-0">
              <div className="flex items-start gap-3">
                <span className="min-w-0 flex-1 text-headline font-normal text-fg">
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
