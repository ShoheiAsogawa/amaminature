# 生き物のシルエット 62 種 制作リスト

図鑑で、まだ記録していない種を「影」で見せるためのシルエットです。イラストレーターへの発注書と、制作の進み具合の管理に使います。進み具合は Excel 版（`docs/silhouette-list.xlsx`）の「状態」列で管理します。

- 使う場所: 図鑑のタイル（114px）、季節の種の行のサムネイル（40〜56px）、種の詳細の上部
- 表示: 幅 64% の単色の影。色はアプリ側で付ける（`fill="currentColor"` を mask として使う）
- 点数: 62（優先度 A 15 点・B 33 点・C 14 点）

## 共通の仕様

| 項目 | 内容 |
|---|---|
| ファイル | SVG 1 点につき 1 ファイル。名前は `{種の ID}.svg`（下の表のとおり）。`src/art/sil/` に置くだけで画面に出る |
| キャンバス | `viewBox="0 0 100 100"`。width・height は付けない |
| 図形 | `<path>` を 1 つだけ（サブパスは複数でよい）。`fill="currentColor"`。線（stroke）、`<text>`、`<image>`、`<style>`、`transform`、グラデーション、クリップは使わない |
| 構図 | 長い辺が 88〜92 になるよう中央に置く。地面に立つ・座る種は、足（または小道具）の下端を y=94 前後にそろえる |
| 向き | 横向きで、頭は左。例外（正面・真上・飛翔など）は表の「向き」に書いたとおり |
| 細部の太さ | 脚・指・触角・気根・尾の先など細い部分は太さ 2.5 以上、すき間も 2.5 以上（40px のサムネイルで 1px 残る太さ） |
| 内側 | 穴（白抜き）は使わない。目・模様・羽の線は描かず、輪郭だけで種がわかるようにする |
| 色で見分ける種 | 色は出せない。白い尾の先、赤いくちばしなど色の特徴は、姿勢と輪郭の特徴で代える（表の「描き分け」） |
| 小道具 | 枝・岩・花など、種を特定する助けになるときだけ。本体とつなげて最小限に（表の「小道具」） |
| 容量 | 1 点 8KB 以下。SVGO などで点を減らす |
| 参考写真 | 1 枚の写真をそのままなぞらない（著作権）。複数の写真を見て描き起こす。なぞる場合は CC0 / CC BY の写真に限り、出典を記録する |
| 監修 | 完成後、研究者・保護センターに形態の確認を受ける（とくに A と、難しさ「難」の種） |

## 優先度

| 優先度 | 決め方 | 点数 |
|---|---|---|
| A | アプリの顔になる種（オンボーディング・図鑑カード・宣伝で最も目に触れる） | 15 |
| B | A 以外で、レア度「ときどき」以上、固有種・固有亜種、または天然記念物 | 33 |
| C | 上記以外 | 14 |

## 進め方

1. 試作 3 点（アマミノクロウサギ・ルリカケス・ハブ）で絵柄の方向性（輪郭のなめらかさ、デフォルメの度合い）を決める
2. 優先度 A の残り 12 点 → B（33 点）→ C（14 点）の順に納品
3. 納品のたびに `npm run check:sil` で形式を確認し、図鑑の画面で 40px・114px の見え方を確かめる
4. 監修の指摘を反映して完了

## 一覧

