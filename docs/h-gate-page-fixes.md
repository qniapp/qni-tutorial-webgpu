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

## 最終公開・完了記録 (09:31 JST)

位置・サイズ修正 `ae4828538b4484edde016b5391c6f944d084f8d7` の [Pages 38009141674](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/38009141674) が成功 (build 2m48s、deploy 9s)。1440px と390pxの原文/公開版を再撮影し、比較 PNG を再度目視確認した。H は双方19 (本文12/図7)、移植前1。24円、枠線/gray boxなし、追加数式なし、ページの横はみ出しなし。各 viewport の8円の外側を画素確認し、全16点がページ背景 RGB255,252,240 と一致。SVG の角が透明で、ゼロ円の内側が paper であることは対象テストでも検証済み。

最終撮影の四つのケースは **console error 0 / page error 0**。移植版は AMD rdna-3 の実機 GPU を確認。Chromium152.0.7977.82、`--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan --force-device-scale-factor=1`。以前観測した旧サイト root favicon の404は文書と JSON に識別情報を残した。

成果物: `/tmp/qtw-hfix.json`、`/tmp/qtw-hfix-compare-1440.png`、`/tmp/qtw-hfix-compare-390.png`。原文/移植版個別の section PNG も `/tmp/qtw-hfix-original-{1440,390}.png`、`/tmp/qtw-hfix-ours-{1440,390}.png` に保持。検証スクリプト `/tmp/qtw-hfix-verify.mjs`。比較画像は依頼どおり保持し、再現/画素検査用の中間画像を削除。開始したブラウザーと対象テストのサーバーは終了した。型チェック、Astro build、9対象テストが成功。各 push 前に fetch/rebase を行い、約24分に達する前に最終文書を push して終了する。

## Ket 表記

### 調査と命名の更新 (2026-10-10 09:37 JST)

作業は独立した `feat/ket-notation` worktree、分岐元 `5cd9362`。更新された依頼に従い prefix を廃止し、今後は原文のタグ名を直接書く。今回の時間制限は更新から25分。

原文の `{% ket 0 %}` は **Qni の登録 custom element ではない**。`apps/tutorial/_plugins/ket_tag.rb:11-12` が `\(|0\rangle\)` を出力し、`_layouts/default.html:15-17` の MathJax `tex-mml-chtml.js` が **`<mjx-container jax="CHTML">`** にする。elements package に ket element はない。MathJax CHTML の内部は mjx-math / mjx-mo / mjx-mn / mjx-c と、スクリーンリーダー向け MathML。SVG ではなく、TeX font の glyph を CSS の疑似要素で描画する。

実機原文で font-size=119.5% (本文16pxに対して19.12px)、bar幅0.278em、数字幅0.5em、angle幅0.389em を確認。bar は U+007C、angle は U+27E9。数字は upright、MathJax Main Regular。original ket の幅は22.296875px。円の右下のケットは qubit-circle の CSS 由来で、別用途。

### 原文との対応 / 実装 (09:46 JST)

| 位置 | 原文の行 / 値 | 個数 |
| --- | --- | ---: |
| 重ね合わせの導入 | 21:0、1 | 2 |
| 位相の注意書き | 65:1、1 / 66:0 | 3 |
| ハンズオン | 79:0、1 / 80:0 / 81:1 | 4 |
| 逆演算の本文 | 143:0、1 | 2 |
| 回転として見る本文 | 213:0 | 1 |

原文12 / 移植前0 / 移植後12。原文が Liquid で mark up した箇所だけ `mjx-container` にし、任意振幅の説明の plain-text kets、復習問題、circle の labels、circuit JSON は変えない。bare な `<mjx-container jax="CHTML" role="math" aria-label="ケット 0">|0⟩</mjx-container>` は共有 CSS と原文と同じ MathJax_Main-Regular.woff (34,160 bytes、無改変、SIL OFL 1.1 同梱) だけで描画する。MathJax JS、Shadow DOM、SVG、element 登録は不要。TeX エンジンではないため任意の LaTeX は解釈せず、今回の literal basis-ket に対応する。

`h-gate` は共有の小さな custom element に変更。Vite の virtual module がビルド時にピンから SVG を git show し、その SVG を一回バンドルする。bare `<h-gate></h-gate>` と動的に追加したタグも描画できる。HTML 全体の postprocess と別の runtime 経路を作るより単純で、glyph の追加 fetch や外部 font は不要。`qubit-circle` は従来の軽量 renderer を原名に登録した。ASTRO wrapper も HGate / QubitCircle に改名したが、h_gate は wrapper を使わず原名の bare tags だけを使う。CSS、tooltip ID、performance marks、型、tests も prefix を除去。

