# AMAMI NATURE デザインシステム「瑠璃の野帳」

- 状態: 確定 v1.0（2026-10-10）
- 位置づけ: UI 刷新の唯一の正典。実装はこの文書に従う。ここにない見た目は足さない。迷ったら §1 の原則と §11「やってはいけないこと」で判断する。
- 対象ファイル: `index.html` / `tailwind.config.js` / `src/styles/index.css` / `vite.config.ts` / `src/components/*` / `src/screens/*` / `src/lib/share.ts` / `src/data/species.ts`（`nameBreak` の追加）/ `src/data/experiences.ts`（`image` の追加）
- 前提: React 18.3 + TypeScript + Vite 6.4 + Tailwind CSS 3.4 + framer-motion 11 + zustand。LINE LIFF（フルサイズ）内で動く。列幅は最大 480px、日本語 UI。

---

## 0. 決定の経緯

### 0.1 3案の採点

観点と重み: (a) クライアントが指摘した AI っぽさ・素人っぽさ（色・箱・書体）を消せるか ×3、(b) 題材と利用者（奄美の旅行者と島民、LINE 内、自治体パートナー）に合うか ×2、(c) 日本語の読みやすさと組版の質 ×2、(d) React 18 / Tailwind 3 / 推奨ライブラリでこのコードベースに実装できるか ×1、(e) 小細工なしで覚えてもらえるか ×2。

| 観点（重み） | A: 瑠璃ネイティブ（LINE ネイティブ） | B: 瑠璃の野帳（フィールドガイド） | C: 標本箱（コレクション） |
|---|---|---|---|
| (a) AI っぽさの除去 ×3 | 8 | **9** | 8 |
| (b) 題材・利用者への適合 ×2 | 7 | **9** | 8 |
| (c) 日本語の読みやすさ・組版 ×2 | 6 | **9** | **9** |
| (d) 実装しやすさ ×1 | **9** | 8 | 7 |
| (e) 独自性（小細工なし） ×2 | 5 | 7 | **9** |
| **合計（満点 100）** | **69** | **85** | **83** |

採点の根拠

- **A（69点）**: 色・カード・明朝は消える。ただし全画面が灰色背景（#F2F2F4）に白い角丸グループで、ダークは iOS の #1C1C1E。これでは「iOS 設定画面の複製」という別の既製品の見た目になる。LINE Seed JP は `palt` が効かずカタカナが詰まらない（社長が嫌う「すかすか」のまま）。500 のウェイトがなく、数字が等幅でないので Figtree を足して 2 書体になる。字幅も広い。LINE の社用書体なので「LINE 公式の機能」に見え、ブランドが埋もれる。
- **B（85点）**: 白いページに区切り線だけのリストを置く。「BOX がダサい」に最も直接に答える。色は瑠璃 1 色、書体は Plex。季節を主役にしたホーム、和名の改行指定、学名の規則、LINE グリーンを LINE の操作だけに限定、パートナー画面まで具体的。弱点は島の地図に GIS データが要ることと、大胆な要素がやや控えめなこと。
- **C（83点）**: いちばん記憶に残る。レア度を「泥染・夜光貝・金箔」という奄美の素材で表し、バッジを印影にした。ただし全画面を灰色背景＋白グループで組むので箱っぽさが残る。素材の縁のグラデーションは、カード以外に漏れると装飾のグラデーションに逆戻りする。ホームの冒頭に写真ヒーローを置くが、このリポジトリには種の写真が 1 枚もない（`public/` はアイコンのみ）。500 ウェイトの分、読み込みも重い。

### 0.2 採用案

**B「瑠璃の野帳」を土台に採用する。** 次の要素を他案から移植する。

| 移植元 | 移植するもの | 理由 |
|---|---|---|
| C | レア度の素材（泥染の縁・夜光貝・金箔）。ただし**図鑑カード（記録時の演出・記録詳細・共有画像）だけ**に使う | 「大胆さは 1 か所」をカードに集中させる。奄美固有の素材で、ガチャ風の色分けにならない |
| C | バッジを「印影」にする（形を塗り、図柄を白抜き）。形で系統を表す（◇菱＝生き物、⬡亀甲＝守る） | スタンプラリーの判子と同じ造形言語になる |
| C | 夜の森モードの面と文字を泥染系の暖色にする（ページ自体は純黒のまま） | 赤みのある暗さは暗順応を壊しにくい。B の緑がかった黒より夜の観察向き |
| C | `amami:fern`（ヒカゲヘゴ）を植物カテゴリとロゴの両方に使う | 既存ロゴのシダと一致し、汎用の葉アイコンを避けられる |
| C | 路上レポートとセーフドライブを「体験」タブ下部の 1 グループにまとめる | ホームのクイックアクション廃止後の行き先 |
| A | 夜の森モードで写真を `brightness(.85)` に落とす | ナイトツアー中のまぶしさ対策 |
| A | `<Phrase>` コンポーネントとコントラスト検査スクリプト | 改行と配色の品質を機械的に保証できる |
| A | 図鑑の「記録済み/未発見」をシートに移す（チップ列の先頭に解除できるチップを出す） | フィルターの段積み（批評 P1-14）をなくす |

### 0.3 対立点の裁定

| 論点 | A | B | C | 決定 | 理由 |
|---|---|---|---|---|---|
| ブランド色 | #2A46A3 | #1E50A2 | #33479B | **#1E50A2** | 伝統色「瑠璃色」そのもの。白地で 7.7:1 |
| ページ背景（ライト） | 灰 #F2F2F4 | 白 | 灰 #F1F2F4 | **白 #FFFFFF** | 灰地に白グループを並べると箱が戻る。囲むのは設定・フォーム・料金・KPI・グラフだけ |
| ダーク | 純黒＋iOS 灰 | 純黒＋緑がかった面 | 泥染の茶黒 | **ページは純黒、面と文字は泥染の暖色** | OLED で消灯し、暖色で暗順応を守る |
| 書体 | LINE Seed JP＋Figtree | IBM Plex 400/600 | IBM Plex 400/500/600 | **IBM Plex Sans JP 400/600 ＋ IBM Plex Sans** | `palt` が効き、数字は等幅、本物のイタリックがある。500 を省いて約 0.33MB 軽くする |
| タブ画面のタイトル | 22 | 28 | 22 | **22**（28 はホームの季節見出し・種名・オンボーディング・Plus 見出しだけ） | LINE のヘッダーと重複するので控えめにする |
| 種タイルの角丸 | 4 | 6 | 6 | **6** | 印刷された図版らしく、かつ硬すぎない |
| 区切り線 | 0.5px | 1px | 0.5px | **1px** | Android WebView では 0.5px の描画が不安定 |
| バッジの塗り | ブランド＋塗り | ブランド＋デュオトーン | 墨＋白抜き | **瑠璃の印影（形を `brand-fill`、図柄を白抜きの fill）、幻だけ `legend`** | デュオトーンを使わずアイコンの重みを 2 種に抑える。判子と揃う |
| 体験タブのアイコン | compass | map-trifold | compass | **compass** | 地図アイコンは「地図画面」と誤解される |
| 昆虫のアイコン | butterfly | bug-beetle | butterfly | **butterfly** | bug 系はソフトウェアのバグに見える。収録 8 種中 4 種がチョウ |
| 植物のアイコン | leaf | plant | amami:fern | **amami:fern** | 上記の移植理由と同じ |
| レア度ジェムの色 | 3〜4 をブランド | 灰 | 灰 | **塗りは `fg-2`、空きは `sep`、幻だけ `legend`** | 色ではなく数で表す |
| 未発見の種名 | 表示（薄く） | 表示（薄く） | 表示（薄く） | **表示する（`fg-3`）** | 図鑑なので「何を探せばよいか」を見せる |
| 発見状態フィルター | シート | シート | 常時表示のセグメント | **シート＋解除チップ** | 操作部品を 2 段に抑える |
| アイコンの配信方法 | unplugin-icons | unplugin-icons | unplugin-icons | **生成スクリプト**（`@iconify-json/ph` から必要分だけ書き出す） | Vite 6.4 での動作が未検証のビルドプラグインと SVGR を避け、既存の `scripts/` 方式に合わせる |
| ホームの冒頭 | 挨拶 | 「10月の奄美」 | 写真ヒーロー | **「10月の奄美」＋季節の一文。写真がある時だけ注目種の写真を入れる** | 写真アセットがまだない |
| スタンプ | 4×3 の格子 | 島の地図 | 地図＋4×3 | **島ごとに分けた印の格子（第1段階）。地図は第2段階** | 地図は GIS データの準備が要る |
| 危険生物（ハブ）の注意 | warning | danger | warning | **warning** | danger は路上レポート・ロードキル・エラー専用 |
| 中央の記録ボタン | 44px | 44px | 48px | **48px** | 研究結果どおり。56px のバーに収まる |

---

## 1. 原則

1. **主役は生き物。** 画面の枠は白・墨・瑠璃の 3 色だけにする。色は写真とシルエットが持ち込む。
2. **箱で区切らない。** 区切りは余白・見出し・1px の線で作る。囲んでよいのは設定、フォーム、料金プラン、KPI、グラフだけ。カードの中にカードを入れない。
3. **書体は IBM Plex の 1 ファミリー、ウェイトは 400 と 600 だけ。** 英字の見出しラベル、和文の字間あけ、明朝、和文のイタリックは使わない。
4. **大胆にするのは 1 か所だけ。** それは「図鑑カード」。記録した瞬間に裏返り、裏面に大島紬の龍郷柄が出て、縁はレア度に応じた素材（泥染・夜光貝・金箔）になる。龍郷柄も素材の縁もここ以外では使わない。
5. **LINE の中のアプリとして振る舞う。** LINE のヘッダーと重複する大きなブランド見出しは置かない。LINE グリーンは LINE の操作だけに使う。

---

## 2. カラー

### 2.1 トークン

CSS 変数は `--c-*` に RGB チャンネル（スペース区切り）で入れ、Tailwind から `rgb(var(--c-x) / <alpha-value>)` で参照する。既存の仕組みと同じ形にする。

| CSS 変数 | Tailwind | Light | Dark（夜の森） | 用途 |
|---|---|---|---|---|
| `--c-page` | `page` | #FFFFFF | #000000 | ページ、タブバー、固定 CTA バー |
| `--c-surface` | `surface` | #FFFFFF | #1A1714 | シート、図鑑カードの表面 |
| `--c-fill` | `fill` | #F1F3F2 | #24201C | グループの面、検索欄、入力欄、チップ、セグメントの溝、未発見タイル、ページ上の行の押下 |
| `--c-fill-strong` | `fill-strong` | #E4E8E6 | #2F2A25 | グループ内の行の押下、`fill` 上のチップ |
| `--c-sep` | `sep` | #E1E4E2 | #36302A | 1px の区切り線、ジェムの空き、グラフの補助線 |
| `--c-fg` | `fg` | #161A18 | #D4CDC2 | 見出し、本文 |
| `--c-fg-2` | `fg-2` | #4A524E | #ADA498 | メタ情報、補足、行頭アイコン、塗ったジェム |
| `--c-fg-3` | `fg-3` | #656C68 | #90877B | 図鑑番号、プレースホルダー、シェブロン、未発見の名前、無効状態 |
| `--c-brand` | `brand` | #1E50A2 | #9DA9D8 | ブランド色の文字とアイコン（リンク、選択中のタブ、「すべて見る」）、細いバー（進捗バー、季節バー）、グラフ系列 1 |
| `--c-brand-fill` | `brand-fill` | #1E50A2 | #4057A3 | 面積の大きい塗り（主ボタン、記録ボタン、選択中のチップ、ラジオ、チェック、印影） |
| `--c-brand-pressed` | `brand-pressed` | #173F82 | #334790 | 塗りの押下 |
| `--c-brand-soft` | `brand-soft` | #E8EEF7 | #1A2038 | 選択中の候補行の背景（この 1 用途だけ） |
| `--c-on-brand` | `on-brand` | #FFFFFF | #ECEAF2 | `brand-fill` 上の文字とアイコン |
| `--c-on-danger` | `on-danger` | #FFFFFF | #1A1714 | `danger` で塗ったボタンの文字（路上レポートの送信だけ） |
| `--c-success` | `success` | #1B7A47 | #7DB894 | 記録済みのチェック、同期完了 |
| `--c-warning` | `warning` | #8F5C00 | #D6A35A | ハブなど危険生物の注意、フラッシュの注意、オフライン、未同期 |
| `--c-danger` | `danger` | #C0322B | #E2786C | 路上レポート、ロードキル、エラー、削除、グラフ系列 2 |
| `--c-legend` | `legend` | #8A6A1E | #C9A65A | レア度「幻」だけ |
| `--c-silhouette` | `silhouette` | #D3D8D5 | #332D27 | 未発見のシルエット（装飾。文字には使わない） |
| `--c-line-green` | `line-green` | #06C755 | #06C755 | LINE の操作だけ（友だち追加、LINE で送る、LINE ログイン） |
| `--c-thumb` | `thumb` | #FFFFFF | #3A332C | セグメントの選択つまみ |
| `--c-toast` | `toast` | #1F2422 | #2E2924 | トーストの背景 |
| `--c-toast-fg` | `toast-fg` | #F2F4F3 | #D4CDC2 | トーストの文字 |
| `--scrim` | （CSS のみ） | `rgb(0 0 0 / .40)` | `rgb(0 0 0 / .60)` | シートの背面、写真上の丸ボタン |
| `--stage` | （CSS のみ） | `rgb(0 0 0 / .92)` | `rgb(0 0 0 / .92)` | 図鑑カード演出とバッジ獲得の舞台（両モード共通） |

カードの素材（テーマごとに固定。図鑑カード以外では使わない）

| CSS 変数 | Light | Dark |
|---|---|---|
| `--mat-dorozome`（泥染） | #4B3A2E | #5A4738 |
| `--mat-yakougai`（夜光貝） | `conic-gradient(from 200deg, #C9DCE6, #E3D3E6, #D2E8DC, #EDE1C8, #C9DCE6)` | `conic-gradient(from 200deg, #3B4852, #4A3E4D, #3A4A41, #52473A, #3B4852)` |
| `--mat-kinpaku`（金箔） | `linear-gradient(135deg, #8A6A22, #E2C77A 40%, #F3E4B2 50%, #BE9845 62%, #8A6A22)` | `linear-gradient(135deg, #6E5520, #C9AE68 45%, #DFCA8E 52%, #A3843F 65%, #6E5520)` |