| No. | 和名 | 優先度 | 難しさ | 向き | ファイル |
|---|---|---|---|---|---|
| 001 | アマミノクロウサギ | A | 中 | 横向き（頭は左） | `amami-kurousagi.svg` |
| 002 | ケナガネズミ | B | 中 | 横向き（頭は左） | `kenaganezumi.svg` |
| 003 | アマミトゲネズミ | B | 中 | 横向き（頭は左） | `amami-togenezumi.svg` |
| 004 | リュウキュウイノシシ | B | 易 | 横向き（頭は左） | `ryukyu-inoshishi.svg` |
| 005 | ルリカケス | A | 中 | 横向き（頭は左） | `rurikakesu.svg` |
| 006 | オーストンオオアカゲラ | A | 中 | 横向き（頭は左） | `ooston-ooakagera.svg` |
| 007 | オオトラツグミ | A | 中 | 横向き（頭は左） | `ootoratsugumi.svg` |
| 008 | アマミヤマシギ | A | 易 | 横向き（頭は左） | `amami-yamashigi.svg` |
| 009 | アカヒゲ | B | 中 | 横向き（頭は左） | `akahige.svg` |
| 010 | リュウキュウアカショウビン | A | 易 | 横向き（頭は左） | `ryukyu-akashobin.svg` |
| 011 | リュウキュウコノハズク | A | 易 | ほぼ正面 | `ryukyu-konohazuku.svg` |
| 012 | ズアカアオバト | B | 中 | 横向き（頭は左） | `zuakaaobato.svg` |
| 013 | カラスバト | B | 易 | 横向き（頭は左） | `karasubato.svg` |
| 014 | アマミコゲラ | B | 中 | 横向き（頭は左） | `amami-kogera.svg` |
| 015 | シロハラクイナ | C | 中 | 横向き（頭は左） | `shirohara-kuina.svg` |
| 016 | クロサギ | A | 中 | 横向き（頭は左） | `kurosagi.svg` |
| 017 | ミサゴ | B | 中 | 横から見た飛翔 | `misago.svg` |
| 018 | イソヒヨドリ | C | 中 | 横向き（頭は左） | `isohiyodori.svg` |
| 019 | リュウキュウツバメ | C | 易 | 下から見た飛翔 | `ryukyu-tsubame.svg` |
| 020 | アマミヒヨドリ | B | 中 | 横向き（頭は左） | `amami-hiyodori.svg` |
| 021 | メジロ | C | 中 | 横向き（頭は左） | `mejiro.svg` |
| 022 | アマミヤマガラ | B | 中 | 横向き（頭は左） | `amami-yamagara.svg` |
| 023 | サシバ | B | 中 | 横向き（頭は左） | `sashiba.svg` |
| 024 | アマミイシカワガエル | A | 中 | 横向き（頭は左） | `amami-ishikawagaeru.svg` |
| 025 | オットンガエル | B | 難 | やや斜め前 | `otton-gaeru.svg` |
| 026 | アマミハナサキガエル | B | 中 | 横向き（頭は左） | `amami-hanasakigaeru.svg` |
| 027 | イボイモリ | B | 中 | 真上から（頭は上） | `iboimori.svg` |
| 028 | シリケンイモリ | C | 易 | 横向き（頭は左） | `shiriken-imori.svg` |
| 029 | リュウキュウカジカガエル | C | 易 | 横向き（頭は左） | `ryukyu-kajikagaeru.svg` |
| 030 | ハロウエルアマガエル | B | 中 | 縦向き（頭は上） | `harouel-amagaeru.svg` |
| 031 | アマミアオガエル | B | 中 | 横向き（頭は左） | `amami-aogaeru.svg` |
| 032 | ハブ | A | 中 | 横向き（頭は左） | `habu.svg` |
| 033 | ヒメハブ | B | 中 | 横向き（頭は左） | `himehabu.svg` |
| 034 | アカマタ | B | 易 | 横向き（頭は左） | `akamata.svg` |
| 035 | ヒャン | B | 中 | 横向き（頭は左） | `hyan.svg` |
| 036 | オキナワキノボリトカゲ | C | 中 | 縦向き（頭は上） | `okinawa-kinoboritokage.svg` |
| 037 | オオシマトカゲ | B | 易 | 横向き（頭は左） | `ooshima-tokage.svg` |
| 038 | アマミマルバネクワガタ | A | 中 | 真上から（頭は上） | `amami-marubane.svg` |
| 039 | フェリエベニボシカミキリ | B | 中 | 真上から（頭は上） | `ferie-beniboshi.svg` |
| 040 | アサギマダラ | B | 中 | 横向き（頭は左） | `asagimadara.svg` |
| 041 | オオゴマダラ | B | 易 | 真上から（翅を開く） | `oogomadara.svg` |
| 042 | ツマベニチョウ | B | 中 | 真上から（翅を開く） | `tsumabenichou.svg` |
| 043 | オオシマゼミ | C | 易 | 真上から（頭は上） | `ooshimazemi.svg` |
| 044 | ザトウクジラ | A | 中 | 横向き（頭は左） | `zatoukujira.svg` |
| 045 | ミナミバンドウイルカ | B | 易 | 横向き（頭は左） | `minami-bandouiruka.svg` |
| 046 | アオウミガメ | A | 易 | 真上から（頭は上） | `aoumigame.svg` |
| 047 | アカウミガメ | B | 中 | 横向き（頭は左） | `akaumigame.svg` |
| 048 | オカヤドカリの仲間 | B | 中 | 横向き（頭は左） | `okayadokari.svg` |
| 049 | ミナミトビハゼ | C | 中 | 横向き（頭は左） | `minami-tobihaze.svg` |
| 050 | シオマネキの仲間 | B | 中 | 正面 | `shiomaneki.svg` |
| 051 | リュウキュウアユ | B | 易 | 横向き（頭は左） | `ryukyu-ayu.svg` |
| 052 | クマノミ | B | 中 | 横向き（頭は左） | `kumanomi.svg` |
| 053 | ヒカゲヘゴ | A | 難 | 全体（立ち姿） | `hikagehego.svg` |
| 054 | ガジュマル | A | 難 | 全体（立ち姿） | `gajumaru.svg` |
| 055 | アダン | C | 難 | 全体（立ち姿） | `adan.svg` |
| 056 | ソテツ | C | 中 | 全体（立ち姿） | `sotetsu.svg` |
| 057 | オヒルギ | C | 中 | 枝先のアップ | `ohirugi.svg` |
| 058 | メヒルギ | C | 易 | 枝先のアップ | `mehirugi.svg` |
| 059 | イジュ | C | 中 | 枝先のアップ | `iju.svg` |
| 060 | テッポウユリ | B | 易 | 花茎を横から | `teppouyuri.svg` |
| 061 | アマミセイシカ | B | 中 | 枝先のアップ | `amami-seishika.svg` |
| 062 | アマミエビネ | B | 難 | 株全体を横から | `amami-ebine.svg` |

## 哺乳類（4 種）

### 001 アマミノクロウサギ

*Pentalagus furnessi* ・ `src/art/sil/amami-kurousagi.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。地面に 4 本足をついて座る。背中を丸めた姿
- **必ず出す特徴:** 耳が短い（頭の長さの半分ほど、先が丸い）／丸い背中／後ろ足が短い／尾はほぼ見えない／前足の長い爪 2〜3 本
- **描き分け:** ふつうのウサギに見えないよう、耳を長くしない・立てない。ネズミ類とは「尾がない」「体が丸く大きい」で分ける
- **小道具:** なし
- **大きさの目安:** 体長 約42〜51cm、耳 約4.5cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Pentalagus+furnessi&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Pentalagus+furnessi)

### 002 ケナガネズミ

*Diplothrix legata* ・ `src/art/sil/kenaganezumi.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。木の枝の上を歩く
- **必ず出す特徴:** 頭胴と同じかそれ以上に長い尾を枝から垂らす／背中の輪郭から長い毛が 4〜6 本ぴんと出る／小さく丸い耳
- **描き分け:** アマミトゲネズミとは「木の上」「長い尾」「毛羽立った背中」で分ける。白い尾の先は色なので描けない
- **小道具:** 体の下を通る細い枝
- **大きさの目安:** 頭胴 約22〜33cm、尾 約24〜33cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Diplothrix+legata&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Diplothrix+legata)

