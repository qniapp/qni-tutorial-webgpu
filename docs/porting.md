# 原文ページの順次移植

順序は `src/data/toc.ts`。原文は qniapp/qni origin/main `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d` の `apps/tutorial` を git show で参照する。未対応機能が必要なページでは判断を利用者に返し、そのページと後続ページを移植しない。

## 1. はじめに (`index` / サイトルート) - circuit-block PR 待ち・未移植

12:30の指示更新: 高宮さんがこのページの保留を決定。別ストリームのqni-webgpu circuit-block PRを待ち、今回indexは変更しない。「QPUとは」から再開し、以後もcircuit-blockページだけは保留して次に進んでよい。以下は12:19時点の停止記録。

2026-10-10 12:19 JST。原文 `apps/tutorial/index.html:1-9` のtitleは「はじめに」、sectionは「イントロダクション」、descriptionは「実践による量子コンピュータプログラミング」。現行indexは従来の実験版トップページのままで、本文の忠実移植はまだ行っていない。sidebarはファイル有無でリンクを導出するため、以前からこの既存indexに「はじめに」のリンクを表示しているが、本文が移植完了という意味ではない。

### STOPの理由と位置

原文 `index.html:104-106` の mini_qni 回路:

```json
{"cols":[["|0>","|0>"],["{量子もつれ"],["H"],["•","X"],["}"],["Measure"],[1,"Measure"]]}
```

`{量子もつれ` / `}` は原文で表示される回路グループの開始・終了注釈。原文 `packages/elements/src/quantum-circuit-element.ts:1323-1327` はこのラベルを `CircuitBlockElement` に設定する。公開原文の quantum-circuit でも `circuit-block` の `data-comment="量子もつれ"` を確認した。

現行WebGPU pin `f4cd605fbf85030ebc4a7dd0f3a84b98e0b3f99f` ではこれを表現できない。`apps/web/src/url_circuit/decode.rs` の `summarize_circuit_json` (98行付近) は全tokenを `token_to_gate` で検証し、未知tokenは失敗になる。グループ注釈はgate tokenの対応表にない。`build_gates` (174行付近) の未知tokenを読み飛ばす経路を使っても、ラベルとグループ枠を失うため忠実な移植にはならない。

### 実ユーザーに近い環境での再現

ソースの推測だけでなく、公開h_gateの既存 `qni-webgpu-circuit` に原文JSONをそのまま設定して確認した (検証ブラウザ内だけの操作。公開ファイルは変更していない)。gmktec Chromium **152.0.7977.82**、Node **22.23.2**、`--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan --force-device-scale-factor=1`。

| viewport | data-state | 画面のstatus | console |
| --- | --- | --- | --- |
| 1440px | error | 量子回路を起動できませんでした。 | invalid circuit JSON: expected {"cols":[...]} with supported gates |
| 390px | error | 同上 | 同上 |

原文の公開indexから取得した回路JSONは上記と一致し、グループlabelは「量子もつれ」。成功時のzero-errors条件は満たせないため、移植を開始せず停止した。本文・画像・Orbit・注釈・header「実験版」・footerには変更なし。QPUとは等、後続ページにも進んでいない。

保存:

- `/tmp/qtw-port-index.json`: compatibility-check-only、両幅のエラー、原文JSON・group label、blocked=true。
- `/tmp/qtw-port-index-blocked-webgpu-{1440,390}.png`: 実際の起動失敗表示。
- `/tmp/qtw-port-index-blocked-original-1440.png`: 原文の埋め込み回路。
- `/tmp/qtw-port-index-check.mjs`: 再現手順。

これは移植完了比較ではないので、normalized本文diff・完了版compare画像・成功したembedの結果は作っていない。製品コードに変更がないためtypecheck/buildや移植テストの追加も行っていない。ブラウザはfinallyで停止し、サーバーは起動していない。今回はcheckpointのdocsだけを通常pushする。ページの移植deployはない。

### 高宮さんへの質問 (未決定)

**この回路の「量子もつれ」グループ注釈をどう扱いますか?**

