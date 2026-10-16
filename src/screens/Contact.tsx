import { useEffect } from 'react';
import { IconChatCircle, IconCopy, IconEnvelopeSimple, IconFileText, IconShieldCheck } from '../components/icons';
import { Button, button, ButtonNote, Group, ListRow, Notice, ScreenHeader, SectionHeader, toast } from '../components/ui';
import { CONTACT } from '../data/consentTexts';
import { COMPANY, fillCompany } from '../data/company';
import { useStore } from '../store/useStore';

const ADD_FRIEND_URL = (import.meta.env.VITE_LINE_ADD_FRIEND_URL as string | undefined) ?? '';

/** お問い合わせ（メール・LINE）。開示・訂正・利用停止・削除の請求もここで受け付ける */
export default function Contact() {
  const account = useStore((s) => s.account);
  const code = account.mode === 'line' ? (account.me?.supportCode ?? null) : null;

  useEffect(() => {
    document.title = CONTACT.title;
  }, []);

  const mailto = COMPANY.email
    ? `mailto:${COMPANY.email}?subject=${encodeURIComponent('AMAMI NATURE お問い合わせ')}&body=${encodeURIComponent(
        `お問い合わせ番号：${code ?? '（デモモード）'}\n\n（お問い合わせの内容をお書きください）\n`,
      )}`
    : null;

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success('お問い合わせ番号をコピーしました');
    } catch {
      toast('コピーできませんでした。番号を書き写してください');
    }
  };

  return (
    <main className="min-h-dvh pb-[calc(32px+var(--safe-bottom))]">
      <ScreenHeader variant="nav" title={CONTACT.title} />
      <p className="prose whitespace-pre-line px-4 pt-2 text-body text-fg-2">{fillCompany(CONTACT.intro)}</p>
      {CONTACT.items.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-9 pr-4 text-body text-fg-2 marker:text-fg-3">
          {CONTACT.items.map((it) => (
            <li key={it}>{fillCompany(it)}</li>
          ))}
        </ul>
      )}

      {/* お問い合わせ番号（運営がアカウントを探すため） */}
      <SectionHeader title="お問い合わせ番号" />
      {code ? (
        <div className="panel mx-4 flex items-center gap-3 p-3">
          <span className="num min-w-0 flex-1 text-[24px] tracking-[1px] text-fg" aria-label={`お問い合わせ番号 ${code.split('').join(' ')}`}>
            {code}
          </span>
          <Button variant="secondary" size="md" className="h-10 px-2" onClick={copy}>
            <IconCopy size={18} />
            コピー
          </Button>
        </div>
      ) : (
        <Notice>
          {account.mode === 'line'
            ? '番号を読み込んでいます。電波の良い場所でひらき直してください。'
            : 'デモモードでは、記録はこの端末にだけ保存されていて、運営は持っていません。消すときは、マイページの「この端末のデータを消去」を使ってください。'}
        </Notice>
      )}
      {code && <p className="prose mt-2 px-4 text-sub text-fg-2">{fillCompany(CONTACT.codeNote)}</p>}

      <SectionHeader title="連絡先" />
      <div className="px-4">
        {mailto ? (
          <a href={mailto} className={button({ variant: 'primary', size: 'lg' })}>
            <IconEnvelopeSimple size={20} />
            メールで問い合わせる
          </a>
        ) : (
          <>
            <Button disabled>
              <IconEnvelopeSimple size={20} />
              メールで問い合わせる
            </Button>
            <ButtonNote>メールアドレスは準備中です</ButtonNote>
          </>
        )}
        {COMPANY.email && <p className="mt-2 text-center text-sub text-fg-2 break-all">{COMPANY.email}</p>}
        {ADD_FRIEND_URL && (
          <Button variant="line" className="mt-3" onClick={() => window.open(ADD_FRIEND_URL, '_blank', 'noopener')}>
            <IconChatCircle size={20} />
            LINE のトークで問い合わせる
          </Button>
        )}
      </div>

      <SectionHeader title={CONTACT.requestsTitle} />
      <p className="prose whitespace-pre-line px-4 text-body text-fg-2">{fillCompany(CONTACT.requests)}</p>

      <Group className="mt-6">
        <ListRow icon={IconFileText} title="利用規約" chevron to="/terms" />
        <ListRow icon={IconShieldCheck} title="プライバシーポリシー" chevron to="/privacy" />
      </Group>
    </main>
  );
}
