import { useState } from 'react';
import { IconDeviceMobile, IconGauge, IconLightbulb, IconWarning } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { Button, CheckMark, CtaBar, Group, ListRow, Num, ScreenHeader, SectionHeader, toast } from '../components/ui';
import { api } from '../lib/api';
import { SAFE_DRIVE_POINTS } from '../lib/progress';
import { localDateKey, useStore } from '../store/useStore';

/** 固定 CTA バー（ボタン 50 ＋ 理由 1 行）の分だけ本文の下を空ける */
const CTA_WITH_NOTE_PADDING = 'pb-[calc(118px+var(--safe-bottom))]';

const CHECKS = [
  { icon: IconGauge, text: '林道では時速20〜30km程度でゆっくり走ります' },
  { icon: IconLightbulb, text: '生き物を見つけてもライトを当て続けず、すぐに通り過ぎます' },
  { icon: IconDeviceMobile, text: '運転中はスマホを操作しません。記録は停車してから、または同乗者が行います' },
  { icon: IconWarning, text: '路上の生き物には、後続車に注意して停車か徐行をし、道をゆずります' },
];

export default function SafeDrive() {
  const declared = useStore((s) => s.settings.safeDriveDates.includes(localDateKey()));
  const total = useStore((s) => s.settings.safeDriveDates.length);
  const declareSafeDrive = useStore((s) => s.declareSafeDrive);
  const lineMode = useStore((s) => s.account.mode === 'line');
  const [checked, setChecked] = useState<boolean[]>(CHECKS.map(() => declared));
  const [busy, setBusy] = useState(false);
  const all = checked.every(Boolean);

  const declare = async () => {
    setBusy(true);
    try {
      if (lineMode) await api.safeDrive().catch(() => undefined);
      if (declareSafeDrive()) toast.success(`宣言しました。+${SAFE_DRIVE_POINTS}pt`);
    } finally {
      setBusy(false);
    }
  };

  const note = declared
    ? '今日は宣言済みです。明日また宣言できます'
    : all
      ? `宣言は1日1回、${SAFE_DRIVE_POINTS}ptもらえます`
      : `${CHECKS.length}つすべてにチェックすると宣言できます`;

  return (
    <main className={`min-h-dvh ${CTA_WITH_NOTE_PADDING}`}>
      <ScreenHeader variant="nav" title="セーフドライブ宣言" />

      <section className="px-4 pt-2">
        <h2 className="balance text-title text-fg">
          <Phrase text="夜の道は、生き物たちの道でもある" />
        </h2>
        <p className="mt-2 text-body text-fg-2">
          <Phrase text="奄美大島・徳之島では、アマミノクロウサギの交通事故が毎年多く確認されています。ゆっくり走れば、事故を防げるだけでなく、生き物に出会えるチャンスも増えます。" />
        </p>
        <p className="mt-4 flex items-baseline gap-3 text-callout text-fg">
          <span>これまでの宣言</span>
          <Num value={total} unit="回" />
        </p>
      </section>

      <SectionHeader title="出発前のチェック" />
      <Group>
        {CHECKS.map((c, i) => (
          <ListRow
            key={c.text}
            icon={c.icon}
            title={c.text}
            role="checkbox"
            aria-checked={checked[i]}
            trailing={<CheckMark checked={checked[i]} />}
            onClick={declared ? undefined : () => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
          />
        ))}
      </Group>

      <CtaBar note={note}>
        <Button disabled={!all || declared || busy} onClick={declare}>
          宣言して出発する
        </Button>
      </CtaBar>
    </main>
  );
}