1. WebGPU本体で原文のグループ開始/終了token、表示、JSON保持を実装し、新しいpinを公開してから「はじめに」を忠実移植する。
2. このページだけ、グループ注釈を省略してよいと明示的に承認する (計算とlabel表示は別問題。原文の可視ラベルは失われる)。今回は承認がないので省略していない。
3. 「はじめに」は保留し、明示的な順序変更の承認を得て「QPUとは」へ進む。今回はsidebar順の指定があるので飛ばしていない。

12:30の更新で高宮さんが選択肢3を承認したため、indexは保留して以下の順序で再開した。

## 2. QPU とは (`qpu`) - 移植・公開検証完了

原文 `apps/tutorial/qpu.html` をそのまま転記。追加の説明・見出し・注釈はなし。`nmargin_note hhl` は既存Sidenote(numbered)へ、`./index.html` のリンクは現行baseへ変更。Orbitの4promptと元の属性は維持し、元と同じOrbit moduleを読み込む。画像・回路・ket・新規custom elementなし。header/footer/index/pinは変更しない。

公開検証: 1440/390pxの両方でnormalized本文diff=0、MathJax入力diff=0、Orbit全属性一致。原文/移植ともh-gate=0 / qubit-circle=0 / ket=0 / math=0 / embed=0 / img=0 / Orbit prompt=4 (area=1) / sidenote=1。sidebarはqpuリンクでaria-current=page。console/page errors=0、overflowなし。回路がないのでembed起動テストは該当なし。

実装 `aac530e8f5594e991e32f63c110332b30c2b4bcd`、最終公開確認commit `1a011982d9ea86a1fbcbcfa04c5d57dcce259be5`、Pages **38021386661** success。`/tmp/qtw-port-qpu-compare-{1440,390}.png`、`/tmp/qtw-port-qpu.json` 保存、目視確認済み。

## 3. QPU は何が得意? (`what_qpu_do_faster`) - 移植・公開検証完了

原文 `apps/tutorial/what_qpu_do_faster.html` を転記。6つのnmargin_noteは既存Sidenote(numbered)へ。元のTeXをString.rawで出力し、hasMathで実MathJaxを読み込む。Orbitの12promptと属性を維持。`images/what-qpu-do-faster/` の4PNGはgit showのバイト列を変更せずpublicへコピーした。原文calloutのborder-blue-400/bg-blue-50/p-4/my-5/md:w-7/12、list-decimal、overflow-auto、italicをCSSで再現。回路・新規custom elementなし。

公開検証: 1440/390pxの両方でnormalized本文diff=0、TeX入力diff=0、Orbit全属性一致。原文/移植ともh-gate=0 / qubit-circle=0 / ket=0 / MathJax=13 / embed=0 / img=4 / Orbit prompt=12 (area=3) / sidenote=6。4画像のSHA256は原文git showと一致し、公開画像もすべてload成功。MathJaxエラーなし、横overflowなし、sidebarのリンクと現在ページ表示も正常。console/page errors=0。回路なしのためembed検証は該当なし。

実装 `aac530e8f5594e991e32f63c110332b30c2b4bcd`、Orbit修正 `1a011982d9ea86a1fbcbcfa04c5d57dcce259be5`、Pages **38021386661** success (build2分11秒、deploy10秒)。`/tmp/qtw-port-what_qpu_do_faster-compare-{1440,390}.png`、`/tmp/qtw-port-what_qpu_do_faster.json` 保存、目視確認済み。

比較環境: gmktec Chromium152.0.7977.82、Node22.23.2、unsafe WebGPU/Vulkan/use-angle=vulkan/force-device-scale-factor=1。normalized本文はcontent-with-margin内のfooter/script/style/MathJax生成DOM/Orbit reviewareaを除いたtext nodesをNFC化し空白を除去。TeXはMathJax入力、Orbitはprompt属性を別に比較。原文cold favicon404は別記録し、比較ケースは原文・移植ともerrors0。共有layoutの色・書体・header・footer・前後リンク等の既存差はpage本文移植で変更しない。typecheck/build成功、関連10spec **54/54 tests** 成功。原文の時点の数値や説明も更新・訂正していない。browserはfinallyで停止、preview serverはテスト終了時に停止。