`rg 'qw-|Qw' src tests` は **0件**。古い測定文書内の prefix は履歴であり、現行 API は `h-gate`、`qubit-circle`、`mjx-container`。型チェック、Astro build、新規 ket 2件 + 関連9件の **11/11 テスト成功**。1440/390px で12 ket の値・順番、無変更の plain kets、19 H / 24 circles、bare H の動的挿入、tooltip、透明な円外側を確認。

### 公開確認 / 完了 (10:00 JST)

実装 `8480f853f71cf50a1e6bb75db8b4bb5b65141060`、Pages **38010652084** 成功。実機で font の native line metrics がゼロで bbox が2pxになることを検出し、CSS に CHTML 相当の上下 padding を追加。修正 `18e89384b0c6e6985f54a40f34039676ae1b479d`、Pages **38011139595** 成功 (build 2分26秒 / deploy 11秒)。公開 font license は `fonts/MathJax-OFL.txt`。修正後 build と関連 **11/11 tests** を再実行して成功。

最終 gmktec Chromium 152 / AMD rdna-3 の1440px・390px比較で、両ページとも ket=12、原文と移植後の H=19、circles=24。原文 ket bbox=22.296875×21px、移植後=22.3125×21.09375px、同じ19.12px font と glyph。自然な文字列の subpixel advance と CHTML の個別 glyph padding による差は幅0.015625px。目視で glyph、間隔、括弧を比較した。移植後は両幅で overflow なし、MathJax JS なし、実際の mouse hover で shared tooltip の +0.70711 / +50.0000% / +0.00° を確認。

最終4比較ケースは **console/page errors 0**。ただし冷起動の原文には既知の `https://qniapp.github.io/favicon.ico` 404 がある。これを修正したとは主張せず、cold baseline の error を JSON に残し、同じ browser context を温めた後の再比較が0であることを記録した。移植後の cold/warm はともに0。404を隠す route/mock は使用していない。

保存: `/tmp/qtw-ket-compare-1440.png`、`/tmp/qtw-ket-compare-390.png`、`/tmp/qtw-ket.json`。拡大 crop は `/tmp/qtw-ket-crops-{1440,390}.png`、個別 crop は `/tmp/qtw-ket-crop-{original,ours}-{1440,390}.png`。最初の診断は `/tmp/qtw-ket-first.json`。開始した browser は finally で停止、test server も終了。ピン f4cd605 は変更していない。文書の最終 push 後の docs-only deploy は時間制限のため待たず終了する。

### 実 MathJax への移行 (2026-10-10)

上記の手書き CHTML / font shim は履歴。現在は原文と同じ TeX を `Ket.astro` で出力し、実 MathJax 3.2.2 を math ページだけで self-hosted/defer 読込する。shim、font、専用ライセンスは削除済み。設定、配信方式の比較、公開計測と検証は [mathjax.md](./mathjax.md) を参照。

### 本文 inline H の白色化 (2026-10-10 10:33 JST)

既存の `p h-gate` / `.qc-operation h-gate` の本文・図の区別を共有 component CSS で使い、本文12個の glyph のみ #FFFFFF にした。bare なタグにも自動で適用され、新しい属性は不要。図7個 (24px) と非本文の他サイズは #FFFCF0 のまま、body #3AA99F、SVG、寸法、pin は変更しない。図を p 内に置いた場合も `.qc-operation` が優先する。型チェック、Astro build、本文/図の色・動的 bare tag・32px 非本文サイズ等の関連6/6 tests が成功。公開前の DPR1/2 crops と採色用 JSON を保存済み。公開後に実 Chromium で再撮影・pixel 採色する。

実装 **01fc5537d7c0212c1e61ff16a2ee869498d1a5b0**、Pages **38013641012** 成功 (build2分10秒 / deploy10秒)。gmktec Chromium152 / Vulkan / unsafe WebGPUで、context DPRと `--force-device-scale-factor` を両方1/2に揃えて公開再検証した。DPR2の本文glyph coreは **#FFFFFF (29 pixels)**、図は **#FFFCF0 (64 pixels)**。DPR1はantialiasingがかかるため本文の最明glyph pixelは **RGB181,223,219 (#B5DFDB)**、opaque white pixelは0。図DPR1の最明pixelはRGB230,242,230。bodyは両DPRとも実pixel **#3AA99F**。

