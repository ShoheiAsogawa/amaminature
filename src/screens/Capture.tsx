import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  Car,
  Check,
  ChevronRight,
  CircleDashed,
  Dices,
  EyeOff,
  HandHeart,
  ImagePlus,
  LoaderCircle,
  LocateFixed,
  Mic,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CardReveal } from '../components/CardReveal';
import { CategoryIcon, PageHeader, RarityGems, Sheet, toast } from '../components/ui';
import { AREA_BY_ID, AREAS, ISLAND_ORDER } from '../data/areas';
import { QUESTS } from '../data/quests';
import { CATEGORY_META, CATEGORY_ORDER, SPECIES_BY_ID, searchSpecies } from '../data/species';
import type { Category, Quest, Species } from '../data/types';
import { api, errorMessage } from '../lib/api';
import { nearestArea, protectLocation } from '../lib/geo';
import { getCurrentPosition } from '../lib/position';
import { processPhoto, toAiPayload, type ProcessedPhoto } from '../lib/image';
import {
  allQuestProgress,
  BADGES,
  computeStats,
  currentMonth,
  earnedBadges,
  pointsForNewSighting,
  type Badge,
} from '../lib/progress';
import type { RoadReport, Sighting } from '../lib/types';
import { useCollection } from '../store/useCollection';
import { isPlusActive, newId, useStore } from '../store/useStore';

type Step = 'photo' | 'identify' | 'details';

const ROAD_OPTIONS: { value: RoadReport; label: string; desc: string; icon: typeof Car; tone: string }[] = [
  { value: 'roadkill', label: '交通事故にあった生き物', desc: '道路や路肩で死んでいた', icon: TriangleAlert, tone: 'text-danger bg-danger/10' },
  { value: 'injured', label: 'けがをしている生き物', desc: '動けない・弱っている', icon: HandHeart, tone: 'text-sango bg-sango/10' },
  { value: 'on-road', label: '路上にいた生き物', desc: '生きていて、道路上や路肩にいた', icon: Car, tone: 'text-ruri bg-ruri/10' },
];

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PREFIXES = ['アマミノ', 'アマミ', 'リュウキュウ', 'オキナワ', 'オオシマ', 'ミナミ'];
const SUFFIXES = ['ちゃん', '丸', 'すけ', 'ぴー', '太郎', 'たん', 'じろう', 'っち'];

function nicknameIdeas(sp: Species | null, seed: number): string[] {
  if (!sp) return [];
  let base = sp.name.replace(/の仲間$/, '');
  for (const p of PREFIXES) if (base.startsWith(p) && base.length > p.length + 1) base = base.slice(p.length);
  const short = base.slice(0, base.length > 3 ? 2 : base.length);
  return [0, 1, 2].map((i) => {
    const s = SUFFIXES[(seed + i * 3) % SUFFIXES.length];
    return i === 2 ? `島の${short}${s}` : `${short}${s}`;
  });
}