両ページのfixture、1440/390pxの構造・sidebar link・MathJax/imageテストを追加。本文・数式・Orbit属性・画像hash・countsの公開比較結果はdeploy後に記録する。

初回公開比較で、本文・数式・countsは一致したが、Orbitの2問のTeX属性でAstroが `\begin` をbackspaceとして処理していた。公開ブラウザで再現後、属性もString.rawに直し、原文の全prompt属性をfixtureとして検査するテストを追加した。data-astro-cidはCSS scope用で本文の属性ではないため比較から除外する。

## 4. 量子回路 (`quantum_circuit`) - 移植・公開検証完了

12:47の更新で、原文tag名のdisplay-only circuit-step / circuit-dropzone実装を高宮さんが承認。以下の停止理由は履歴として残す。

circuit-blockページではないので自動skipしない。原文 `apps/tutorial/quantum_circuit.html:91-229` の命令表に、未実装の x-gate / phase-gate / write-gate / measurement-gate / control-gate / swap-gate と、CNOT・Toffoli・CPHASE・CZ・SWAP・CSWAPの複合図を作る circuit-step / circuit-dropzone がある。単独glyphは軽量化できるが、複合図はwire入力/出力、上下結線、phase同士やswap同士の接続を持つ新規描画要素が必要。

原文 `packages/elements/src/circuit-step-element.ts:489-532` は接続をリセットしてcontrolled/phase-phase/swap/control-control接続を再計算する。`circuit-dropzone-element.ts:29-32,241-260,316-317` はdata-input-wire-quantum / output / connect-top / connect-bottomに応じたwire SVGの表示を持つ。現行tutorialにはこれらの要素はなく、h-gateのような単一SVGのコピーだけでは忠実な表を表示できない。WebGPU本体の計算命令が未対応という意味ではなく、チュートリアルの複合図を表すDOM要素が未移植という問題。

**質問: この表のために、原文名 circuit-step / circuit-dropzone を保った読み取り専用の複合図rendererを新規実装してよいですか?**

- 案A: original tag / 属性 / 結線を保つ軽量read-only rendererと上記gate glyphを実装し、表の全行を1440/390pxで確認してから移植。
- 案B: 原文要素の接続・イベント挙動も含む互換実装を先に行う (単純なglyph移植より大きい作業)。
- 画像化や表の省略は、originalタグ/忠実移植の指定に合わないので採用していない。

12:47承認前はここで停止し、ページは追加していなかった。承認後は以下の実装で再開した。

`circuit-display.ts/css` に原文名の表示専用circuit-step / circuit-dropzoneとx/y/z/phase/write/measurement/control/swap-gateを追加。ドラッグ・イベントによる接続再計算・シミュレーションは持たず、原文の宣言済みdata-connect/input/output属性を描画する。sm=640px、desktop48×32/mobile32×48、中心glyph32px、no-rotationのcolumn、desktop16px間隔/mobile0、CPHASE行padding16pxは原文CSS・公開実測と一致。wire SVGは原文をコピーし、Shadow DOM用の重複IDだけ描画時に除去する。

ゲート内部はWebGPU pin f4cd605のplus/p/y/z/digit0/digit1.svg、control半径8、swap(12,12)-(36,36)・stroke4、write括弧座標、meter原文geometryを使用する。色はnative #3AA99F / #FFFCF0、測定#5E409D、writeの0/1=#AF3029/#205EA6。native meterと同じscale strokeにする。phase angleは原文data-angleから上/下に表示する。Hは既存登録を再利用。本文は原文そのまま、画像2枚はバイトコピー、注釈2、Orbit6、命令表11行を維持。anonymous noteは可視文言を変えずDOMのIDだけ補った。注釈の大画像は原文prose同様max-width100%にしてoverflowを防ぐ。