### 003 アマミトゲネズミ

*Tokudaia osimensis* ・ `src/art/sil/amami-togenezumi.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。地面で前かがみにしゃがむ（跳ねる直前）
- **必ず出す特徴:** 小さく丸い体／大きめの丸い耳と長めの鼻先／頭胴より短い尾／背中の輪郭に短いトゲ状の毛（細かいギザギザ 6〜10）
- **描き分け:** ケナガネズミとは「地面」「尾が短い」「背中は短いギザギザ」で分ける
- **小道具:** なし
- **大きさの目安:** 頭胴 約12〜18cm、尾 約10〜13cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Tokudaia+osimensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Tokudaia+osimensis)

### 004 リュウキュウイノシシ

*Sus scrofa riukiuanus* ・ `src/art/sil/ryukyu-inoshishi.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。歩く（前足を 1 本上げる）
- **必ず出す特徴:** 長い鼻先（先が平ら）／肩が盛り上がった体形／背中のたてがみ／細い脚と小さなひづめ／下がった細い尾
- **描き分け:** 胴を長くしすぎず、脚を細めにして小柄な南の島の亜種らしく
- **小道具:** なし
- **大きさの目安:** 体長 約1m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Sus+scrofa+riukiuanus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Sus+scrofa+riukiuanus)

## 鳥類（19 種）

### 005 ルリカケス

*Garrulus lidthi* ・ `src/art/sil/rurikakesu.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。枝にとまり、頭を少し上げる
- **必ず出す特徴:** 太く頑丈なくちばし／冠羽のない丸い頭／体とほぼ同じ長さの、先の丸い尾／がっしりした胴
- **描き分け:** アマミヒヨドリとは「くちばしが太い」「頭が丸い」「尾の先が丸い」で分ける。カラスに見えないよう、くちばしは短めで太く
- **小道具:** 足元の枝
- **大きさの目安:** 全長 約38cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Garrulus+lidthi&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Garrulus+lidthi)

### 006 オーストンオオアカゲラ

*Dendrocopos leucotos owstoni* ・ `src/art/sil/ooston-ooakagera.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。太い幹に縦にとまる。頭を後ろに引いた、幹をたたく直前の姿
- **必ず出す特徴:** のみのようにまっすぐで長いくちばし／尾羽を幹に押し当てて体を支える（尾の先がとがる）／幹をつかむ足
- **描き分け:** アマミコゲラとは「太い幹に縦」「くちばしが長い」「首が長め」で分ける
- **小道具:** 左側に縦に通る太い幹（頭が幹の側を向く）
- **大きさの目安:** 全長 約28〜30cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Dendrocopos+leucotos+owstoni&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Dendrocopos+leucotos+owstoni)

### 007 オオトラツグミ

*Zoothera major* ・ `src/art/sil/ootoratsugumi.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。地面に立ち、頭を下げて落ち葉をつつく前かがみの姿
- **必ず出す特徴:** ずんぐりした大きな胴／長めの脚／短めの尾／まっすぐなくちばし（頭の長さほど）
- **描き分け:** アカヒゲは尾を立てるので、こちらは尾を水平からやや下に。アマミヤマシギとはくちばしの長さで分ける
- **小道具:** なし
- **大きさの目安:** 全長 約29cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Zoothera+major&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Zoothera+major)

### 008 アマミヤマシギ

*Scolopax mira* ・ `src/art/sil/amami-yamashigi.svg` ・ 優先度 A ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。地面に立ち、長いくちばしを斜め下に向ける
- **必ず出す特徴:** 体の 3 分の 1 近い、長くまっすぐなくちばし／丸くずんぐりした体／短い脚／短い尾
- **描き分け:** クロサギとは「首が短い」「脚が短い」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約36cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Scolopax+mira&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Scolopax+mira)

### 009 アカヒゲ

*Larvivora komadori* ・ `src/art/sil/akahige.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。石の上で尾をぴんと上げ、胸を張る
- **必ず出す特徴:** 立てた尾／細く長めの脚／丸い頭と細いくちばし／小鳥らしい丸い体
- **描き分け:** シロハラクイナ（こちらも尾を上げる）とは「脚と指が短い」「体が丸い」で分ける
- **小道具:** 足元の小さな石
- **大きさの目安:** 全長 約14cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Larvivora+komadori&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Larvivora+komadori)

### 010 リュウキュウアカショウビン

*Halcyon coromanda bangsi* ・ `src/art/sil/ryukyu-akashobin.svg` ・ 優先度 A ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。枝にとまる
- **必ず出す特徴:** 頭より長い、太く大きなくちばし／大きな頭／短い尾／短い脚
- **描き分け:** カワセミの仲間らしく頭でっかちに、尾は短く
- **小道具:** 足元の枝
- **大きさの目安:** 全長 約27cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Halcyon+coromanda+bangsi&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Halcyon+coromanda+bangsi)

### 011 リュウキュウコノハズク

*Otus elegans* ・ `src/art/sil/ryukyu-konohazuku.svg` ・ 優先度 A ・ 難しさ 易

- **向き・ポーズ:** ほぼ正面。ほぼ正面を向いて枝に直立する
- **必ず出す特徴:** 頭の上に立つ 2 本の羽角（耳のような羽）／丸い頭と縦長の胴／短い尾
- **描き分け:** ほかの鳥はすべて横向きなので、これだけ正面にしてフクロウだと一目でわかるように
- **小道具:** 足元の枝
- **大きさの目安:** 全長 約20cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Otus+elegans&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Otus+elegans)

