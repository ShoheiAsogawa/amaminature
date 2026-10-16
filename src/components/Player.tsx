import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { countsForCollection } from '../lib/progress';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';
import { CoinCount, LevelBadge, pxCircleClip, XPBar } from './game';
import { IconUser } from './icons';
import { usePhotoUrl } from './PhotoImg';

/** プレイヤーの名前（未設定なら「レンジャー」） */
export function usePlayerName(): string {
  return useStore((s) => s.settings.name) || 'レンジャー';
}

/**
 * アバター: 利用者の最初の記録の写真。なければ LINE のプロフィール画像、それもなければ人のアイコン。
 * ドット絵の丸：墨の線（size の外に 3px）・白い縁・写真を 1 ドット（3px）ずつ内側に重ねて切り抜く
 */
export function PlayerAvatar({ size = 64, className }: { size?: number; className?: string }) {
  const sightings = useStore((s) => s.sightings);
  const pictureUrl = useStore((s) => s.account.pictureUrl);
  // 交通事故・けがの路上レポートや対象外になった記録の写真は、アバターにしない
  const firstPhotoId = [...sightings].reverse().find((s) => s.photoId && countsForCollection(s) && s.syncState !== 'rejected')?.photoId ?? null;
  const url = usePhotoUrl(firstPhotoId, 'thumb');
  const src = url ?? (firstPhotoId ? null : pictureUrl);
  return (
    <span className={cn('relative block shrink-0', className)} style={{ width: size, height: size }}>
      <span aria-hidden className="absolute -inset-[3px] bg-brand-pressed" style={{ clipPath: pxCircleClip(size + 6) }} />
      <span aria-hidden className="absolute inset-0 bg-white" style={{ clipPath: pxCircleClip(size) }} />
      <span className="absolute inset-[3px] grid place-items-center overflow-hidden bg-brand-soft text-brand" style={{ clipPath: pxCircleClip(size - 6) }}>
        {src ? <img src={src} alt="" className="photo absolute inset-0 h-full w-full object-cover" draggable={false} /> : <IconUser size={Math.round(size * 0.5)} />}
      </span>
    </span>
  );
}

/**
 * プレイヤーの HUD（ゲームのステータス）。アバターとレベル、名前と称号（押すとマイページ）、
 * ポイントのコイン（押すとポイント交換）、次のレベルまでの XP バー。
 */
export function PlayerHud({ className }: { className?: string }) {
  const name = usePlayerName();
  const { level, rank, balance } = useProgress();
  return (
    <div className={cn('panel p-2.5', className)}>
      <div className="flex items-center gap-3">
        <Link to="/me" className="flex min-w-0 flex-1 items-center gap-3 active:opacity-80">
          <span className="relative shrink-0">
            <PlayerAvatar size={60} />
            <LevelBadge level={level.level} size={34} className="absolute -bottom-1.5 -right-2" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-headline font-black text-fg">{name}</span>
            <span className="px-clip-1 mt-0.5 inline-flex max-w-full items-center bg-brand-soft px-2 py-[1px] text-caption text-brand">
              <span className="truncate">{rank.current.title}</span>
            </span>
          </span>
        </Link>
        <Link
          to="/rewards"
          aria-label={`ポイント ${balance}pt。ポイント交換へ`}
          className="px-pill-gold pressable flex h-10 shrink-0 items-center pl-0.5 pr-2"
        >
          <CoinCount value={balance} size={24} numClassName="text-[18px] leading-none text-fg" />
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="num shrink-0 text-[12px] text-fg-2">Lv.{level.level}</span>
        <XPBar value={level.progress} id="hud-xp" label={`レベル ${level.level}。次のレベルまで ${level.toNext}pt`} className="flex-1" />
        <span className="shrink-0 text-caption text-fg-3">
          {level.next ? (
            <>
              あと<span className="num px-0.5 text-[12px] text-fg-2">{level.toNext}</span>pt
            </>
          ) : (
            'MAX'
          )}
        </span>
      </div>
    </div>
  );
}
