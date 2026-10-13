import { AnimatePresence, m, type Variants } from 'framer-motion';
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  IconCameraFill,
  IconCaretLeft,
  IconCarProfile,
  IconCircleNotch,
  IconDiceFive,
  IconEyeSlash,
  IconFlashlight,
  IconFrameCorners,
  IconGpsFix,
  IconHandHeart,
  IconImageSquare,
  IconInfo,
  IconMapPin,
  IconMicrophone,
  IconScan,
  IconWarning,
  IconX,
  type IconProps,
} from '../components/icons';
import { TYPE_META } from '../components/game';
import { Phrase } from '../components/Phrase';
import { SciName, SpeciesPlate, SpeciesThumb } from '../components/SpeciesTile';
import { SpeciesName } from '../components/SpeciesName';
import {
  Button,
  ButtonNote,
  Chip,
  ChipRow,
  cn,
  CTA_PADDING,
  CtaBar,
  DateTimeRow,
  EmptyState,
  Field,
  Group,
  Input,
  ListRow,
  Notice,
  RadioMark,
  ScreenHeader,
  SearchField,
  SectionHeader,
  Sheet,
  toast,
} from '../components/ui';
import { AREA_BY_ID, AREAS, ISLAND_ORDER } from '../data/areas';
import { QUESTS } from '../data/quests';
import { CATEGORY_META, CATEGORY_ORDER, SPECIES_BY_ID, searchSpecies } from '../data/species';
import type { Category, Quest, Species } from '../data/types';
import { api, errorMessage } from '../lib/api';
import { nearestArea, protectLocation } from '../lib/geo';
import { processPhoto, toAiPayload, type ProcessedPhoto } from '../lib/image';
import { getCurrentPosition } from '../lib/position';
import {
  allQuestProgress,
  BADGES,
  computePoints,
  computeStats,
  currentMonth,
  earnedBadges,
  pointsForNewSighting,
  type Badge,
} from '../lib/progress';
import type { RoadReport, Sighting } from '../lib/types';
import { useCollection } from '../store/useCollection';
import { isPlusActive, newId, useStore } from '../store/useStore';

// 記録（docs/DESIGN_SYSTEM.md §8.4）。1 写真（黒い舞台）→ 2 名前 → 3 記録 の 3 段階。
// 路上レポート（?mode=road）は 1 段階目の前に「見つけた生き物の状態」を出す。

// 図鑑カードの演出（NumberFlow を含む）は保存した後にしか使わないので分けて読み込み、この画面を開いた時に先読みする
const loadReveal = () => import('../components/CardReveal');
const CardReveal = lazy(() => loadReveal().then((mod) => ({ default: mod.CardReveal })));

type Step = 'road' | 'photo' | 'identify' | 'details';
const STEP_ORDER: Record<Step, number> = { road: 0, photo: 1, identify: 2, details: 3 };

const ROAD_OPTIONS: { value: RoadReport; label: string; desc: string; icon: typeof IconWarning }[] = [
  { value: 'roadkill', label: '交通事故にあった生き物', desc: '道路や路肩で死んでいた', icon: IconWarning },
  { value: 'injured', label: 'けがをしている生き物', desc: '動けない、弱っている', icon: IconHandHeart },
  { value: 'on-road', label: '路上にいた生き物', desc: '生きていて、道路上や路肩にいた', icon: IconCarProfile },
];

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 記録できる一番古い観察日時。サーバー（worker/src/validate.ts）は3年より前を受け付けないので、1日の余裕をみる */
function oldestObserved(now = Date.now()): Date {
  return new Date(now - (3 * 365 - 1) * 86400000);
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

/** 操作の待ち時間だけに使う回転（1 秒で 1 周） */
function Spinner({ size = 20, className, ...p }: IconProps) {
  return <IconCircleNotch size={size} className={cn('animate-spin', className)} {...p} />;
}

/** 段階の表示（右上の 2 / 3） */
function StepCount({ n }: { n: number }) {
  return (
    <span className="num text-caption text-fg-2" aria-label={`${n}段階目（全3段階）`}>
      {n} / 3
    </span>
  );
}

/** 記録の段階の切り替え（横 24px ＋フェード、220ms。§9 の 6）。戻る時は逆向き */
const stepVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 24 * dir }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/** ?species= / ?mode=road / ?inbox= が変わったら、最初の段階からやり直す */
export default function Capture() {
  const { search } = useLocation();
  return <CaptureFlow key={search} />;
}