### 2.2 コントラスト（WCAG 2.x、実測）

| 文字 | Light: page / fill / brand-soft | Dark: page / surface / fill |
|---|---|---|
| `fg` | 17.6 / 15.8 / 15.1 | 13.3 / 11.3 / 10.3 |
| `fg-2` | 8.1 / 7.2 / 6.9 | 8.5 / 7.3 / 6.6 |
| `fg-3` | 5.4 / 4.8 / 4.6 | 5.9 / 5.0 / 4.6 |
| `brand` | 7.7 / 6.9 / 6.6 | 9.1 / 7.7 / 7.0 |
| `success` | 5.4 / 4.8 | 9.2 / 7.8 / 7.1 |
| `warning` | 5.7 / 5.1 | 9.2 / 7.9 / 7.1 |
| `danger` | 5.6 / 5.0 | 7.1 / 6.1 / 5.5 |
| `legend` | 5.0 / 4.5 | 9.1 / 7.7 / 7.0 |

- `on-brand` / `brand-fill`: Light 7.7（押下時 10.1）、Dark 5.7（押下時 7.2）
- `toast-fg` / `toast`: Light 14.3、Dark 9.1
- `brand-fill` とページ背景（記録ボタンなど UI 部品の 3:1 基準）: Light 7.7、Dark 3.1
- `on-danger` / `danger`（路上レポートの送信ボタン）: Light 5.6、Dark 6.1
- 細いバーの値（`brand`）と溝（`fill`）: Light 6.9、Dark 7.0。`brand-fill` はダークで `fill` に対し 2.4 しかないので、細いバーには使わない
- `fg-3` は `fill-strong` の上に置かない（Light 4.4）
- **白文字と LINE グリーンは 2.3:1。** これは LINE ブランド規定による例外。必ず LINE のロゴと 16px / 600 のラベルを組み合わせる。
- `silhouette` と `sep` は装飾・構造用（1.2〜1.3:1）。文字には使わない。

### 2.3 CSS（`src/styles/index.css` の `:root` を全面的に置き換える）

```css
:root {
  --c-page: 255 255 255;      /* #FFFFFF */
  --c-surface: 255 255 255;   /* #FFFFFF */
  --c-fill: 241 243 242;      /* #F1F3F2 */
  --c-fill-strong: 228 232 230; /* #E4E8E6 */
  --c-sep: 225 228 226;       /* #E1E4E2 */
  --c-fg: 22 26 24;           /* #161A18 */
  --c-fg-2: 74 82 78;         /* #4A524E */
  --c-fg-3: 101 108 104;      /* #656C68 */
  --c-brand: 30 80 162;       /* #1E50A2 */
  --c-brand-fill: 30 80 162;  /* #1E50A2 */
  --c-brand-pressed: 23 63 130; /* #173F82 */
  --c-brand-soft: 232 238 247; /* #E8EEF7 */
  --c-on-brand: 255 255 255;  /* #FFFFFF */
  --c-on-danger: 255 255 255; /* #FFFFFF */
  --c-success: 27 122 71;     /* #1B7A47 */
  --c-warning: 143 92 0;      /* #8F5C00 */
  --c-danger: 192 50 43;      /* #C0322B */
  --c-legend: 138 106 30;     /* #8A6A1E */
  --c-silhouette: 211 216 213; /* #D3D8D5 */
  --c-line-green: 6 199 85;   /* #06C755 */
  --c-thumb: 255 255 255;     /* #FFFFFF */
  --c-toast: 31 36 34;        /* #1F2422 */
  --c-toast-fg: 242 244 243;  /* #F2F4F3 */
  --scrim: rgb(0 0 0 / 0.4);
  --stage: rgb(0 0 0 / 0.92);
  --mat-dorozome: #4b3a2e;
  --mat-yakougai: conic-gradient(from 200deg, #c9dce6, #e3d3e6, #d2e8dc, #ede1c8, #c9dce6);
  --mat-kinpaku: linear-gradient(135deg, #8a6a22, #e2c77a 40%, #f3e4b2 50%, #be9845 62%, #8a6a22);
  --chart-1: rgb(var(--c-brand));
  --chart-2: rgb(var(--c-danger));
  --chart-grid: rgb(var(--c-sep));
  --chart-band: rgb(var(--c-fill));
  --font-ui: "IBM Plex Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", Meiryo, system-ui, sans-serif;
  --font-num: "IBM Plex Sans", "IBM Plex Sans JP", -apple-system, "Hiragino Sans", Roboto, system-ui, sans-serif;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-top: env(safe-area-inset-top, 0px);
  color-scheme: light;
}

:root[data-theme='dark'] {
  --c-page: 0 0 0;            /* #000000 */
  --c-surface: 26 23 20;      /* #1A1714 */
  --c-fill: 36 32 28;         /* #24201C */
  --c-fill-strong: 47 42 37;  /* #2F2A25 */
  --c-sep: 54 48 42;          /* #36302A */
  --c-fg: 212 205 194;        /* #D4CDC2 */
  --c-fg-2: 173 164 152;      /* #ADA498 */
  --c-fg-3: 144 135 123;      /* #90877B */
  --c-brand: 157 169 216;     /* #9DA9D8 */
  --c-brand-fill: 64 87 163;  /* #4057A3 */
  --c-brand-pressed: 51 71 144; /* #334790 */
  --c-brand-soft: 26 32 56;   /* #1A2038 */
  --c-on-brand: 236 234 242;  /* #ECEAF2 */
  --c-on-danger: 26 23 20;    /* #1A1714 */
  --c-success: 125 184 148;   /* #7DB894 */
  --c-warning: 214 163 90;    /* #D6A35A */
  --c-danger: 226 120 108;    /* #E2786C */
  --c-legend: 201 166 90;     /* #C9A65A */
  --c-silhouette: 51 45 39;   /* #332D27 */
  --c-thumb: 58 51 44;        /* #3A332C */
  --c-toast: 46 41 36;        /* #2E2924 */
  --c-toast-fg: 212 205 194;  /* #D4CDC2 */
  --scrim: rgb(0 0 0 / 0.6);
  --mat-dorozome: #5a4738;
  --mat-yakougai: conic-gradient(from 200deg, #3b4852, #4a3e4d, #3a4a41, #52473a, #3b4852);
  --mat-kinpaku: linear-gradient(135deg, #6e5520, #c9ae68 45%, #dfca8e 52%, #a3843f 65%, #6e5520);
  color-scheme: dark;
}
```

### 2.4 Tailwind（`tailwind.config.js` の `theme.extend.colors` を置き換える）

```js
const v = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;
colors: {
  page: v('page'), surface: v('surface'),
  fill: { DEFAULT: v('fill'), strong: v('fill-strong') },
  sep: v('sep'),
  fg: { DEFAULT: v('fg'), 2: v('fg-2'), 3: v('fg-3') },
  brand: { DEFAULT: v('brand'), fill: v('brand-fill'), pressed: v('brand-pressed'), soft: v('brand-soft') },
  'on-brand': v('on-brand'), 'on-danger': v('on-danger'),
  success: v('success'), warning: v('warning'), danger: v('danger'),
  legend: v('legend'), silhouette: v('silhouette'), 'line-green': v('line-green'),
  thumb: v('thumb'), toast: { DEFAULT: v('toast'), fg: v('toast-fg') },
},
```

旧トークン `paper paper2 card ink ink2 ink3 accent primary onprimary ruri kuri umi sango kin forest-* washi lapis gold` はすべて削除する。`RARITY_COLOR`、`CATEGORY_META.color`、`GLOW`、コンポーネント内の固定 16 進色（`#101B33` `#0B1A2E` `#1B2F55` `#E2C46F` `#F2D58A` `#06C755` など）も削除する。

### 2.5 使い方の規則

- ブランド色（`brand` / `brand-fill`）を使うのは次だけ: 主ボタン、記録ボタン、選択中の状態（タブ・チップ・ラジオ・チェック）、リンクと「すべて見る」、進捗バー、印影（バッジ・スタンプ）、季節バーの見頃、グラフ系列 1。
- 面積の大きい塗り（ボタン、記録ボタン、選択中のチップ、印影）は `brand-fill`。細いバー（進捗バー、季節バー）とグラフは `brand`（文字用の値）で塗る。ダークで溝との差を 3:1 以上にするため。
- 意味の色（`success` `warning` `danger`）は**アイコンと短いラベルだけ**に付ける。文章は `fg` か `fg-2` のまま。面を塗らない。例外は路上レポートの「送信する」ボタン（`danger` で塗り、文字は `on-danger`）だけ。
- **テーマで値が変わるトークンの上に、テーマで変わらない固定色の文字を置かない。** ダークモードで報酬画面の文字が消えた不具合（P0-2）の原因はこれ。`brand-fill` の上は必ず `on-brand`。
- 面の重なりは常に 1 段ずらす。`page` の上に `fill`、`fill` の上の押下は `fill-strong`。シート（`surface`）の中のグループは `fill`。
- グラデーションは禁止。例外は 2 つだけ: 図鑑カードの素材の縁（`--mat-yakougai` と `--mat-kinpaku`）と、写真の上に白文字を置く必要があるときの写真用スクリム。

### 2.6 レア度

| レア度 | 言葉 | ジェム（6px の菱形 4 つ、間隔 3px） | 種タイル | 図鑑カードの縁 |
|---|---|---|---|---|
| 1 | よく見る | 塗り 1 つ（`fg-2`）、空き 3 つ（`sep`） | なし | 素材なし（1px の `sep` 枠） |
| 2 | ときどき | 塗り 2 つ | なし | 泥染（`--mat-dorozome`、4px） |
| 3 | めずらしい | 塗り 3 つ | なし | 夜光貝（`--mat-yakougai`、4px） |
| 4 | 幻 | 塗り 4 つ（`legend`） | 写真の内側に 2px の `legend` の線、名前の後ろに「幻」（12px / 600、`legend`） | 金箔（`--mat-kinpaku`、4px） |

- レア度は日本語の言葉だけで呼ぶ。COMMON / UNCOMMON / RARE / LEGENDARY は UI からも `RARITY_META.en` からも削除する。
- 金色（`legend` と `--mat-kinpaku`）は「幻」以外に使わない。

### 2.7 カテゴリ

色を持たない。区別はアイコン（§5.4）とラベルで行う。

### 2.8 グラフ（パートナー画面）

- 系列 1（記録）= `--chart-1`（`brand`）、系列 2（ロードキル）= `--chart-2`（`danger`）。青と赤なので色覚の違いがあっても区別できる。
- 補助線は `--chart-grid`、夜間の帯は `--chart-band`、軸ラベルは 12px の `fg-2`。
- 1 系列 1 色。グラデーションと影は使わない。

### 2.9 夜の森（ダーク）の追加規則

- ページは純黒 #000000（OLED では消灯する）。面と文字は泥染系の暖色にし、白は約 80% まで落とす。
- 写真は暗くする: `[data-theme='dark'] .photo { filter: brightness(.85); }`
- 影を使わない。浮いている層（シート、トースト）は上辺に 1px の `sep` を引いて区別する。
- 鮮やかな青を使わない。ブランドの文字色は彩度を落とした #9DA9D8。
- `index.html` の `theme-color` は Light #FFFFFF、Dark #000000。

---

## 3. タイポグラフィ