公開1440/390で本文diff=0、Orbit属性一致、errors=0、画像hash一致。h-gate1、x3、phase3、write2、control6、swap4、measurement1、circuit-step6、dropzone14、画像2、注釈2、Orbit6。ket/circle/embedなし。stepの高さはdesktop[80,128,112,80,80,128] / mobile[96,144,128,96,96,144]で原文実測と一致。命令表の図も目視確認した。

commit **9461b4631fbf046754f2e86058bd967a36882127**、Pages **38022357556** success。`/tmp/qtw-port-quantum_circuit-compare-{1440,390}.png`、`/tmp/qtw-port-quantum_circuit.json`。

## 5. Qni 入門 (`qni_intro`) - 移植・公開検証完了

原文本文・見出し・3注釈・2GIFを維持。mini_qniの `{"cols":[["|0>"]]}` と、単独quantum-circuitの `{"cols":[["|0>","|0>"],["H"],["•","X"],["Measure"],[1,"Measure"]]}` を同じJSONのqni-webgpu-circuitへ置換。単独editor例はshow-state-panel=false。原文のpalette-dropzone 4個はdisplay-onlyでh/x/y/zのglyphを描画し、既存の8振幅円を同じcomplex値・ket・lgサイズで使用。未移植circle_notationリンクは原文URLへ解決し、可視テキストは変えない。回路を説明する本文も更新・訂正せず保持。header/footer/index/pin不変。

公開1440/390で本文diff=0、errors=0、画像hash一致。embed2、外側palette h/x/y/z各1、circle8、画像2、注釈3。Orbit/ketなし。GPU readbackは初期回路[1,0,0,0]、測定付き回路は2量子ビットのone-hot状態で起動・計算を確認。2番目は本番show-state-panel=falseのためreadback bufferを用意しない。検証ブラウザ内だけ一時的にtrueへ切替えて診断し、falseに戻して撮影した。最初のharnessで非表示panelからreadbackした際のstate vector not readyはこの方法で確認し直した。

normalized比較はembed内部を除く。原文mini_qniの外側にある「Qniで開く」は新embedのShadow DOMに移ったので本文diffから除外し、ボタンの表示自体は維持。単独quantum-circuitもnative embedへ置換した分、そのUIにはtabが付く。commit **9461b46**、Pages **38022357556**。`/tmp/qtw-port-qni_intro-compare-{1440,390}.png`、`/tmp/qtw-port-qni_intro.json`。

型チェック/build、関連display/sidebar9テスト成功。

## 6. 確率的ビット (`p_bit`) - 移植・公開検証完了

原文p_bit.htmlの本文、4つのnumbered注釈 (probablity-dataの原文typoも保持)、Orbit10prompt、PNG3枚をコピー。既に移植済みwhat_qpu_do_fasterへのリンクだけ現行baseへ解決。最後の !w-full figureは原文どおりcontent全幅。回路や新規表示要素なし。

公開1440/390で本文diff=0、Orbit全属性一致、errors=0。画像3・注釈4・Orbit10 (area1)、gate/circle/ket/embedなし。画像SHA256は原文一致、sidebarリンク正常。commit **6bf7299b07268ca3d4548f1b567d7336eca2d2b0**、Pages **38022817881** success。`/tmp/qtw-port-p_bit-compare-{1440,390}.png`、`/tmp/qtw-port-p_bit.json`。

## 7. 重ね合わせ状態 (`superposition`) - 移植・公開検証完了

原文本文、ket TeX、Orbit7promptを保持。10個の振幅円は元の値とsqrt、ket、xlサイズ、probability-only tooltipを既存qubit-circleで描画。原文magnitude-limeはdiscだけ#84CC16とし、他の既存circleには影響しないページ限定CSS。table/callout/配列を元のCSSutilityと同じ配置で描画。TeXのあるOrbit属性はString.raw。画像や回路なし。

公開1440/390で本文diff=0、TeX入力diff=0、Orbit全属性一致、errors=0。circle10、ket=18 (MathJax18)、Orbit7 (area1)、画像/注釈/gate/embedなし。sidebarリンク正常。commit **6bf7299**、Pages **38022817881** success (build2分34秒、deploy8秒)。`/tmp/qtw-port-superposition-compare-{1440,390}.png`、`/tmp/qtw-port-superposition.json`。目視でMathJax・円配置・calloutを確認した。

