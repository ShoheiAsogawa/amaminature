# AMAMI NATURE — 奄美いきものコレクション

奄美群島で出会った生き物を **LINEで撮って・名前をつけて・集める** 図鑑サービス。
観光客と住民の記録を、ロードキル対策や生物調査のデータにもつなげます。運営：株式会社アマリンク（Amalink）。

- 事業計画・マネタイズ戦略 → [docs/BUSINESS_PLAN.md](docs/BUSINESS_PLAN.md)
- LINE公式アカウント・Cloudflareへの公開手順 → [docs/LINE_SETUP.md](docs/LINE_SETUP.md)

## できること

| 画面 | 内容 |
|---|---|
| ホーム | 図鑑の進み具合・ランク・ポイント、今月出会える生き物、開催中のクエスト、最近の記録、おすすめ体験 |
| 記録 | 撮影 → 図鑑から選ぶ（AI判定も可）→ ニックネーム → カード獲得演出。写真なし（声・痕跡）の記録も可 |
| 路上レポート | ロードキル・けが・路上の生き物を報告。正確な位置は行政・保護機関向けにのみ保存 |
| 図鑑 | 62種（哺乳類・鳥類・爬虫両生類・昆虫・海水辺・植物）。検索、分類・発見状況で絞り込み |
| 種の詳細 | 解説・分布・見ごろカレンダー・観察のコツ・マナー・シマの話・この生き物に会える体験 |
| 体験 | ツアー掲載（送客）、12市町村スタンプラリー、観察マナー |
| マイページ | バッジ16種、ポイント交換、AMAMI NATURE+、表示モード（夜の森＝ダーク）、バックアップ |
| 自治体・保護団体向け | 市町村別・時間帯別・月別ロードキルのダッシュボード（キーで実データ表示） |
| LINEトーク | 写真を送るとAIが名前の候補を返信 →「この写真で記録」でLIFFへ |

希少種（アマミノクロウサギ、アマミイシカワガエル、ラン類など）は、**端末でもサーバーでも座標を保存しません**。

## 構成

```
src/        LIFFアプリ（React 18 + TypeScript + Vite + Tailwind CSS、PWA対応）
  data/     図鑑62種・12市町村・体験・クエスト・景品
  lib/      ポイント/バッジ計算・位置の保護・画像処理・API/LIFFクライアント
  store/    状態管理（zustand）とオフラインファーストのサーバー同期
  screens/  各画面
worker/     Cloudflare Workers（Hono）：API・LINE Webhook・AI判定（Claude）・提携先API
  migrations/  D1スキーマ
scripts/    アイコン/リッチメニュー生成、スクリーンショット、APIスモークテスト、E2E
tests/      ユニットテスト（Vitest）
line/       リッチメニュー画像・チャネルアイコン
```

ポイント・バッジ・クエストの計算（`src/lib/progress.ts`）と位置の保護（`src/lib/geo.ts`）は、
アプリとWorkerで**同じコードを共有**しています（景品交換はサーバー側の計算が正）。

## 開発

```bash
npm install

# フロントだけ（デモモード：端末内保存のみ）
npm run dev

# API込み（ローカルD1/R2）
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply amami-nature --local
npm run build && npm run dev:worker      # http://127.0.0.1:8787
```

LINEの外（ブラウザ）で開くと「デモモード」で動きます。`VITE_LIFF_ID` を設定してLINEから開くと、
LINEログイン → クラウド同期 → AI判定・ポイント交換が有効になります。

## テスト

```bash
npm run typecheck          # アプリ + Worker の型チェック
npm test                   # ユニットテスト（ポイント・クエスト・位置保護・署名検証・入力検証など）
node scripts/smoke-api.mjs # APIスモークテスト（wrangler dev 起動中に）
node scripts/e2e-capture.mjs  # ブラウザで 撮影→記録→同期→別端末で表示 を通しで確認
```

## デモビルド（LINE外で配る静的版）

```bash
npm run build:demo   # dist-demo/（相対パス・ハッシュルーター）
```