### 012 ズアカアオバト

*Treron formosae* ・ `src/art/sil/zuakaaobato.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。枝先で体を傾け、木の実をついばむ
- **必ず出す特徴:** ハトの体形（小さな頭・丸い胸・短い脚）／中くらいの尾
- **描き分け:** カラスバトとは「枝先で実をついばむ」「尾が短め」で分ける
- **小道具:** 実のついた枝先
- **大きさの目安:** 全長 約33cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Treron+formosae&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Treron+formosae)

### 013 カラスバト

*Columba janthina* ・ `src/art/sil/karasubato.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。太い枝にとまり、長い尾を下げる
- **必ず出す特徴:** 小さな頭／ふくらんだ胸／体とほぼ同じ長さの尾
- **描き分け:** ズアカアオバトより尾を長く、体を大きく
- **小道具:** 足元の枝
- **大きさの目安:** 全長 約40cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Columba+janthina&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Columba+janthina)

### 014 アマミコゲラ

*Yungipicus kizuki amamii* ・ `src/art/sil/amami-kogera.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。細い枝に横向きにとまり、体を傾けて枝の下側をのぞき込む
- **必ず出す特徴:** 小さく丸い体／短いくちばし／尾羽で体を支える
- **描き分け:** オーストンオオアカゲラとは「細い枝」「短いくちばし」「ずんぐり」で分ける
- **小道具:** 斜めの細い枝
- **大きさの目安:** 全長 約15cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Yungipicus+kizuki+amamii&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Yungipicus+kizuki+amamii)

### 015 シロハラクイナ

*Amaurornis phoenicurus* ・ `src/art/sil/shirohara-kuina.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。地面を歩き、短い尾をぴんと上げる
- **必ず出す特徴:** 長い脚と長い指／上げた短い尾／やや長い首／太く短いくちばし
- **描き分け:** アカヒゲとは「脚と指が長い」「体が大きく縦長」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約32cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Amaurornis+phoenicurus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Amaurornis+phoenicurus)

### 016 クロサギ

*Egretta sacra* ・ `src/art/sil/kurosagi.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。岩の上で首を S 字に縮め、前かがみで獲物をねらう
- **必ず出す特徴:** 太く長いくちばし／S 字に縮めた首／ほかのサギより短い脚／後頭の短い冠羽
- **描き分け:** アマミヤマシギとは首と脚の長さで分ける
- **小道具:** 足元の低い岩
- **大きさの目安:** 全長 約62cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Egretta+sacra&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Egretta+sacra)

### 017 ミサゴ

*Pandion haliaetus* ・ `src/art/sil/misago.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横から見た飛翔。翼を大きく広げて飛び、足で魚をつかむ
- **必ず出す特徴:** 細長い翼が手首で「く」の字に折れる（M 字）／足にぶら下げた魚／短い尾
- **描き分け:** サシバ（とまった姿）とは姿勢で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約54〜64cm、翼を広げて 約155〜175cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Pandion+haliaetus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Pandion+haliaetus)

### 018 イソヒヨドリ

*Monticola solitarius* ・ `src/art/sil/isohiyodori.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。岩の上にやや直立して立つ
- **必ず出す特徴:** 細くまっすぐなくちばし／すらっとした体／中くらいの尾
- **描き分け:** アマミヒヨドリとは「頭がなめらか（逆立たない）」「岩の上」で分ける
- **小道具:** 足元の岩
- **大きさの目安:** 全長 約23cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Monticola+solitarius&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Monticola+solitarius)

### 019 リュウキュウツバメ

*Hirundo tahitica* ・ `src/art/sil/ryukyu-tsubame.svg` ・ 優先度 C ・ 難しさ 易

- **向き・ポーズ:** 下から見た飛翔。翼を広げて飛ぶ姿を下から
- **必ず出す特徴:** 細くとがった翼／切れ込みの浅い尾（長い尾羽はない）
- **描き分け:** 本土のツバメのように尾を長く割らない
- **小道具:** なし
- **大きさの目安:** 全長 約13cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Hirundo+tahitica&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Hirundo+tahitica)

### 020 アマミヒヨドリ

*Hypsipetes amaurotis ogawae* ・ `src/art/sil/amami-hiyodori.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。枝にとまり、尾を下げる
- **必ず出す特徴:** 後頭が逆立ったぼさぼさの頭／細長い体／長い尾／細めのくちばし
- **描き分け:** ルリカケス・イソヒヨドリとは頭の逆立ちで分ける
- **小道具:** 足元の枝
- **大きさの目安:** 全長 約27.5cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Hypsipetes+amaurotis+ogawae&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Hypsipetes+amaurotis+ogawae)

### 021 メジロ

*Zosterops japonicus* ・ `src/art/sil/mejiro.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。花の枝にとまり、花にくちばしを差し込む
- **必ず出す特徴:** 小さく丸い体／細くとがった短いくちばし／短い尾
- **描き分け:** 小鳥どうしは形が似るので、ツバキの花で見分けさせる
- **小道具:** ツバキの花 1 輪と枝
- **大きさの目安:** 全長 約12cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Zosterops+japonicus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Zosterops+japonicus)

### 022 アマミヤマガラ

*Sittiparus varius amamii* ・ `src/art/sil/amami-yamagara.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。枝の上で木の実を足で押さえ、くちばしでつつく
- **必ず出す特徴:** 丸い頭／短く太いくちばし／足で押さえた実／中くらいの尾
- **描き分け:** メジロとは実を押さえる行動で分ける
- **小道具:** 足元の枝と実 1 つ
- **大きさの目安:** 全長 約14cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Sittiparus+varius+amamii&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Sittiparus+varius+amamii)