### 12:47再開分の最終チェックポイント (13:10 JST)

4ページすべて1440/390で本文diff0、counts一致、errors0、overflowなし。旧サイトのcold favicon404だけ別記録。比較のgate/circle countsはembed内部を除く (nativeはcanvas、旧はcustom elementなので構造が違う)。TeXはMathJax入力、Orbitはprompt属性を別比較。共有layout/色/書体/ナビゲーション等の既存差は変更しない。画像はすべてSHA256一致。typecheck/build成功、関連11spec **62/62 tests**。

「はじめに」は引き続きcircuit-block PR待ち。index・header「実験版」・footer・WebGPU pinは不変。次は「量子ビット」(qubit)。残り時間を検証とcheckpointに使い、新規ページは開始しなかった。未解決のSTOP質問はなし。display-only original tagの追加は以後確認不要という12:47の指示に従う。browserはfinallyで停止、test serverも終了。docsのみ最後に通常pushして終了する。

## 8. 量子ビット (`qubit`) - 移植・公開検証完了

原文qubit.htmlの本文・3注釈・3PNG・Orbit6promptを保持。ket/TeXは実MathJax、2つの円は既存qubit-circle (sqrt元値保持)。mini_qniは原文と同じ `{"cols":[["|0>"],["X"],["Rx(π/2)"],["Rz(π/2)"],["Ry(π/2)"]]}` のnative embedへ置換。本文のリンク先だけ現行URLへ解決。hasMath/hasCircuit、header/footer/index/pin不変。

旧UI記述: 「ブロッホ球を回路のいろんな場所に置く」はWebGPUでもBloch gateを置けるが、原文はBlochだけのpaletteで、nativeは全命令palette・native state window。配置や操作の見た目は異なる。本文は変更しない。


公開1440/390: normalized本文diff0、TeX入力diff0、Orbit属性・要素数一致、errors0、overflowなし、画像SHA256一致、sidebarリンク正常。counts={"hGate": 0, "qubitCircle": 2, "kets": 5, "steps": 0, "dropzones": 0, "x": 0, "phase": 0, "write": 0, "control": 0, "swap": 0, "measurement": 0, "math": 11, "embeds": 1, "images": 3, "orbitPrompts": 6, "orbitAreas": 1, "sidenotes": 3}。commit **0f92bfb9f3fa718f29683c748a90aa1aaf5f294a**、Pages **38023514257** success。PNG `/tmp/qtw-port-qubit-compare-{1440,390}.png`、JSON `/tmp/qtw-port-qubit.json`。

## 9. 位相 (`phase`) - 移植・公開検証完了

原文本文・注釈1・PNG1・Orbit3promptを保持。複素振幅とsqrt/prepend/appendフィルタは同じ値で6つのqubit-circleへ、ketはMathJax。原文末尾の手組みquantum-simulator全体を `{"cols":[["|0>"]]}` のnative embedに置換。原文の確率/位相/drag説明は変更しない。

旧UI記述: 手組みpalette9個と右上inspector-button、circle-notationのレイアウトはnative toolbar/palette/state windowとは異なる。ドラッグして確率や位相を見る操作はnativeでも可能だが、位置・inspector・角度編集UIは異なる。本文は原文のまま。

両ページ型チェック/build、関連page/sidebar17テスト成功。原文にcircuit-blockはない。公開比較を追記する。


公開1440/390: normalized本文diff0、TeX入力diff0、Orbit属性・要素数一致、errors0、overflowなし、画像SHA256一致、sidebarリンク正常。counts={"hGate": 0, "qubitCircle": 6, "kets": 10, "steps": 0, "dropzones": 0, "x": 0, "phase": 0, "write": 0, "control": 0, "swap": 0, "measurement": 0, "math": 10, "embeds": 1, "images": 1, "orbitPrompts": 3, "orbitAreas": 1, "sidenotes": 1}。commit **0f92bfb9f3fa718f29683c748a90aa1aaf5f294a**、Pages **38023514257** success。PNG `/tmp/qtw-port-phase-compare-{1440,390}.png`、JSON `/tmp/qtw-port-phase.json`。

