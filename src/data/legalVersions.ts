/**
 * 利用規約・プライバシーポリシー・路上レポートの位置の提供・AI判定の写真の送信への同意の版。
 * 文面を変えたら日付を上げる（利用者に改定を知らせ、もう一度同意してもらう）。
 * サーバー（worker）も路上レポートの同意の確認に使う。
 */
export const TERMS_VERSION = '2026-10-14';
export const PRIVACY_VERSION = '2026-10-15';
export const ROAD_CONSENT_VERSION = '2026-10-14';
/** AI判定で写真を外国（米国）の事業者に送ることへの同意（個人情報保護法 28 条） */
export const AI_CONSENT_VERSION = '2026-10-15';