公開前の同じDPRのfigure cropとのraw pixel差分は **DPR1=0 / DPR2=0**。本文は36/96 pixelsだけ変化し、変更されたpixelsをglyph採色に使ってpage cornerを除外した。16/24px寸法、背景色、pinは不変。両browserともconsole/page errors0。保存: `/tmp/qtw-hwhite-{inline,figure}-dpr{1,2}.png`、`/tmp/qtw-hwhite.json`、比較元 `/tmp/qtw-hwhite-before-{inline,figure}-dpr{1,2}.png`。cropを目視確認済み。起動browserはfinallyで停止、test serverも終了。最終文書push後のdocs-only deployは待たず終了する。

## 原文との一致 (追加物の削除)

### 範囲 / 削除一覧 (2026-10-10 10:55 JST)

独立した feat/ket-notation / origin/main ad39e16 から開始。更新2の期限は28分。qni origin/main acf87bfa の h_gate.html をgit showで読み、live rendered text/elementと照合。beforeのraw HTML/blocksは `/tmp/qtw-strip-before.json`。比較では語や句読点を変えず、HTML/Liquidの改行とMathJax分割nodeの空白のみ除去する。

| 何を / 場所 | 原文にない理由 / 処置 |
| --- | --- |
| ハンズオン circuit-help sidenote3文 (ドラッグ方法、全palette、保存されない旨) | 原文79-82はヒントだけ。note削除 |
| noscript「回路を操作するには JavaScript を有効にしてください」 | 原文にはない。削除 |
| 任意状態図「適用前」「適用後」振幅の2段落 | 原文236-254は円/矢印/Hのみ。削除 |
| 「復習」headingと文章向け調整の説明 | 原文は見出し/説明なしでOrbit。削除 |
| details/summary7個の代替復習UI、改変質問/答え | 原文のOrbitタグ/全属性/5 attachments/clozeをそのまま復元。外部moduleも原文と同じ |
| 「関連ページ」paragraphと未移植説明note | 原文にはない。削除。原文のprev/nextはlayout footer |
| 状態図3個の追加aria-label | 原文wrapperにない。削除 |
| Bloch画像の追加alt説明 | 原文は画像とcredit noteのみ。altを空にした |
| linkの追加title tooltip | 原文mini_qni_filterのanchorにない。削除 |

元からある2 sidenotes、4 headings、Bloch画像/credit、3組の円/矢印、19 H /24 circles /12 ketsを維持。qc-figure/qc-transitionは原文の図用div群のCSS移植で、新規図や背景tileではない。文字/labelを含まないため残す。circuit置換/linkは許可された差分。

### 欠落一覧 / 共有layoutの判断

- beforeの欠落: Orbit reviewarea/7 prompts/5 attachment画像/cloze。今回原文どおり復元し、創作していない。
- afterの欠落: `_layouts/page.html:46` が挿入する `_includes/footer.html` のprev「X ゲート (量子 NOT)」/next「PHASE ゲート」リンク。先のページは未移植で今回は追加せず、normalized本文diffの許容欠落として列挙。
- 原文のsidebar/mobile navigation/GitHub icon/help templates等の共有layoutは未移植。別ページも変える作業ではないので保留。
- 現行共有header「Qni Tutorial」「実験版」、footer「ページ一覧」「WebGPU 対応ブラウザで使う実験版です。回路の変更は保存されません。」、header/heading/ledeの装飾/幅/色は原文と異なる。h_gate専用追加ではないので削除しない。明示されたbranding更新とembed frame移管だけ共有部も変更した。

### visible branding変更の全一覧

| file:line | before → after |
| --- | --- |
| src/components/qni-webgpu-circuit.ts:55 | Qni WebGPU で開く → **Qniで開く** (更新2 no-space) |
| src/layouts/TutorialLayout.astro:19 | title suffix Qni Tutorial WebGPU → Qni Tutorial |
| src/layouts/TutorialLayout.astro:58 | header Qni Tutorial WebGPU → Qni Tutorial |
| src/pages/index.astro:7 | Astro と Qni WebGPU に少しずつ移しています → Astro と Qni に少しずつ移しています |

aria/alt/meta/loading/no-WebGPU/error/device-lost stringsも監査したが、他にこのbrandingはない。技術名WebGPU/GPUを説明する日本語messagesはそのまま。`rg -n 'Qni WebGPU' src public` は0、bundle JS/MJS/HTMLとwasm stringsも該当0。上流から来る未変更の該当brandingはない。コード名/tag/APP_URL/パス/pinは維持。

### 原文の青いボタン