## 10. 状態ベクトル表示 (`circle_notation`) - 移植・公開検証完了

原文本文、3注釈、PNG1、Orbit8、16個の元のcomplex/sqrt/prepend/append振幅円を維持。ket/複素数TeXは実MathJax、原文lime色はdiscに限定。原文のまとめで「確率は半径」と記載する箇所も勝手に訂正しない。旧UI記述: 円のhover popupは軽量tooltipへ置換済みで、情報(振幅/確率/位相)は同じだが見た目やメニューは異なる。本文は原文のまま。


公開1440/390: normalized本文diff0、TeX入力diff0、Orbit属性・要素数一致、errors0、overflowなし、画像SHA256一致、sidebarリンク正常。counts={"hGate": 0, "qubitCircle": 16, "kets": 9, "steps": 0, "dropzones": 0, "x": 0, "phase": 0, "write": 0, "control": 0, "swap": 0, "measurement": 0, "math": 20, "embeds": 0, "images": 1, "orbitPrompts": 8, "orbitAreas": 1, "sidenotes": 3}。commit **270af6355545ed6e65d8223003152515a8eedbbb**、Pages **38023868027** success。PNG `/tmp/qtw-port-circle_notation-compare-{1440,390}.png`、JSON `/tmp/qtw-port-circle_notation.json`。

## 11. CPU 命令との違い (`cpu_vs_qpu_operations`) - 移植・公開検証完了

原文本文、2注釈、PNG1、Orbit8、10円のcomplex値・lgサイズ・ket順を維持。minus/arrow_right.svgを原文のまま取り込み、QPU命令/命令/逆演算の図をdisplay-only HTMLとして描画。未移植ページへの3リンクは原文URLへ解決し、可視文言は同じ。旧UI操作記述なし (命令概念と静的図の説明のみ)。円のtooltipは他ページ同様軽量版。回路なし。

両ページtypecheck/buildと関連page/sidebar21/21テスト成功。


公開1440/390: normalized本文diff0、TeX入力diff0、Orbit属性・要素数一致、errors0、overflowなし、画像SHA256一致、sidebarリンク正常。counts={"hGate": 0, "qubitCircle": 10, "kets": 0, "steps": 0, "dropzones": 0, "x": 0, "phase": 0, "write": 0, "control": 0, "swap": 0, "measurement": 0, "math": 0, "embeds": 0, "images": 1, "orbitPrompts": 8, "orbitAreas": 1, "sidenotes": 2}。commit **270af6355545ed6e65d8223003152515a8eedbbb**、Pages **38023868027** success。PNG `/tmp/qtw-port-cpu_vs_qpu_operations-compare-{1440,390}.png`、JSON `/tmp/qtw-port-cpu_vs_qpu_operations.json`。

## 12. X ゲート (`x_gate`) - 旧pinではcircuit-block PR 待ち

原文x_gate.html:254は `{重ね合わせ状態の準備` / `}` を含む。13:27のPR #49 merge承認後、pin更新とindexの後に再開予定。h_gateは移植済みなので再実装しない。

## 13. PHASE ゲート (`phase_gate`) - 旧pinではcircuit-block PR 待ち

原文phase_gate.html:155は `{重ね合わせ` / `}` を含む。新pinの検証後に再開する。

## 14. WRITE 命令 (`write_operation`) - 移植・公開確認待ち

原文本文・Orbit4prompt・8円・ketと原文タグの静的図を保持。qpu_operationは元のwrite-gate/h-gate、bare quantum-circuitはdisplay-onlyの1-wire authored diagram。原文CSS通りsm(640px)でcolumn/row切替、wire属性をreadonlyで付与する。minus/arrowSVGは原文そのまま。旧UI操作の記述なし (初期化・リセットの静的説明)。本文のWRITE可逆性の説明も変更しない。typecheck/build、関連page/sidebar/display27/27 tests。
