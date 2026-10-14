import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconFileText, IconShieldCheck } from '../components/icons';
import { Phrase } from '../components/Phrase';
import { Button, Group, ListRow, Notice, ScreenHeader, Sheet } from '../components/ui';
import { RECONSENT } from '../data/consentTexts';
import { COMPANY, fillCompany, LEGAL_DRAFT } from '../data/company';
import { PRIVACY_VERSION, TERMS_VERSION } from '../data/legalVersions';
import { PRIVACY_DOC, TERMS_DOC, type LegalDoc } from '../data/legalTexts';
import { api } from '../lib/api';
import { useStore } from '../store/useStore';

export type LegalKind = 'terms' | 'privacy';

const DOCS: Record<LegalKind, { doc: LegalDoc; version: string }> = {
  terms: { doc: TERMS_DOC, version: TERMS_VERSION },
  privacy: { doc: PRIVACY_DOC, version: PRIVACY_VERSION },
};

/** 版（2026-10-14）を「2026年10月14日」に */
function versionLabel(v: string): string {
  const [y, m, d] = v.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/** 本文（画面とシートの両方で使う） */
export function LegalBody({ kind }: { kind: LegalKind }) {
  const { doc, version } = DOCS[kind];
  return (
    <article className="pb-6">
      <p className="px-4 text-caption text-fg-3">制定・改定 {versionLabel(version)}</p>
      {LEGAL_DRAFT && (
        <Notice kind="caution" className="mt-3">
          この文面は、専門家に確認してもらっている途中の案です。内容は変わることがあります。
        </Notice>
      )}
      <p className="prose mt-4 px-4 text-body text-fg">{fillCompany(doc.intro)}</p>
      {doc.sections.map((s, i) => (
        <section key={s.heading} className="mt-6 px-4" aria-labelledby={`${kind}-${i}`}>
          <h2 id={`${kind}-${i}`} className="text-headline font-black text-fg">
            {s.heading}
          </h2>
          {s.paragraphs.map((p) => (
            <p key={p} className="prose mt-2 whitespace-pre-line text-body text-fg-2">
              {fillCompany(p)}
            </p>
          ))}
          {s.items && s.items.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-body text-fg-2 marker:text-fg-3">
              {s.items.map((it) => (
                <li key={it} className="prose whitespace-pre-line">
                  {fillCompany(it)}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <section className="mt-8 px-4">
        <h2 className="text-headline font-black text-fg">運営者</h2>
        <dl className="mt-2 grid grid-cols-[6.5em_1fr] gap-x-3 gap-y-1 text-body text-fg-2">
          <dt className="text-fg-3">名称</dt>
          <dd>{COMPANY.name}</dd>
          <dt className="text-fg-3">住所</dt>
          <dd>{COMPANY.address || '【会社の住所】'}</dd>
          <dt className="text-fg-3">代表者</dt>
          <dd>{COMPANY.representative || '【代表者名】'}</dd>
          <dt className="text-fg-3">お問い合わせ</dt>
          <dd className="break-all">{COMPANY.email || '【お問い合わせ先メールアドレス】'}</dd>
        </dl>
      </section>
    </article>
  );
}

/** /terms・/privacy（LINE ログインの同意画面や、アプリの外からも開ける） */
export default function Legal({ kind }: { kind: LegalKind }) {
  const { doc } = DOCS[kind];
  useEffect(() => {
    document.title = doc.title;
  }, [doc.title]);
  return (
    <main className="min-h-dvh pb-[calc(32px+var(--safe-bottom))]">
      <ScreenHeader variant="nav" title={doc.title} />
      <LegalBody kind={kind} />
    </main>
  );
}

/** 本文をシートで読む（オンボーディングや再同意の画面から。入力中の内容を残したまま読めるように） */
export function LegalSheet({ kind, onClose }: { kind: LegalKind | null; onClose: () => void }) {
  // 閉じるアニメーションの間も中身を残す
  const [last, setLast] = useState<LegalKind>('terms');
  useEffect(() => {
    if (kind) setLast(kind);
  }, [kind]);
  const shown = kind ?? last;
  return (
    <Sheet open={!!kind} onClose={onClose} title={DOCS[shown].doc.title} snapPoints={[1]}>
      <div className="-mx-4">
        <LegalBody kind={shown} />
      </div>
    </Sheet>
  );
}

/** 同意の記録（端末と、LINE モードならサーバー） */
export function recordConsent() {
  const consent = { terms: TERMS_VERSION, privacy: PRIVACY_VERSION };
  const { updateSettings, account } = useStore.getState();
  updateSettings({ consent: { ...consent, at: new Date().toISOString() } });
  // 送れなくても、次の同期で送る（sync.ts の syncConsents）
  if (account.mode === 'line') void api.updateMe({ consent }).catch(() => undefined);
}

/**
 * 利用規約・プライバシーポリシーを改定した後、最初に開いた時の画面。同意するまでアプリは使えない
 * （利用規約・プライバシーポリシー・お問い合わせは開ける）
 */
export function ConsentUpdate() {
  const [reading, setReading] = useState<LegalKind | null>(null);
  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-page px-4 pb-[calc(24px+var(--safe-bottom))] pt-[calc(32px+var(--safe-top))]">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
        <IconShieldCheck size={36} />
      </span>
      <h1 className="balance mt-4 text-center text-title font-black text-fg">
        <Phrase text={RECONSENT.title} />
      </h1>
      <p className="prose mt-3 whitespace-pre-line text-body text-fg-2">{RECONSENT.body}</p>
      <Group className="-mx-4 mt-5">
        <ListRow icon={IconFileText} title="利用規約" chevron onClick={() => setReading('terms')} />
        <ListRow icon={IconShieldCheck} title="プライバシーポリシー" chevron onClick={() => setReading('privacy')} />
      </Group>
      <div className="mt-auto pt-8">
        <Button onClick={recordConsent}>{RECONSENT.agree}</Button>
        <p className="mt-3 text-center text-sub text-fg-2">
          同意いただけない場合は、
          <Link to="/contact" className="font-bold text-brand underline underline-offset-2">
            お問い合わせ
          </Link>
          から退会・データの削除を受け付けます
        </p>
      </div>
      <LegalSheet kind={reading} onClose={() => setReading(null)} />
    </main>
  );
}