手書きh_gate旧embedにlinkはないため、許可された追加linkの外観はphase_gateの原文mini_qniに合わせる。一次資料 `_plugins/mini_qni_filter.rb:97-104`、`css/mini_qni.css:1-8`。frame border2px #0EA5E9/padding32px/corners6,6,6,0/bg#FAFAFA、tab #0EA5E9/padding8px16px/bottom corners6px、anchor white/16px/500/28px、span margin-right8px、24×24 external-link SVG。pathは原文そのまま。tabはframe左下にgap0で接続。rel=noopener/current-circuit exportと/app/先は維持。

before `/tmp/qtw-btn-before-{1440,390}.png` と原文phaseのcomputed stylesを取得済み。typecheck/build成功、本文snapshot/元Orbit/branding/button/Canvas resize/link export等の関連30/30 tests成功。公開後の比較を追記する。

### 公開検証 / 完了 (11:03 JST)

実装 **04e344da36f656b7ebaf14ee3557ffcc83f420e5**、Pages **38015071471** 成功 (build2分40秒 / deploy9秒)。gmktec実 Chromium152 / AMD Vulkan / unsafe WebGPU / DPR1、1440/390pxで再比較。normalized本文diffは両幅とも **delete「Xゲート(量子NOT)PHASEゲート」だけ**。原文footerを除けば全文一致。本文top-level element順も一致し、唯一許可されたembedの div→qni-webgpu-circuit 置換だけ違う。19 H /24 circles /12 kets /7 Orbit prompts維持。原文4ケースの最終console/page errors0、移植h_gate/index/multi-3のbody.innerTextに「Qni WebGPU」0。

原文phaseと現在h_gateのanchor/tab/frame各10 style項目の差分 **0**、tabとframeのgap=0、leftOffset=0 (両幅)。原文と同じSVG path、文字、padding、color、radius、font size/weightを確認し、before/after/compareを目視した。Native UI/高さは許可されたembed置換の差である。390pxのnative palette/state windowが横に切れる既存制約はbefore screenshotにもあり、原文のH/XだけのUIとは異なる。上流qni-webgpuを変更できない今回の範囲ではresponsive backendは未修正として記録する。

GPU診断readbackで初期[1,0,0,0]、H後[0.7071067690849304,0,0.7071067690849304,0]を両幅確認。実mouse clickで `/qni-tutorial-webgpu/app/#...` を開き、現在の `{"cols":[["|0>"],["H"]]}` がhashに渡ることを確認。通常anchor/target=_blank/rel=noopenerを維持。新たなproduction readback/CPU fallbackはない。

原文cold warm-upの既知favicon404はcoldOriginalErrorsに記録。最初の比較ではharnessがlegacy custom elementsをcloneNodeしてconstructorのnotNull assertionを誘発したので、DOMをcloneせずrendered textからfooterを引く方法に修正して再実行した。原文/製品bugを隠すroute/mockは使用していない。

保存: `/tmp/qtw-strip-compare-{1440,390}.png`、`/tmp/qtw-strip.json` (raw/normalized全文、textDiffs、element順、runtime branding audit)。ボタンは `/tmp/qtw-btn-before-{1440,390}.png`、`/tmp/qtw-btn-after-{1440,390}.png`、`/tmp/qtw-btn-compare-{1440,390}.png`、`/tmp/qtw-btn.json` (computed style comparisons)。30/30関連tests、typecheck/build成功。browser/server終了、pin不変、通常push後にmain/worktreeをcleanにして終了する。最終docs-only deployは待たない。

### Inline H を paper / Geist Bold に戻す (2026-10-10 11:09 JST)

本文glyphを #FFFFFF から #FFFCF0 に戻し、実 **Geist Bold 700** outlineにした。origin/masterの `scripts/extract-gate-svg.py` は単字Regular、48×48 viewBox、em基準0.62scale。Bold variant SVGはないが `apps/web/assets/Geist-Bold.ttf` があるため、同じscale/centeringでHを抽出した。使用fontは変更していないpin f4cd605のもの。

生成は `QNI_WEBGPU_SOURCE=... python3 scripts/extract-inline-h.py` (fonttools必要)。`src/assets/h-bold.svg` は生成物なので手動編集しない。ビルド時は既存SVGとしてバンドルし、Python/fonttools/runtime font download/strokeは不要。connectedCallbackで p 内かつ qc-operation外だけBoldを選び、図/他contextは既存Regular SVGをそのまま使う。再parent時も再判定する。header「実験版」、footer、shared layout、16/24px寸法、body#3AA99Fは変更なし。

DPR1/2の公開before raw cropsを先に保存。typecheck/buildと関連6/6 tests成功。公開後、8x nearest crops、glyph color/coverage、figure raw pixel diffを追記する。