### 3.1 フォントの読み込み（`index.html`。Shippori Mincho、Cormorant Garamond、Zen Kaku Gothic New のリンクは削除する）

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600&family=IBM+Plex+Sans:ital,wght@0,400..600;1,400&display=swap" rel="stylesheet" />
```

この URL は 2026-10-10 に HTTP 200 を確認済み。IBM Plex Sans JP の 400 と 600 がそれぞれ 123 スライス、IBM Plex Sans のローマン（可変 400〜600）とイタリック 400 が入る。

### 3.2 書体の役割

| 役割 | 書体 | Tailwind | CSS |
|---|---|---|---|
| UI の和文・欧文すべて | IBM Plex Sans JP | `font-sans` | `var(--font-ui)` |
| 単独で立つ数字（pt、種数、KPI、図鑑番号） | IBM Plex Sans（等幅数字） | `font-num` ＋ `.num` | `var(--font-num)` |
| 学名 | IBM Plex Sans Italic 400 | `.sci` | 下記 |

```js
// tailwind.config.js（theme.extend ではなく theme で上書きし、serif と latin を消す）
fontFamily: {
  sans: ['"IBM Plex Sans JP"', '"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"', '"Yu Gothic UI"', 'Meiryo', 'system-ui', 'sans-serif'],
  num: ['"IBM Plex Sans"', '"IBM Plex Sans JP"', '-apple-system', '"Hiragino Sans"', 'Roboto', 'system-ui', 'sans-serif'],
},
fontWeight: { normal: '400', semibold: '600' },
```

```css
@layer base {
  body { @apply bg-page text-fg font-sans antialiased; font-weight: 400; font-synthesis: none;
         font-feature-settings: "palt"; text-size-adjust: 100%; overscroll-behavior-y: none; position: relative; }
  p, .prose { font-feature-settings: normal; }  /* 複数行の本文は詰めない */
  #root { isolation: isolate; }
}
@layer components {
  .num { font-family: var(--font-num); font-variant-numeric: tabular-nums lining-nums; }
  .sci { font-family: var(--font-num); font-style: italic; font-weight: 400; letter-spacing: 0; color: rgb(var(--c-fg-2)); }
  .phrase { word-break: keep-all; overflow-wrap: anywhere; }
  .balance { text-wrap: balance; }
  @supports (word-break: auto-phrase) { .phrase { word-break: auto-phrase; } }
}
```

### 3.3 文字サイズ

`theme.fontSize` を**上書き**する（`extend` しない）。`text-xs`〜`text-9xl` は使えなくなる。`text-[Npx]` も禁止。

| トークン（`text-*`） | サイズ / 行送り | 太さ | 字間 | palt | 用途 |
|---|---|---|---|---|---|
| `display` | 28 / 36 | 600 | 0 | 有効 | ホームの「10月の奄美」、種詳細の和名、オンボーディングの見出し、Plus の見出し |
| `title` | 22 / 30 | 600 | 0 | 有効 | タブ画面と遷移先画面のタイトル、図鑑カードの和名、バッジ獲得画面の名前 |
| `section` | 18 / 26 | 600 | 0 | 有効 | セクション見出し |
| `headline` | 16 / 22 | 600 | 0 | 有効 | 行のタイトル、ボタン（大）、シートのタイトル |
| `body` | 15 / 26 | 400 | 0 | **無効** | 説明文（複数行） |
| `callout` | 15 / 22 | 400 | 0 | 有効 | 1 行の行テキスト、値、ボタン（中、600 にする） |
| `input` | 16 / 24 | 400 | 0 | 有効 | すべての入力欄（iOS のフォーカス時ズームを防ぐ） |
| `sub` | 13 / 20 | 400 | 0 | 1 行なら有効 | メタ情報、注記、チップ |
| `tile` | 13 / 18 | 600 | 0 | 有効 | 種タイルの和名（2 行まで） |
| `caption` | 12 / 16 | 400 | +0.02em | 有効 | 日付、件数、図鑑番号、注意書き。**読ませる文字の最小サイズ** |
| `tab` | 11 / 14 | 400（選択時 600） | +0.02em | 有効 | タブのラベルだけ |
| `num-xl` | 40 / 44 | 600 | −0.02em | — | ポイント残高 |
| `num-kpi` | 28 / 32 | 600 | −0.02em | — | パートナー画面の KPI |
| `num-l` | 22 / 26 | 600 | −0.01em | — | 統計の数字、未発見タイルの番号 |

```js
fontSize: {
  display: ['28px', { lineHeight: '36px', fontWeight: '600' }],
  title: ['22px', { lineHeight: '30px', fontWeight: '600' }],
  section: ['18px', { lineHeight: '26px', fontWeight: '600' }],
  headline: ['16px', { lineHeight: '22px', fontWeight: '600' }],
  body: ['15px', { lineHeight: '26px' }],
  callout: ['15px', { lineHeight: '22px' }],
  input: ['16px', { lineHeight: '24px' }],
  sub: ['13px', { lineHeight: '20px' }],
  tile: ['13px', { lineHeight: '18px', fontWeight: '600' }],
  caption: ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
  tab: ['11px', { lineHeight: '14px', letterSpacing: '0.02em' }],
  'num-xl': ['40px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '600' }],
  'num-kpi': ['28px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
  'num-l': ['22px', { lineHeight: '26px', letterSpacing: '-0.01em', fontWeight: '600' }],
},
```

`num-*` は必ず `.num` と一緒に使う（例: `className="num text-num-xl"`）。

### 3.4 規則

- **字間:** 和文は 0。許容範囲は −0.02〜+0.02em。`tracking-label` と `.label` は削除する。ワードマークだけは 0.04em まで可。
- **palt:** 見出し、ラベル、ボタン、チップ、タブ、1 行のメタ情報では有効（body の初期値）。複数行の本文（`p`）では無効。`font-feature-settings` は親の値と合成されないので、子で指定する場合は `"palt"` を書き直す。数字の機能は `font-variant-numeric` で指定する。
- **太さ:** 400 と 600 だけ。`font-bold`（130 か所）と `font-extrabold`（19 か所）は `font-semibold` に置き換える。文中の一語だけを太字や色付きにしない。見出しの一語だけを強調しない。
- **最小サイズ:** タブのラベルだけ 11px。それ以外は 12px 以上。複数行は 13px 以上。入力欄は 16px。9px、10px、10.5px は全廃する。
- **行送り:** 本文 1.73（15/26）。1 行の UI は 1.3〜1.45。かなや漢字を含む行は 1.25 未満にしない。数字だけの行は 1.0〜1.1 まで可。
- **大文字の英字ラベルは使わない。** 英字の見出し上ラベル（約 30 か所）はすべて削除する。日本語の見出しだけで階層を作る。

### 3.5 改行（P0-8 の対策）

- **`<Phrase>`**（`src/components/Phrase.tsx`）: BudouX（`loadDefaultJapaneseParser()`。モジュールの外で 1 回だけ生成する）で文字列を文節に分け、文節の間に `<wbr>` を入れる。`.phrase` クラスを付ける。見出し、ボタン、バッジ名、クエスト名、体験のタイトル、空状態の一文に使う。見出しには `.balance` も付ける。
  ```tsx
  const parser = loadDefaultJapaneseParser();
  export function Phrase({ text }: { text: string }) {
    const parts = useMemo(() => parser.parse(text), [text]);
    return <span className="phrase">{parts.map((p, i) => <Fragment key={i}>{i > 0 && <wbr />}{p}</Fragment>)}</span>;
  }
  ```
- **和名:** BudouX はカタカナの複合語をうまく切れないので、`Species` に `nameBreak?: string` を足し、区切りを `|` で書く。`<SpeciesName>` は `|` を `<wbr>` にし、`.phrase` を付けて描画する。種名は省略記号（…）で切らない。2 行まで表示する（`line-clamp-2`）。7 文字以上の和名には必ず `nameBreak` を入れる:

  | 和名 | nameBreak |
  |---|---|
  | アマミノクロウサギ | アマミノ\|クロウサギ |
  | ケナガネズミ | ケナガ\|ネズミ |
  | アマミトゲネズミ | アマミ\|トゲネズミ |
  | リュウキュウイノシシ | リュウキュウ\|イノシシ |
  | オーストンオオアカゲラ | オーストン\|オオアカゲラ |
  | オオトラツグミ | オオ\|トラツグミ |
  | アマミヤマシギ | アマミ\|ヤマシギ |
  | リュウキュウアカショウビン | リュウキュウ\|アカショウビン |
  | リュウキュウコノハズク | リュウキュウ\|コノハズク |
  | ズアカアオバト | ズアカ\|アオバト |
  | シロハラクイナ | シロハラ\|クイナ |
  | イソヒヨドリ | イソ\|ヒヨドリ |
  | リュウキュウツバメ | リュウキュウ\|ツバメ |
  | アマミヒヨドリ | アマミ\|ヒヨドリ |
  | アマミヤマガラ | アマミ\|ヤマガラ |
  | アマミコゲラ | アマミ\|コゲラ |
  | アマミイシカワガエル | アマミ\|イシカワ\|ガエル |
  | オットンガエル | オットン\|ガエル |
  | アマミハナサキガエル | アマミ\|ハナサキ\|ガエル |
  | シリケンイモリ | シリケン\|イモリ |
  | リュウキュウカジカガエル | リュウキュウ\|カジカ\|ガエル |
  | ハロウエルアマガエル | ハロウエル\|アマガエル |
  | アマミアオガエル | アマミ\|アオガエル |
  | オキナワキノボリトカゲ | オキナワ\|キノボリ\|トカゲ |
  | オオシマトカゲ | オオシマ\|トカゲ |
  | アマミマルバネクワガタ | アマミ\|マルバネ\|クワガタ |
  | フェリエベニボシカミキリ | フェリエ\|ベニボシ\|カミキリ |
  | アサギマダラ | アサギ\|マダラ |
  | オオゴマダラ | オオ\|ゴマダラ |
  | ツマベニチョウ | ツマベニ\|チョウ |
  | オオシマゼミ | オオシマ\|ゼミ |
  | ザトウクジラ | ザトウ\|クジラ |
  | ミナミバンドウイルカ | ミナミ\|バンドウ\|イルカ |
  | アオウミガメ | アオ\|ウミガメ |
  | アカウミガメ | アカ\|ウミガメ |
  | オカヤドカリの仲間 | オカヤドカリの\|仲間 |
  | ミナミトビハゼ | ミナミ\|トビハゼ |
  | シオマネキの仲間 | シオマネキの\|仲間 |
  | リュウキュウアユ | リュウキュウ\|アユ |
  | テッポウユリ | テッポウ\|ユリ |
  | アマミセイシカ | アマミ\|セイシカ |
  | アマミエビネ | アマミ\|エビネ |

- バッジ名（例: バードウォッチャー → バード\|ウォッチャー、セーフドライバー → セーフ\|ドライバー、夜道の見守り隊 → 夜道の\|見守り隊、マングローブ探検家 → マングローブ\|探検家、固有種ハンター → 固有種\|ハンター）も同じ書式で `BADGES` に `titleBreak` として持たせる。

### 3.6 学名

- `<i lang="la" className="sci">` で書く（HTML 仕様が分類名に `<i>` を使う例として挙げている）。
- 属名は大文字で始め、種小名は小文字。どちらもイタリック。命名者、年、sp. / subsp. / var. / cf. は立体（`not-italic`）にする。
- 大きさ: 種詳細 15/22、行 13/18。種タイルには出さない。色は `fg-2`。
- 省略記号で切らない。2 回目以降は属名を略す（*P. furnessi*）。
- 和名と英名はイタリックにしない。

### 3.7 数字と単位

- 数字は `.num`（Plex Sans の等幅数字）。
- 和文の単位は数字に続けて書く（`62種`、`3回`）。欧文の単位は 0.15em あける（`160 pt`、実装は `<span className="ml-[0.15em]">pt</span>`）。
- 統計の単位は数字の基準線にそろえ、`sub` の `fg-2` にする。
- 金額は `4,000円から`（`〜` は使ってよい）。

### 3.8 縦位置の補正

Plex JP は行の中央より約 0.07em 上に字面が来る。高さが固定のボタン、チップ、タブのラベルは `items-center` に加えて上側に 2px のパディングを足す（`pt-[2px]`。中身が 1px 下がる）。

### 3.9 フォントのキャッシュ（`vite.config.ts`）

- `google-fonts` のランタイムキャッシュの `maxEntries` を 40 から **500** にする。ホームだけで 74 スライス以上読むため、40 では追い出しと再取得が起きる。
- `theme_color` を `#FFFFFF`、`background_color` を `#FFFFFF` に変える。

---

## 4. 形・区切り・奥行き

### 4.1 角丸

`theme.borderRadius` を上書きする。

| トークン | 値 | 使う場所 |
|---|---|---|
| `rounded-none` | 0 | 全幅の写真（種詳細、オンボーディング、Plus）、タブバー、固定 CTA バー |
| `rounded-bar` | 2px | 進捗バー、季節バー |
| `rounded-xs` | 6px | 種タイル、行のサムネイル（40〜56）、最近の記録のタイル、アルバムボタン |
| `rounded-sm` | 10px | 検索欄、入力欄、セグメントの溝、お知らせ枠 |
| `rounded-thumb` | 8px | セグメントの選択つまみ |
| `rounded-md` | 12px | グループ、ボタン、トースト、体験・注目種の写真（16:9 / 4:3） |
| `rounded-lg` | 16px | シートの上辺、図鑑カード |
| `rounded-full` | 9999px | チップ、アバター、記録ボタン、写真上の丸ボタン、スタンプ、ラジオ |

```js
borderRadius: { none: '0', bar: '2px', xs: '6px', thumb: '8px', sm: '10px', md: '12px', lg: '16px', full: '9999px' },
```

`rounded-2xl` `rounded-3xl` `rounded-4xl` と、26 / 22 / 16 / 5 / 1.5 / 1px の個別値はすべて廃止する。

### 4.2 区切り線

- 1px、`sep` 色。行の区切りは、行の文字の開始位置から右端まで引く（左側を空ける）。
- 全幅の線は「タブバーの上辺」「固定 CTA バーの上辺」「スクロール後の画面ヘッダーの下辺」だけ。
- 入れ物には枠線を引かない。入力欄にも枠線を引かない（`fill` で塗り、フォーカス時に 2px の `brand` のリング）。
- フォーカス表示: `:focus-visible { outline: 2px solid rgb(var(--c-brand)); outline-offset: 2px; }`

### 4.3 影（浮いている層だけ）

`theme.boxShadow` を上書きする。`shadow-card` `shadow-lift` `shadow-glow` は削除する。

| トークン | 値 | 使う場所 |
|---|---|---|
| `shadow-sheet` | `0 -8px 32px rgb(0 0 0 / .14)` | シート |
| `shadow-toast` | `0 8px 24px rgb(0 0 0 / .18)` | トースト |
| `shadow-thumb` | `0 1px 2px rgb(0 0 0 / .12)` | セグメントの選択つまみ（ライトのみ） |
| `shadow-object` | `0 24px 48px rgb(0 0 0 / .45)` | 演出中の図鑑カード（黒い舞台の上） |

- ページの流れの中にあるもの（行、グループ、ボタン、タイル、写真）には影を付けない。
- ダークでは `shadow-object` 以外の影を `none` にし、上辺に 1px の `sep` を引く。

### 4.4 リストは 2 種類だけ

| 種類 | 見た目 | 使う場所 |
|---|---|---|
| **プレーンリスト**（標準） | ページ背景の上に全幅の行。行と行の間に内側から引いた区切り線 | ホームの季節の種・クエスト、体験の一覧、ポイント交換の景品、候補、マナー、セーフドライブのチェック以外のほぼすべて |
| **グループ** | `fill`、`rounded-md`、左右 16px の余白、中の行は区切り線で分ける | 設定、フォーム（記録の日時・地域・メモ）、種詳細の項目一覧、料金プラン、セーフドライブのチェック、KPI、グラフ、シート内の選択肢 |

- 1 項目に 1 枚のカードを作らない。カードの中にカードを入れない。
- 「カード」と呼んでよいのは図鑑カード（§7.21）だけ。

### 4.5 余白とレイアウト

- 4px グリッド。左右の余白は 16px（列幅 390 なら本文 358px）。
- アプリの列: `mx-auto w-full max-w-[480px]`。パートナー画面だけ `max-w-[960px]`。
- セクション見出しの上は 32px（画面で最初のセクションは 16px）、見出しの下は 8px。グループ同士の間は 24px。
- タブ画面の下余白: `.pb-tabbar { padding-bottom: calc(56px + var(--safe-bottom) + 24px); }`
- 固定 CTA がある画面の下余白: `calc(74px + var(--safe-bottom) + 16px)`。
- 横スクロールの行（チップ、最近の記録）は左右 16px の内側余白を持ち、端のフェードは付けない。

---

## 5. アイコン

### 5.1 配信方法

- 図案は **Phosphor**（MIT）。`@iconify-json/ph@1.2.2` を devDependency に入れ、`scripts/build-ui-icons.mjs` で必要なものだけを `src/components/icons.tsx` に書き出す（`npm run icons:ui`）。生成されたファイルはコミットする。
- スクリプトは `node_modules/@iconify-json/ph/icons.json`（viewBox 256）と `src/icons/amami/*.svg` を読み、アイコンごとに 1 つのコンポーネントを書き出す。名前は `Icon` ＋ PascalCase（`house-simple-fill` → `IconHouseSimpleFill`、`amami:frog` → `IconAmamiFrog`）。
  ```tsx
  export function IconHouseSimple({ size = 24, ...p }: IconProps) {
    return <svg viewBox="0 0 256 256" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false" {...p} dangerouslySetInnerHTML={{ __html: BODY }} />;
  }
  ```
- `lucide-react` は削除する。

書き出すアイコン（このリストを `scripts/build-ui-icons.mjs` の `ICONS` にする）

```
house-simple house-simple-fill book-open-text book-open-text-fill camera-fill compass compass-fill
user-circle user-circle-fill caret-left caret-right caret-down x magnifying-glass sliders-horizontal
share-network pencil-simple trash check check-circle-fill warning warning-circle-fill info circle-notch
arrow-clockwise arrow-counter-clockwise arrow-square-out heart heart-fill dots-three
bird butterfly fish-simple footprints-fill trophy-fill feather-fill binoculars-fill moon-stars-fill
island-fill waves-fill sailboat-fill sun-horizon-fill hand-heart-fill car-profile-fill road-horizon-fill
moon-stars road-horizon car-profile gauge flashlight device-mobile map-pin gps-fix calendar-blank clock
image-square microphone scan dice-five hand-heart ticket gift coins lock-simple eye-slash cloud-slash
wifi-slash cloud-check file-arrow-down file-arrow-up buildings key bank table chart-bar speaker-high
chat-circle users user seal-check lightbulb path diamond frame-corners flag-banner sun moon tree
tree-palm leaf plant user-plus
amami:kurousagi amami:kurousagi-fill amami:frog amami:frog-fill amami:fern amami:fern-fill
amami:kayak amami:kayak-fill
```

上記の Phosphor 名はすべて `@iconify-json/ph@1.2.2` に存在することを確認済み。

### 5.2 太さ・大きさ・色

- **regular**: すべての UI。
- **fill**: 選択中のタブ、選択・オン状態（保存済みのハート、チェック済み）、記録ボタンのカメラ、トーストの状態アイコン、バッジの図柄。
- duotone、thin、light、bold は使わない。`Sparkle` 系は全面禁止（16 か所を下の対応表どおりに置き換える）。
- 大きさ: タブバーとヘッダー 24、行頭 20、チップと文中 16。シェブロンは 16。
- 色: 標準は `fg-2`、ナビゲーションは `fg`、選択中は `brand`。`warning` と `danger` は警告の時だけ。
- **色付きの四角にアイコンを入れたもの（`bg-x/10` のアイコンタイル）は作らない。**

### 5.3 タブ

| タブ | 通常 | 選択中 |
|---|---|---|
| ホーム | `house-simple` | `house-simple-fill` |
| 図鑑 | `book-open-text` | `book-open-text-fill` |
| 記録（中央） | `camera-fill`（常に。48px の `brand-fill` の円の中に `on-brand` で置く） | — |
| 体験 | `compass` | `compass-fill` |
| マイページ | `user-circle` | `user-circle-fill` |

### 5.4 カテゴリ（`CATEGORY_ICON`）

| Category | ラベル | 通常 | 選択中 |
|---|---|---|---|
| `mammal` | 哺乳類 | `amami:kurousagi`（耳の短いクロウサギ） | `amami:kurousagi-fill` |
| `bird` | 鳥類 | `bird` | `bird`（fill なし。選択中は色だけ変える） |
| `herp` | 爬虫・両生 | `amami:frog` | `amami:frog-fill` |
| `insect` | 昆虫 | `butterfly` | `butterfly` |
| `aqua` | 海・水辺 | `fish-simple` | `fish-simple` |
| `plant` | 植物 | `amami:fern`（ヒカゲヘゴ） | `amami:fern-fill` |

カテゴリのアイコンを種の代わりの絵として使わない（タイルや図鑑カードに大きく置かない）。

### 5.5 バッジ（16 種）

形で系統を表す。紋章は 64×64 の viewBox で描く。

| 形 | 系統 | 形状（viewBox 0 0 64 64） |
|---|---|---|
| ○ 円 | 記録の節目 | `<circle cx="32" cy="32" r="30"/>` |
| ◇ 菱（レア度のジェムと同じ形） | 生き物 | `<path d="M32 3 L61 32 L32 61 L3 32 Z" stroke-linejoin="round"/>`（同色の 4px の線で角を丸める） |
| □ 角印 | 島と季節 | `<rect x="4" y="4" width="56" height="56" rx="10"/>` ＋ 内側 5px に 1px の線（`on-brand`、不透明度 40%） |
| ⬡ 亀甲 | 守る | `<path d="M18 4 H46 L61 32 L46 60 H18 L3 32 Z" stroke-linejoin="round"/>` |

| id | 名前 | 形 | 図柄 |
|---|---|---|---|
| `first-step` | はじめの一歩 | ○ | `footprints-fill` |
| `half` | 図鑑の半分 | ○ | `book-open-text-fill` |
| `complete` | 奄美マスター | ○ | `trophy-fill` |
| `ruri` | 瑠璃の使者 | ◇ | `feather-fill` |
| `bird-watcher` | バードウォッチャー | ◇ | `binoculars-fill` |
| `night-walker` | 夜の森の住人 | ◇ | `moon-stars-fill` |
| `endemic-hunter` | 固有種ハンター | ◇ | `island-fill` |
| `legend` | 幻との遭遇 | ◇ | 文字「幻」（IBM Plex Sans JP 600、紋章 64 に対し 26px） |
| `shore` | 潮だまりの友 | ◇ | `waves-fill` |
| `mangrove` | マングローブ探検家 | ◇ | `amami:kayak-fill` |
| `island-hopper` | 島めぐり | □ | `sailboat-fill` |
| `all-areas` | 12市町村制覇 | □ | 数字「12」（IBM Plex Sans 600、24px） |
| `four-seasons` | 四季の記録者 | □ | `sun-horizon-fill` |
| `pledge` | 森との約束 | ⬡ | `hand-heart-fill` |
| `safe-driver` | セーフドライバー | ⬡ | `car-profile-fill` |
| `road-guardian` | 夜道の見守り隊 | ⬡ | `road-horizon-fill` |

- **獲得済み:** 形を `brand-fill` で塗り、図柄は `on-brand`（印影）。`legend` だけ形を `legend` で塗る。
- **未獲得:** 形を `fill` で塗り、1px の `sep` の縁、図柄は `fg-3`。
- 大きさ: 一覧 56、マイページの「最近獲得した」64、獲得画面 120。図柄は紋章の 44%。
- `BadgeIcon` 型と `BADGE_ICON` マップは上の表に合わせて作り直す（`gem` `crown` `shield` `heart` は使わない）。

### 5.6 lucide から Phosphor への対応表

| lucide | Phosphor | lucide | Phosphor |
|---|---|---|---|
| Award | `seal-check` | Hand | `hand-heart`（文脈により） |
| BadgeCheck | `seal-check` | HandHeart | `hand-heart` |
| Binoculars | `binoculars-fill`（バッジのみ） | Heart | `heart` / `heart-fill` |
| Bird | `bird` | House | `house-simple` |
| BookOpen | `book-open-text` | ImagePlus | `image-square` |
| Bug | `butterfly`（カテゴリ） | Kayak | `amami:kayak` |
| Building2 | `buildings` | KeyRound | `key` |
| Calendar | `calendar-blank` | Landmark | `bank` |
| Camera | `camera-fill`（記録ボタン） / `image-square`（アルバム） | Leaf | `amami:fern`（カテゴリ） / `leaf` |
| Car | `car-profile` | Lightbulb | `lightbulb` |
| Check | `check` / `check-circle-fill` | LoaderCircle | `circle-notch`（回転は 1 秒 1 周、操作の待ち時間だけ） |
| ChevronLeft | `caret-left` | LocateFixed | `gps-fix` |
| ChevronRight | `caret-right` | Lock | `lock-simple` |
| CircleDashed | 削除（未発見は塗りの面で表す） | MapPin | `map-pin` |
| Clock | `clock` | MessageCircle | `chat-circle` |
| Cloud | `cloud-check` | Mic | `microphone` |
| CloudOff | `cloud-slash` | Moon | `moon-stars` |
| Compass | `compass` | Pencil | `pencil-simple` |
| Crown | 削除（幻は文字「幻」） | Rabbit | `amami:kurousagi` |
| Dices | `dice-five` | RefreshCw | `arrow-clockwise` |
| ExternalLink | `arrow-square-out`（外部サイトへの移動だけ。ボタン名の後ろには付けない） | RotateCcw | `arrow-counter-clockwise` |
| EyeOff | `eye-slash` | Route | `path` |
| Feather | `feather-fill`（バッジ） | Sailboat | `sailboat-fill`（バッジ） |
| FileDown | `file-arrow-down` | ScanSearch | `scan` |
| FileUp | `file-arrow-up` | Search | `magnifying-glass` |
| Fish | `fish-simple` | Share2 | `share-network` |
| Flashlight | `flashlight` | ShieldAlert | `warning` |
| Footprints | `footprints-fill`（バッジ） | ShieldCheck | `car-profile`（セーフドライブ） / `seal-check` |
| Frame | `frame-corners` | Smartphone | `device-mobile` |
| Gauge | `gauge` | Sparkles | **削除**。AI 機能は `scan`、固有種は `island-fill`（バッジ）またはアイコンなし、クエストは `flag-banner`、記録演出はアイコンなし |
| Gem | 削除（レア度はジェム、バッジは `island-fill`） | Sprout | `plant` |
| Gift | `gift` | Stamp | 削除（スタンプは印のコンポーネント） |
| Sun | `sun` | Table2 | `table` |
| Ticket | `ticket` | Trash2 | `trash` |
| TreePalm | `tree-palm` | Trees | `tree` |
| TriangleAlert | `warning` | Trophy | `trophy-fill`（バッジ） |
| Turtle | `amami:frog`（カテゴリ） | User | `user` |
| Users | `users` | Volume2 | `speaker-high` |
| Waves | `waves-fill`（バッジ） | WifiOff | `wifi-slash` |
| X | `x` | | |

### 5.7 独自アイコン（`src/icons/amami/*.svg`）

- 256×256 の viewBox、Phosphor regular と同じ見た目の太さにする。通常版は `fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"`、fill 版は同じ輪郭を塗りつぶしたもの。外周は 24 の余白を取る。
- `kurousagi`: 横向きに座ったアマミノクロウサギ。**耳は短く丸く**（頭の高さの 1/3 以下）、胴は丸く、脚は短い。ペットのウサギの長い耳にしない。
- `frog`: 正面から見たカエル（アマミイシカワガエルを想定）。目が上に出っ張り、前脚と後脚を広げる。
- `fern`: ヒカゲヘゴ。まっすぐな幹 1 本と、上で左右に広がる 5 枚の羽状の葉。既存ロゴのシダと同じ形にする。
- `kayak`: 横から見たカヤックと、斜めのパドル 1 本。
- 描けるまでの代用品は使わない（ペット型のウサギやカメで代用しない）。これら 4 つは実装の最初の段階で作る。

---

## 6. 図像アセット

種の絵がないことが最大の問題（P0-7）。アセットごとの表示ルールと、ないときの代わりの表示を決める。

| アセット | 置き場所 | 内容 | ないときの代わりの表示 |
|---|---|---|---|
| 種のシルエット 62 点 | `src/art/sil/{species.id}.svg` | 1 パスの塗りの横向きシルエット。viewBox 0 0 100 100。`fill="currentColor"` | 番号だけのプレート（§7.10） |
| 種の参考写真 | 提携先・環境省・CC BY のもの。`species.photo = { src, credit }` | クレジットを必ず表示する | シルエット、それもなければ番号だけ |
| 利用者の写真 | 既存の IndexedDB / R2 | 記録した写真 | — |
| 体験の写真 | 事業者から提供。`experience.image = { src, credit }` | 16:9 | 写真なしの行（§8.6） |
| 龍郷柄 | `src/art/tatsugo.svg` | 図鑑カード裏面の柄。下の仕様 | 必須（実装で作る） |
| ワードマーク | `src/components/Brand.tsx` | `amami:fern` ＋「AMAMI NATURE」（IBM Plex Sans 600、字間 0.04em）。下に「奄美いきものコレクション」（`sub`、`fg-2`、字間 0） | — |
| Plus の写真 | 夜の森の写真 | 4:3 | 写真なし（紺のグラデーションで代用しない） |

**龍郷柄（`tatsugo.svg`）:** 40×40 のタイルを繰り返す。地は `brand-fill`（固定値 #1E50A2。ダークでは #4057A3）。

- 中央に菱形の輪郭 `M20 4 L36 20 L20 36 L4 20 Z` を 3px の線、`stroke-dasharray="3 2"`（絣のかすれ）で描く。色は白、不透明度 28%。
- 内側に塗りの菱形 `M20 13 L27 20 L20 27 L13 20 Z` を白、不透明度 50% で描く。
- 四隅に 4 分の 1 の菱形を同じ線で描き、隣のタイルとつなげる。

この柄を使ってよいのは図鑑カードの裏面と、共有画像の「幻」の外周だけ。`<Kasuri>` の 27 か所はすべて削除する。

---

## 7. コンポーネント

### 7.1 クラスの組み立て

- `src/lib/cn.ts`: `export const cn = (...c: ClassValue[]) => twMerge(clsx(c));`（tailwind-merge は v2.6.0。v3 は Tailwind v4 専用）
- tailwind-merge にこのシステムの独自トークンを登録する（`extendTailwindMerge`）。登録しないと `text-sub` と `text-fg-2` が衝突扱いになる:
  ```ts
  extendTailwindMerge({ extend: { classGroups: {
    'font-size': [{ text: ['display','title','section','headline','body','callout','input','sub','tile','caption','tab','num-xl','num-kpi','num-l'] }],
    'rounded': [{ rounded: ['bar','xs','thumb','sm','md','lg'] }],
    'shadow': [{ shadow: ['sheet','toast','thumb','object'] }],
  } } })
  ```
- 見た目の種類があるものは `cva`（class-variance-authority 0.7.1）で作る。

### 7.2 タブバー（`TabBar.tsx`）

- 表示する画面: `/` `/zukan` `/explore` `/me` だけ。遷移先の画面では出さない。
- 固定、`bottom-0`、`mx-auto w-full max-w-[480px]`、高さ `56px + var(--safe-bottom)`。背景は `page`（不透明。ぼかしは使わない）、上辺に 1px の `sep`。浮かせない、角丸にしない、影を付けない。
- 5 つの等幅の区画。アイコン 24 の 2px 下にラベル（`tab`）。
  - 通常: regular、`fg-2`。
  - 選択中: fill、アイコンとラベルは `brand`、ラベルは 600。点や下線は付けない。
- 中央: 48px の円、`brand-fill`、`camera-fill` 24 を `on-brand` で置く。バーの高さの中央に配置し、はみ出さない。ラベルなし、`aria-label="記録する"`。押下時は `brand-pressed`。リング、グラデーション、影は付けない。
- タップした時のアニメーションはない。

### 7.3 画面ヘッダー

- LINE のヘッダーがアプリ名を出しているので、画面内にワードマークは出さない（例外: オンボーディングの 1 ページ目とマイページのフッター）。
- 画面ごとに `document.title` を設定する（`useDocumentTitle()`）:

  | パス | タイトル |
  |---|---|
  | `/` | ホーム |
  | `/zukan` | 図鑑 |
  | `/species/:id` | 和名 |
  | `/capture` | 記録する（`?mode=road` は 路上レポート） |
  | `/sighting/:id` | ニックネーム（なければ和名） |
  | `/explore` | 体験 |
  | `/me` | マイページ |
  | `/plus` | AMAMI NATURE+ |
  | `/rewards` | ポイント交換 |
  | `/safe-drive` | セーフドライブ宣言 |
  | `/partners` | 自治体・保護団体の方へ |
  | `/onboarding` | はじめに |

- **タブ画面:** 52px の行。タイトル（`title`、22/30）を左寄せ。パディングは上 12、左右 16、下 8。右側に 40px のアイコンボタンを 2 つまで置ける。
- **遷移先の画面:** 44px の固定行。左に戻るボタン（`caret-left` 24、当たり判定 44×44）、中央にタイトル（`headline`）。スクロールが 8px を超えたら背景を `page` にし、下辺に 1px の `sep` を引く（150ms のフェード）。
- **写真の上:** 戻るボタンは 36px の円、背景は `var(--scrim)`、アイコンは白。ぼかしと影は付けない。
- 英字の上ラベルは付けない。

### 7.4 セクション見出し（`SectionHeader`）

- 左に `section`（18/26、600、`fg`）。右に任意で「すべて見る」（`sub` 600、`brand`、当たり判定 44px）と `caret-right` 14。
- 上 32px（画面の最初は 16px）、下 8px。
- 補足は 1 行まで（`sub`、`fg-2`、見出しの下 2px）。
- `label` プロパティ（英字の上ラベル）は型から削除する。

### 7.5 リストの行（`ListRow`）とグループ（`Group`）

- 最小の高さ: 1 行 48（グループ内の設定）／ 56（プレーンリスト）、2 行 64、56px のサムネイル付き 76。
- パディング: 左右 16、上下 10〜12。要素の間隔 12。
- 先頭（任意）: 20 のアイコン（`fg-2`）、または 40 / 48 / 56 のサムネイル（`rounded-xs`）。
- タイトル: `headline`（設定行は `callout`）。副題: `sub`、`fg-2`。
- 末尾（任意）: 値（`callout`、`fg-2`、数字は `.num`）、チェック（`check-circle-fill`、`success`）、`caret-right` 16（`fg-3`）、またはスイッチ。
- 押下: プレーンリストは `fill`、グループ内は `fill-strong`。即時に切り替え、縮小アニメーションは付けない。
- 区切り線はタイトルの開始位置から右端まで。最後の行には引かない。
- 1 行に事実を複数並べる時は中黒やダッシュでつながない。`<span>` を分けて 12px あけるか、日本語の文にする。
- `Group`: `mx-4 overflow-hidden rounded-md bg-fill`。見出しはグループの外に置く。グループの下に注記（`sub`、`fg-2`、上 8px）を付けられる。

### 7.6 ボタン（`button` の cva）

| 種類 | 高さ | 見た目 | 押下 / 無効 |
|---|---|---|---|
| `primary` | 50（固定 CTA と全幅）／ 44（行内） | `rounded-md`、`brand-fill`、`on-brand`、`headline`（44 の時は `callout` 600）、左右 20 | 押下 `brand-pressed`。無効は `fill` ＋ `fg-3`、ボタンの下に理由を 1 行（`sub`、`fg-2`。例「あと140pt」「4つすべてにチェックすると宣言できます」） |
| `secondary` | 50 / 44 | `fill`、`fg`、600 | 押下 `fill-strong` |
| `text` | 当たり判定 44 | 背景なし、`brand`、`callout` 600 | 押下で不透明度 60% |
| `danger-text` | 当たり判定 44 | 背景なし、`danger`、`callout` 600 | 削除・取り消し |
| `danger` | 50 | `danger` で塗り、文字は `on-danger` | 路上レポートの「送信する」だけ |
| `line` | 50 | `line-green`、白、16 / 600、左に LINE 公式ロゴ（LINE Brand Resources の SVG）20 | ロゴを用意できない場合はラベルのみ。吹き出しアイコンで代用しない |
| `on-stage` | 50 | 黒い舞台の上用。`rgb(255 255 255 / .14)`、白文字 | 図鑑カード演出とバッジ獲得画面 |

- 角丸はすべて 12（`rounded-md`）。丸いピル型のボタンは作らない（チップと記録ボタンだけが丸い）。
- ラベルの後ろに「→」や矢印アイコンを付けない。ボタンの中にチェックアイコンを入れない。
- `active:scale` は使わない。押下は色の切り替えだけ。
- 上側に 2px のパディングを足す（§3.8）。
- **固定 CTA バー:** `fixed bottom-0`、`max-w-[480px] mx-auto`、背景 `page`、上辺に 1px の `sep`、パディング `12px 16px calc(12px + var(--safe-bottom))`。

```ts
export const button = cva('inline-flex select-none items-center justify-center gap-2 pt-[2px] transition-colors disabled:pointer-events-none', {
  variants: {
    variant: {
      primary: 'bg-brand-fill text-on-brand active:bg-brand-pressed disabled:bg-fill disabled:text-fg-3',
      secondary: 'bg-fill text-fg active:bg-fill-strong disabled:text-fg-3',
      text: 'bg-transparent text-brand active:opacity-60',
      'danger-text': 'bg-transparent text-danger active:opacity-60',
      danger: 'bg-danger text-on-danger active:opacity-90',
      line: 'bg-line-green text-white active:opacity-90',
      'on-stage': 'bg-white/[.14] text-white active:bg-white/20',
    },
    size: {
      lg: 'h-[50px] w-full rounded-md px-5 text-headline',
      md: 'h-11 rounded-md px-4 text-callout font-semibold',
      hit: 'min-h-11 px-1 text-callout font-semibold',
    },
  },
  defaultVariants: { variant: 'primary', size: 'lg' },
});
```

### 7.7 チップ（`Chip`）

- 高さ 32、左右 12、`rounded-full`、`sub`。上側に 2px のパディングを足す。
- 通常: `fill`、`fg`、400。グループやシートの中では `fill-strong`。
- 選択中: `brand-fill`、`on-brand`、600。先頭のアイコンを fill 版にする。
- 先頭に 16 のアイコンを置ける。件数（`3/19`）は `.num` で、不透明度 72%。
- 枠線なし。横スクロールの行は間隔 8、左右 16。

### 7.8 セグメント（`Segmented`）

- 溝: 高さ 32、`rounded-sm`、`fill`、内側 2px。
- つまみ: `rounded-thumb`、`thumb`、`shadow-thumb`（ライトのみ）。framer-motion の `layoutId` で動かす（spring、stiffness 500、damping 40）。
- ラベル: 13px。選択中は `fg` の 600、それ以外は `fg-2` の 400。
- 全幅で使う。ピルの中にピルを入れた形にしない。

### 7.9 検索欄と入力欄

- **検索欄:** 高さ 36、`rounded-sm`、`fill`、枠線なし、影なし。左に `magnifying-glass` 16（`fg-3`）。文字は 16px（`input` の大きさ、行送り 20）。プレースホルダーは「名前・学名で探す」（`fg-3`。例示の括弧は付けない）。入力中は右に消去ボタン（`x`、20 の円）。
- **入力欄:** 高さ 48、`rounded-sm`、`fill`、`input`、左右 14。フォーカス時に 2px の `brand` のリング（`ring-2 ring-brand`）、背景はそのまま。
- **複数行:** 最小 96px、同じ見た目。
- **ラベル:** 入力欄の上 6px に `sub` 600 の `fg-2`。字間をあけない。大文字にしない。
- **日時:** `datetime-local` を透明にして行全体に重ね、行には整形した値（`10月10日 21:14`）を表示する。

### 7.10 種タイル（`SpeciesTile`）

- 3 列。列の間隔 8、行の間隔 16（358 = 114 × 3 + 8 × 2）。
- **プレート:** 1:1、`rounded-xs`、`object-cover`。プレートに枠線、模様、影を付けない。
- **キャプション**（プレートの下 6px）:
  - 1 行目: `No.001`（`caption`、`.num`、`fg-3`）と、右寄せのレア度ジェム。24 時間以内に記録した種は番号の後ろに 6px の `brand-fill` の点（「NEW!」のシールは使わない）。
  - 2 行目: 和名（`tile`、`<SpeciesName>`、2 行まで）。

| 状態 | プレート | 和名 |
|---|---|---|
| 記録済み | 利用者の写真（なければ参考写真） | `fg`、600 |
| 未発見（シルエットあり） | `fill` の上に、種のシルエットを幅 64% で `silhouette` 色 | `fg-3`、400 |
| 未発見（シルエットなし） | `fill` の上に番号 `007`（`num-l`、`fg-3`、不透明度 50%、中央、`aria-hidden`） | `fg-3`、400 |
| 幻 | 上記のどれかに、2px の `legend` の内側の線（`box-shadow: inset 0 0 0 2px rgb(var(--c-legend))`）。未発見の時は不透明度 50% | 和名の後ろに「幻」（`caption` 600、`legend`） |

- 押下時は不透明度 72%。出現アニメーションは付けない。
- カテゴリのアイコンをプレートに置かない。

### 7.11 レア度ジェム（`RarityGems`）

- 6px の正方形を 45° 回転した菱形を 4 つ、間隔 3px。塗りは `fg-2`（幻は `legend`）、空きは 1px の `sep` の輪郭。
- 行と詳細では、右に日本語の言葉を付ける（`sub`、`fg-2`、間隔 6px）。タイルではジェムだけ。
- `aria-label="レア度 ときどき"` のように言葉を読ませる。

### 7.12 進捗バー（`ProgressBar`）

- 高さ 4、`rounded-bar`、溝 `fill`、値 `brand`（§2.5）。
- 値の文字はバーの外に置く（例: `5/62種` を `.num` 15/600、`8%` を `sub` の `fg-2`）。
- 画面に出た時に 0 から伸ばさない。そのセッション中に値が変わった時だけ 300ms で動かす。
- リング（`ProgressRing`）は削除する。

### 7.13 統計（`Stat` / `StatRow`）

- 数字は `num-l`（`fg`）。単位は数字の直後に `sub` の `fg-2` で置き、基準線をそろえる。ラベルは数字の下に `caption` の `fg-2`。
- 3〜4 列を高さ 28px の 1px の縦線（`sep`）で区切る。囲みは付けない。

### 7.14 バッジの紋章（`BadgeEmblem`）

§5.5 のとおり。押すとバッジの説明シートを開く（トーストで説明しない）。シートには紋章 120、名前（`title`）、説明（`body`）、獲得日または「未獲得」を出す。

### 7.15 スタンプ（`StampSeal`）

- 72px の円。
- **訪問済み:** `brand-fill` の円、内側 4px に 1px の `on-brand`（不透明度 40%）の輪、中央に市町村名の漢字（「町」「村」「市」を除く。奄美・龍郷・大和・宇検・瀬戸内・喜界・徳之島・天城・伊仙・和泊・知名・与論）を `on-brand` の 15/600 で入れる。円の下 6px に日付（`caption`、`fg-2`、`10/10`）。
- **未訪問:** `fill` の円、1px の `sep` の輪、名前は `fg-3` の 400。点線にしない。白い角丸の箱に入れない。
- 回転、かすれ、押印アニメーションは付けない。

### 7.16 ボトムシート（`Sheet`。`@base-ui/react/drawer` で作る）

```tsx
import { Drawer } from '@base-ui/react/drawer';
<Drawer.Root open={open} onOpenChange={setOpen}>
  <Drawer.Portal>
    <Drawer.Backdrop className="sheet-backdrop" />
    <Drawer.Viewport>
      <Drawer.Popup className="sheet-popup">
        <div className="sheet-grabber" aria-hidden />
        <Drawer.Content>
          <header className="flex items-center justify-between pb-3">
            <Drawer.Title className="text-headline">…</Drawer.Title>
            <Drawer.Close aria-label="閉じる" className="grid h-11 w-11 place-items-center"><span className="grid h-8 w-8 place-items-center rounded-full bg-fill"><IconX size={16} /></span></Drawer.Close>
          </header>
          …
        </Drawer.Content>
      </Drawer.Popup>
    </Drawer.Viewport>
  </Drawer.Portal>
</Drawer.Root>
```

```css
@layer components {
  .sheet-backdrop { position: absolute; inset: 0; background: var(--scrim); transition: opacity .45s cubic-bezier(.32,.72,0,1); }
  .sheet-backdrop[data-starting-style], .sheet-backdrop[data-ending-style] { opacity: 0; }
  .sheet-popup {
    position: fixed; inset-inline: 0; bottom: 0; margin-inline: auto; width: 100%; max-width: 480px; max-height: 90dvh;
    overflow-y: auto; overscroll-behavior: contain;
    background: rgb(var(--c-surface)); border-radius: 16px 16px 0 0; box-shadow: 0 -8px 32px rgb(0 0 0 / .14);
    padding: 8px 16px calc(24px + var(--safe-bottom) + var(--drawer-keyboard-inset, 0px));
    transform: translateY(calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px)));
    transition: transform .45s cubic-bezier(.32,.72,0,1);
  }
  .sheet-popup[data-swiping] { transition-duration: 0s; }
  .sheet-popup[data-starting-style], .sheet-popup[data-ending-style] { transform: translateY(100%); }
  [data-theme='dark'] .sheet-popup { box-shadow: none; border-top: 1px solid rgb(var(--c-sep)); }
  .sheet-grabber { width: 36px; height: 5px; border-radius: 3px; background: rgb(var(--c-sep)); margin: 0 auto 12px; }
}
```

- 背面は `position: absolute`、`body { position: relative }`、`#root { isolation: isolate }`（Base UI の要件と iOS 26 Safari 対策）。
- 入力欄のあるシート（観察者ネーム、ニックネームとメモの編集）は `Drawer.VirtualKeyboardProvider` で包む。
- スナップポイント: 内容の多いシートは `[0.55, 1]`、確認用は自動の高さ（指定しない）。
- シートの中に横スクロールがある場合、その要素に `data-base-ui-swipe-ignore="x"` を付ける。
- framer-motion の `AnimatePresence` で包まない。動きは Base UI の CSS に任せる。

### 7.17 確認ダイアログ（`@base-ui/react/alert-dialog`）

取り消せない操作（この端末のデータを消去、記録の削除）だけに使う。

- 中央に表示。幅 `min(320px, 100% - 48px)`、`rounded-lg`、`surface`、`shadow-sheet`、パディング 20。
- タイトルは `headline`、本文は `body` の `fg-2`。
- ボタンは縦に 2 つ並べる。上が `danger-text` の［消去する］、下が `secondary` の［やめる］。赤で塗ったボタンは使わない。

### 7.18 トースト（`sonner`）

```tsx
<Toaster
  position="top-center"
  offset={{ top: 'calc(12px + env(safe-area-inset-top))' }}
  mobileOffset={{ top: 'calc(12px + env(safe-area-inset-top))' }}
  theme={resolvedTheme}
  visibleToasts={2}
  duration={2600}
  icons={{ success: <IconCheckCircleFill size={20} className="text-success" />, error: <IconWarningCircleFill size={20} className="text-danger" />, info: <IconInfo size={20} className="text-toast-fg/80" /> }}
  toastOptions={{
    unstyled: true,
    classNames: {
      toast: 'flex min-h-12 w-[calc(100vw-32px)] max-w-[448px] items-center gap-3 rounded-md bg-toast px-4 py-3 text-toast-fg shadow-toast dark:shadow-none',
      title: 'text-callout',
      description: 'text-sub opacity-80',
      icon: 'shrink-0',
      actionButton: 'ml-auto text-callout font-semibold text-toast-fg underline-offset-2',
    },
  }}
/>
```

- 位置は上中央（下はタブバー、記録ボタン、固定 CTA で混んでいる）。
- `ui.tsx` から `export { toast } from 'sonner'` で再公開する。既存の約 50 か所の呼び出しはそのまま使える。`ToastHost` と `useToastStore` は削除する。
- 文言は操作と同じ動詞の過去形（「記録しました」「交換しました」「宣言しました。+10pt」）。バッジの説明にトーストを使わない（§7.14）。

### 7.19 空状態（`EmptyState`）

- セクションの中に左寄せで置く。イラストの塊は使わない。
- 構成: シルエットまたは regular アイコン 40（`fg-3`、任意）、1 行の見出し（`headline`）、2 行までの本文（`body`、`fg-2`）、ボタン 1 つ（`secondary` の `md`）。
- 例: 「最初の1枚を撮ろう」「近くで見られる生き物から始められます」［記録する］

### 7.20 お知らせ行（`Notice`）

色は**アイコンだけ**に付け、文字は `fg` か `fg-2` にする。色付きの面や破線の枠は使わない。

| 種類 | アイコン（20） | 文字 | 背景 |
|---|---|---|---|
| `info` | `info`、`fg-2` | `sub`、`fg-2` | なし（流れの中）／ デモデータの告知だけ `fill` の `rounded-sm`、パディング 12 |
| `caution` | `warning`、`warning` | `sub`、`fg` | なし |
| `danger` | `warning-circle-fill`、`danger` | `sub`、`fg`。最初の一文だけ 600 | なし |
| `night` | `moon-stars`、`fg-2` | `sub`、`fg-2`。右端に `text` ボタン | なし |

### 7.21 図鑑カード（`CollectibleCard`）：唯一の大胆な要素

アプリの中で唯一の「カード」。記録時の演出（§8.5）、記録詳細（§8.6）、共有画像（§8.15）で使う。

- 大きさ: 280×392、`rounded-lg`。
- **外枠（素材）:** 外側の `div` に `padding: 4px; border-radius: 16px; background: <素材>`。内側の `div` は `border-radius: 12px; overflow: hidden; background: rgb(var(--c-surface))`。
  - レア度 1: パディング 0、1px の `sep` の枠。
  - レア度 2: `var(--mat-dorozome)`。
  - レア度 3: `var(--mat-yakougai)`。
  - レア度 4: `var(--mat-kinpaku)`。
  - マスク合成は使わない（WebKit で不安定なので、パディングで縁を作る）。
- **表面:**
  - 上部: 写真 272×272（1:1、角丸なし）。写真がなければ `fill` の上にシルエット、それもなければ番号のプレート。**写真の上には文字を置かない。**
  - 下部の帯（`surface`、パディング 12/14）:
    - 1 行目: `No.005`（`caption`、`.num`、`fg-3`）とジェム。
    - 2 行目: 和名（`title`、`<SpeciesName>`）。
    - 3 行目: 「ルリ太郎」（`sub`、`fg-2`。ニックネームがあるとき）。
  - **生 ID（`sighting.id`）を描画しない。** 番号は `No.${String(species.no).padStart(3, '0')}`。
- **裏面:** `brand-fill` の地に龍郷柄（§6）。中央に `amami:fern` 48（白、不透明度 70%）。文字はなし。
- 影は黒い舞台の上でだけ `shadow-object`。ページの上（記録詳細）では影なし。

### 7.22 その他の削除・置き換え

- 削除: `Kasuri`、`ProgressRing`、`Page` の出現アニメーション、`.foil`、`.card`、`.label`、`.chip`（新しい `Chip` に置き換え）、`.btn*`（`button` の cva に置き換え）、`.input`（新しい入力欄）、`keyframes.shimmer`、`keyframes.floaty`、`animation.*`。
- `PageHeader` は `ScreenHeader`（§7.3）に置き換える。

---

## 8. 画面

ワイヤーフレームの幅は 358px（左右 16px の余白を除く）。`[ ]` は写真や枠、`( )` はチップや円。

### 8.1 ホーム（`/`、タブ画面）

```
10月の奄美                               display 28/36
サシバが南へ渡る途中、奄美で羽を休めます     callout fg-2（SEASON_NOTE を文にする）
[ 注目種の写真 4:3 rounded-md ]          写真がある時だけ
                       © 撮影者           caption fg-3（写真の下）

図鑑                       5/62種   ›     headline ＋ .num、行全体で /zukan へ
▬▬▬─────────────────────────────          ProgressBar 4px
見習い観察者　160 pt                       sub fg-2

10月に会えるかも                すべて見る ›
[56] サシバ                          ✓    headline、末尾は記録済みなら success のチェック
     ◆◆◇◇ ときどき                         sub fg-2
─────────────────────────────            内側から引いた区切り線（3 行まで）
開催中のクエスト                すべて見る ›
(flag-banner) 秋の渡りを見届けよう   1/2   headline、末尾は .num
              +80pt                       sub fg-2
最近の記録                      すべて見る ›   （記録がある時だけ）
[96][96][96][96] →                       rounded-xs、横スクロール
ルリ太郎  クロ吉 …                         sub、写真の下に 1 行（ニックネームは省略記号可）
おすすめの体験
[ 16:9 写真 rounded-md ]                  写真がなければ写真なしの行
金作原 原生林ガイドウォーク                 headline
3時間　奄美市　4,000円から                  sub fg-2（span を 12px あける）
(moon-stars) 夜の道路ではクロウサギが飛び出します  セーフドライブ ›
                                          Notice night。18:00〜翌5:59 だけ
β版　運営：株式会社アマリンク               caption fg-3
```

- 削除: 緑のヒーロー（挨拶、リング、ランク、ポイント）、4 つのクイックアクション、ワードマークの見出し、「デモ」のピル（デモ表示は §7.20 の `Notice info` にして、マイページの「設定」グループの上に置く）。
- 路上レポートとセーフドライブは体験タブ（§8.7）へ、ポイント交換はマイページ（§8.8）へ移す。
- 季節の種の行のサムネイル: 利用者の写真 → 参考写真 → シルエット → 番号プレートの順で使う。

### 8.2 図鑑（`/zukan`、タブ画面）

```
図鑑                              5/62種  8%     title ＋ .num 15/600 ＋ sub fg-2
▬▬▬─────────────────────────────────────          ProgressBar
[(⌕) 名前・学名で探す              ] [⚙]          検索 36 ＋ 40px の sliders-horizontal
(未発見 ×)(すべて)(🐇 哺乳類 1/4)(鳥類 3/19)(🐸 爬虫・両生 0/14)(昆虫 1/8)(海・水辺 0/9)(植物 0/8) →
┌────┐ ┌────┐ ┌────┐
│写真│ │ 影 │ │007 │
└────┘ └────┘ └────┘
No.001 ◆◆◆◇  No.002 ◆◇◇◇  No.003 ◆◇◇◇
アマミノ        ケナガ          アマミ
クロウサギ      ネズミ          トゲネズミ
```

- 背景は `page`。進捗のカードは廃止し、タイトル行の右の数字と 4px のバーにする。
- フィルターボタン（`sliders-horizontal`）でシートを開く。中身: 「表示」のセグメント（すべて / 記録済み / 未発見）、「並び順」のラジオ行（番号順 / レア度順 / 最近記録した順）、［この条件で表示］。
- 発見状態のフィルターがかかっている時は、チップ列の先頭に選択中のチップ（例「未発見 ×」）を出し、押すと解除する。
- 0 件の時: 「該当する生き物はいません」＋［条件を解除］（`secondary`）。
- 下線タブ（すべて / 記録済み / 未発見）は廃止する。

### 8.3 種詳細（`/species/:id`、遷移先）

```
[ 全幅の写真 4:3（角丸なし）、なければ fill の上にシルエット ]   （‹）写真の上に 36px の丸ボタン
                                         © 撮影者   caption fg-3（写真の下、右寄せ）
No.005  ◆◆◇◇ ときどき                               caption .num fg-3 ＋ sub fg-2
ルリカケス                                           display（<SpeciesName>）
Garrulus lidthi                                      sci 15/22
[            この生き物を記録する            ]        primary lg
あなたの記録 2件                         すべて見る ›   （記録がある時だけ）
[96][96] →                                           日付は caption、ニックネームは sub
どんな生き物？                                        section
本文 15/26                                            body
┌ グループ ─────────────────────────┐
│ 分類        鳥類                    │               左 callout fg-2 / 右 callout fg
│ 固有性      奄美の固有種            │
│ 保護        国の天然記念物          │
│ 活動する時間 昼                      │
│ 生息環境    森　里                   │
│ 分布        奄美大島・加計呂麻島…   │  ← 値は文章のまま（中黒は地名の列挙として可）
└───────────────────────────────────┘
見られる季節
▮▮▮▮▮▮▮▮▮▮▮▮                                         12 本、高さ 24、間隔 2、rounded-bar
1 2 3 4 5 6 7 8 9 10月 11 12                          caption fg-3、今月だけ「10月」を fg 600
観察のコツ / 観察マナー / シマの話                     section ＋ body（見出しはすべて fg）
(warning) ハブに注意。夜の草むらに…                    Notice caution（危険生物だけ）
(eye-slash) 希少種のため位置を自動でぼかします         Notice info（sensitive の種だけ）
この生き物に会える体験                                 1 行のリスト（カルーセルにしない）
```

- 写真もシルエットもない時はヒーローを出さず、通常の 44px の遷移ヘッダー（戻る＋和名）から始める。
- 季節バー: 見頃の月は `brand`、それ以外は `fill`。通年の種はバーを出さず「一年中見られます」（`callout`）とだけ書く。今月を赤い枠で囲まない。
- 固有種・天然記念物・夜行性などの色付きピルはやめ、上のグループの項目にする。セクション見出しの色分けとアイコンもやめる。
- 記録ボタンは本文の流れの中に置く（固定しない）。

### 8.4 記録（`/capture`、遷移先、3 段階）

段階は実際の手順なので、右上に `1 / 3`（`caption`、`.num`、`fg-2`）を出す。3 本の進捗バーと英字の上ラベルは廃止する。

**1 写真**（全画面の黒い舞台。ライトでも #000）

```
(×)                                        1 / 3      白。右上はフラッシュの注意を開く（info）
                                                      
        近づきすぎず、ズームで撮ろう                    callout、白 70%
   夜行性の生き物にフラッシュを向けすぎないでください    sub、白 55%

[▢ アルバム]        ( ◯ 72 )         写真なしで記録     下部 120 ＋ safe
 44 rounded-xs      シャッター          text、白
```

- シャッターは白い 4px の輪と、内側 58px の白い円。押すと `<input type="file" accept="image/*" capture="environment">` を開く（LIFF 内でライブビューは使わない）。
- 撮影・選択後は写真を舞台いっぱいに表示（`object-contain`）し、下部を［撮り直す］（`on-stage`）と［この写真で進む］（`primary`）に替える。
- 点線の「ドロップゾーン」、緑のグラデーション、クリーム色の円は廃止する。

**2 名前**（`page`）

```
‹   なにを見ましたか？                       2 / 3
[72 写真]                                             rounded-xs
[(⌕) 名前・学名で探す                    ]
AIの候補                                              section（Plus の時）
[56] ルリカケス          確からしさ 82%   [これ]     sub fg-2 ＋ secondary 32px
     Garrulus lidthi                                  sci 13
(scan) AIで名前を調べる                         ›    Plus でない時。sub「1日1回無料。Plusなら1日30回」
この季節に多い生き物
[56] …                                       [これ]
わからない・あとで調べる                         ›    最後の行
```

- 選んだ候補の行は `brand-soft` にする（この画面だけの用途）。

**3 記録**（`page`）

```
‹   記録する                                3 / 3
[72] ルリカケス                              変更     headline ＋ sci 13、text ボタン
     Garrulus lidthi
ニックネーム
[ ルリ太郎                        (dice) ]           input 48、右端に dice-five の 40px ボタン
(ルリちゃん)(ルリぴー)(島のルリじろう) →                Chip
┌ グループ ──────────────────────────┐
│ 日時      10月10日 21:14          › │
│ 地域      龍郷町          (gps-fix) │
│ メモ      どんな様子だった？         │  ← 複数行の入力
└────────────────────────────────────┘
(info) 位置は約100mぼかして保存します。共有画像には市町村名だけを表示します     Notice info
[              図鑑に記録する              ]           固定 CTA
```

**路上レポート**（`/capture?mode=road`）

- 1 段階目の前に、`page` の上で次を出す:
  - `Notice danger`: 「運転中は操作しないでください。」に続けて「安全な場所に停車してから、または同乗者が記録しましょう。正確な位置は行政・保護機関との共有にだけ使い、公開しません。」
  - セクション「何を見つけましたか？」と、グループ内の 3 つのラジオ行（交通事故にあった生き物 `warning` / けがをしている生き物 `hand-heart` / 路上にいた生き物 `car-profile`。アイコンは `fg-2`、選択中の行だけアイコンを `danger`）。
  - ［写真を撮る］（`primary`）で 1 段階目の舞台へ進む。
- 最後のボタンは［送信する］（`danger` の塗り）。お礼の画面は紙吹雪なしで、けがをした動物の連絡先をリストで出す。

### 8.5 図鑑カードの演出とバッジ獲得

```
                                          (×)    白、44
            ┌──────────────────┐
            │  写真 1:1         │   280×392、素材の縁、shadow-object
            ├──────────────────┤
            │ No.005 ◆◆◇◇      │
            │ ルリカケス        │
            │ 「ルリ太郎」      │
            └──────────────────┘
              図鑑に登録しました                headline、白（2回目以降は「記録しました」）
                 +30 pt                        .num 22/600、白 70%、NumberFlow
   クエスト「秋の渡りを見届けよう」を達成　+80 pt     sub、白 70%（あれば 1 行ずつ）
[           LINEで送る           ]             line
[           続けて記録           ]             on-stage
              図鑑で見る                       text、白 80%
```

- 舞台は `var(--stage)`（両モードとも黒 92%）。カードは画面中央より少し上、ボタンは下にまとめる（幅 358）。
- 新しい種の時は「NEW」の札を付けない。見出しの言葉（「図鑑に登録しました」）で伝える。
- **バッジ獲得:** 閉じる操作（続けて記録 / 図鑑で見る / ×）の後、新しいバッジがあれば 1 つずつ同じ舞台で見せる。紋章 120、名前（`title`、白）、説明（`body`、白 70%）、日付（`caption`、白 55%）、［OK］（`primary`）。全部見終えてから元の操作を実行する。「LINEで送る」では閉じない。
- 「NEW BADGE」「QUEST CLEAR」「NEW DISCOVERY」などの英字は使わない。

### 8.6 記録詳細（`/sighting/:id`、遷移先）

```
‹   ルリ太郎
        ┌──────────────┐
        │ 図鑑カード    │   280×392、中央、影なし（演出なし、裏返らない）
        └──────────────┘
[ LINEで送る ]  [ 編集 ]                     line md ＋ secondary md、横並び
┌ グループ ─────────────────────────┐
│ 日時       2026年10月10日 21:14      │
│ 地域       龍郷町                    │
│ メモ       木の上で鳴いていた         │
│ 位置       約100mぼかして保存         │  ← sensitive は「希少種のため座標は保存していません」
│ 同期       同期済み (cloud-check)     │  ← 未同期は warning のアイコンと「未同期」
└───────────────────────────────────┘
この生き物の図鑑を見る                     ›
この記録を削除                                danger-text → 確認ダイアログ
```

- 編集はシート（ニックネーム、メモ）。`VirtualKeyboardProvider` で包む。

### 8.7 体験（`/explore`、タブ画面）

```
体験
[ 体験 | スタンプ | マナー ]                     Segmented、全幅
```

**体験**

- 写真がある体験（`experience.image`）: 16:9 の写真（`rounded-md`）、右上に 36px の丸い保存ボタン（`var(--scrim)`、白い `heart`／保存済みは `heart-fill`）、写真の下にタイトル（`headline`、`<Phrase>`）とメタ 1 行（`sub`、`fg-2`、「3時間　奄美市　4,000円から」）。認定ガイドの時だけ、メタの下に中立のタグ「認定ガイド」（`caption`、`fill`、高さ 24、`rounded-full`、左右 8）。
- 写真がない体験: プレーンリストの行（タイトル `headline`、メタ `sub`、`caret-right`）。色付きのグラデーションの箱で代用しない。
- 一覧には説明文と「予約へ」ボタンを置かない。行を押すと詳細シート（説明、所要時間、料金、事業者）が開き、そこに［事業者のサイトで予約する］（`primary`）を置く。ボタンの下に `arrow-square-out` 16 と「外部サイトが開きます」（`sub`、`fg-2`）を添える。ボタンの文字の後ろにはアイコンを付けない。
- 一覧の最後にセクション「道路と生き物」とプレーンリスト 2 行:
  - (road-horizon) 路上レポートを送る　副題「交通事故やけがをした生き物を見つけたら」→ `/capture?mode=road`
  - (car-profile) セーフドライブ宣言　副題「夜の林道はゆっくり。1日1回 +10pt」→ `/safe-drive`

**スタンプ**

```
12市町村のうち 4 か所                          callout ＋ .num
▬▬▬▬─────────────────────────────
奄美大島                                       sub 600 fg-2
(奄美)(龍郷)(大和)(宇検)                        StampSeal 72、4 列、間隔 16
(瀬戸内)
喜界島
(喜界)
徳之島
(徳之島)(天城)(伊仙)
沖永良部島
(和泊)(知名)
与論島
(与論)
(info) スタンプは、その市町村で生き物を記録するともらえます     Notice info
```

- 島の地図に印を置く版は第 2 段階で作る（国土数値情報の行政区域、CC BY 4.0 を mapshaper で簡略化）。

**マナー**

- アイコンを先頭にしたプレーンリスト。番号を付けない（順序のある手順ではないため）。各行はタイトル（`headline`）と説明（`body`、`fg-2`）。

### 8.8 マイページ（`/me`、タブ画面）

```
(64) しまのり                             (pencil-simple)    title ＋ 40px のボタン
     見習い観察者                                              sub fg-2
  12     │  5/62種  │  4/12   │   3                          StatRow
  記録       図鑑      市町村     バッジ
┌ グループ ─────────────────────────┐
│ (coins) ポイント          160 pt  › │  → /rewards、副題「次の「森の探検家」まで40pt」
└───────────────────────────────────┘
最近獲得したバッジ                       すべて見る ›          → シート（4×4 の全 16 個）
 ◇ 64      ○ 64      ⬡ 64
 瑠璃の使者  はじめの一歩  森との約束                          caption、<Phrase>、2 行まで
アカウント
┌ LINE 連携  しまのり   › │ 観察者ネーム  しまのり  › ┐
設定
┌ 表示モード  自動  › │ セーフドライブ宣言  › ┐               表示モード → シートで 自動 / ライト / 夜の森
データ
┌ 記録を書き出す › │ バックアップから読み込む › │ この端末のデータを消去（danger-text） ┐
その他
┌ 自治体・保護団体の方へ › │ AMAMI NATURE+ › ┐
[            LINEで友だち追加            ]                     line（この画面で唯一の緑）
AMAMI NATURE β版　運営：株式会社アマリンク                    caption fg-3、ワードマーク（小）
```

- アバター: 利用者の最初の記録の写真。なければ `fill` の円に `user` 32（`fg-3`）。明朝の頭文字と金の輪は廃止する。
- 濃い緑のカード、4 つの統計の箱、16 個のバッジの一括表示は廃止する。
- 未ログインの時は「LINE 連携」の行を［LINEでログイン］（`line`）に替える。

### 8.9 ポイント交換（`/rewards`、遷移先）

```
‹   ポイント交換
160 pt                                         num-xl（pt は sub fg-2、0.15em あける）
これまでに160pt獲得、0pt交換しました             sub fg-2
交換できるもの
(hand-heart) 奄美の自然保護に寄付する      100 pt   headline ／ 副題 sponsor（sub fg-2）／ 末尾 .num 15/600 brand
(ticket)     提携ツアー 1,000円OFF     あと140pt   末尾は sub fg-3（ボタンを灰色にしない）
(ticket)     島の協賛店クーポン        あと40pt
(gift)       …                                     「森との約束」バッジが必要、のように条件は副題に
交換履歴                                            （履歴がある時だけ）
(info) ポイントに換金性はありません。景品は掲載イメージです     Notice info
```

- 先頭のアイコンは種類で決める: 寄付 `hand-heart`、クーポン `ticket`、品物 `gift`、抽選 `dice-five`。
- 行を押すと確認シート（自動の高さ）: タイトル（`headline`）、説明（`body`）、グループ（必要なポイント 100 pt ／ 交換後の残り 60 pt）、［交換する］（`primary`）、［やめる］（`text`）。交換後のトーストは「交換しました」。
- 茶色のグラデーションのヒーローは廃止する。

### 8.10 AMAMI NATURE+（`/plus`、遷移先、全画面）

```
(×)                                             写真があれば写真上の丸ボタン
[ 夜の森の写真 4:3、全幅 ]                        写真がなければ省く
名前がわからなくても、                             display（<Phrase>、balance）
写真から調べられる
写真を撮ると、AIが図鑑の中から候補を出します。       body fg-2
┌ グループ ─────────────────────────┐
│ (scan)  写真から名前の候補を表示     │  副題「1日30回まで」
│ (…)     …                           │
└───────────────────────────────────┘
近日追加                                          section
┌ (microphone) 鳴き声から調べる   準備中 ┐          fg-3、「準備中」は caption
プラン
┌ グループ ─────────────────────────┐
│ (●) トリップパス     ¥480           │  sub「7日間、自動更新なし」、caption brand「旅行中の方に」
│ ( ) 年額プラン      ¥3,800          │  sub「月あたり約¥317」、caption brand「いちばんお得」
│ ( ) 月額プラン       ¥480           │  sub「1か月ごとに自動更新」
└───────────────────────────────────┘
[       トリップパスではじめる       ]             固定 CTA（選んだプランの名前）
β版のため、決済は発生しません                       caption fg-2（CTA の下）
利用規約      購入を復元                            text ボタン 2 つ（中黒でつながない）
```

- ラジオは 20px の円。選択中は `brand-fill` の円に白い 8px の点。行の外枠を色で囲まない。
- 紺のグラデーション、金の光の塊、グラデーションのボタン、5 枚の機能カードは廃止する。

### 8.11 セーフドライブ宣言（`/safe-drive`、遷移先）

```
‹   セーフドライブ宣言
夜の道は、生き物たちの道でもある                     title（<Phrase>）
奄美大島・徳之島では、アマミノクロウサギの交通事故が    body fg-2
毎年多く確認されています。…
これまでの宣言　3回                                   callout ＋ .num
出発前のチェック                                      section
┌ グループ ─────────────────────────────┐
│ (gauge)  林道では時速20〜30km程度で          ( ) │  末尾は 24px のチェック円
│          ゆっくり走ります                        │  チェック済みは brand-fill の円に白い check
│ (lightbulb) 生き物を見つけてもライトを当て続けず… ( ) │
│ (device-mobile) 運転中はスマホを操作しません…    ( ) │
│ (warning) 路上の生き物には、後続車に注意して…    ( ) │
└────────────────────────────────────────┘
[          宣言して出発する          ]                 固定 CTA
4つすべてにチェックすると宣言できます                    無効時の理由（sub fg-2）
```

- 宣言後: トースト「宣言しました。+10pt」、ボタンは無効になり、理由は「今日は宣言済みです。明日また宣言できます」。
- 紺のヒーロー、金の円（月が 2 つある状態）、アイコンタイルは廃止する。

### 8.12 自治体・保護団体の方へ（`/partners`、最大 960px）

```
‹   自治体・保護団体の方へ
ダッシュボード                         [ グラフ | 表 ]   title ＋ Segmented（幅 160）
(info) デモデータを表示しています                        Notice info（fill の枠）
┌ グループ（2×2、640px 以上は 4×1）──────┐
│ 記録数        │ ロードキル報告         │  ラベル sub fg-2、値 num-kpi
│ 1,284         │ 37                    │  ロードキルの値も fg（数字を赤くしない）
├───────────────┼───────────────────────┤
│ 参加者        │ セーフドライブ宣言     │
└───────────────┴───────────────────────┘
市町村別の記録                                          section
┌ グラフのグループ（fill、パディング 16）┐
│ 横棒、系列1 brand、多い順、押すとその市町村の路上レポート │
└──────────────────────────────────────┘
時間帯別（夜間の帯は chart-band）、月別のロードキル（系列2 danger）
```

- 表: 数字は右寄せの `.num`。状態は 6px の点（`success` / `warning` / `danger`）と文字。ピル型の状態表示は使わない。
- 鍵の入力が必要な場合は、入力欄（`input`）と［表示する］（`primary`）だけの画面にする。
- 「位置は提携先のみ」の注記は `Notice info` で残す。

### 8.13 オンボーディング（`/onboarding`）

- 3 ページを CSS の scroll-snap で横に並べる（ライブラリは使わない）。各ページ: 上 60% に全幅の写真（クロウサギ、ルリカケス、「クロウサギ注意」の道路標識）。写真がない間は写真の領域を省き、見出しを上に詰める。
- 見出し（`display`、`<Phrase>`、`balance`）、本文（`body`、`fg-2`）、6px の点のページ表示（現在は `fg`、それ以外は `sep`）。
- 1 ページ目の上部にだけワードマーク（§6）。
- 固定 CTA: ［次へ］、最後は［はじめる］。右上に「スキップ」（`text`）。
- 例: 「奄美の生き物を記録して、自分だけの図鑑をつくろう」。

**3つの約束（Pledge）**

```
3つの約束                                              title
(hand-heart)   近づきすぎず、そっと見守ります             headline ＋ body fg-2
(car-profile)  夜の林道はゆっくり走ります
(eye-slash)    希少な生き物の場所は広めません
観察者ネーム（あとで変更できます）                        ラベル sub 600 fg-2（字間あけない）
[ しまのり                              ]               input 48
[          約束してはじめる          ]                    固定 CTA
```

- 番号を付けない。チェックボックスで同意させない（約束は 1 つのボタンで行う）。

### 8.14 タブ画面以外の共通事項

- 遷移先の画面ではタブバーを出さない。
- 主な操作が 1 つの画面は固定 CTA を使う（記録 3、Plus、セーフドライブ、オンボーディング）。それ以外は流れの中にボタンを置く。

### 8.15 共有画像（`src/lib/share.ts`、1080×1350）

- 背景は白 #FFFFFF（テーマに関係なく常にライト）。色は `src/styles/palette.ts` に定義したライトの値を使う（canvas は CSS 変数を読めないため、16 進数を書いてよいのはこのファイルだけ）。
- 写真: (60, 60) に 960×960、角丸 24。写真がなければ #F1F3F2 の上にシルエット、それもなければ番号。
- レア度 2〜4 は画像の外周 16px を素材で塗る（泥染は単色、夜光貝は `createConicGradient`、金箔は `createLinearGradient`。値は §2.1 のライト）。幻だけ外周に龍郷柄を重ねてよい。
- 文字（すべて IBM Plex。`document.fonts.load` で 600 と 400 を読み込んでから描く）:
  - (60, 1080) `No.005` と、その右のジェム: Plex Sans 600 30px、#656C68
  - (60, 1160) 和名: Plex Sans JP 600 64px、#161A18（長い時は 52px に下げる）
  - (60, 1220) 「ルリ太郎」: Plex Sans JP 400 36px、#4A524E
  - (60, 1290) 「龍郷町　2026年10月10日」: Plex Sans JP 400 28px、#656C68（sensitive の種は市町村名を出さない）
  - 右下 (1020, 1290) 右寄せ: 「AMAMI NATURE」Plex Sans 600 28px、#1E50A2
- ハッシュタグは画像に入れず、共有テキストに入れる。

---

## 9. モーション

**動かしてよいもの**（利用者の操作への応答と、1 つの演出だけ）

1. **図鑑カードの演出**（全体で 1.6 秒以内）:
   1. 裏面のカードが 24px 上がりながらフェードイン（240ms）。
   2. Y 軸で 1 回だけ裏返る（600ms、`cubic-bezier(.2,.8,.2,1)`）。
   3. ジェムが 60ms ずつずれて現れる。
   4. レア度 3 は夜光貝の縁に光が 1 回だけ走る（900ms）。レア度 4 は金箔の縁に 1 回だけ光が走る（1200ms）。どちらも 1 回で止める。
   5. 文字が 200ms でフェードイン。ポイントは NumberFlow で 600ms かけて数える。
   6. ボタンが 400ms 後にフェードイン。
2. シートの開閉とドラッグ（Base UI の CSS トランジション）。
3. トーストの出入り（Sonner）。
4. セグメントのつまみ（`layoutId`）。
5. チェックのオン・オフ（scale 0.9 → 1、120ms）。
6. 記録の段階の切り替え（横 24px ＋フェード、220ms）。
7. 遷移ヘッダーの背景の切り替え（150ms）。
8. 進捗バーとポイントの数値。そのセッション中に値が変わった時だけ。
9. 押下の色の切り替え（即時）。

**動かしてはいけないもの**

- 画面遷移のたびのフェードアップ（`Page` の `initial=`）、タブの切り替え。
- タイルやスタンプの時間差の出現（スタッガー）。
- 表示時にリングやバーを 0 から伸ばすこと。
- `floaty`、`.foil` / シマー、無限ループのアニメーション全般。
- ホバーで浮かせること、`active:scale`、パララックス、紙吹雪、スケルトンのシマー（読み込み中は静止した `fill`）。

**動きを減らす設定**（`prefers-reduced-motion: reduce`）: 演出は 150ms のクロスフェードだけにし、裏返し・光・NumberFlow のアニメーションは止める。既存の一括無効化のブロックは残す。

---

## 10. 文言

- 中黒（`·`、`・` による事実の連結）、半角・全角のダッシュ（`—`、`——`）でつないだラベルを使わない。例:
  - 「10月 · 秋 — サシバの渡り」→「10月の奄美」＋「サシバが南へ渡る途中、奄美で羽を休めます」
  - 「累計 160pt · 交換済み 0pt」→「これまでに160pt獲得、0pt交換しました」
  - 「7日間 · 自動更新なし」→「7日間、自動更新なし」
  - 「1日1回無料 · Plusなら1日30回」→「1日1回無料。Plusなら1日30回」
  - 地名の列挙（奄美大島・徳之島）の中黒は日本語の通常の用法なので可。
- 英字の見出し、英語のランク名（`RANKS.en`）、英語のレア度（`RARITY_META.en`）は UI に出さない。
- 「NEW!」の傾いたシール、装飾としての「+80pt」のピル、ボタンの「→」は使わない。
- フッターは日本語に統一する:「β版　運営：株式会社アマリンク」。
- ボタンは結果を表す動詞にし、同じ操作は最後まで同じ言葉を使う（［図鑑に記録する］→ トースト「記録しました」、［交換する］→「交換しました」、［宣言して出発する］→「宣言しました」）。
- エラーは何が起きたかと直し方を書く。謝らない。例:「通信できませんでした。電波のある場所でもう一度送信してください」。
- 空の画面は行動を促す 1 文にする（§7.19）。
- 「すべて見る」「変更」「やめる」「閉じる」など、画面をまたいで同じ言葉を使う。

---

## 11. やってはいけないこと

1. クリーム色・紙色の背景。明朝体、Cormorant、セリフ体全般。和文のイタリック。
2. 英字の大文字の上ラベル。和文の字間あけ（±0.02em を超えるもの）。
3. ページの流れの中で影の付いたカード。カードの中のカード。1 項目 1 カードのリスト。全部同じ角丸。
4. 装飾のグラデーション、光の塊、絣の壁紙。例外は図鑑カードの素材の縁と、写真用のスクリム、龍郷柄（カード裏面と共有画像の幻）だけ。
5. 画面の先頭の色付きヒーロー。大きな数字と小さなラベルを並べたダッシュボード風のヒーロー。
6. 2 色目のブランド色。カテゴリごとの色。「幻」以外の金色。
7. LINE の操作以外での LINE グリーン。
8. 写真の上に帯なしで文字を置くこと。生の ID を UI に出すこと。
9. 中黒やダッシュでつないだメタ情報、「WORD — 断片」型のラベル、ボタンの「→」、「NEW!」のシール。
10. 12px 未満の文字（タブのラベルの 11px だけ例外）、16px 未満の入力欄、`text-[Npx]`。
11. 700 / 800 の太さ。文中の一語だけの太字。見出しの一語だけの色や太字。
12. 色付きのアイコンタイル、Sparkle アイコン、種の代わりのストックアイコン、lucide。
13. テーマで変わるトークンの上の固定色の文字。
14. 利用者の操作によらない動き（§9 の 1 の演出を除く）。
15. カタカナの和名の途中での改行。和名の省略記号。
16. 灰色の背景に白い角丸グループを全画面で並べること（グループは §4.4 の用途だけ）。
17. 数字を等幅でない書体で表示すること。モノスペース書体のデータラベル。

---

## 12. ライブラリと設定

### 12.1 インストール（バージョン固定。すべて 2026-09-26 以前の公開）

```bash
npm i --save-exact sonner@2.0.8 @base-ui/react@1.8.0 clsx@2.1.1 tailwind-merge@2.6.0 class-variance-authority@0.7.1 budoux@0.9.2 @number-flow/react@0.6.2
npm i -D --save-exact @iconify-json/ph@1.2.2
npm rm lucide-react
```

| パッケージ | 版 | 公開日 | ライセンス | 用途 |
|---|---|---|---|---|
| `sonner` | 2.0.8 | 2026-08-09 | MIT | トースト（§7.18） |
| `@base-ui/react` | 1.8.0 | 2026-09-04 | MIT | ボトムシート（`/drawer`）、確認ダイアログ（`/alert-dialog`）。サブパスからだけ読み込む |
| `clsx` | 2.1.1 | 2024-04-23 | MIT | クラスの結合 |
| `tailwind-merge` | 2.6.0 | 2024-12-23 | MIT | クラスの衝突解決。**v3 は Tailwind v4 専用なので使わない** |
| `class-variance-authority` | 0.7.1 | 2024-11-26 | Apache-2.0 | ボタンなどの種類 |
| `budoux` | 0.9.2 | 2026-09-16 | Apache-2.0 | 日本語の文節改行（§3.5）。0.9.3 は公開から日が浅いので使わない |
| `@number-flow/react` | 0.6.2 | 2026-07-18 | MIT | ポイントの数値の変化（演出、ポイント交換） |
| `@iconify-json/ph` | 1.2.2（dev） | 2024-12-16 | MIT | Phosphor の図案データ（§5.1） |

採用しないもの: `unplugin-icons` と `@svgr/*`（生成スクリプトで足りる）、`@phosphor-icons/react`（6 ウェイトが同梱され約 68KB）、`vaul`（保守停止）、`embla-carousel-react`（scroll-snap で足りる）、Konsta UI / HeroUI（Tailwind v4・React 19 前提）、shadcn/ui の既定の見た目、Radix（Base UI と重複）、Material Symbols、Tabler。

### 12.2 設定の変更点

- `index.html`:
  - フォントのリンクを §3.1 のものに替える。`lang="ja"` は残す（Android で日本語の字形を選ぶために必須）。
  - `<title>AMAMI NATURE</title>`。
  - `theme-color` を 2 つにする: `<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">` と `<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">`。テーマを切り替えた時は JS で `content` を更新する。
  - `apple-mobile-web-app-status-bar-style` は `default`。
  - テーマのちらつき防止スクリプトはそのまま残す。
- `vite.config.ts`: `google-fonts` のキャッシュを `maxEntries: 500`。マニフェストの `theme_color` と `background_color` を `#FFFFFF`。
- `tailwind.config.js`: §2.4、§3.2、§3.3、§4.1、§4.3 のとおり。`letterSpacing.label`、`keyframes`、`animation` は削除。
- `src/styles/index.css`: §2.3、§3.2、§7.16、§7.21 のとおり。`.foil`、`.label`、`.card`、`.btn*`、`.chip`、`.input`、`.hairline` を削除。
- `package.json` の scripts に `"icons:ui": "node scripts/build-ui-icons.mjs"` と `"contrast": "node scripts/contrast.mjs"` を足す。
- `src/components/ui.tsx`: `ToastHost`、`Sheet`、`Kasuri`、`ProgressRing`、`RARITY_COLOR`、lucide の 2 つのマップを削除し、§7 の新しい部品に替える。`toast` は Sonner から再公開。
- `App.tsx`: `<Toaster>` を 1 つだけ置く。`resolvedTheme` は設定ストアから取る。

### 12.3 コントラスト検査（`scripts/contrast.mjs`）

`index.css` の `:root` と `:root[data-theme='dark']` から値を読み、次の組み合わせが 4.5:1 以上であることを確かめる（満たさなければ終了コード 1）。

- `fg` `fg-2` `fg-3` `brand` `success` `warning` `danger` `legend` × `page` `fill`（ダークは `surface` も）
- `on-brand` × `brand-fill`、`brand-pressed`
- `on-danger` × `danger`
- `toast-fg` × `toast`
- 3:1 以上: `brand-fill` × `page`（UI 部品）、`brand` × `fill`（細いバー）

---

## 13. 移行の順番と完了の基準

### 13.1 順番

1. トークン、書体、角丸、影（`index.html`、`tailwind.config.js`、`index.css`、`vite.config.ts`）とコントラスト検査。
2. アイコン（生成スクリプト、`amami:*` の 4 つ）、`cn`、`button`、`Phrase`、`SpeciesName`、`species.ts` の `nameBreak`。
3. 共通部品（TabBar、ScreenHeader、SectionHeader、ListRow / Group、Chip、Segmented、入力欄、SpeciesTile、RarityGems、ProgressBar、StatRow、BadgeEmblem、StampSeal、Sheet、AlertDialog、Toaster、EmptyState、Notice、CollectibleCard）。
4. 画面（§8 の順）と共有画像。
5. 演出（§9）。
6. スクリーンショットとソースの検査（§13.2）、LINE の実機確認。

### 13.2 完了の基準（すべて満たしたら完了）

ソースの検査（`src/` で 0 件になること）:

```bash
grep -rnE "text-\[[0-9.]+px\]" src
grep -rnE "font-(bold|extrabold|serif|latin)|tracking-label|uppercase|className=\"[^\"]*\blabel\b|shadow-(card|lift|glow)|rounded-(2xl|3xl|4xl)|bg-gradient|radial-gradient|Kasuri|ProgressRing|animate-(floaty|shimmer|pulse|bounce)|\bfoil\b" src
grep -rnE "\b(bg|text|border|ring|from|to|via|fill|stroke|shadow|outline|divide)-(paper2?|card|ink2?|ink3|accent|primary|onprimary|ruri|kuri|umi|sango|kin|washi|lapis|gold|forest-[0-9]+)\b" src
grep -rn "lucide-react" src package.json
grep -rnE "#[0-9A-Fa-f]{6}\b" src --include=*.tsx          # .tsx では 0 件。.ts で 16 進数を書いてよいのは src/styles/palette.ts だけ
grep -rnE "\b(COMMON|UNCOMMON|RARE|LEGENDARY|NEW!|IN SEASON|FIELD GUIDE|QUEST CLEAR|NEW BADGE|MY RECORD)\b" src --include=*.tsx
grep -rnE "Sparkles?|IconSparkle" src
grep -rn "sighting.id}" src/components/CardReveal.tsx       # 生 ID の描画がないこと
```

画面の検査:

- `npm run contrast` が通る。
- `npm run screenshots` で 390×844 の全画面をライトとダークの両方で撮り、次を目で確認する:
  - 横スクロールが出ない。
  - 和名がカタカナの途中で切れていない。省略記号で切れた和名がない。
  - 英字の上ラベル、中黒の連結、色付きのヒーロー、影の付いたカードがない。
  - ダークで読めない文字がない（報酬・スタンプ画面を含む）。
  - タブバーが不透明で、下のコンテンツが透けない。
- `npm run build` と `npm run typecheck` が通る。メインチャンクの gzip が現状（174KB）から 30KB 以上増えていない。
- LINE の実機（iOS と Android）で確認する:
  - 入力欄のあるシートでキーボードを開いても、シートと入力欄が隠れない。
  - トーストが LINE のヘッダーと重ならない。
  - タブバーと固定 CTA が下端の安全領域の上にある。
  - 入力欄のフォーカスで画面がズームしない。
  - 夜の森モードで写真が暗くなり、画面全体がまぶしくない。