### 023 サシバ

*Butastur indicus* ・ `src/art/sil/sashiba.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。電柱のてっぺんに直立してとまる
- **必ず出す特徴:** 先がかぎ状に曲がったくちばし／直立した姿勢／長めの尾／尾の半分ほどまで届く翼の先
- **描き分け:** ミサゴ（飛翔）とは姿勢で分ける
- **小道具:** 電柱の頂部（短く）
- **大きさの目安:** 全長 約47〜51cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Butastur+indicus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Butastur+indicus)

## 爬虫類・両生類（14 種）

### 024 アマミイシカワガエル

*Odorrana splendida* ・ `src/art/sil/amami-ishikawagaeru.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。岩の上に座る
- **必ず出す特徴:** ずんぐりした大きな体／背中のイボで背中の線をわずかに凸凹に／折りたたんだ後ろ足／指先の小さな吸盤
- **描き分け:** ほかのカエルより大きく、背中の線を凸凹にする
- **小道具:** 足元の低い岩
- **大きさの目安:** 体長 約9〜13cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Odorrana+splendida&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Odorrana+splendida)

### 025 オットンガエル

*Babina subaspera* ・ `src/art/sil/otton-gaeru.svg` ・ 優先度 B ・ 難しさ 難

- **向き・ポーズ:** やや斜め前。地面に前足を踏ん張って構える
- **必ず出す特徴:** 横に広い頭とがっしりした体／前足の内側に突き出たトゲ（「5本目の指」）を必ず見せる／太い腕
- **描き分け:** アマミイシカワガエルとは「前足のトゲ」「横に広い頭」で分ける
- **小道具:** なし
- **大きさの目安:** 体長 約9〜14cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Babina+subaspera&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Babina+subaspera)

### 026 アマミハナサキガエル

*Odorrana amamiensis* ・ `src/art/sil/amami-hanasakigaeru.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。跳ぶ瞬間。後ろ足を後ろへまっすぐ伸ばす
- **必ず出す特徴:** とがった鼻先／細長い体／とても長い後ろ足
- **描き分け:** ほかのカエルは座った姿なので、これだけ跳ぶ姿にする
- **小道具:** なし
- **大きさの目安:** 体長 約6〜10cm（メスが大きい）
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Odorrana+amamiensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Odorrana+amamiensis)

### 027 イボイモリ

*Echinotriton andersoni* ・ `src/art/sil/iboimori.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 真上から（頭は上）。地面を歩く姿を真上から
- **必ず出す特徴:** 平たく幅の広い三角形の頭／体の両側に並ぶ大きなイボ（輪郭の凸凹を左右 5〜7 個ずつ）／太い尾
- **描き分け:** シリケンイモリとは「輪郭が凸凹」「頭が幅広い」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約13〜19cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Echinotriton+andersoni&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Echinotriton+andersoni)

### 028 シリケンイモリ

*Cynops ensicauda* ・ `src/art/sil/shiriken-imori.svg` ・ 優先度 C ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。水中を泳ぐ（手足をたたむ）
- **必ず出す特徴:** 剣のように平たく長い尾（上下にひれ状の縁、先がとがる）／なめらかな体
- **描き分け:** イボイモリとは「輪郭がなめらか」「尾が長い」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約10〜15cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Cynops+ensicauda&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Cynops+ensicauda)

### 029 リュウキュウカジカガエル

*Buergeria japonica* ・ `src/art/sil/ryukyu-kajikagaeru.svg` ・ 優先度 C ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。石の上で鳴く。のどの鳴き袋を丸くふくらませる
- **必ず出す特徴:** あごの下の丸い鳴き袋／平たく小さな体
- **描き分け:** ほかのカエルとは鳴き袋で分ける
- **小道具:** 足元の小さな石
- **大きさの目安:** 体長 約2.5〜3.8cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Buergeria+japonica&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Buergeria+japonica)

### 030 ハロウエルアマガエル

*Hyla hallowellii* ・ `src/art/sil/harouel-amagaeru.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 縦向き（頭は上）。草の葉に縦にしがみつく
- **必ず出す特徴:** 細身の小さな体／指先の吸盤／短い鼻先
- **描き分け:** アマミアオガエルとは「草の葉に縦」「細身」で分ける
- **小道具:** 細長い草の葉
- **大きさの目安:** 体長 約3〜4cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Hyla+hallowellii&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Hyla+hallowellii)

### 031 アマミアオガエル

*Zhangixalus amamiensis* ・ `src/art/sil/amami-aogaeru.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。水平な枝にとまる
- **必ず出す特徴:** 指先の大きな丸い吸盤（直径 4 以上）／長い手足を折りたたむ／目の盛り上がり
- **描き分け:** ハロウエルアマガエルとは「枝に横向き」「吸盤が大きい」で分ける
- **小道具:** 体の下を通る枝
- **大きさの目安:** 体長 約5〜8cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Zhangixalus+amamiensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Zhangixalus+amamiensis)

### 032 ハブ

*Protobothrops flavoviridis* ・ `src/art/sil/habu.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。首を S 字に持ち上げて構える（体の後ろ半分は地面）
- **必ず出す特徴:** 大きな三角形の頭と、細い首のくびれ／細長い体
- **描き分け:** ヒメハブ（とぐろ）・アカマタ（這う）とは姿勢で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約1〜2m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Protobothrops+flavoviridis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Protobothrops+flavoviridis)

### 033 ヒメハブ

*Ovophis okinavensis* ・ `src/art/sil/himehabu.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。とぐろを巻き、頭をとぐろの上にのせる
- **必ず出す特徴:** 太く短い体／三角形の頭
- **描き分け:** ハブとは「とぐろ」「太く短い体」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約30〜80cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Ovophis+okinavensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Ovophis+okinavensis)

