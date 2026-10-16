import { AI_CONSENT, ROAD_CONSENT } from '../data/consentTexts';
import { AI_CONSENT_VERSION, ROAD_CONSENT_VERSION } from '../data/legalVersions';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';
import { IconMapPin, IconScan, type IconComponent } from './icons';
import { Prose } from './Prose';
import { Button, Sheet } from './ui';

type Decision = { version: string | null } | null | undefined;

/** 路上レポートの正確な位置の提供に、いまの版で同意しているか */
export function hasRoadConsent(c: Decision): boolean {
  return c?.version === ROAD_CONSENT_VERSION;
}

/** AI判定の写真の送信に、いまの版で同意しているか */
export function hasAiConsent(c: Decision): boolean {
  return c?.version === AI_CONSENT_VERSION;
}

/** 同意・撤回を記録する（端末と、LINE モードならサーバー。送れなくても次の同期で送る） */
export function setRoadConsent(agree: boolean) {
  const { updateSettings, account } = useStore.getState();
  const version = agree ? ROAD_CONSENT_VERSION : null;
  updateSettings({ roadConsent: { version, at: new Date().toISOString() } });
  if (account.mode === 'line') void api.updateMe({ roadConsent: version }).catch(() => undefined);
}

/** AI判定は記録画面からすぐサーバーに写真を送るので、サーバーに届くまで待てるよう Promise を返す */
export async function setAiConsent(agree: boolean): Promise<void> {
  const { updateSettings, account } = useStore.getState();
  const version = agree ? AI_CONSENT_VERSION : null;
  updateSettings({ aiConsent: { version, at: new Date().toISOString() } });
  if (account.mode === 'line') await api.updateMe({ aiConsent: version }).catch(() => undefined);
}

type ConsentText = { title: string; body: string; items: string[]; agree: string; decline: string };

/** 同意のシート（本文・箇条書き・2つのボタン）。マイページから開いた時はボタンを「同意する／同意しない（やめる）」にする */
function ConsentSheet({
  text,
  icon: Icon,
  open,
  onClose,
  onDecide,
  settings,
  withdrawLabel,
}: {
  text: ConsentText;
  icon: IconComponent;
  open: boolean;
  onClose: () => void;
  onDecide: (agree: boolean) => void;
  settings?: { agreed: boolean };
  withdrawLabel: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={text.title} snapPoints={[1]}>
      <div className="flex items-start gap-3">
        <span className="px-circle-m grid h-11 w-11 shrink-0 place-items-center bg-brand-soft text-brand">
          <Icon size={24} />
        </span>
        <p className="prose whitespace-pre-line text-body text-fg-2">
          <Prose text={text.body} />
        </p>
      </div>
      {text.items.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-body text-fg-2 marker:text-fg-3">
          {text.items.map((it) => (
            <li key={it} className="prose">
              <Prose text={it} />
            </li>
          ))}
        </ul>
      )}
      <Button className="mt-5" onClick={() => onDecide(true)}>
        {settings ? (settings.agreed ? '同意したままにする' : '同意する') : text.agree}
      </Button>
      <Button variant="secondary" className="mt-2.5" onClick={() => onDecide(false)}>
        {settings ? (settings.agreed ? withdrawLabel : '同意しない') : text.decline}
      </Button>
    </Sheet>
  );
}

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** 押したボタン（true: 同意する / false: 同意しない） */
  onDecide: (agree: boolean) => void;
  /** マイページから開いた時。いま同意しているか */
  settings?: { agreed: boolean };
};

/**
 * 路上レポートの正確な位置を、提携する自治体・保護団体に渡すことへの同意。
 * 最初の路上レポートを送る前（記録画面）と、マイページ（変更・撤回）で使う。
 */
export function RoadConsentSheet(props: SheetProps) {
  return <ConsentSheet {...props} text={ROAD_CONSENT} icon={IconMapPin} withdrawLabel="同意をやめる（これからの報告は市町村まで）" />;
}

/** AI判定で写真を米国の事業者に送ることへの同意。最初に AI判定を使う前（記録画面）と、マイページで使う */
export function AiConsentSheet(props: SheetProps) {
  return <ConsentSheet {...props} text={AI_CONSENT} icon={IconScan} withdrawLabel="同意をやめる（AI判定を使わない）" />;
}
