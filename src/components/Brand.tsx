/** ブランドマーク：ヒカゲヘゴの若葉（ゼンマイ）と、夜の森を照らす月 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0E2A20" />
      <circle cx="46" cy="17" r="5.5" fill="#C79A2E" />
      <path
        d="M24 55c0-12 .4-19 3.2-25.2 3.4-7.4 12.9-9.6 15.8-3.4 2.3 4.9-1.7 9.4-6 7.6-3.1-1.3-2.9-5.6.4-5.9"
        fill="none"
        stroke="#F6F1E7"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M25.3 41.5c-4.4-.4-8-3-9.4-7.2 4.3-.3 7.8 2.4 9.4 7.2Z" fill="#9CC8B0" />
      <path d="M24.9 49.2c3-3.6 7.6-4.8 11.6-3.1-2.8 3.6-7.4 4.9-11.6 3.1Z" fill="#9CC8B0" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={30} />
      <div className="leading-none">
        <div className={`text-[13px] font-bold tracking-[0.22em] ${light ? 'text-washi' : 'text-ink'}`}>AMAMI NATURE</div>
        <div className={`mt-1 text-[10px] tracking-[0.12em] ${light ? 'text-washi/70' : 'text-ink3'}`}>奄美いきものコレクション</div>
      </div>
    </div>
  );
}