### 034 アカマタ

*Lycodon semicarinatus* ・ `src/art/sil/akamata.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。横に長く這う（大きな波形 2〜3 回）
- **必ず出す特徴:** 長い体／首のくびれが弱い、平たい楕円の頭
- **描き分け:** ハブとは「頭が三角でない」「体を持ち上げない」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約1〜2m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Lycodon+semicarinatus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Lycodon+semicarinatus)

### 035 ヒャン

*Sinomicrurus japonicus japonicus* ・ `src/art/sil/hyan.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。ゆるく C 字に弧を描いて這う
- **必ず出す特徴:** 細い体／首のくびれがない小さな丸い頭／短く先の丸い尾
- **描き分け:** アカマタとは「短い C 字」「丸い頭」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約30〜60cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Sinomicrurus+japonicus+japonicus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Sinomicrurus+japonicus+japonicus)

### 036 オキナワキノボリトカゲ

*Diploderma polygonatum* ・ `src/art/sil/okinawa-kinoboritokage.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 縦向き（頭は上）。木の幹に縦にとまり、のど袋をふくらませる
- **必ず出す特徴:** 背中のノコギリ状のたてがみ／ふくらませたのど袋／とても長い尾（全長の約 3 分の 2）
- **描き分け:** オオシマトカゲとは「縦向き」「たてがみ」で分ける
- **小道具:** 縦に通る幹（帯状）
- **大きさの目安:** 全長 約20〜25cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Diploderma+polygonatum&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Diploderma+polygonatum)

### 037 オオシマトカゲ

*Plestiodon marginatus oshimensis* ・ `src/art/sil/ooshima-tokage.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。平たい石の上に伏せて日光浴する
- **必ず出す特徴:** なめらかな円筒形の体／短い手足／長くとがった尾
- **描き分け:** オキナワキノボリトカゲとは「水平」「なめらかな背中」で分ける
- **小道具:** 平たい石
- **大きさの目安:** 全長 約15〜25cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Plestiodon+marginatus+oshimensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Plestiodon+marginatus+oshimensis)

## 昆虫（6 種）

### 038 アマミマルバネクワガタ

*Neolucanus protogenetivus* ・ `src/art/sil/amami-marubane.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 真上から（頭は上）。真上から見たオス
- **必ず出す特徴:** 内側に曲がる太い大あご／丸みのある胸と上翅（「マルバネ」の名の由来）／6 本の脚
- **描き分け:** カミキリとは「触角が短い」「大あご」で分ける
- **小道具:** なし
- **大きさの目安:** オス 約40〜65mm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Neolucanus+protogenetivus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Neolucanus+protogenetivus)

### 039 フェリエベニボシカミキリ

*Rosalia ferriei* ・ `src/art/sil/ferie-beniboshi.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 真上から（頭は上）。真上から見た姿。触角を後ろへ弧を描いて広げる
- **必ず出す特徴:** 体長の 1.5 倍以上ある長い触角（節の毛の房を小さなこぶで）／細長い体
- **描き分け:** クワガタとは長い触角で分ける
- **小道具:** なし
- **大きさの目安:** 体長 約20〜30mm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Rosalia+ferriei&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Rosalia+ferriei)

### 040 アサギマダラ

*Parantica sita* ・ `src/art/sil/asagimadara.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。花にとまり、翅を閉じる
- **必ず出す特徴:** 細長い前翅（先はやや丸い）／先がこん棒状の長い触角／翅を閉じた三角形の輪郭
- **描き分け:** オオゴマダラ（開いた翅）・ツマベニチョウ（とがった前翅）とは姿勢で分ける
- **小道具:** フジバカマの花房
- **大きさの目安:** 前翅長 約5〜6cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Parantica+sita&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Parantica+sita)

### 041 オオゴマダラ

*Idea leuconoe* ・ `src/art/sil/oogomadara.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 真上から（翅を開く）。翅を大きく開いた姿を真上から
- **必ず出す特徴:** 大きく丸い翅（前翅は縦長の楕円）／細い体
- **描き分け:** ツマベニチョウとは「翅の先が丸い」で分ける
- **小道具:** なし
- **大きさの目安:** 前翅長 約7〜8cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Idea+leuconoe&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Idea+leuconoe)

### 042 ツマベニチョウ