export default function Capture() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roadMode = params.get('mode') === 'road';
  const preset = params.get('species');
  const inboxId = params.get('inbox');

  const sightings = useStore((s) => s.sightings);
  const settings = useStore((s) => s.settings);
  const account = useStore((s) => s.account);
  const addSighting = useStore((s) => s.addSighting);
  const collection = useCollection();

  const [step, setStep] = useState<Step>('photo');
  const [roadType, setRoadType] = useState<RoadReport | null>(null);
  const [photo, setPhoto] = useState<ProcessedPhoto | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [speciesId, setSpeciesId] = useState<string | null | undefined>(preset && SPECIES_BY_ID[preset] ? preset : undefined);
  const [customName, setCustomName] = useState('');
  const [nickname, setNickname] = useState('');
  const [memo, setMemo] = useState('');
  const [observedAt, setObservedAt] = useState(toLocalInput(new Date()));
  const [areaId, setAreaId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [ai, setAi] = useState<{ loading: boolean; candidates: { speciesId: string; confidence: number; reason: string }[] | null }>({
    loading: false,
    candidates: null,
  });
  const [aiSheet, setAiSheet] = useState(false);
  const [seed, setSeed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    sighting: Sighting;
    isNew: boolean;
    points: number;
    badges: Badge[];
    quests: Quest[];
  } | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const month = new Date(observedAt).getMonth() + 1;
  const species = speciesId ? SPECIES_BY_ID[speciesId] : null;
  const rescue = roadType === 'roadkill' || roadType === 'injured';

  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  // LINEのトークに送った写真から記録する
  useEffect(() => {
    if (!inboxId || account.mode !== 'line') return;
    setProcessing(true);
    api
      .inboxPhoto(inboxId)
      .then((blob) => acceptPhoto(blob))
      .catch(() => toast('トークの写真を読み込めませんでした'))
      .finally(() => setProcessing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxId, account.mode]);

  async function acceptPhoto(file: Blob) {
    setProcessing(true);
    try {
      const p = await processPhoto(file);
      setPhoto(p);
      setPhotoUrl(URL.createObjectURL(p.full));
      if (p.takenAt) setObservedAt(toLocalInput(p.takenAt));
      if (p.lat != null && p.lng != null) {
        setCoords({ lat: p.lat, lng: p.lng });
        const near = nearestArea(p.lat, p.lng);
        if (near) setAreaId(near.area.id);
      }
      setStep(speciesId !== undefined ? 'details' : 'identify');
    } catch {
      toast('写真を読み込めませんでした');
    } finally {
      setProcessing(false);
    }
  }

  async function locate() {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCoords(pos);
      const near = nearestArea(pos.lat, pos.lng);
      if (near) {
        setAreaId(near.area.id);
        toast(`${near.area.name}に設定しました`);
      } else {
        toast('奄美群島の外のようです。地域を選んでください');
      }
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  async function runAi() {
    if (!photo) return;
    if (account.mode !== 'line') {
      setAiSheet(true);
      return;
    }
    setAi({ loading: true, candidates: null });
    try {
      const r = await api.identify(await toAiPayload(photo.full), month, areaId);
      setAi({ loading: false, candidates: r.candidates });
    } catch (e) {
      setAi({ loading: false, candidates: null });
      if ((e as { code?: string }).code === 'ai_quota_exceeded') setAiSheet(true);
      else toast(errorMessage(e));
    }
  }

  const list = useMemo(() => {
    const base = searchSpecies(query).filter((s) => !cat || s.category === cat);
    if (query) return base;
    return [...base].sort((a, b) => {
      const ia = a.months.includes(month) ? 0 : 1;
      const ib = b.months.includes(month) ? 0 : 1;
      return ia - ib || a.no - b.no;
    });
  }, [query, cat, month]);

  function choose(id: string | null) {
    setSpeciesId(id);
    setStep('details');
  }

  async function save() {
    if (speciesId === undefined) return;
    setSaving(true);
    try {
      const now = new Date();
      const observed = new Date(observedAt);
      const protectedLoc = protectLocation(species, coords?.lat ?? null, coords?.lng ?? null);
      const photoId = photo ? newId() : null;
      const s: Sighting = {
        id: newId(),
        speciesId,
        customName: speciesId === null ? customName.trim() || undefined : undefined,
        nickname: rescue ? '' : nickname.trim(),
        memo: memo.trim(),
        observedAt: (isNaN(observed.getTime()) ? now : observed).toISOString(),
        createdAt: now.toISOString(),
        areaId,
        ...protectedLoc,
        photoId,
        kind: photo ? 'photo' : 'sign',
        ...(roadType ? { roadReport: roadType, reportLat: coords?.lat ?? null, reportLng: coords?.lng ?? null } : {}),
      };

      const nowMonth = currentMonth(now);
      const ctx = { pledged: settings.pledged, safeDriveDays: settings.safeDriveDates.length };
      const before = earnedBadges(computeStats(sightings), ctx);
      const questsBefore = new Set(allQuestProgress(sightings, nowMonth).filter((q) => q.done).map((q) => q.quest.id));
      const isNew = !!speciesId && !rescue && !collection.has(speciesId);
      const points = pointsForNewSighting(s, sightings);

      await addSighting(
        s,
        photo && photoId ? { id: photoId, full: photo.full, thumb: photo.thumb, width: photo.width, height: photo.height } : undefined,
      );

      const after = [s, ...sightings];
      const afterBadges = earnedBadges(computeStats(after), ctx);
      const badges = BADGES.filter((b) => afterBadges.has(b.id) && !before.has(b.id));
      const quests = allQuestProgress(after, nowMonth)
        .filter((q) => q.done && !questsBefore.has(q.quest.id))
        .map((q) => QUESTS.find((x) => x.id === q.quest.id)!);
      setResult({ sighting: s, isNew, points, badges, quests });
    } catch {
      toast('保存できませんでした。もう一度お試しください');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setResult(null);
    setPhoto(null);
    setPhotoUrl(null);
    setSpeciesId(undefined);
    setCustomName('');
    setNickname('');
    setMemo('');
    setAi({ loading: false, candidates: null });
    setObservedAt(toLocalInput(new Date()));
    setStep('photo');
  }

  if (result) {
    return (
      <CardReveal
        sighting={result.sighting}
        species={result.sighting.speciesId ? SPECIES_BY_ID[result.sighting.speciesId] : null}
        photoUrl={photoUrl}
        isNew={result.isNew}
        points={result.points}
        newBadges={result.badges}
        completedQuests={result.quests}
        onAgain={reset}
      />
    );
  }

  const stepIndex = { photo: 0, identify: 1, details: 2 }[step];
  const plus = isPlusActive(settings);

  return (
    <div className="min-h-dvh pb-[calc(110px+var(--safe-bottom))]">
      <PageHeader
        label={roadMode ? 'ROAD REPORT' : 'NEW RECORD'}
        title={roadMode ? '路上レポート' : 'いきものを記録'}
        right={
          <button onClick={() => navigate(-1)} className="grid h-10 w-10 place-items-center rounded-full active:bg-ink/5" aria-label="閉じる">
            <X className="h-5 w-5" />
          </button>
        }
      />
      <div className="flex gap-1.5 px-5 pb-2">
        {['写真', '名前', '記録'].map((l, i) => (
          <div key={l} className="flex-1">
            <div className={`h-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-accent' : 'bg-ink/10'}`} />
            <div className={`mt-1 text-[10px] font-bold ${i <= stepIndex ? 'text-accent' : 'text-ink3'}`}>{l}</div>
          </div>
        ))}
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && acceptPhoto(e.target.files[0])} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && acceptPhoto(e.target.files[0])} />

      <AnimatePresence mode="wait">
        {/* ───────── 1. 写真 ───────── */}
        {step === 'photo' && (
          <motion.section key="photo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-4 pt-3">
            {roadMode && (
              <div className="mb-5">
                <div className="mb-3 flex gap-3 rounded-2xl bg-ruri/10 p-4 text-[12.5px] leading-relaxed text-ink">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ruri" />
                  <p>
                    <b>運転中は操作しないでください。</b>安全な場所に停車してから、または同乗者が記録しましょう。正確な位置は行政・保護機関との共有にだけ使い、公開しません。
                  </p>
                </div>
                <div className="label mb-2 px-1">何を見つけましたか？</div>
                <div className="space-y-2">
                  {ROAD_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setRoadType(o.value)}
                      className={`card flex w-full items-center gap-3 p-3.5 text-left transition ${roadType === o.value ? 'ring-2 ring-accent' : ''}`}
                    >
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${o.tone}`}>
                        <o.icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[14px] font-bold">{o.label}</span>
                        <span className="block text-[11.5px] text-ink3">{o.desc}</span>
                      </span>
                      {roadType === o.value && <Check className="h-5 w-5 text-accent" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!roadMode || roadType) && (
              <>
                {processing ? (
                  <div className="card grid aspect-[4/3] place-items-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-4xl bg-forest-900 text-washi shadow-lift active:scale-[0.99]"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_40%,rgba(43,103,80,.9),transparent_70%)]" />
                    <div className="absolute inset-6 rounded-3xl border border-dashed border-white/20" />
                    <div className="relative flex flex-col items-center">
                      <span className="grid h-20 w-20 place-items-center rounded-full bg-washi text-forest-900 shadow-lift">
                        <Camera className="h-9 w-9" strokeWidth={1.7} />
                      </span>
                      <span className="mt-4 font-serif text-[19px] font-bold">カメラで撮る</span>
                      <span className="mt-1 text-[12px] text-washi/60">近づきすぎず、ズームで撮ろう</span>
                    </div>
                  </button>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => libraryRef.current?.click()} className="btn-ghost">
                    <ImagePlus className="h-4 w-4" /> 写真を選ぶ
                  </button>
                  <button onClick={() => setStep(speciesId !== undefined ? 'details' : 'identify')} className="btn-ghost">
                    <Mic className="h-4 w-4" /> 写真なしで
                  </button>
                </div>
                <p className="mt-4 px-1 text-[11.5px] leading-relaxed text-ink3">
                  「写真なしで」は鳴き声を聞いた・暗くて撮れなかったときに。夜行性の生き物にはフラッシュを向けすぎないでください。
                </p>
              </>
            )}
          </motion.section>
        )}

        {/* ───────── 2. 名前（種の選択） ───────── */}
        {step === 'identify' && (
          <motion.section key="identify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-2">
            <div className="flex items-center gap-3 px-4">
              {photoUrl ? (
                <img src={photoUrl} alt="撮影した写真" className="h-20 w-20 rounded-2xl object-cover shadow-card" />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-ink/[0.06]">
                  <Mic className="h-7 w-7 text-ink3" />
                </div>
              )}
              <div>
                <div className="font-serif text-[19px] font-bold">この生き物は？</div>
                <div className="text-[12px] text-ink3">図鑑から選ぶか、AIで調べよう</div>
              </div>
            </div>

            {photo && (
              <div className="mt-4 px-4">
                <button
                  onClick={runAi}
                  disabled={ai.loading}
                  className="relative flex w-full items-center gap-3 overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B2F55] to-lapis p-4 text-left text-white shadow-lift"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15">
                    {ai.loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-gold" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-bold">{ai.loading ? 'AIが調べています…' : 'AIで名前を調べる'}</span>
                    <span className="block text-[11px] text-white/65">
                      {plus ? 'AMAMI NATURE+ ：1日30回まで' : '1日1回無料 · Plusなら1日30回'}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-white/50" />
                </button>

                {ai.candidates && (
                  <div className="mt-3 card divide-y divide-[var(--line)] overflow-hidden">
                    {ai.candidates.map((c) => {
                      const sp = SPECIES_BY_ID[c.speciesId];
                      if (!sp)
                        return (
                          <div key="unknown" className="p-4 text-[13px] text-ink2">
                            図鑑の中からは特定できませんでした。{c.reason}
                          </div>
                        );
                      return (
                        <button key={c.speciesId} onClick={() => choose(sp.id)} className="flex w-full items-center gap-3 p-3.5 text-left active:bg-ink/5">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: CATEGORY_META[sp.category].color }}>
                            <CategoryIcon category={sp.category} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold">{sp.name}</span>
                            <span className="block truncate text-[11px] text-ink3">{c.reason}</span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[15px] font-extrabold text-ruri">{Math.round(c.confidence * 100)}%</span>
                            <span className="block text-[9px] text-ink3">確からしさ</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="sticky top-[calc(56px+var(--safe-top))] z-20 mt-4 bg-paper/90 px-4 pb-2 pt-1 backdrop-blur">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink3" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="名前で探す" className="input pl-10" aria-label="生き物の名前で探す" />
              </div>
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
                {CATEGORY_ORDER.map((c) => (
                  <button key={c} onClick={() => setCat(cat === c ? null : c)} className={`chip shrink-0 ${cat === c ? 'border-transparent bg-primary text-onprimary' : ''}`}>
                    <CategoryIcon category={c} className="h-3.5 w-3.5" /> {CATEGORY_META[c].short}
                  </button>
                ))}
              </div>
            </div>

            {!query && <div className="label px-5 pb-1 pt-2">{month}月に見られる生き物から順に表示</div>}
            <ul className="px-2">
              {list.map((sp) => (
                <li key={sp.id}>
                  <button onClick={() => choose(sp.id)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left active:bg-ink/5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: CATEGORY_META[sp.category].color }}>
                      <CategoryIcon category={sp.category} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-bold">{sp.name}</span>
                        {collection.has(sp.id) && <span className="shrink-0 rounded-full bg-accent/10 px-1.5 text-[9px] font-bold text-accent">記録済み</span>}
                      </span>
                      <span className="sci block truncate text-[12.5px] text-ink3">{sp.sci}</span>
                    </span>
                    <RarityGems rarity={sp.rarity} size={5} />
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => choose(null)} className="mt-1 flex w-full items-center gap-3 rounded-2xl border border-dashed hairline px-3 py-3 text-left active:bg-ink/5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink/[0.06]">
                    <CircleDashed className="h-5 w-5 text-ink3" />
                  </span>
                  <span>
                    <span className="block font-bold">図鑑にない・わからない生き物</span>
                    <span className="block text-[11.5px] text-ink3">フィールドノートに記録して、あとで調べよう</span>
                  </span>
                </button>
              </li>
            </ul>
          </motion.section>
        )}

        {/* ───────── 3. 記録の詳細 ───────── */}
        {step === 'details' && (
          <motion.section key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5 px-4 pt-3">
            <div className="card flex items-center gap-3 p-3">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <span className="grid h-16 w-16 place-items-center rounded-2xl text-white" style={{ background: species ? CATEGORY_META[species.category].color : '#808C86' }}>
                  {species ? <CategoryIcon category={species.category} className="h-7 w-7" /> : <CircleDashed className="h-7 w-7" />}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-[18px] font-bold">{species?.name ?? '図鑑にない生き物'}</div>
                {species ? <div className="sci truncate text-[13px] text-ink3">{species.sci}</div> : null}
              </div>
              <button onClick={() => setStep('identify')} className="text-[12px] font-bold text-accent">
                変更
              </button>
            </div>

            {speciesId === null && (
              <label className="block">
                <span className="label mb-1.5 block px-1">わかる範囲の名前</span>
                <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例：青いトンボ、白い花" className="input" maxLength={40} />
              </label>
            )}

            {!rescue && (
              <div>
                <span className="label mb-1.5 block px-1">ニックネームをつけよう</span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={species ? `例：${nicknameIdeas(species, seed)[0]}` : '例：なぞのいきもの1号'}
                  className="input font-bold"
                  maxLength={24}
                />
                {species && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {nicknameIdeas(species, seed).map((n) => (
                      <button key={n} onClick={() => setNickname(n)} className="chip">
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setSeed((x) => x + 1)} className="chip" aria-label="ほかの候補">
                      <Dices className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <label className="block">
              <span className="label mb-1.5 block px-1">メモ</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder={rescue ? '状況（車線・時間帯・個体の様子など）' : 'どんな様子だった？（行動、鳴き声、天気など）'}
                className="input resize-none leading-relaxed"
                maxLength={500}
              />
            </label>

            <div className="grid grid-cols-1 gap-3">
              <label className="block">
                <span className="label mb-1.5 block px-1">観察した日時</span>
                <input type="datetime-local" value={observedAt} onChange={(e) => setObservedAt(e.target.value)} className="input" />
              </label>
              <div>
                <span className="label mb-1.5 block px-1">地域</span>
                <div className="flex gap-2">
                  <select value={areaId ?? ''} onChange={(e) => setAreaId(e.target.value || null)} className="input flex-1 appearance-none" aria-label="地域">
                    <option value="">選択しない</option>
                    {ISLAND_ORDER.map((island) => (
                      <optgroup key={island} label={island}>
                        {AREAS.filter((a) => a.island.startsWith(island)).map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <button onClick={locate} disabled={locating} className="btn-ghost shrink-0 px-4" aria-label="現在地から設定">
                    {locating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  </button>
                </div>
                {areaId && <div className="mt-1.5 px-1 text-[11px] text-ink3">{AREA_BY_ID[areaId].island}</div>}
              </div>
            </div>

            {roadType ? (
              <div className="flex gap-3 rounded-2xl bg-ruri/10 p-4 text-[12px] leading-relaxed text-ink2">
                <LocateFixed className="mt-0.5 h-4 w-4 shrink-0 text-ruri" />
                <p>
                  {coords ? '正確な位置を記録しました。' : '現在地ボタンで正確な位置を記録すると、対策に役立ちます。'}
                  正確な位置は行政・保護機関との共有用で、アプリ内や共有画像には表示しません。
                </p>
              </div>
            ) : species?.sensitive ? (
              <div className="flex gap-3 rounded-2xl bg-kuri/10 p-4 text-[12px] leading-relaxed text-ink2">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-kuri" />
                <p>
                  <b className="text-ink">{species.name}</b>は保護が必要な生き物のため、位置は市町村までしか保存しません。共有画像にも地域名は入りません。
                </p>
              </div>
            ) : (
              <p className="px-1 text-[11px] leading-relaxed text-ink3">位置は約100m単位にぼかして保存し、共有画像には市町村名だけを表示します。</p>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {step === 'details' && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-[calc(16px+var(--safe-bottom))] pt-6">
          <button onClick={save} disabled={saving} className="btn-primary w-full py-4 text-[16px]">
            {saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            {roadType ? 'レポートを送る' : '図鑑に記録する'}
          </button>
        </div>
      )}

      <Sheet open={aiSheet} onClose={() => setAiSheet(false)} title="AI判定は AMAMI NATURE+ の機能です">
        <p className="text-[13.5px] leading-relaxed text-ink2">
          {account.mode === 'line'
            ? '今日の無料回数を使い切りました。AMAMI NATURE+ なら1日30回まで、旅のあいだ何度でも名前を調べられます。'
            : 'AI判定は、LINE公式アカウントから開いたときに使えます（1日1回無料）。AMAMI NATURE+ なら1日30回まで調べられます。'}
        </p>
        <div className="mt-5 grid gap-2">
          <button className="btn-primary" onClick={() => navigate('/plus')}>
            <Sparkles className="h-4 w-4" /> AMAMI NATURE+ を見る
          </button>
          <button className="btn-ghost" onClick={() => setAiSheet(false)}>
            図鑑から自分で選ぶ
          </button>
        </div>
      </Sheet>
    </div>
  );
}