function CaptureFlow() {
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

  const [step, setStep] = useState<Step>(roadMode ? 'road' : 'photo');
  const [dir, setDir] = useState(1);
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
  const [tipsSheet, setTipsSheet] = useState(false);
  const [seed, setSeed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    sighting: Sighting;
    isNew: boolean;
    points: number;
    badges: Badge[];
    /** 記録した後の図鑑の種数 */
    discovered: number;
    quests: Quest[];
    pointsBefore: number;
    pointsAfter: number;
  } | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  /** 写真の EXIF から入れた値（撮り直した時に戻す） */
  const fromPhoto = useRef({ time: false, place: false });
  /** Plus の AI 判定を自動で走らせた写真 */
  const aiTriedFor = useRef<ProcessedPhoto | null>(null);
  /** いまの写真（AI の結果が届いた時に、撮り直した後の写真か確かめる） */
  const photoRef = useRef<ProcessedPhoto | null>(null);
  photoRef.current = photo;
  /** 現在地の取得の世代。保存・つづけて記録した後に届いた位置は使わない */
  const locateGen = useRef(0);
  const month = new Date(observedAt).getMonth() + 1;
  const species = speciesId ? SPECIES_BY_ID[speciesId] : null;
  const rescue = roadType === 'roadkill' || roadType === 'injured';
  const plus = isPlusActive(settings);

  useEffect(() => () => void (photoUrl && URL.revokeObjectURL(photoUrl)), [photoUrl]);

  // 図鑑カードの演出を先読みしておく（保存した瞬間に待たないように）
  useEffect(() => {
    void loadReveal().catch(() => {});
  }, []);

  // 段階が変わったら先頭から見せる
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

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

  function go(next: Step) {
    setDir(STEP_ORDER[next] >= STEP_ORDER[step] ? 1 : -1);
    setStep(next);
  }

  /** 写真の後の段階（図鑑から来た時は名前を飛ばす） */
  function afterPhoto() {
    go(speciesId !== undefined ? 'details' : 'identify');
  }

  function leave() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  }

  async function acceptPhoto(file: Blob) {
    setProcessing(true);
    try {
      const p = await processPhoto(file);
      setPhoto(p);
      setPhotoUrl(URL.createObjectURL(p.full));
      setAi({ loading: false, candidates: null });
      // 撮影日時が古すぎる・未来（カメラの時計ずれ）の時は使わない
      const taken = p.takenAt && p.takenAt >= oldestObserved() ? new Date(Math.min(p.takenAt.getTime(), Date.now())) : null;
      if (p.takenAt && !taken) toast('写真の撮影日が3年より前のため、日時はいまにしました');
      fromPhoto.current = { time: !!taken, place: false };
      if (taken) setObservedAt(toLocalInput(taken));
      if (p.lat != null && p.lng != null) {
        setCoords({ lat: p.lat, lng: p.lng });
        fromPhoto.current.place = true;
        const near = nearestArea(p.lat, p.lng);
        if (near) setAreaId(near.area.id);
      }
    } catch {
      toast('写真を読み込めませんでした。別の写真を選んでください');
    } finally {
      setProcessing(false);
    }
  }

  /** 撮る・選ぶ（同じ写真を選び直しても届くように、読んだら入力を空にする） */
  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void acceptPhoto(file);
  }

  /** 撮り直す: 写真と、写真から入れた日時・位置を戻して、シャッターの状態に戻る */
  function retake() {
    setPhoto(null);
    setPhotoUrl(null);
    setAi({ loading: false, candidates: null });
    if (fromPhoto.current.time) setObservedAt(toLocalInput(new Date()));
    if (fromPhoto.current.place) {
      setCoords(null);
      setAreaId(null);
    }
    fromPhoto.current = { time: false, place: false };
  }

  async function locate() {
    const gen = ++locateGen.current;
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      if (gen !== locateGen.current) return;
      setCoords(pos);
      const near = nearestArea(pos.lat, pos.lng);
      if (near) {
        setAreaId(near.area.id);
        toast(`${near.area.name}に設定しました`);
      } else {
        toast('奄美群島の外のようです。地域を選んでください');
      }
    } catch (e) {
      if (gen === locateGen.current) toast(errorMessage(e));
    } finally {
      if (gen === locateGen.current) setLocating(false);
    }
  }

  async function runAi() {
    if (!photo) return;
    if (account.mode !== 'line') {
      setAiSheet(true);
      return;
    }
    const forPhoto = photo;
    setAi({ loading: true, candidates: null });
    try {
      const r = await api.identify(await toAiPayload(photo.full), month, areaId);
      // 待っている間に撮り直していたら、前の写真の候補は出さない
      if (photoRef.current !== forPhoto) return;
      setAi({ loading: false, candidates: r.candidates });
    } catch (e) {
      if (photoRef.current !== forPhoto) return;
      setAi({ loading: false, candidates: null });
      if ((e as { code?: string }).code === 'ai_quota_exceeded') setAiSheet(true);
      else toast(errorMessage(e));
    }
  }

  // Plus の時は、名前の段階に来たら AI の候補を自動で出す（写真 1 枚につき 1 回）
  useEffect(() => {
    if (step !== 'identify' || !photo || !plus || account.mode !== 'line') return;
    if (aiTriedFor.current === photo) return;
    aiTriedFor.current = photo;
    void runAi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, photo, plus, account.mode]);

  const list = useMemo(() => searchSpecies(query).filter((s) => !cat || s.category === cat), [query, cat]);
  // 「この季節に多い生き物」は今月が見頃の種だけ（一年中見られる種は含めない。ホームの speciesInSeason と同じ考え方）
  const [inSeason, offSeason] = useMemo(() => {
    const seasonal = (s: Species) => s.months.length < 12 && s.months.includes(month);
    return [list.filter(seasonal), list.filter((s) => !seasonal(s))];
  }, [list, month]);

  function choose(id: string | null) {
    setSpeciesId(id);
    go('details');
  }

  async function save() {
    if (speciesId === undefined || saving) return;
    if (locating) {
      toast('現在地を調べています。少し待ってから送ってください');
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      const entered = new Date(observedAt);
      // iOS は datetime-local の min / max を守らないので、ここでも確かめる（未来はいまにする）
      const observed = isNaN(entered.getTime()) || entered > now ? now : entered;
      if (observed < oldestObserved(now.getTime())) {
        toast('3年より前の観察は記録できません。日時を確かめてください');
        return;
      }
      const protectedLoc = protectLocation(species, coords?.lat ?? null, coords?.lng ?? null);
      const photoId = photo ? newId() : null;
      const s: Sighting = {
        id: newId(),
        speciesId,
        customName: speciesId === null ? customName.trim() || undefined : undefined,
        nickname: rescue ? '' : nickname.trim(),
        memo: memo.trim(),
        observedAt: observed.toISOString(),
        createdAt: now.toISOString(),
        areaId,
        ...protectedLoc,
        photoId,
        kind: photo ? 'photo' : 'sign',
        ...(roadType ? { roadReport: roadType, reportLat: coords?.lat ?? null, reportLng: coords?.lng ?? null } : {}),
      };

      const nowMonth = currentMonth(now);
      const ctx = { pledged: settings.pledged, safeDriveDays: settings.safeDriveDates.length };
      // ポイント・バッジ・レベルは、図鑑の進み具合と同じく、サーバーが受け付けなかった記録を数えない
      const counted = sightings.filter((x) => x.syncState !== 'rejected');
      const before = earnedBadges(computeStats(counted), ctx);
      const questsBefore = new Set(allQuestProgress(counted, nowMonth).filter((q) => q.done).map((q) => q.quest.id));
      const isNew = !!speciesId && !rescue && !collection.has(speciesId);
      const points = pointsForNewSighting(s, counted);
      const pointsBefore = computePoints(counted, nowMonth, settings.safeDriveDates.length);
      const pointsAfter = computePoints([s, ...counted], nowMonth, settings.safeDriveDates.length);

      await addSighting(
        s,
        photo && photoId ? { id: photoId, full: photo.full, thumb: photo.thumb, width: photo.width, height: photo.height } : undefined,
      );

      const after = [s, ...counted];
      const afterStats = computeStats(after);
      const afterBadges = earnedBadges(afterStats, ctx);
      const badges = BADGES.filter((b) => afterBadges.has(b.id) && !before.has(b.id));
      const quests = allQuestProgress(after, nowMonth)
        .filter((q) => q.done && !questsBefore.has(q.quest.id))
        .map((q) => QUESTS.find((x) => x.id === q.quest.id)!);
      setResult({ sighting: s, isNew, points, badges, quests, discovered: afterStats.discovered, pointsBefore, pointsAfter });
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
    // 前の記録の正確な位置を次の記録（路上レポート）に持ち越さない
    setCoords(null);
    locateGen.current++;
    setLocating(false);
    fromPhoto.current = { time: false, place: false };
    setDir(-1);
    setStep('photo');
  }

  if (result) {
    return (
      <Suspense fallback={<div className="fixed inset-0 z-50" style={{ background: 'var(--stage)' }} />}>
        <CardReveal
          sighting={result.sighting}
          species={result.sighting.speciesId ? SPECIES_BY_ID[result.sighting.speciesId] : null}
          photoUrl={photoUrl}
          isNew={result.isNew}
          points={result.points}
          newBadges={result.badges}
          completedQuests={result.quests}
          discovered={result.discovered}
          pointsBefore={result.pointsBefore}
          pointsAfter={result.pointsAfter}
          onAgain={reset}
        />
      </Suspense>
    );
  }

  const ideas = nicknameIdeas(species, seed);
  const area = areaId ? AREA_BY_ID[areaId] : null;

  /** 名前の段階の 1 行（行全体で選ぶ。選んだ行は brand-soft）。記録済みの種は学名の下に「記録済み」 */
  const speciesRow = (sp: Species, trailing?: ReactNode) => {
    const entry = collection.get(sp.id);
    return (
      <ListRow
        key={sp.id}
        onClick={() => choose(sp.id)}
        selected={speciesId === sp.id}
        leading={<SpeciesThumb species={sp} photoId={entry?.photoId} discovered={!!entry} showReference size={56} />}
        thumbSize={56}
        title={<SpeciesName species={sp} clamp={false} />}
        subtitle={
          <>
            <SciName sci={sp.sci} className="block text-sub leading-[18px]" />
            {entry && <span className="mt-0.5 block text-caption text-fg-3">記録済み</span>}
          </>
        }
        trailing={trailing}
        chevron
      />
    );
  };

  return (
    <div className={cn('min-h-dvh', step === 'details' && CTA_PADDING)}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={onPick} />

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        {/* ───────── 路上レポート: 見つけた生き物の状態 ───────── */}
        {step === 'road' && (
          <m.section key="road" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
            <ScreenHeader variant="nav" title="路上レポート" />
            <Notice kind="danger" title="運転中は操作しないでください。" className="mt-2">
              安全な場所に停車してから、または同乗者が記録しましょう。正確な位置は行政・保護機関との共有にだけ使い、公開しません。
            </Notice>
            <SectionHeader title="見つけた生き物の状態" id="road-type" />
            <Group>
              <div role="radiogroup" aria-labelledby="road-type">
                {ROAD_OPTIONS.map((o) => {
                  const on = roadType === o.value;
                  return (
                    <ListRow
                      key={o.value}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setRoadType(o.value)}
                      icon={o.icon}
                      iconClassName={on ? 'text-danger' : undefined}
                      title={o.label}
                      subtitle={o.desc}
                      trailing={<RadioMark checked={on} />}
                    />
                  );
                })}
              </div>
            </Group>
            <div className="px-4 pb-[calc(24px+var(--safe-bottom))] pt-6">
              <Button disabled={!roadType} onClick={() => go('photo')}>
                写真を撮る
              </Button>
              {!roadType && <ButtonNote>見つけたものを選ぶと進めます</ButtonNote>}
            </div>
          </m.section>
        )}

        {/* ───────── 1. 写真（全画面の黒い舞台。ライトでも黒） ───────── */}
        {step === 'photo' && (
          <m.div
            key="photo"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="fixed inset-0 z-40 mx-auto flex w-full max-w-[480px] flex-col bg-black text-white"
          >
            <div className="pt-safe shrink-0">
              <div className="flex h-11 items-center justify-between">
                <button
                  type="button"
                  onClick={roadMode ? () => go('road') : leave}
                  aria-label={roadMode ? '戻る' : '閉じる'}
                  className="grid h-11 w-11 place-items-center text-white active:opacity-60"
                >
                  {roadMode ? <IconCaretLeft size={24} /> : <IconX size={24} />}
                </button>
                <div className="flex items-center">
                  <span className="num text-caption text-white/70" aria-label="1段階目（全3段階）">
                    1 / 3
                  </span>
                  <button
                    type="button"
                    onClick={() => setTipsSheet(true)}
                    aria-label="撮影の注意"
                    className="grid h-11 w-11 place-items-center text-white active:opacity-60"
                  >
                    <IconInfo size={24} />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              {processing ? (
                <div className="absolute inset-0 grid place-items-center" role="status" aria-label="写真を読み込んでいます">
                  <Spinner size={32} className="text-white/70" />
                </div>
              ) : photoUrl ? (
                <img src={photoUrl} alt="撮影した写真" className="photo absolute inset-0 h-full w-full object-contain" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <p className="text-callout text-white/70">近づきすぎず、ズームで撮ろう</p>
                  <p className="mt-2 text-sub text-white/[.55]">
                    <span className="phrase">
                      夜行性の生き物に<wbr />
                      フラッシュを<wbr />
                      向けすぎないでください
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="h-[calc(120px+var(--safe-bottom))] shrink-0 px-4 pb-[var(--safe-bottom)]">
              {photoUrl && !processing ? (
                <div className="flex h-full items-center gap-2">
                  <Button variant="on-stage" className="flex-1" onClick={retake}>
                    撮り直す
                  </Button>
                  <Button className="flex-1" onClick={afterPhoto}>
                    この写真で進む
                  </Button>
                </div>
              ) : (
                <div className="grid h-full grid-cols-3 items-center">
                  <button
                    type="button"
                    onClick={() => libraryRef.current?.click()}
                    disabled={processing}
                    className="flex flex-col items-center gap-1.5 justify-self-start text-white active:opacity-60"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-xs bg-white/[.14]">
                      <IconImageSquare size={24} />
                    </span>
                    <span className="text-caption text-white/70">アルバム</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    disabled={processing}
                    aria-label="カメラで撮る"
                    className="relative grid h-[80px] w-[80px] place-items-center justify-self-center rounded-full border-[5px] border-white bg-capture text-white shadow-[0_4px_0_rgb(var(--c-capture-edge))] transition-transform duration-75 active:translate-y-[3px]"
                  >
                    <span aria-hidden className="absolute inset-[-5px] animate-ring-pulse rounded-full border-4 border-capture" />
                    <IconCameraFill size={34} />
                  </button>
                  <Button variant="text" size="hit" className="justify-self-end text-white" disabled={processing} onClick={afterPhoto}>
                    写真なしで記録
                  </Button>
                </div>
              )}
            </div>
          </m.div>
        )}

        {/* ───────── 2. 名前 ───────── */}
        {step === 'identify' && (
          <m.section
            key="identify"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="pb-[calc(32px+var(--safe-bottom))]"
          >
            <ScreenHeader variant="nav" title="名前を選ぶ" onBack={() => go('photo')} right={<StepCount n={2} />} />
            {photoUrl && <img src={photoUrl} alt="撮影した写真" className="photo ml-4 mt-2 h-[72px] w-[72px] rounded-xs object-cover" />}
            <div className="px-4 pt-3">
              <SearchField value={query} onChange={setQuery} aria-label="生き物の名前で探す" />
            </div>
            <ChipRow className="mt-3">
              {CATEGORY_ORDER.map((c) => (
                <Chip
                  key={c}
                  selected={cat === c}
                  icon={TYPE_META[c].icon}
                  onClick={() => setCat(cat === c ? null : c)}
                  className={cn(cat === c && [TYPE_META[c].bg, 'border-transparent shadow-[0_3px_0_rgb(0_0_0/.25)]'])}
                  aria-label={CATEGORY_META[c].label}
                >
                  {TYPE_META[c].label}
                </Chip>
              ))}
            </ChipRow>

            {photo &&
              (ai.loading || ai.candidates ? (
                <>
                  <SectionHeader title="AIの候補" />
                  <div>
                    {ai.loading ? (
                      <ListRow icon={Spinner} title="AIが調べています" />
                    ) : (
                      ai.candidates!.map((c) => {
                        const sp = SPECIES_BY_ID[c.speciesId];
                        if (!sp)
                          return (
                            <Notice key={`unknown-${c.speciesId}`} className="py-3">
                              {`図鑑の中からは特定できませんでした。${c.reason}`}
                            </Notice>
                          );
                        return speciesRow(
                          sp,
                          <span className="shrink-0 whitespace-nowrap text-sub text-fg-2">
                            確からしさ <span className="num">{Math.round(c.confidence * 100)}%</span>
                          </span>,
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  <ListRow
                    icon={IconScan}
                    title="AIで名前を調べる"
                    subtitle={plus ? '1日30回まで' : '1日1回まで無料（Plusは1日30回）'}
                    chevron
                    onClick={runAi}
                  />
                </div>
              ))}

            {query ? (
              <div className="mt-2">
                {list.length === 0 && <EmptyState title="該当する生き物はいません" body="図鑑にない生き物は、いちばん下から記録できます" />}
                {list.map((sp) => speciesRow(sp))}
                <ListRow title="わからない・あとで調べる" subtitle="図鑑にない生き物も記録できます" chevron onClick={() => choose(null)} />
              </div>
            ) : (
              <>
                {inSeason.length > 0 && (
                  <>
                    <SectionHeader title="この季節に多い生き物" />
                    <div>{inSeason.map((sp) => speciesRow(sp))}</div>
                  </>
                )}
                <SectionHeader title={inSeason.length > 0 ? 'そのほかの生き物' : '生き物'} />
                <div>
                  {offSeason.map((sp) => speciesRow(sp))}
                  <ListRow title="わからない・あとで調べる" subtitle="図鑑にない生き物も記録できます" chevron onClick={() => choose(null)} />
                </div>
              </>
            )}
          </m.section>
        )}

        {/* ───────── 3. 記録 ───────── */}
        {step === 'details' && (
          <m.section key="details" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
            <ScreenHeader
              variant="nav"
              title={roadMode ? '路上レポート' : '記録する'}
              onBack={() => go('identify')}
              right={<StepCount n={3} />}
            />
            <div className="flex items-center gap-3 px-4 pt-2">
              {photoUrl ? (
                <img src={photoUrl} alt="撮影した写真" className="photo h-[72px] w-[72px] shrink-0 rounded-xs object-cover" />
              ) : species ? (
                <SpeciesPlate species={species} discovered={collection.has(species.id)} showReference patternSize="thumb" className="h-[72px] w-[72px] shrink-0 rounded-xs" />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="text-headline text-fg">{species ? <SpeciesName species={species} /> : '図鑑にない生き物'}</div>
                {species && <SciName sci={species.sci} className="mt-0.5 block text-sub leading-[18px]" />}
              </div>
              <Button variant="text" size="hit" className="-mr-1 shrink-0" onClick={() => go('identify')}>
                変更
              </Button>
            </div>

            {speciesId === null && (
              <div className="px-4 pt-6">
                <Field label="わかる範囲の名前">
                  <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例：青いトンボ、白い花" maxLength={40} />
                </Field>
              </div>
            )}

            {!rescue && (
              <div className="pt-6">
                <div className="px-4">
                  <Field label="ニックネーム">
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder={species ? `例：${ideas[0]}` : '例：なぞのいきもの1号'}
                      maxLength={24}
                      trailing={
                        species ? (
                          <button
                            type="button"
                            onClick={() => {
                              const next = seed + 1;
                              setSeed(next);
                              setNickname(nicknameIdeas(species, next)[0]);
                            }}
                            aria-label="ニックネームの候補を変える"
                            className="grid h-10 w-10 place-items-center rounded-sm text-fg-2 active:bg-fill-strong"
                          >
                            <IconDiceFive size={20} />
                          </button>
                        ) : undefined
                      }
                    />
                  </Field>
                </div>
                {ideas.length > 0 && (
                  <ChipRow className="mt-3">
                    {ideas.map((n) => (
                      <Chip key={n} selected={nickname === n} onClick={() => setNickname(n)}>
                        {n}
                      </Chip>
                    ))}
                  </ChipRow>
                )}
              </div>
            )}

            <Group className="mt-6">
              <DateTimeRow value={observedAt} onChange={setObservedAt} min={toLocalInput(oldestObserved())} max={toLocalInput(new Date())} />
              {/* 地域: select を行に重ねる（行には市町村名だけを出す）。右端は現在地から設定 */}
              <div className="group/row relative flex pl-4">
                <div className="flex min-h-12 min-w-0 flex-1 items-center gap-1 border-b border-sep pr-1 group-last/row:border-b-0">
                  <div className="relative flex min-w-0 flex-1 items-center gap-3 self-stretch rounded-sm py-2.5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                    <span className="w-24 shrink-0 text-callout text-fg-2">地域</span>
                    <span className={cn('min-w-0 flex-1 text-callout', area ? 'text-fg' : 'text-fg-3')}>{area?.name ?? '未設定'}</span>
                    <select
                      value={areaId ?? ''}
                      onChange={(e) => setAreaId(e.target.value || null)}
                      aria-label="地域"
                      className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
                    >
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
                  </div>
                  <button
                    type="button"
                    onClick={locate}
                    disabled={locating}
                    aria-label="現在地から設定"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-brand active:bg-fill-strong"
                  >
                    {locating ? <Spinner size={20} /> : <IconGpsFix size={20} />}
                  </button>
                </div>
              </div>
              <label className="group/row flex rounded-b-md pl-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand">
                <span className="flex min-w-0 flex-1 items-start gap-3 py-3 pr-4">
                  <span className="w-24 shrink-0 text-callout text-fg-2">メモ</span>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    cols={1}
                    placeholder={rescue ? '状況（車線、時間帯、個体の様子など）' : '見たときの様子（任意）'}
                    maxLength={500}
                    className="block min-h-[66px] min-w-0 flex-1 resize-none bg-transparent text-input leading-[22px] text-fg outline-none placeholder:text-fg-3 focus-visible:outline-none"
                  />
                </span>
              </label>
            </Group>

            <div className="pb-4 pt-4">
              {roadType ? (
                <Notice icon={IconMapPin}>
                  {`${coords ? '正確な位置を記録しました。' : '地域の行の現在地ボタンで正確な位置を記録すると、対策に役立ちます。'}正確な位置は行政・保護機関との共有用で、アプリ内や共有画像には表示しません。`}
                </Notice>
              ) : species?.sensitive ? (
                <Notice icon={IconEyeSlash}>
                  {`${species.name}は保護が必要な生き物のため、位置は市町村までしか保存しません。共有画像にも地域名は入りません。`}
                </Notice>
              ) : (
                <Notice>位置は約100mぼかして保存します。共有画像には市町村名だけを表示します。</Notice>
              )}
            </div>
          </m.section>
        )}
      </AnimatePresence>

      {step === 'details' && (
        <CtaBar>
          <Button variant={roadType ? 'danger' : 'primary'} onClick={save} aria-busy={saving}>
            {saving && <Spinner size={20} />}
            {roadType ? '送信する' : '図鑑に記録する'}
          </Button>
        </CtaBar>
      )}

      {/* 撮影の注意（1 段階目の右上の info） */}
      <Sheet open={tipsSheet} onClose={() => setTipsSheet(false)} title="撮影するときの注意">
        <div className="-mx-4">
          <ListRow
            icon={IconFlashlight}
            title="フラッシュを向けすぎない"
            subtitle={<Phrase text="夜行性の生き物は強い光に驚きます。ライトも当て続けないでください。" />}
          />
          <ListRow icon={IconFrameCorners} title="近づきすぎず、ズームで撮る" subtitle={<Phrase text="生き物を驚かせない距離から撮りましょう。" />} />
          <ListRow icon={IconMicrophone} title="写真なしでも記録できます" subtitle={<Phrase text="鳴き声を聞いた、暗くて撮れなかったときに。" />} />
        </div>
      </Sheet>

      <Sheet open={aiSheet} onClose={() => setAiSheet(false)} title="AI判定は AMAMI NATURE+ の機能です">
        <p className="text-body text-fg-2">
          {account.mode === 'line'
            ? '今日の無料回数を使い切りました。AMAMI NATURE+ なら1日30回まで、旅のあいだ何度でも名前を調べられます。'
            : 'AI判定は、LINE公式アカウントから開いたときに使えます（1日1回無料）。AMAMI NATURE+ なら1日30回まで調べられます。'}
        </p>
        <div className="mt-5 grid gap-2">
          <Button onClick={() => navigate('/plus')}>AMAMI NATURE+ を見る</Button>
          <Button variant="text" size="hit" onClick={() => setAiSheet(false)}>
            図鑑から自分で選ぶ
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
