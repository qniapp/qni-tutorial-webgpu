# H ゲートページの原文対応・図の修正

## 開始 / 公開版での再現 (2026-10-10 09:08 JST)

28 分の時間制限、24 分前後で終了処理。作業は独立した `/home/yasuhito/Work/qni-tutorial-webgpu-worktrees/feat/h-gate-page-fixes`、分岐元 `b0508ff`。旧 Qni/WebGPU の作業ツリーは fetch と git show だけ。

公開ページの実機 Chromium で、H アイコンは 1 個、SVG background は #FFFCF0、最初の図の background は #F2F0E5、追加された H|0⟩ の数式あり、と再現した。再現用 `/tmp/qtw-hfix-before.mjs`、記録 `/tmp/qtw-hfix-before.json`。

## 原文の集計と描画の調査

旧原文は `qni origin/main:apps/tutorial/h_gate.html`。本文/図の H は **19** 個: Liquid `qpu_operation h` 12 個、直書き `<h-gate>` 7 個。シミュレーターのパレットの 1 個は対象外 (全体のタグに換算すると 20)。移植前は **1** 個。

WebGPU `gpu/shaders/state_render.wgsl:84-87` は円の外で透明、`:175-181` は alpha=0 の領域を discard。円盤以外の内側も透明で、背後の state panel `render/state_panel_draw/panel.rs:20` の `colors.surface` (=paper) が見える。SVG は矩形の paper 背景を削除し、外枠の半径までの円形 underlay だけ paper にする。hover は underlay には適用しない。これで内部の見た目を保ち、円の外は任意の親背景が見える。

灰色の figure wrapper と追加数式を除去し、原文の本文アイコン 12、図の操作アイコン 7 を QwHGate に置き換える。円の値 24 個は維持する。

## 原文との対応表 / 実装 (09:17 JST)

原文の行番号は simulator を除いても変更せず集計した。本文の 12 個と図の 7 個、計 **19 個**を直接 `<QwHGate />` にした。

| 位置 | 原文の行 | 個数 |
| --- | --- | ---: |
| 名前・人物の紹介 | 13 | 1 |
| シンプルな重ね合わせ | 21 | 1 |
| 最初の図: H\|0⟩ / H\|1⟩ の操作 | 36、53 | 2 |
| 位相の注意書き | 65、66 | 2 |
| QPU 独自の命令 | 71 | 1 |
| ハンズオンの説明 | 79 | 1 |
| 逆演算の本文 | 141、142、143-144 | 3 |
| 逆演算の図: 二回ずつの操作 | 159、170、187、199 | 4 |
| 回転として見る本文 | 212 (二個)、213-214 | 3 |
| 任意の振幅の図の操作 | 244 | 1 |

変更前 1 → 変更後 19。パレット (原文:93) は対象外。図の H は原文の実測どおり 24px、本文は既存の 1em (16px)。矢印は原文 `_includes/qubit_transition_arrow.svg` のパスを再利用し、H を重ねて原文の図の構造に戻した。灰色・角丸の wrapper は三つとも削除。最初の数式二つと、原文にない逆演算の数式も削除。逆演算の長い図は原文のように狭い画面で図内スクロールし、円を縮めたりページ全体を横にはみ出させない。

SVG は surface 円を一つ追加し、矩形 background を除去。surface は hover 時も paper を保ち、円盤/針/枠だけ暗くする。形状は既存の inner radius / disc / rim / phase / outline を変更しない。

Node 22 の型チェック、Astro build、対象 **9/9 テスト成功**。1440/390px のアイコン数 (本文12/操作7)、全24円、数式なし、gray wrapper なし、横はみ出しなしを確認。SVG の透明な角は RGBA 0,0,0,0、ゼロ振幅の中央は paper RGBA 255,252,240,255 と実際に rasterize して確認した。旧 inline-H テストは最初の本文アイコンを検証し、図を含めた個数は新テストで別途固定した。

## 公開 / 実機比較の中間記録 (09:26 JST)

初回実装 `379c90efb6b07624f8e7629cbd17a1bc8f353457`、[Pages 38008471882](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/38008471882) 成功。実機 gmktec / Chromium 152 / AMD rdna-3 で原文と移植版を 1440px・390px にて撮影した。双方の本文/図のタグ数は19、移植版の console/page error は0、外側の角の画素は8個すべてページ背景 #FFFCF0 と一致。

比較画像を吟味して図の左寄せと H のサイズ差を修正した。原文の直書き H は実測 **24px** (本文 Liquid H は16px)。通常の図は本文列の中央、circle 間隔は原文の8px、逆演算の長い図だけ左から図内スクロールを維持する。背景/形状/個数を検証した9テストにサイズ・中央寄せの回帰検証を加えた。

旧サイトのみ散発的な 404 console error があり、別途調べたところ `https://qniapp.github.io/favicon.ico` の不在だった。旧 Qni チェックアウトや root Pages はこのタスクで変更しない。移植先のエラーとは区別して JSON に記録する。
