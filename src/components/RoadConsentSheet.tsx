import { ROAD_CONSENT } from '../data/consentTexts';
import { ROAD_CONSENT_VERSION } from '../data/legalVersions';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { IconMapPin } from './icons';
import { Button, Sheet } from './ui';

/** 路上レポートの正確な位置の提供に、いまの版で同意しているか */
export function hasRoadConsent(c: { version: string | null } | null | undefined): boolean {
  return c?.version === ROAD_CONSENT_VERSION;
}

/** 同意・撤回を記録する（端末と、LINE モードならサーバー。送れなくても次の同期で送る） */
export function setRoadConsent(agree: boolean) {
  const { updateSettings, account } = useStore.getState();
  const version = agree ? ROAD_CONSENT_VERSION : null;
  updateSettings({ roadConsent: { version, at: new Date().toISOString() } });
  if (account.mode === 'line') void api.updateMe({ roadConsent: version }).catch(() => undefined);
}

/**
 * 路上レポートの正確な位置を、提携する自治体・保護団体に渡すことへの同意。
 * 最初の路上レポートを送る前（記録画面）と、マイページ（変更・撤回）で使う。
 */
export function RoadConsentSheet({
  open,
  onClose,
  onDecide,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  /** 押したボタン（true: 同意して位置を送る / false: 位置を送らない） */
  onDecide: (agree: boolean) => void;
  /** マイページから開いた時（ボタンを「同意しない」「同意をやめる」にする）。いま同意しているか */
  settings?: { agreed: boolean };
}) {
  return (
    <Sheet open={open} onClose={onClose} title={ROAD_CONSENT.title} snapPoints={[1]}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
          <IconMapPin size={24} />
        </span>
        <p className="prose whitespace-pre-line text-body text-fg-2">{ROAD_CONSENT.body}</p>
      </div>
      {ROAD_CONSENT.items.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-body text-fg-2 marker:text-fg-3">
          {ROAD_CONSENT.items.map((it) => (
            <li key={it} className="prose">
              {it}
            </li>
          ))}
        </ul>
      )}
      <Button className="mt-5" onClick={() => onDecide(true)}>
        {settings ? (settings.agreed ? '同意したままにする' : '同意する') : ROAD_CONSENT.agree}
      </Button>
      <Button variant="secondary" className="mt-2.5" onClick={() => onDecide(false)}>
        {settings ? (settings.agreed ? '同意をやめる（これからの報告は市町村まで）' : '同意しない') : ROAD_CONSENT.decline}
      </Button>
    </Sheet>
  );
}
