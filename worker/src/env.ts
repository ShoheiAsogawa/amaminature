export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  ASSETS: Fetcher;

  /** LIFFアプリID（例: 2000000000-xxxxxxxx） */
  LIFF_ID: string;
  /** LIFFを置いたLINEログインチャネルのチャネルID（IDトークン検証の client_id） */
  LINE_LOGIN_CHANNEL_ID: string;
  /** 公開URL（共有画像のURL生成用）例: https://amami-nature.example.workers.dev */
  PUBLIC_BASE_URL: string;

  // ── secrets（wrangler secret put） ──
  /** Messaging API チャネルシークレット（Webhook署名検証） */
  LINE_CHANNEL_SECRET: string;
  /** Messaging API チャネルアクセストークン（長期） */
  LINE_CHANNEL_ACCESS_TOKEN: string;
  /** セッショントークン署名用のランダム文字列（32文字以上） */
  SESSION_SECRET: string;
  ANTHROPIC_API_KEY: string;

  /** 'true' のとき決済前の Plus 体験APIを有効にする */
  DEMO_PLUS?: string;
  /** 'true' のときローカル開発用の `Authorization: Dev <userId>` を許可（本番では絶対に設定しない） */
  DEV_AUTH?: string;
}

export type AppEnv = { Bindings: Env; Variables: { userId: string } };
