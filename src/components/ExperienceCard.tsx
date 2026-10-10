import { BadgeCheck, Bird, Building2, Clock, ExternalLink, Kayak, MapPin, Moon, Sailboat, Trees } from 'lucide-react';
import { KIND_LABEL } from '../data/experiences';
import type { Experience } from '../data/types';
import { Kasuri, toast, yen } from './ui';

const KIND_STYLE: Record<Experience['kind'], { icon: typeof Moon; bg: string }> = {
  night: { icon: Moon, bg: 'linear-gradient(135deg,#0B1A2E 0%,#1B2F55 60%,#2A4FA3 100%)' },
  forest: { icon: Trees, bg: 'linear-gradient(135deg,#0E2A20 0%,#1E4D3A 60%,#2B6750 100%)' },
  mangrove: { icon: Kayak, bg: 'linear-gradient(135deg,#123B33 0%,#1E6B5C 55%,#5E8F5A 100%)' },
  sea: { icon: Sailboat, bg: 'linear-gradient(135deg,#0B3442 0%,#1E7A8C 60%,#4FB0BE 100%)' },
  bird: { icon: Bird, bg: 'linear-gradient(135deg,#2A2140 0%,#2A4FA3 55%,#8A4B2A 100%)' },
  facility: { icon: Building2, bg: 'linear-gradient(135deg,#3A2B22 0%,#8A4B2A 60%,#B5762A 100%)' },
};

export function ExperienceCard({ exp, compact = false }: { exp: Experience; compact?: boolean }) {
  const style = KIND_STYLE[exp.kind];
  const Icon = style.icon;
  const open = () => {
    if (exp.url) window.open(exp.url, '_blank', 'noopener');
    else toast('提携事業者の予約ページは準備中です（掲載イメージ）');
  };
  return (
    <article className="card overflow-hidden">
      <div className={`relative ${compact ? 'h-24' : 'h-32'} text-white`} style={{ background: style.bg }}>
        <Kasuri className="text-white/[0.07]" />
        <Icon className="absolute right-4 top-4 h-10 w-10 text-white/25" strokeWidth={1.3} />
        <div className="absolute left-4 top-3 flex gap-1.5">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold backdrop-blur">{KIND_LABEL[exp.kind]}</span>
          {exp.certifiedGuide && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold text-forest-950">
              <BadgeCheck className="h-3 w-3" /> 認定ガイド
            </span>
          )}
        </div>
        <h3 className="absolute bottom-3 left-4 right-4 font-serif text-[18px] font-bold leading-snug">{exp.title}</h3>
      </div>
      <div className="p-4">
        {!compact && <p className="text-[13px] leading-relaxed text-ink2">{exp.summary}</p>}
        <div className={`${compact ? '' : 'mt-3'} flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink2`}>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {exp.duration}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {exp.area}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            {exp.priceFrom ? (
              <div className="font-bold">
                <span className="text-[18px]">{yen(exp.priceFrom)}</span>
                <span className="text-[11px] text-ink3"> 〜 / 人（目安）</span>
              </div>
            ) : (
              <div className="text-[11px] text-ink3">{exp.priceNote}</div>
            )}
            <div className="mt-0.5 text-[10px] text-ink3">{exp.provider}</div>
          </div>
          <button onClick={open} className="btn-primary shrink-0 px-4 py-2.5 text-[13px]">
            予約へ <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
