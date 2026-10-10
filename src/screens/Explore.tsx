import { motion } from 'framer-motion';
import { Car, ChevronRight, Flashlight, Hand, Leaf, Moon, Route, ShieldCheck, Sprout, Stamp, TreePalm, TriangleAlert } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExperienceCard } from '../components/ExperienceCard';
import { Kasuri, Page, PageHeader, ProgressBar, Segmented } from '../components/ui';
import { AREAS, ISLAND_ORDER } from '../data/areas';
import { EXPERIENCES } from '../data/experiences';
import { useStore } from '../store/useStore';

type Tab = 'tours' | 'stamps' | 'manner';

const MANNERS = [
  { icon: Car, title: '夜の林道はゆっくり走る', body: '時速20〜30km程度で。アマミノクロウサギなどの交通事故が後を絶ちません。ハイビームで照らし続けないことも大切です。' },
  { icon: Route, title: '林道の夜間ルールを確認する', body: '三太郎線周辺などでは、夜間の通行台数の予約制などのルールが試行されています。出かける前に最新の公式情報を確認しましょう。' },
  { icon: Leaf, title: '金作原は認定ガイドと', body: '世界自然遺産の金作原では利用ルールがあり、認定ガイドの同行が必要です。' },
  { icon: Hand, title: '採らない・触らない・餌をあげない', body: '多くの希少種は法律や条例で捕獲・採取が禁止されています。写真で記録して、そっと見守りましょう。' },
  { icon: ShieldCheck, title: '希少種の場所を広めない', body: '盗掘・密猟を防ぐため、SNSに場所がわかる投稿をしないでください。このアプリは希少種の位置を自動でぼかします。' },
  { icon: Flashlight, title: 'ハブに注意', body: '夜はライトで足元を照らし、草むらや石垣のすき間に手を入れない。長靴がおすすめです。' },
  { icon: Sprout, title: '外来種を持ち込まない・放さない', body: 'ペットや植物を野外に放さない。ネコは室内で飼い、捨てないことが島の生き物を守ります。' },
  { icon: TreePalm, title: '海ではサンゴとウミガメにやさしく', body: 'サンゴに触れない・踏まない。産卵中のウミガメにライトを当てない。' },
];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab | null) ?? 'tours';
  const sightings = useStore((s) => s.sightings);
  const month = new Date().getMonth() + 1;

  const counts = new Map<string, number>();
  for (const s of sightings) if (s.areaId) counts.set(s.areaId, (counts.get(s.areaId) ?? 0) + 1);
  const visited = AREAS.filter((a) => counts.has(a.id)).length;

  const tours = [...EXPERIENCES].sort((a, b) => Number(b.months.includes(month)) - Number(a.months.includes(month)));

  return (
    <Page>
      <PageHeader label="EXPLORE" title="奄美をめぐる" />
      <div className="px-4 pb-4">
        <Segmented<Tab>
          value={tab}
          onChange={(v) => setParams({ tab: v }, { replace: true })}
          options={[
            { value: 'tours', label: '体験・ツアー' },
            { value: 'stamps', label: 'スタンプラリー' },
            { value: 'manner', label: 'マナー' },
          ]}
        />
      </div>

      {tab === 'tours' && (
        <div className="space-y-4 px-4">
          <p className="px-1 text-[12.5px] leading-relaxed text-ink2">
            夜の森や原生林は、認定ガイドと一緒なら安全に、そして出会える確率もぐっと上がります。
          </p>
          {tours.map((e) => (
            <ExperienceCard key={e.id} exp={e} />
          ))}
          <p className="px-1 text-[10.5px] leading-relaxed text-ink3">
            ※ 掲載内容は提携前の掲載イメージです。料金は公開されている相場を参考にした目安で、実際の料金・予約条件は各事業者の情報をご確認ください。
          </p>
        </div>
      )}

      {tab === 'stamps' && (
        <div className="px-4">
          <div className="relative overflow-hidden rounded-4xl bg-kuri p-5 text-washi shadow-card">
            <Kasuri className="text-white/[0.07]" />
            <div className="relative flex items-center gap-4">
              <Stamp className="h-10 w-10 text-gold" strokeWidth={1.5} />
              <div className="flex-1">
                <div className="text-[10px] font-bold tracking-label text-washi/60">12 MUNICIPALITIES</div>
                <div className="font-serif text-[20px] font-bold">奄美群島 12市町村めぐり</div>
                <ProgressBar value={visited / AREAS.length} color="#C79A2E" className="mt-2 bg-white/15" />
              </div>
              <div className="text-right font-serif text-[28px] font-extrabold">
                {visited}
                <span className="text-[13px] text-washi/60">/12</span>
              </div>
            </div>
            <p className="relative mt-3 text-[11.5px] leading-relaxed text-washi/70">
              各市町村で生き物を記録するとスタンプが押されます。全制覇で記念品と交換できます（予定）。
            </p>
          </div>

          {ISLAND_ORDER.map((island) => {
            const areas = AREAS.filter((a) => a.island.startsWith(island));
            return (
              <section key={island} className="mt-6">
                <h3 className="mb-2 px-1 font-serif text-[15px] font-bold">{island}</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {areas.map((a, i) => {
                    const n = counts.get(a.id) ?? 0;
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className={`relative grid aspect-square place-items-center rounded-3xl border ${n ? 'border-transparent bg-card shadow-card' : 'border-dashed hairline'}`}
                      >
                        {n > 0 ? (
                          <div className="grid h-[74%] w-[74%] -rotate-12 place-items-center rounded-full border-[3px] border-sango/80 text-sango">
                            <div className="text-center leading-tight">
                              <div className="font-serif text-[15px] font-extrabold">{a.name}</div>
                              <div className="text-[9px] font-bold">{n}件の記録</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="font-serif text-[14px] font-bold text-ink3">{a.name}</div>
                            <div className="mt-0.5 text-[9px] text-ink3">未訪問</div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === 'manner' && (
        <div className="px-4">
          <div className="relative overflow-hidden rounded-4xl bg-forest-900 p-5 text-washi">
            <Kasuri className="text-white/[0.05]" />
            <Moon className="relative h-7 w-7 text-gold" />
            <h2 className="relative mt-3 font-serif text-[21px] font-bold leading-snug">
              世界自然遺産の島で、
              <br />
              生き物と人がともに暮らすために
            </h2>
            <p className="relative mt-2 text-[12px] leading-relaxed text-washi/70">奄美大島と徳之島は、2021年に世界自然遺産に登録されました。</p>
          </div>
          <ol className="mt-4 space-y-2.5">
            {MANNERS.map((m, i) => (
              <li key={m.title} className="card flex gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <m.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-[14px] font-bold">
                    <span className="mr-1.5 font-latin text-[15px] italic text-ink3">{i + 1}.</span>
                    {m.title}
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/capture?mode=road" className="mt-4 flex items-center gap-3 rounded-3xl bg-sango/10 p-4">
            <TriangleAlert className="h-6 w-6 shrink-0 text-sango" />
            <div className="flex-1">
              <div className="text-[14px] font-bold">交通事故にあった・けがをした動物を見つけたら</div>
              <div className="text-[11.5px] text-ink2">安全な場所に停車して、路上レポートで知らせてください</div>
            </div>
            <ChevronRight className="h-5 w-5 text-ink3" />
          </Link>
        </div>
      )}
    </Page>
  );
}
