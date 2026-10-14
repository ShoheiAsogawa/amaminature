/**
 * 運営者の情報（利用規約・プライバシーポリシー・お問い合わせに出す）。
 * 空の項目は画面に「【…】」のまま出る。公開の前に埋めて、`npm run check:legal` で確かめる。
 */
export const COMPANY = {
  name: '株式会社アマリンク',
  /** 本店の住所（登記どおり） */
  address: '',
  /** 代表者の氏名 */
  representative: '',
  /** お問い合わせ・開示等の請求の窓口のメールアドレス */
  email: '',
  /** 返信までの目安（例: 「5営業日以内」） */
  replyTime: '',
  /** 個人情報の取扱いの責任者（部署名や役職でよい） */
  privacyOfficer: '',
  /** 裁判の管轄（例: 「鹿児島地方裁判所」） */
  court: '',
};

/** 利用規約とプライバシーポリシーが弁護士の確認前の案である間は true（画面に「確認中の案」と出す） */
export const LEGAL_DRAFT = true;

/** 文面の中の【…】を、上の情報で置き換える（空なら【…】のまま） */
const PLACEHOLDERS: Record<string, keyof typeof COMPANY> = {
  '【会社の住所】': 'address',
  '【代表者名】': 'representative',
  '【お問い合わせ先メールアドレス】': 'email',
  '【返信の目安】': 'replyTime',
  '【個人情報の取扱いの責任者】': 'privacyOfficer',
  '【会社所在地を管轄する地方裁判所】': 'court',
};

export function fillCompany(text: string): string {
  return text.replace(/【[^】]+】/g, (m) => {
    const key = PLACEHOLDERS[m];
    return key && COMPANY[key] ? COMPANY[key] : m;
  });
}
