# LINE公式アカウント × Cloudflare 公開手順

所要時間の目安：初回 1〜2時間。必要なもの：LINEビジネスID、Cloudflareアカウント、Claude APIキー（AI判定を使う場合）。

## 0. 全体像

```
LINEアプリ
 ├─ トーク（公式アカウント） ── Webhook ──▶ Cloudflare Worker  /api/line/webhook
 │    └─ リッチメニュー ──────────────▶ LIFF（https://liff.line.me/<LIFF_ID>/...）
 └─ LIFF（アプリ画面） ─────────────────▶ Cloudflare Worker  （静的配信 + /api/*）
                                              ├─ D1：ユーザー・記録・路上レポート・ポイント
                                              ├─ R2：写真・共有カード・トークで受け取った写真
                                              └─ Claude API：AI判定
```

> **重要**：Messaging APIチャネルとLINEログインチャネルは**同じプロバイダー**に作成してください。
> 同じプロバイダー配下ならユーザーIDが一致し、「トークに送った写真 → LIFFで記録」がつながります。

## 1. LINE Developers の設定

1. [LINE Developers](https://developers.line.biz/) でプロバイダー「Amalink」を作成
2. **Messaging API チャネル**（＝LINE公式アカウント）を作成
   - チャネルシークレット → `LINE_CHANNEL_SECRET`
   - チャネルアクセストークン（長期）を発行 → `LINE_CHANNEL_ACCESS_TOKEN`
   - LINE Official Account Manager で「応答メッセージ」をオフ、「Webhook」をオン
3. **LINEログイン チャネル**を同じプロバイダーに作成
   - チャネルID → `LINE_LOGIN_CHANNEL_ID`
   - 「リンクされたLINE公式アカウント」に手順2のアカウントを設定
4. LINEログインチャネルに **LIFFアプリ**を追加
   - サイズ：Full ／ エンドポイントURL：`https://<デプロイ先>/` ／ Scope：`openid`, `profile`
   - 友だち追加オプション：On（Aggressive）
   - 発行された LIFF ID → `LIFF_ID`（Worker の vars）と `VITE_LIFF_ID`（ビルド時の環境変数）

## 2. Cloudflare の準備

```bash
npx wrangler login
npx wrangler d1 create amami-nature              # 表示された database_id を wrangler.toml に記入
npx wrangler r2 bucket create amami-nature-photos
npx wrangler d1 migrations apply amami-nature --remote

npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put SESSION_SECRET            # 32文字以上のランダム文字列（例: openssl rand -hex 32）
npx wrangler secret put ANTHROPIC_API_KEY
```

`wrangler.toml` の `[vars]` に `LIFF_ID` / `LINE_LOGIN_CHANNEL_ID` / `PUBLIC_BASE_URL` を記入します。
課金（Stripe）を本番化するまでは `DEMO_PLUS = "true"`（Plusを無料体験として有効化できる）。

### R2 のライフサイクル（推奨）

トークで受け取った写真（`inbox/` 配下）は記録に使われなければ不要なので、7日で自動削除します。

```bash
npx wrangler r2 bucket lifecycle add amami-nature-photos inbox-expire inbox/ --expire-days 7
```

## 3. ビルドとデプロイ

```bash
VITE_LIFF_ID=<LIFF_ID> VITE_LINE_ADD_FRIEND_URL=https://lin.ee/xxxxxxx npm run build
# 新しい Worker が使う表・列を先に作る（worker/migrations のうち、まだ当てていないものだけが当たる）
npm run db:migrate:remote
npx wrangler deploy
```

（`npm run deploy` は build → db:migrate:remote → wrangler deploy をまとめて行う。VITE_* は環境変数で渡す）

デプロイ後、LINE Developers の Messaging API 設定で **Webhook URL** を
`https://<デプロイ先>/api/line/webhook` に設定し、「検証」→ 成功を確認、「Webhookの利用」をオン。

## 4. リッチメニュー

```bash
LINE_CHANNEL_ACCESS_TOKEN=... LIFF_ID=... node scripts/line-richmenu.mjs --deploy
```

`line/richmenu.jpg`（2500×1686）を生成し、6つのボタン（記録する／図鑑／路上レポート／体験・ツアー／ポイント交換／マイページ）を
LIFFの各画面に割り当てて、全ユーザーのデフォルトに設定します。

公式アカウントのプロフィール画像には `line/channel-icon.png` を使えます。

## 5. 提携先（自治体・保護機関）のキー発行

```bash
KEY=$(openssl rand -hex 24)                         # 提携先に安全な方法で渡す
HASH=$(printf %s "$KEY" | shasum -a 256 | cut -d' ' -f1)
npx wrangler d1 execute amami-nature --remote --command \
  "INSERT INTO partners (id, name, api_key_hash, scope, created_at) VALUES ('yamato', '大和村', '$HASH', 'yamato', datetime('now'))"
```

`scope` は `all` または市町村IDのカンマ区切り（`amami,yamato,uken` など）。提携先はアプリの
「マイページ → 自治体・保護団体の方へ」でキーを入力すると、範囲内の実データ（正確な位置つきの路上レポートを含む）を見られます。

## 6. 公開前チェックリスト

- [ ] 図鑑データの監修（docs/BUSINESS_PLAN.md「監修体制」）
- [ ] 利用規約・プライバシーポリシー（位置情報を行政・保護機関に提供する旨と範囲）
- [ ] `DEV_AUTH` が本番の環境変数に**存在しない**こと
- [ ] Webhook の署名検証が通ること（LINE Developers の「検証」）
- [ ] 景品・抽選の運用ルールの専門家確認（景品表示法）
- [ ] 送客の契約形態の確認（旅行業法）
- [ ] Stripe 本番化と `DEMO_PLUS = "false"`