同じ作業の更新により、embed frameのpadding32pxを **0px** に変更した。blue border2pxと左下「Qniで開く」tabは維持。canvasの実getBoundingClientRectに基づくDPR resizeは既存のまま、寸法testを316×192 (host320×240) に更新し、frame内縁4辺とtabのgap0をtestした。11:12に旧paddingありのbefore screenshotを1440/390pxで取得済み。型チェック/build、Bold/frame/link/本文等の関連28/28 tests成功。header/footer/shared layoutには触れていない。

11:16の更新でタイトル下の横線だけ共有layout変更が許可された。原文 `_layouts/page.html:35` の `mb-10 border-b border-zinc-200 pb-10` は単独hrではなくdivのbottom border。これを page-title-block として移植した。borderは1px solid #E4E4E7、padding-bottom40px / margin-bottom40px / margin-top0、content全幅。既存タイトルfontを変えず、原文inline H1 rowの1px gapを補正して H1 bottom→line=73px / line→first paragraph=41px に揃えた。header「実験版」/footerは不変。型チェック/buildとdivider/Bold等9/9関連tests成功。

原文のdesktop content幅1120pxに対し現行shared mainの内幅は1072px、mobileは双方358px。横線は双方のcontent全幅100%とし、横線だけの許可を超えるmain/sidebarの幅変更はしない。computed styles/実寸をJSONに残す。

#### 3項目の最終公開検証 (11:28 JST)

コミット: Bold **4c7500347cf6c91adfe5cfe94a6435f8faefd279**、frame **ba49972e0d3cd8053f6c38c20d4ffb02a0e41845**、divider **b9d81b095e8dd4ef414d284ceb42575e21ec222c**。最終実装Pages **38016650187** 成功 (build2分41秒 / deploy10秒)。このdeploy後にまとめてgmktec Chromium152/Vulkan/unsafe WebGPUで検証し、DPRはcontextとforce-device-scale-factorを両方1/2にした。最終sourceの関連 **31/31 tests**、typecheck/build成功。

| DPR | glyph before→after 最明RGB | glyph mean RGB before→after | effective coverage before→after |
| --- | --- | --- | --- |
| 1 | 181,223,219 → 230,242,230 | 142.11,205.97,200.00 → 191.89,225.72,213.94 | 6.010% → 9.562% |
| 2 | 255,255,255 → **255,252,240** | 181.86,223.18,219.38 → 207.28,231.94,220.19 | 5.896% → 9.469% |

DPR2のopaque paper coreは68pixels。glyph採色はcorner背景を除く中央20%-80% ROIで、body/foreground間のRGB projectionからalphaを推定し、sum(alpha)/(16×16×DPR²)をcoverageとした。meanはalpha>1/255のglyph pixelの非加重平均。**figureのbefore/after raw pixel差分はDPR1=0 / DPR2=0**。nearest-neighbor8xを目視し、実Boldの方が16pxで読み取りやすいことを確認した。

frameは1440/390px×DPR1/2の4ケースすべてcanvas-inner edgeのleft/right/top/bottom=0、tab gap=0/left offset=0、canvas buffer=round(CSS size×DPR)、page overflowなし。H診断readbackは[0.7071067690849304,0,0.7071067690849304,0]。production CPU fallback/readback追加はなし。

dividerは原文/移植×1440/390の4ケースでbottom border1px solid RGB228,228,231、margin-top0/margin-bottom40/padding-bottom40、H1→line73px /line→paragraph41px。実装を原文同様border-bottomにしたため、border-topは双方0px solid (colorは同色)。widthはdesktop原文1120 /移植1072px、mobile双方358pxで、どちらもcontent全幅。header/footerは変更しない。原文cold favicon404は別記録、最終比較のconsole/page errorsは0。移植Bold/frameのcold検証も0。

保存: `/tmp/qtw-hbold-inline-dpr{1,2}-{before,after}.png` (8x)、`/tmp/qtw-hbold-compare.png`、`/tmp/qtw-hbold-figure-dpr{1,2}.png`、`/tmp/qtw-hbold.json`。frameは `/tmp/qtw-frame-{before,after}-{1440,390}.png` と `/tmp/qtw-frame.json` (DPR2追加写真も保存)。dividerは `/tmp/qtw-hr-compare-{1440,390}.png` と `/tmp/qtw-hr.json`。最初のdivider cropはstartup focus後のscrollとclip座標が食い違ったharness問題で、document座標/fullPage撮影に直して再取得・目視確認した。browserはfinallyで停止、test serverも終了。通常push後にcleanで終了し、docs-only deployは待たない。
