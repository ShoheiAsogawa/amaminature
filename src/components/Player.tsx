import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { useProgress } from '../store/useProgress';
import { useStore } from '../store/useStore';
import { CoinCount, LevelBadge, XPBar } from './game';
import { IconUser } from './icons';
import { usePhotoUrl } from './PhotoImg';

/** プレイヤーの名前（未設定なら「レンジャー」） */
export function usePlayerName(): string {
  return useStore((s) => s.settings.name) || 'レンジャー';
}

/** アバター: 利用者の最初の記録の写真。なければ LINE のプロフィール画像、それもなければ人のアイコン */
export function PlayerAvatar({ size = 64, className }: { size?: number; className?: string }) {
  const sightings = useStore((s) => s.sightings);
  const pictureUrl = useStore((s) => s.account.pictureUrl);
  const firstPhotoId = [...sightings].reverse().find((s) => s.photoId)?.photoId ?? null;
  const url = usePhotoUrl(firstPhotoId, 'thumb');
  const src = url ?? (firstPhotoId ? null : pictureUrl);
  const box = cn('shrink-0 rounded-full border-[3px] border-white bg-brand-soft shadow-[0_0_0_2px_rgb(var(--c-line))]', className);
  if (src) return <img src={src} alt="" className={cn('photo object-cover', box)} style={{ width: size, height: size }} draggable={false} />;
  return (
    <span className={cn('grid place-items-center text-brand', box)} style={{ width: size, height: size }}>
      <IconUser size={Math.round(size * 0.5)} />
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
    <div className={cn('panel p-3.5', className)}>
      <div className="flex items-center gap-3">
        <Link to="/me" className="flex min-w-0 flex-1 items-center gap-3 active:opacity-80">
          <span className="relative shrink-0">
            <PlayerAvatar size={60} />
            <LevelBadge level={level.level} size={34} className="absolute -bottom-1.5 -right-2" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-headline font-black text-fg">{name}</span>
            <span className="mt-0.5 inline-flex max-w-full items-center rounded-full bg-brand-soft px-2 py-[1px] text-caption text-brand">
              <span className="truncate">{rank.current.title}</span>
            </span>
          </span>
        </Link>
        <Link
          to="/rewards"
          aria-label={`ポイント ${balance}pt。ポイント交換へ`}
          className="pressable flex h-10 shrink-0 items-center rounded-full border-2 border-gold-edge/40 bg-gold-soft pl-1.5 pr-3 shadow-[0_3px_0_rgb(var(--c-gold-edge)/.5)]"
        >
          <CoinCount value={balance} size={24} numClassName="text-[18px] leading-none text-fg" />
        </Link>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="num shrink-0 text-[13px] text-fg-2">Lv.{level.level}</span>
        <XPBar value={level.progress} id="hud-xp" label={`レベル ${level.level}。次のレベルまで ${level.toNext}pt`} className="flex-1" />
        <span className="shrink-0 text-caption text-fg-3">
          {level.next ? (
            <>
              あと<span className="num px-0.5 text-[13px] text-fg-2">{level.toNext}</span>pt
            </>
          ) : (
            'MAX'
          )}
        </span>
      </div>
    </div>
  );
}