*Hebomoia glaucippe* ・ `src/art/sil/tsumabenichou.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 真上から（翅を開く）。翅を開いて飛ぶ姿を、やや斜めの真上から
- **必ず出す特徴:** 先がとがって角ばる前翅（わずかに鎌形）／丸い後翅
- **描き分け:** オオゴマダラとは「前翅の先がとがる」で分ける
- **小道具:** なし
- **大きさの目安:** 前翅長 約4.5〜6cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Hebomoia+glaucippe&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Hebomoia+glaucippe)

### 043 オオシマゼミ

*Meimuna oshimensis* ・ `src/art/sil/ooshimazemi.svg` ・ 優先度 C ・ 難しさ 易

- **向き・ポーズ:** 真上から（頭は上）。翅をたたんだ姿を真上から
- **必ず出す特徴:** 左右に張り出した複眼と幅の広い頭／屋根形にたたんだ、腹の先を大きく越える翅
- **描き分け:** ほかの虫とは「太い体」「長い翅」で分ける
- **小道具:** なし
- **大きさの目安:** 翅の先まで 約45〜50mm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Meimuna+oshimensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Meimuna+oshimensis)

## 海・水辺（9 種）

### 044 ザトウクジラ

*Megaptera novaeangliae* ・ `src/art/sil/zatoukujira.svg` ・ 優先度 A ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。ジャンプ（ブリーチ）。体を斜め上へ
- **必ず出す特徴:** 体長の約 3 分の 1 の長い胸びれ／頭のこぶ（輪郭の凸凹）／小さな背びれ／大きな尾びれ
- **描き分け:** イルカとは「長い胸びれ」「小さな背びれ」で分ける
- **小道具:** なし
- **大きさの目安:** 体長 約12〜15m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Megaptera+novaeangliae&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Megaptera+novaeangliae)

### 045 ミナミバンドウイルカ

*Tursiops aduncus* ・ `src/art/sil/minami-bandouiruka.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。水面から弧を描いてジャンプする
- **必ず出す特徴:** 鎌形の背びれ／短めの口先
- **描き分け:** ザトウクジラとは「大きな背びれ」「短い胸びれ」で分ける
- **小道具:** なし
- **大きさの目安:** 体長 約2〜2.6m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Tursiops+aduncus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Tursiops+aduncus)

### 046 アオウミガメ

*Chelonia mydas* ・ `src/art/sil/aoumigame.svg` ・ 優先度 A ・ 難しさ 易

- **向き・ポーズ:** 真上から（頭は上）。前ひれを広げて泳ぐ姿を真上から
- **必ず出す特徴:** 小さく丸い頭／楕円の甲羅／長い前ひれ
- **描き分け:** アカウミガメとは「頭が小さい」「真上から」で分ける
- **小道具:** なし
- **大きさの目安:** 甲長 約80〜100cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Chelonia+mydas&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Chelonia+mydas)

### 047 アカウミガメ

*Caretta caretta* ・ `src/art/sil/akaumigame.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。砂浜をはい上がる
- **必ず出す特徴:** 体に比べて大きな頭／盛り上がった甲羅／体を押し上げる前ひれ
- **描き分け:** アオウミガメとは「横向き」「大きな頭」で分ける
- **小道具:** 砂浜の線
- **大きさの目安:** 甲長 約70〜100cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Caretta+caretta&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Caretta+caretta)

### 048 オカヤドカリの仲間

*Coenobita spp.* ・ `src/art/sil/okayadokari.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。巻貝を背負って歩く
- **必ず出す特徴:** らせんの輪郭の巻貝／左の大きいはさみ／長い触角と目の柄
- **描き分け:** シオマネキとは巻貝で分ける
- **小道具:** なし
- **大きさの目安:** 貝殻を含め 約3〜10cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Coenobita&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Coenobita)

### 049 ミナミトビハゼ

*Periophthalmus argentilineatus* ・ `src/art/sil/minami-tobihaze.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。泥の上で胸びれを使って体を起こす
- **必ず出す特徴:** 頭の上に突き出た目／立てた背びれ／体を支える胸びれ
- **描き分け:** ほかの魚とは「陸の上に立つ」で分ける
- **小道具:** 泥の線
- **大きさの目安:** 全長 約8〜10cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Periophthalmus+argentilineatus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Periophthalmus+argentilineatus)

### 050 シオマネキの仲間

*Uca spp.* ・ `src/art/sil/shiomaneki.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 正面。正面から。大きいはさみを持ち上げる
- **必ず出す特徴:** 片方だけ極端に大きいはさみ（甲羅より大きい）／長い目の柄 2 本／細い歩脚
- **描き分け:** オカヤドカリとは「貝がない」「正面」で分ける
- **小道具:** なし
- **大きさの目安:** 甲幅 約2〜3cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Uca&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Uca)

### 051 リュウキュウアユ

*Plecoglossus altivelis ryukyuensis* ・ `src/art/sil/ryukyu-ayu.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 横向き（頭は左）。泳ぐ
- **必ず出す特徴:** 細長い流線形／背びれの後ろの小さなあぶらびれ（太さ 3 以上）／二叉の尾びれ
- **描き分け:** クマノミとは「細長い体」で分ける
- **小道具:** なし
- **大きさの目安:** 全長 約10〜15cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Plecoglossus+altivelis+ryukyuensis&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Plecoglossus+altivelis+ryukyuensis)

### 052 クマノミ

*Amphiprion clarkii* ・ `src/art/sil/kumanomi.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 横向き（頭は左）。イソギンチャクの上を泳ぐ
- **必ず出す特徴:** 楕円の体／続けて並ぶぎざぎざの背びれ／丸い尾びれ
- **描き分け:** リュウキュウアユとは「体高が高い」「イソギンチャク」で分ける
- **小道具:** 下端のイソギンチャク（短い触手 6〜8 本）
- **大きさの目安:** 全長 約10〜15cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Amphiprion+clarkii&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Amphiprion+clarkii)

## 植物（10 種）

### 053 ヒカゲヘゴ

*Sphaeropteris lepifera* ・ `src/art/sil/hikagehego.svg` ・ 優先度 A ・ 難しさ 難

- **向き・ポーズ:** 全体（立ち姿）。木全体
- **必ず出す特徴:** 細くまっすぐな幹／幹の上に傘のように広がって垂れる大きな羽状の葉（縁を細かいぎざぎざに）／頂部の渦巻いた若葉 1〜2 本
- **描き分け:** ソテツとは「幹が細く高い」「葉が垂れる」で分ける
- **小道具:** なし
- **大きさの目安:** 高さ 約10〜15m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Sphaeropteris+lepifera&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Sphaeropteris+lepifera)

### 054 ガジュマル

