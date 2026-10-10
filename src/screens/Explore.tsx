import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExperienceItem, ExperienceSheet } from '../components/ExperienceCard';
import {
  IconCarProfile,
  IconEyeSlash,
  IconFlashlight,
  IconHandHeart,
  IconLeaf,
  IconPath,
  IconPlant,
  IconRoadHorizon,
  IconTreePalm,
  type IconComponent,
} from '../components/icons';
import { Phrase } from '../components/Phrase';
import { ListRow, Notice, Page, ProgressBar, ScreenHeader, SectionHeader, Segmented, StampSeal } from '../components/ui';
import { AREAS, ISLAND_ORDER } from '../data/areas';
import { EXPERIENCES } from '../data/experiences';
import { useStore } from '../store/useStore';

// 体験タブ（docs/DESIGN_SYSTEM.md §8.7）。体験 / スタンプ / マナー をセグメントで切り替える。
// どれを開いているかは ?tab=tours|stamps|manner で持つ（リッチメニューやスクリーンショットから直接開ける）。

type Tab = 'tours' | 'stamps' | 'manner';

const TABS: { value: Tab; label: string }[] = [
  { value: 'tours', label: '体験' },
  { value: 'stamps', label: 'スタンプ' },
  { value: 'manner', label: 'マナー' },
];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = raw === 'stamps' || raw === 'manner' ? raw : 'tours';

  return (
    <Page>
      <ScreenHeader title="体験" />
      <div className="px-4 pt-1">
        <Segmented<Tab> aria-label="表示する内容" value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} options={TABS} />
      </div>
      {tab === 'tours' && <Tours />}
      {tab === 'stamps' && <Stamps />}
      {tab === 'manner' && <Manners />}
    </Page>
  );
}

// ───────── 体験 ─────────

function Tours() {
  const [openId, setOpenId] = useState<string | null>(null);
  const month = new Date().getMonth() + 1;
  // 今の季節に催行している体験を先に
  const tours = [...EXPERIENCES].sort((a, b) => Number(b.months.includes(month)) - Number(a.months.includes(month)));
  const open = EXPERIENCES.find((e) => e.id === openId) ?? null;

  return (
    <>
      <p className="px-4 pt-4 text-sub text-fg-2">夜の森や原生林は、認定ガイドと一緒なら安全です。生き物に出会える確率もぐっと上がります。</p>
      <div className="mt-2">
        {tours.map((e) => (
          <ExperienceItem key={e.id} exp={e} onOpen={() => setOpenId(e.id)} />
        ))}
      </div>
      <Notice className="mt-4">
        <>掲載内容は提携前の掲載イメージです。料金は公開されている相場を参考にした目安です。実際の料金や予約条件は、各事業者の情報をご確認ください。</>
      </Notice>

      <SectionHeader title="道路と生き物" />
      <div>
        <ListRow icon={IconRoadHorizon} title="路上レポートを送る" subtitle="交通事故やけがをした生き物を見つけたら" to="/capture?mode=road" chevron />
        <ListRow icon={IconCarProfile} title="セーフドライブ宣言" subtitle="夜の林道はゆっくり。1日1回 +10pt" to="/safe-drive" chevron />
      </div>

      <ExperienceSheet exp={open} onClose={() => setOpenId(null)} />
    </>
  );
}

// ───────── スタンプ ─────────

function Stamps() {
  const sightings = useStore((s) => s.sightings);

  // 市町村ごとに、最初に記録した日（スタンプの日付）
  const firstAt = new Map<string, string>();
  for (const s of sightings) {
    if (!s.areaId) continue;
    const cur = firstAt.get(s.areaId);
    if (!cur || s.observedAt < cur) firstAt.set(s.areaId, s.observedAt);
  }
  const visited = AREAS.filter((a) => firstAt.has(a.id)).length;

  return (
    <>
      <div className="px-4 pt-4">
        <p className="text-callout text-fg">
          <span className="num">{AREAS.length}</span>市町村のうち<span className="num">{visited}</span>か所
        </p>
        <ProgressBar value={visited / AREAS.length} id="stamps" label="スタンプを集めた市町村" className="mt-2" />
      </div>

      {ISLAND_ORDER.map((island) => {
        const areas = AREAS.filter((a) => a.island.startsWith(island));
        return (
          <section key={island} className="mt-6 px-4" aria-label={island}>
            <h2 className="text-sub font-semibold text-fg-2">{island}</h2>
            <div className="mt-3 grid grid-cols-[repeat(4,72px)] gap-4">
              {areas.map((a) => (
                <StampSeal key={a.id} name={a.name} visited={firstAt.has(a.id)} date={firstAt.get(a.id)} />
              ))}
            </div>
          </section>
        );
      })}

      <Notice className="mt-8">
        <>スタンプは、その市町村で生き物を記録するともらえます。12市町村すべてそろえると、記念品と交換できる予定です。</>
      </Notice>
    </>
  );
}

// ───────── マナー ─────────

const MANNERS: { icon: IconComponent; title: string; body: string }[] = [
  {
    icon: IconCarProfile,
    title: '夜の林道はゆっくり走る',
    body: '時速20〜30km程度で。アマミノクロウサギなどの交通事故が後を絶ちません。ハイビームで照らし続けないことも大切です。',
  },
  {
    icon: IconPath,
    title: '林道の夜間ルールを確認する',
    body: '三太郎線周辺などでは、夜間の通行台数の予約制などのルールが試行されています。出かける前に最新の公式情報を確認しましょう。',
  },
  { icon: IconLeaf, title: '金作原は認定ガイドと', body: '世界自然遺産の金作原では利用ルールがあり、認定ガイドの同行が必要です。' },
  {
    icon: IconHandHeart,
    title: '採らない、触らない、餌をあげない',
    body: '多くの希少種は法律や条例で捕獲・採取が禁止されています。写真で記録して、そっと見守りましょう。',
  },
  {
    icon: IconEyeSlash,
    title: '希少種の場所を広めない',
    body: '盗掘・密猟を防ぐため、SNSに場所がわかる投稿をしないでください。このアプリは希少種の位置を自動でぼかします。',
  },
  { icon: IconFlashlight, title: 'ハブに注意', body: '夜はライトで足元を照らし、草むらや石垣のすき間に手を入れない。長靴がおすすめです。' },
  {
    icon: IconPlant,
    title: '外来種を持ち込まない、放さない',
    body: 'ペットや植物を野外に放さない。ネコは室内で飼い、捨てないことが島の生き物を守ります。',
  },
  { icon: IconTreePalm, title: '海ではサンゴとウミガメにやさしく', body: 'サンゴに触れない、踏まない。産卵中のウミガメにライトを当てない。' },
];

function Manners() {
  return (
    <>
      <div className="px-4 pt-4">
        <h2 className="balance text-section text-fg">
          <Phrase text="世界自然遺産の島で、生き物と人がともに暮らすために" />
        </h2>
        <p className="mt-1 text-body text-fg-2">奄美大島と徳之島は、2021年に世界自然遺産に登録されました。</p>
      </div>
      {/* 順序のある手順ではないので番号を付けない */}
      <ul className="mt-4">
        {MANNERS.map((m) => (
          <li key={m.title} className="group/row flex pl-4">
            <m.icon size={20} className="mt-[13px] shrink-0 text-fg-2" />
            <div className="ml-3 min-w-0 flex-1 border-b border-sep py-3 pr-4 group-last/row:border-b-0">
              <h3 className="text-headline text-fg">
                <Phrase text={m.title} />
              </h3>
              <p className="mt-1 text-body text-fg-2">{m.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