*Ficus microcarpa* ・ `src/art/sil/gajumaru.svg` ・ 優先度 A ・ 難しさ 難

- **向き・ポーズ:** 全体（立ち姿）。木全体
- **必ず出す特徴:** 横に広い丸い樹冠／枝から垂れる気根の束／太くうねる幹
- **描き分け:** ふつうの木に見えないよう、気根を必ず入れる
- **小道具:** なし
- **大きさの目安:** 高さ 約20m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Ficus+microcarpa&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Ficus+microcarpa)

### 055 アダン

*Pandanus odoratissimus* ・ `src/art/sil/adan.svg` ・ 優先度 C ・ 難しさ 難

- **向き・ポーズ:** 全体（立ち姿）。木全体
- **必ず出す特徴:** タコの足のような支柱根／らせん状に出る細長い葉の束／パイナップル形の丸い実
- **描き分け:** ソテツとは「支柱根」「実」で分ける
- **小道具:** なし
- **大きさの目安:** 高さ 約2〜6m、実の直径 約20cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Pandanus+odoratissimus&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Pandanus+odoratissimus)

### 056 ソテツ

*Cycas revoluta* ・ `src/art/sil/sotetsu.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 全体（立ち姿）。株全体
- **必ず出す特徴:** 短く太い幹／放射状に広がる硬い羽状の葉（縁は細かい櫛の歯）
- **描き分け:** ヒカゲヘゴとは「幹が太く短い」「葉が上向きで硬い」で分ける
- **小道具:** なし
- **大きさの目安:** 高さ 約1〜4m
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Cycas+revoluta&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Cycas+revoluta)

### 057 オヒルギ

*Bruguiera gymnorhiza* ・ `src/art/sil/ohirugi.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 枝先のアップ。枝先
- **必ず出す特徴:** 星形に裂けたがく（8〜14 裂）の花が下向きに咲く／がくから下へ伸びる太く短い胎生種子／厚い楕円の葉
- **描き分け:** メヒルギとは「星形のがく」「種子が太く短い」で分ける
- **小道具:** なし
- **大きさの目安:** がく 約3cm、胎生種子 約15〜25cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Bruguiera+gymnorhiza&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Bruguiera+gymnorhiza)

### 058 メヒルギ

*Kandelia obovata* ・ `src/art/sil/mehirugi.svg` ・ 優先度 C ・ 難しさ 易

- **向き・ポーズ:** 枝先のアップ。枝先
- **必ず出す特徴:** 枝から垂れる細長い棒状の胎生種子 2〜3 本／楕円の葉
- **描き分け:** オヒルギとは「種子が細長い」「星形のがくがない」で分ける
- **小道具:** なし
- **大きさの目安:** 胎生種子 約20〜40cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Kandelia+obovata&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Kandelia+obovata)

### 059 イジュ

*Schima wallichii* ・ `src/art/sil/iju.svg` ・ 優先度 C ・ 難しさ 中

- **向き・ポーズ:** 枝先のアップ。花の咲いた枝先
- **必ず出す特徴:** 丸い花びら 5 枚の杯形の花 2〜3 輪とつぼみ／楕円の葉
- **描き分け:** アマミセイシカとは「花びらが丸く開く」「雄しべを外に出さない」で分ける
- **小道具:** なし
- **大きさの目安:** 花の直径 約4〜5cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Schima+wallichii&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Schima+wallichii)

### 060 テッポウユリ

*Lilium longiflorum* ・ `src/art/sil/teppouyuri.svg` ・ 優先度 B ・ 難しさ 易

- **向き・ポーズ:** 花茎を横から。花茎
- **必ず出す特徴:** 横を向いた長いラッパ形の花（先が反り返る）／まっすぐな茎と細い葉
- **描き分け:** ほかの花とは「横向きのラッパ」で分ける
- **小道具:** なし
- **大きさの目安:** 高さ 約30〜100cm、花の長さ 約10〜15cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Lilium+longiflorum&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Lilium+longiflorum)

### 061 アマミセイシカ

*Rhododendron latoucheae var. amamiense* ・ `src/art/sil/amami-seishika.svg` ・ 優先度 B ・ 難しさ 中

- **向き・ポーズ:** 枝先のアップ。花の咲いた枝先
- **必ず出す特徴:** 5 つに裂けた漏斗形の花から、長い雄しべが弧を描いて外へ突き出る／枝先に集まる葉
- **描き分け:** イジュとは「雄しべが突き出る」「ラッパ形の花」で分ける
- **小道具:** なし
- **大きさの目安:** 花の直径 約4〜5cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Rhododendron+latoucheae+var.+amamiense&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Rhododendron+latoucheae+var.+amamiense)

### 062 アマミエビネ

*Calanthe amamiana* ・ `src/art/sil/amami-ebine.svg` ・ 優先度 B ・ 難しさ 難

- **向き・ポーズ:** 株全体を横から。株全体
- **必ず出す特徴:** 根元の幅広い大きな葉 2〜3 枚／まっすぐ立つ花茎に、まばらにつく花 5〜8 輪／花の下側の大きな唇弁
- **描き分け:** テッポウユリとは「根元の幅広い葉」「小さな花がたくさん」で分ける
- **小道具:** なし
- **大きさの目安:** 花茎 約30〜40cm
- **参考写真:** [Wikimedia Commons](https://commons.wikimedia.org/w/index.php?search=Calanthe+amamiana&title=Special:MediaSearch&type=image) ・ [iNaturalist](https://www.inaturalist.org/taxa/search?q=Calanthe+amamiana)

---

大きさは図鑑などによる目安で、監修で確認します。参考写真のリンクは学名での検索結果です（写真ごとにライセンスが異なります）。
