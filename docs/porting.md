# 原文ページの順次移植

順序は `src/data/toc.ts`。原文は qniapp/qni origin/main `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d` の `apps/tutorial` を git show で参照する。未対応機能が必要なページでは判断を利用者に返し、そのページと後続ページを移植しない。

## 1. はじめに (`index` / サイトルート) - 移植・公開検証完了

公開1440/390: 本文diff0、TeX diff0、Orbit属性/counts一致、errors0、overflowなし、sidebar rootリンク正常。embed1 running、画像1、Orbit9 (area1)、注釈6、gate/circle/ket0 (embed内部は除外)。GPU one-hot norm1、Qniで開くのexported JSONに `{量子もつれ` / `}` が残ることも両幅で確認。commit **c8bbfcd89f78996c66e5da126b72cdf16892c074**、Pages **38025511738** success。PNG `/tmp/qtw-port-index-compare-{1440,390}.png`、JSON `/tmp/qtw-port-index.json`。

13:27承認とPR #49 mergeにより保留解除。新pin e8a39ccを再build/deployした後、既存h_gate/qni_intro/qubit/phase/multi-3を1440/390で確認し、10 loads / 16 embeds running、GPU vector finite/norm1、errors0。Pages **38024913238**、pin commit **caed094**、JSON `/tmp/qtw-pin-e8a39cc.json`。

原文indexの本文・6注釈・PNG1・Orbit9を維持。「量子もつれ」block tokenを含む原文JSONをそのままnative embedへ置換し、Qniで開くを維持。既存の実験版トップ本文は原文へ置換し、header/footerは変更しない。旧UI記述: Qniの原文スクリーンショットと元palette3個の見た目はnative editorと異なる。原文リンクqniapp.netやGitHub案内もそのまま保持。型チェック/build、関連49/49テスト成功。注釈PNGには元のmax-width100%を適用。native canvas focusによるページ自動scrollをhostのpreventScrollで抑止し、sidebar testはMathJax完了後のdocument座標でlayout shiftを測定する。

以下は旧pin時点の履歴 (質問は解決済み)。

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

### 高宮さんへの質問 (旧pin時点、13:27に解決済み)

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

## 12. X ゲート (`x_gate`) - 移植・公開検証完了 (旧pinの保留を解消)

原文x_gate.html:254は `{重ね合わせ状態の準備` / `}` を含む。13:27のPR #49 merge承認後、pin更新とindexを完了。機能待ちは解除済みだが、13:58の終了期限のため今回このページは開始しない。h_gateは移植済みなので再実装しない。

## 13. PHASE ゲート (`phase_gate`) - 移植・公開検証完了 (旧pinの保留を解消)

原文phase_gate.html:155は `{重ね合わせ` / `}` を含む。新pin検証は完了したが、終了期限のため次回Xの後で再開する。h_gateは既存移植済みなので再実装不要。

## 14. WRITE 命令 (`write_operation`) - 移植・公開検証完了

原文本文・Orbit4prompt・8円・ketと原文タグの静的図を保持。qpu_operationは元のwrite-gate/h-gate、bare quantum-circuitはdisplay-onlyの1-wire authored diagram。原文CSS通りsm(640px)でcolumn/row切替、wire属性をreadonlyで付与する。minus/arrowSVGは原文そのまま。旧UI操作の記述なし (初期化・リセットの静的説明)。本文のWRITE可逆性の説明も変更しない。typecheck/build、関連page/sidebar/display27/27 tests。

公開1440/390: 本文/TeX diff0、Orbit属性・counts一致、errors0、overflowなし。h2、circle8、ket7、step6/dropzone6、write13、Orbit4、画像/注釈/embed0。元のbare quantum-circuitもstatic図なのでembed数から除外して比較。commit **1b81d79**、Pages **38024512712** success。PNG `/tmp/qtw-port-write_operation-compare-{1440,390}.png`、JSON `/tmp/qtw-port-write_operation.json`。

## PR #49 pin更新 - 公開検証完了

13:27承認に従いpinを **e8a39cc529636a508183e931c5caae65ee69b1b8** に更新。別のclean detached upstream worktreeでembed/standaloneを再buildし、Binaryen123を維持。index移植前に公開の既存embedを確認した。Pages **38024913238** success、10 loads / 16 embeds running、norm1/finite、errors0。JSON `/tmp/qtw-pin-e8a39cc.json`。

### 13:56 最終チェックポイント

この再開でqubit/phase/circle_notation/cpu_vs_qpu_operations/write_operation/indexの6ページを公開検証。各1440/390で本文diff0、counts/Orbit属性一致、errors0、overflowなし。7画像の公開original/ours SHA256一致は `/tmp/qtw-port-image-hashes.json`。既存と共有の差 (paper色、書体、サイドバー、MathJax、native UI) は引き継ぎ、旧UI操作記述の差は各節に記録した。WRITEの静的図も目視で確認、glyphはnativeのket/Geistで旧SVGとは異なる。型チェック/buildと関連49 tests成功。最終commitは検証記録のみで通常push。次はx_gate、その後既存h_gateを飛ばしてphase_gate、さらにmeasurement_operation。未解決STOP質問なし。13:58前に終了し、新規ページは開始しない。


## 13:57 画像・対話化方針の遡及適用 (公開検証完了)

本文の既存テキストノードは変更せず、画像/静的figureだけ置換。新しい図の文字は元画像のラベルや数式で、本文diffは `[data-original-image]` の図内容を除いて比較する。旧画像は参照資産として残すが対象ページでは使わない。Orbit markup/attachmentsは維持する。

| ページ | 置換 |
| --- | --- |
| qpu | 画像なし。既存本文/Orbitを維持 |
| what_qpu_do_faster | matrix_multiplication / qpu_operations_matrix_and_state_vector / state_vector_norm1 / reversible_matrix_multiplication PNG4枚 -> 実MathJax行列・ベクトル・逆演算式 |
| quantum_circuit | 論文図2枚は引用説明との整合性のため保持、質問に列挙 |
| qni_intro | 旧UI操作GIF2枚を保持、質問に列挙。既存native回路2つは対話可能 |
| p_bit | p_bit_graph / c_bit_and_p_bit -> pointer/矢印キーで確率を変えられるSVG graph。Wikipedia/YouTube複合図は質問として保持 |
| superposition | 既に元のqubit-circleで対話tooltipあり、画像なし |
| h_gate | bloch_H0 -> 原文タグbloch-displayのH回転図 (赤/青経路、黒xz軸、x/y/ket)、drag/矢印キーで視点変更 |
| qubit | p0p1_graph / qbit_circular_state -> 対話SVG確率線/振幅円。bloch_sphere -> bloch-display、視点変更可能 |
| phase | amplitude_amplification_overview -> 2組の16 qubit-circle。状態をclick/Enterすると選択状態の位相反転・増幅表示が切り替わる。画像の無注記数値は視覚を再現した正規化した例値で、Grover simulationではない |
| circle_notation | argument_of_complex -> 対話SVG偏角図、pointer/矢印キーで角度変化 |
| cpu_vs_qpu_operations | logic_gates_and_not -> 対話SVG AND/NOT、click/Enterで0/1と出力変化 |
| write_operation | 初期化WRITE0-H-Y / WRITE1-Z-Hの静的回路 -> 同じ命令のnative editable embed2つ。残り本文・円・WRITE glyph維持 |
| index | 旧Grover UI screenshotを保持、質問に列挙。block付きnative回路は既に対話可能 |

### 置換を判断しなかった質問 (ファイル / ページ / 内容)

- `public/images/quantum-circuit/feynman_full_adder.png` / quantum_circuit: Feynman 1986論文の引用。「掲載されている図の抜粋」という本文のまま自作回路へ置換してよいか? そのまま保持。
- `public/images/quantum-circuit/quantum_circuit_diagram_example.jpeg` / quantum_circuit: Zhengほかの論文引用回路。引用のまま自作表示へ置換してよいか? そのまま保持。
- `public/images/qni-intro/qni_live_programming.gif` / qni_intro: 旧paletteから命令を追加する操作。native操作の録画に差し替えるには元本文が指すUIとの確認が必要。保持。
- `public/images/qni-intro/qni_step_execution.gif` / qni_intro: 旧ステップ選択/途中状態を確認する操作。nativeには同じ操作・UIがあるか、本文据え置きで置換してよいか? 保持。
- `public/images/p-bit/wikipedia_youtube_cat.png` / p_bit: Wikipedia/YouTube猫の実例、binary、確率グラフの複合画像。グラフ部分だけ自作に分離し、媒体画像を残してよいか? 保持。
- `public/images/introduction/qni_screenshot_grover.png` / index: 旧Grover editor全体のUI screenshot。native Grover回路へ置換すると本文のサービス紹介画面と違うため、保持。
- Orbitの `question-attachments` / `answer-attachments` (h_gate, superposition, phase, circle_notation, p_bit, quantum_circuit): 元の円/図PNG URL。Orbit attachmentは画像URLなので、独自interactive elementをそのまま入れられない。Orbit markupを維持したまま自作static SVGのURLに変えてよいか? 今回は保持。

typecheck/build、関連39/39 tests成功。interactive keyboard/marking/logic、MathJax errors0、幅390/1440のoverflowなしをテスト。公開比較を追記する。

遡及公開検証: commit **8e861d82a26cd4ece6a2112b8e1605e149ebf90c**、Pages **38026390052** success。13ページ×1440/390=26 loads、本文diff0/本文TeX diff0、Orbit属性一致、errors0、overflowなし、全embed running/GPU readback成功。変更した図の内部は旧image同様本文diffから除外し、置換前後のcountsは差分としてJSONに保持。`/tmp/qtw-policy-<slug>.json`、`/tmp/qtw-port-<slug>-{original,ours}-{1440,390}.png`。

### X/PHASEの今回の実装

X: 本文・ket・20円・Orbit9・注釈1を保持。旧simulator2つは同じJSON (初期WRITE0、block付き重ね合わせ準備) のnative embedへ。rotation-by-pi-around-x-axis.pngはbloch-displayのX軸π回転経路と対話視点へ置換し、図クレジットを保持。原文のtransition/arrow SVGを使い、x/y/z-gateは既存original tagの軽量glyph。bodyに説明追加なし。旧UI差: 原文Xだけのpalette/inspectorの配置はnative full paletteと異なるが、Xを置く/2回作用させる操作は同じ。

PHASE: 本文・22円・Orbit4・注釈2、6個の角度付きphase-gate図を保持。block付き原文JSONのnative embed1。旧初期化scriptは存在しないcircle-notation-P-cへsetAmplitudesする死んだ処理で、移植後の明示振幅円には不要なので除去 (本文不変)。旧UI差/質問: 本文「ゲートをクリックし、popupの角度icon」をnativeの角度editor操作に合わせて今後書き換えてよいか? 今回は文言据え置き。Orbit attachment PNG URLも据え置き。

h_gateとwrite_operationは既に移植済みなので順序上再実装しない。型チェック/build、関連36/36 tests成功。公開比較を追記する。


X/PHASE公開: commit **5209ad0c17565986077362f5be000f29a77a536e**、Pages **38026924659** success。両幅で本文diff0/本文TeX diff0、Orbit属性一致、ours errors0、overflowなし、embed running/GPU vector正常。Xはcircle20/ket14/x-gate12/embed2/Orbit9/注釈1/画像0/bloch-display1。PHASEはcircle22/ket4/phase-gate14/embed1/Orbit4/注釈2/画像0。原文PHASEサイトだけ旧死んだscriptの `Cannot read properties of null (reading 'setAmplitudes')` が発生し、oursにはない。原文のエラーとしてJSONに分離して保持。Hの赤青/黒矢印追加も再度両幅で確認。`/tmp/qtw-port-{x_gate,phase_gate,h_gate}.json`、compare PNGを保存。

## 15. MEASUREMENT 命令 (`measurement_operation`) - 移植・公開検証完了

本文、14 qubit-circle、ket、Orbit8・注釈2を維持。原文のtransition/branch-arrow SVGをそのまま使い、measurement-gateは元タグの軽量native glyph。旧simulatorは同じ `{"cols":[["|0>"],["H"],["Measure"]]}` のnative editable embedへ置換。元図は最初からcustom elementsなのでPNG置換なし。旧UI差: inspector/run-circuit-button/circle-notation配置はnative toolbar/state windowとは異なる。本文の「原理的に予測できない乱数」は物理量子測定の説明であり、ブラウザシミュレータは物理乱数源ではないが、忠実移植のため本文は変更しない。後で説明を更新してよいか質問として残す。

typecheck/build成功。全体test runは工具35s timeoutで29件まで成功して中断 (テスト失敗ではない)。owned orphan previewを停止し、measurementの両幅2/2 targeted testsを再実行成功。既存36/36 regressionsはX/PHASEで成功。公開比較を追記する。新規ページはこれで終了し、次はno_cloning_theorem。


### MEASUREMENT 最終公開確認 (14:26)

Pages **38027299761** success。commit **f8f1d1a2e30ff3d69f254bb1720c24b6b2575b42**。1440/390で本文・TeX diff0、Orbit属性/counts一致、ours/original errors0、overflowなし。h2/circle14/ket9/write5/measurement9/embed1/Orbit8/注釈2、画像0。native embed running、GPU測定後one-hot stateをreadback。PNG `/tmp/qtw-port-measurement_operation-compare-{1440,390}.png`、JSON `/tmp/qtw-port-measurement_operation.json`。

## 14:26 gate形状の優先修正 (公開検証完了)

公開x_gateを最小の本文x-gate1個で再現:16×16px、radius2.4pxで角丸矩形。`/tmp/qtw-shape-before.mjs` が実Chromiumでred、local `gate-shapes.spec.ts` の両幅もredを確認した。原因は `circuit-display.css` がx/y/zを同じrectangular selectorにしていたこと。glyphの選択とページCSSは正しい。

| 元タグ | before -> after / 照合結果 |
| --- | --- |
| x-gate | radius0.15emの角丸矩形 -> radius50%の円。本文/図/connected circuitすべて同じselector。glyphは正しいPlusのまま |
| swap-gate | diagonal端butt -> round cap/join。元のstroke4/viewBox48・native endpoints(12,36)/(36,12)は維持 |
| measurement-gate | 旧SVG path pivot r1.875 + stroke3 (外周3.375) -> native filled circle r3.5。arc/needle/透明body/紫/48px基準のscaled strokes維持 |
| control-gate | 透明body、center(24,24) r8のfilled dot、nativeと一致。変更なし |
| phase-gate | 円+Φ。角度ラベル位置・native p.svgと一致。変更なし |
| write-gate | 透明body、ket bracket位置/stroke2、Geist Mono 0/1、nativeと一致。変更なし |
| h-gate | rect radius0.15em (GATE_SIZE40でnative radius6)、Regular/Bold proseの既承認選択、nativeH glyph。変更なし |
| y-gate / z-gate | 同じrect family、native Geist glyph。変更なし |
| bloch-display | gate-sized glyphでなく独自図の360px sphere。球面/grid/軸を保持、今回形変更なし |

Native reference: qni-webgpu **e8a39cc** `apps/web/src/icons/gate_body.rs` / `gate_glyphs.rs`。Xは `circle_filled` + `GateGlyph::Plus`。`x.svg` の文字XはこのGateKind::Xの描画には使わない。コピーしたplus/y/z/p/digit0/digit1 SVG6枚は同commitのassetsとbyte一致。原文はgit show origin/mainのpackages/elements CSS/iconを参照した。

公開native embedを検証ブラウザ内でWRITE0-X回路にして確認し、Xは40px円＋、GPU stateは|1⟩。両幅canvas PNG `/tmp/qtw-shape-native-x-before-{1440,390}.png`。qni-webgpu本体の問題は見つからず、上流変更なし。

shape before JSON `/tmp/qtw-shapes-before.json`、各element `/tmp/qtw-shape-before-{original,ours}-<page>-<tag>-{1440,390}.png`。Original PHASEだけ既知の死んだsetAmplitudes script errorあり、ours errors0。修正後build/typecheck、関連37/37 tests成功。全9 gate種類のbody family/サイズ/primitive regressionを追加した。Y/Zのpalette形状も追加した4件のshape testsを再実行し4/4成功。

公開commit **0b22f9974d23aceba6d2e9ab9c7d93aa55087471**、Pages **38027988482** success。gmktec Chromium152 / WebGPU Vulkan / DPR1+2、1440/390でelement screenshotsを採取。20 snapshots×2DPRでours errors0、全Xはsquare box / radius50%。native canvasのXは両幅ともcircle+Plus、GPU vector |1⟩。qni-webgpuのshape問題なし。

x_gate / phase_gate / measurement_operation / quantum_circuit / qni_intro / cpu_vs_qpu_operations / write_operation / h_gateの8ページ×2幅で本文diff0、本文TeX diff0、Orbit属性一致、errors0、overflowなし、全embed running/GPU vector正常。既知の原文PHASEだけsetAmplitudes null errorあり、oursにはない。実変更のないH/Y/Z/PHASE/CONTROL/WRITEのbefore/after element pixelsもdiff0。

保存:
- `/tmp/qtw-shape-elements-compare-{1440,390}.png`: Original / Before / Afterの10列別glyph比較 (4倍nearest)
- `/tmp/qtw-shape-{before,after}-<original|ours>-<page>-<tag>-{1440,390}.png`: 個別element
- `/tmp/qtw-shape-page-<slug>-compare-{1440,390}.png`: 全ページside-by-side
- `/tmp/qtw-shape-native-x-{before,after}-{1440,390}.png`: native circleとPlus
- `/tmp/qtw-shapes-{before,after,after-dpr2}.json`: glyph geometry/CSS、GPU vector、errors
- `/tmp/qtw-shape-content-<slug>.json`: 本文/TeX/Orbit/起動結果

本文/header/footer/pin/upstreamは不変。original regular font -> native Geist / 旧green -> native #3AA99Fなど既承認差はそのまま保持。SVG glyphの太さやサイズはnative assets、手続き的primitiveはnativeの48px viewBoxを基準にした。形状修正と測定ページの未完検証を完了し、今回新規ページ移植は行わない。


## 14:42 追加: 本文inline XのBold Plus (公開検証完了)

円形修正は完了済みで再実装しない。変更前の公開x_gateを1440/390×DPR1/2で採取し、inline/figureの個別PNGと本文cropを保存した。初期errors0。

`extract-inline-h.py --glyph plus` を追加し、pin **e8a39cc** `apps/web/assets/Geist-Bold.ttf` の実Bold +輪郭をnative同様48px/0.62em・bounding-box中央配置で生成。新asset `src/assets/plus-bold.svg` はfont weight700。SVG strokeで元のRegularを膨らませず、H同様の真のBold輪郭。生成はfontToolsだけで行い、build/runtimeにPythonやfont downloadは不要。

`x-gate` はp内のproseでのみBold、figure/circuit-step/circuit-dropzone/qc-operation/data-original-image内はRegular。再接続でcontextを再評価する。円radius50%、16px、paper #FFFCF0 / fill #3AA99F、位置は不変。table/transition/palette/connected circuit/native embedのglyphはRegularのまま。本文/header/footer/pin/upstream不変。

型チェック/build成功、42/42 tests。DPR1/2×1440/390の新規4件はprose Bold・figure Regular・サイズ/色/円・reconnectのBold->Regular->Boldを確認。before JSON `/tmp/qtw-xbold-before.json`。

公開commit **916ff92b857a9e9f1a0966b4d52cdb49e9ae1070**、Pages **38028720146** success。1440/390×DPR1/2でprose cropを目視確認し、proseはBold・figureはRegular、errors0。背景/紙色/サイズ/radiusは不変。図の24px Xのbefore/after pixel diffは4ケースすべて **0**。

central20%-80%のROIでbackground->foreground RGB projectionのalpha総和を16×16×DPR²で割ったglyph coverage: DPR1 **3.131% -> 3.853%** (+23.1%)、DPR2 **2.603% -> 3.675%** (+41.2%)。両viewportで同じ結果。DPR2は薄いstemが明確な＋になり、DPR1もstemのcoverageが増えた。mean foregroundはDPR1 141.8/204.4/193.6 -> 161.2/212.8/201.2、DPR2は新しいantialias端が増えるため平均輝度は改善指標として扱わない。固定色はpaper #FFFCF0、人工strokeなし。

保存:
- `/tmp/qtw-xbold-compare-{1440,390}-dpr{1,2}.png`: Before/After、12倍nearest zoom
- `/tmp/qtw-xbold-inline-{1440,390}-dpr{1,2}-{before,after}-zoom.png`: 個別zoom crop
- `/tmp/qtw-xbold-prose-{1440,390}-dpr{1,2}-{before,after}.png`: 段落実寸crop
- `/tmp/qtw-xbold-figure-{1440,390}-dpr{1,2}-{before,after}.png`: 変更なしのfigure crop
- `/tmp/qtw-xbold-{before,after}.json` / `/tmp/qtw-xbold-metrics.json`: 属性・geometry・errors・測定

8ページ×1440/390 (x_gate/phase_gate/measurement_operation/quantum_circuit/qni_intro/cpu_vs_qpu_operations/write_operation/h_gate) の公開再確認も本文diff0/本文TeX diff0/Orbit一致/errors0/overflowなし、embed running/GPU正常。JSON `/tmp/qtw-shape-content-<slug>.json`。原文PHASEだけ既知の旧script errorを別記録。円形修正commit **0b22f99** / Pages **38027988482** の結果はそのまま有効。native canvas Xは既に円＋で変更・新規qni-webgpu問題なし。

## PR #50 pin / palette / credit / 全inline Bold (公開確認、390px native clippingでSTOP)

pinを **3cce38bd9ad4e53a6e23e9be7cc79ef97ed630b6** に更新。clean detached `verify/tutorial-palettes` からBinaryen123でembed/standalone再build。nativeは起動・circuit reload時step0、短いpaletteに応じて回路が上へ移動しstate panelは下側に固定される。upstream変更なし。

`qni-webgpu-circuit palette` はJSON string arrayのみ受け付ける。変更時restart。`[]` は隠す、属性なしはsettingsにpalette keyを渡さずnative Fullを維持する。invalid JSON/typeはrunnerを開始せず既存のerror状態を使う。

原文 acf87bf の各sourceをgit showで再確認 (`/tmp/qtw-next-palette-<slug>.html`)。`mini_qni_filter.rb` のPは角度π/2なので明示tokenに変換。Fixture `tests/fixtures/original-palettes.json`:

| page | embed palette (出現順) |
| --- | --- |
| index | H, •, X |
| qni_intro | H, X, Y, Z / [] (2つ目はbare回路、paletteなし) |
| qubit | Bloch |
| h_gate | H, X |
| x_gate | X / X |
| phase | H, X, Y, Z, P(π/2), X^½, Rx(π/2), Ry(π/2), Rz(π/2) |
| phase_gate | P(π/2) |
| write_operation | [] / [] (static authored circuitsのinteractive置換) |
| measurement_operation | [] |
| qpu / what_qpu_do_faster / quantum_circuit / p_bit / superposition / circle_notation / cpu_vs_qpu_operations | embedなし |

置換画像credit削除は **h_gate: physics.stackexchange.com** と **x_gate: qiskit.org** の括弧内citation。元の回転説明は保持。全ported sourceを再検索し他に置換画像creditなし。Feynman/Zhengの引用画像や旧UI GIF/screenshotなど保持画像の引用・creditは維持する。

全inline glyphにprose/diagram共通context判定を適用。Y/Z/S/S†/T/T†/√X/Rx/Ry/Rz/QFT/QFT†はpinの元SVG生成recipeをそのまま使用し、Geist Bold outlineのみへ切り替える。H/Xは既存Bold維持。Pは元の斜線Φのgeometryを保持してstroke2->2.25、CONTROL/SWAP/MEASUREMENTもproseだけ太いprimitive。WRITEはslashed-zeroを失わないようMono Regularの輪郭を48font unitsでembolden (pinはMono Boldを持たない)。`scripts/extract-inline-glyphs.py` で生成し上流ファイルに書き込まない。figure/palette/connected circuit/native embedはRegularのまま。今後のページでも自動適用。

型チェック/build成功、78/78 targeted tests。palette parse/[]/absence/invalid/type/restart、全19tag×1440/390×DPR1/2のprose Bold・diagram Regular・reconnect、保持画像creditを確認。公開commit **45cc5b45fdc50f72a847bde3fe0c3883d5a116a4**、Pages **38029961911** success。

9ページ×1440/390、12embed×2 = **24起動**: 全running、errors0、document overflowなし、palette属性がsource fixtureと一致。GPU readbackがfirst WRITEのone-hot (write_operation 2つ目だけ |1⟩、他は |0⟩ / |00⟩) とnorm1を確認しstep0で開始していることを実証。qni_introの2つ目は診断時だけstate panelを有効化してreadbackし、falseへ復元した。早いframeの `state vector not ready` はframe完成までbounded retryで待つ。結果 `/tmp/qtw-pr50-live.json`、各embed screenshot `/tmp/qtw-pr50-<slug>-<index>-{1440,390}.png`。

ただしnativeの390px layoutは未達。`phase` の9-entry paletteはHの左端とRZの右端がclip、`index` の後続MEASUREMENTも右端外。CNOT target自体は見える。hostのframeはpadding0でcanvasに全面を渡しているためtoken/host余白の問題ではない。upstream **https://github.com/qniapp/qni-webgpu/issues/52** に報告。native修正の承認が必要なため、共通ルールどおり **次ページ移植をSTOP**。scaleでnative UIを縮小する回避策は入れていない。upstream code変更なし。

公開bundleの19tagをprose/figureの16px specimenで実際にrenderし、1440/390×DPR1/2 cropを目視確認。`/tmp/qtw-allbold-live.json`、`/tmp/qtw-allbold-compare-{1440,390}-dpr{1,2}.png` (3倍nearest)、個別 `/tmp/qtw-allbold-<tag>-<width>-dpr<dpr>-{before,after}.png`。未登場のfuture tagはlive DOMへspecimenを挿入したもので、元本文への追加ではない。Pの最初のstroke3案は16pxで穴が潰れたためstroke2.25へ補正しcounterを保持する。図・nativeには補正を適用しない。補正後buildと27 targeted tests成功。補正commit **7f8f03713ccdb172e7fdbaa480e5d227949e1aab**、Pages **38030527912** success。DPR1/2公開zoom cropでPhi counterが残ることを目視確認 (`/tmp/qtw-allbold-phase-gate-compare-{1440,390}-dpr{1,2}.png`)。

原文/liveの8ページ×1440/390再比較: 許可された2つのcredit括弧以外の本文diff0、本文TeX diff0、Orbit一致、ours errors0/overflowなし。JSON `/tmp/qtw-pr50-content-<slug>.json` にauthorizedCreditRemovalsを明示し、未編集のoriginal textも保持。原文PHASEのみ旧script errorを別記録。

390px全12embedのsettled-frame contact `/tmp/qtw-pr50-embeds-390-contact.png` でも確認。追加でqubitのRz/Ry、qni_introの2つ目のMeasure、x_gateの2つ目のPが右側でclipすることをissue #52へ追記。全24embedのGPU readback後にframeが落ち着いてから再撮影した。1440側の短いpalette/全回路は可視。390pxの可視性は未達のまま、upstream修正なし、新規ページ移植 **0**。次ページは引き続きno_cloning_theorem、その次gate_combination。

将来のページでpage-local importを忘れてもBoldが有効になるよう `TutorialLayout.astro` が共通display tagsを登録する。ゲートを持たないqpuページ上の19tag specimen×4条件でも登録・prose Bold・diagram Regularをテストする。

### 今後の移植で必須

- 各embedの元paletteを毎回sourceで確認しtoken syntaxのJSON属性を明示する。元paletteなしは`[]`、standalone用のFull defaultはtutorialに流用しない。
- 自作interactive/custom部品に置換した画像のcreditだけ削除する。保持画像のcredit・引用は保持する。credit以外の本文は編集しない。
- 小さなprose glyphは共通Bold、figure/connected circuit/native embedはRegular。DPR1/2 cropと1440/390のstep0・全gateの可視性を毎回公開で確認する。

## 15:27 owner決定 / sidebar再開

高宮さん承認: **#52の390px native clippingはSTOP対象から除外**。ページごとのclip箇所を記録し、nativeは別作業で修正される。保持画像・PHASE/MEASUREMENT本文は変更しない。原文に合わせられないページ、または#52以外のupstream変更が必要な場合だけSTOP。以下はこの承認後の新規移植。

### no_cloning_theorem / CLONE 命令!? (公開確認完了)

原文source acf87bfをgit showで取得し本文そのまま移植。注2、PNG1、Orbit0、embed0。proofリンクは未移植なので原サイトへ、p_bitは移植先へ。

- 置換: なし。`images/p-bit/wikipedia_youtube_cat.png` は混合メディア図の保持対象なので元画像を保持。
- 削除credit: なし。
- palette / step0 / #52: embedなし、対象外。
- questions: 同じWikipedia/YouTube/猫画像の図を保持する既存の内容方針を引き継ぐ。新規本文変更要求なし。

### gate_combination / 組合わせゲート (公開確認完了)

原文source acf87bfをgit showで取得し全文・12等式図・ket3・Orbit8をそのまま移植。gate図は元のcircuit-dropzone/h-gate/x-gate/phase-gate/rnot-gateを使用、display-only Regular。新規upstream機能不要。JSON block `{重ね合わせ`/`}`を保持した実験embed2。

- 置換: 元からcustom-tagの等式図を同じtagのdisplay-only部品で描画。画像の置換なし。
- 削除credit: なし。
- palette: embed1 `["H","X"]`、embed2 `["X^½"]`。原文の各手書きpaletteを再確認。
- questions: Orbit answer-attachmentsのHH/HXH/2rnots/rnot_gate_decomposition/X_gate_decompositionは既存の画像URL制約として保持。自作部品への置換はしない。
- #52 clipping: 短い2回路はいずれも1440/390で全gate可視。新規clipなし。

型チェック/build成功。新規2ページ1440/390構造・画像・Orbit・MathJax・sidebar、将来tag/元palette、display部品を含む55/55 tests。

公開commit **8c6cd0a78a919c39dd1870224194e8f26eea67c0**、Pages **38031560473** success。原文/live1440/390とも本文diff0・TeX diff0・element counts一致・ours errors0・overflowなし。CLONEはnote2/PNG1、組合わせはH26/X6/PHASE11/√X12/dropzone56/ket3/embed2/Orbit8。両embed running、GPU norm1/one-hot |0⟩でstep0確認。Regular図、√XのSVG・wire、元のangle文字も目視確認。元UIとnative embedの見た目は意図した置換。

結果 `/tmp/qtw-port-{no_cloning_theorem,gate_combination}.json`、original/ours/compare screenshots `/tmp/qtw-port-<slug>-<original|ours|compare>-{1440,390}.png`、mobile冒頭detail `/tmp/qtw-combination-top-390.png`。

### quantum_key_distribution / 量子鍵配送 (公開確認完了)

原文acf87bfの本文・注2・Bennett/Brassard論文引用を保持して移植。
- 置換/削除credit: なし。画像0。
- palette / step0 / #52: embedなし、対象外。
- prose X/H/WRITE0/MEASUREMENTは共通Bold。本文の安全性説明は原文のまま。
- questions: 新規の画像/旧UI問題なし。

### bb84_protocol / BB84 プロトコル (公開確認完了)

原文acf87bfの全段落・箇条書き・注4、送信状態4パターン図を同じoriginal tagsで移植。qubit-circle16のamplitude/ket/sizeを保持し、popupで振幅・確率・位相を確認できる。図のH2個はRegular24px、prose H/MEASUREMENTはBold。元SVG minus/arrowを維持する。
- 置換/削除credit: なし。元からcustom components、画像0。
- palette / step0 / #52: embedなし、対象外。
- questions: 原文の「最終チェック1,000文字の約半分500文字が一致しない」の計数モデルは今後確認したい。本文は編集せず保持し、数値と矛盾する独自interactive盗聴demoを追加していない。

型チェック/build、新規2ページ1440/390構造・amp16・ket・figure/prose・sidebarを含む61/61 tests。

公開commit **0b116ff7ddc0a74a6d17ba96a9aa6dc430a1181f**、Pages **38032000168** success。原文/live1440/390とも本文diff0・TeX diff0・element counts一致・errors0・overflowなし。量子鍵配送はX/H/WRITE/MEASUREMENT各1・note2・Math0、BB84プロトコルはH20/MEASUREMENT3/qubit-circle16/ket22・note4。いずれもembed0/画像0/Orbit0。元の4パターン図はcircle振幅/phaseをtooltipで調べられる。

結果 `/tmp/qtw-port-{quantum_key_distribution,bb84_protocol}.json`、original/ours/compare screenshots `/tmp/qtw-port-<slug>-<original|ours|compare>-{1440,390}.png`。公開1440/390×DPR1/2でもprose glyph全Boldを再確認し、BB84図のH2個がRegular24pxのままであることを確認。metadata `/tmp/qtw-newpage-glyphs.json`、本文crop `/tmp/qtw-<slug>-prose-<width>-dpr<dpr>.png`、個別12倍nearest `/tmp/qtw-<slug>-<tag>-<width>-dpr<dpr>-zoom.png`。目視でWRITE0の斜線/MEASUREMENT meter・H/Xの太さを確認。全8 loads errors0。引用文・原文の安全性/盗聴率の説明は編集していない。

### bb84_circuit / BB84 回路 (#53 待ち、SKIP、未移植)

次ページの原文acf87bfをgit showで調査。original JSONは `Measure>aliceX` / `Measure>aliceH` / `Measure>eveX` / `Measure>bobH` に測定結果を代入し、`X<aliceX` / `H<aliceH` / `X<eveX` / `H<bobH` を変数値1のときだけ実行する。元paletteはなしなので将来の移植時は `[]`。

公開3cce38b nativeで原文JSONをそのまま新しいqni-webgpu-circuitに渡すE2E reproduction: `data-state=error`、`invalid circuit JSON: expected {"cols":[...]} with supported gates`。既存2embedはrunningのまま。native decoderはnamed measurement/condition modelを持たないため、原文の説明・回路を一致させるには#52以外の上流変更が必要。**https://github.com/qniapp/qni-webgpu/issues/53** に報告し、standing STOP ruleで停止する。条件を削って無条件gateで代用することも、本文を書き換えることもしていない。Astroページ/PORTED link未作成。

Artifacts `/tmp/qtw-bb84-flag-repro.{json,png}`、harness `/tmp/qtw-bb84-flag-repro.mjs`、原文snapshot `/tmp/qtw-next-bb84-circuit.html`。upstream code変更なし。今回新規移植はsidebar順に **4ページ**、全公開検証完了。

## 16:55 sidebar継続 / #53 待ちページをSKIP

高宮さん承認: bb84_circuitは **#53 待ち** としてSKIPし、後続の条件付きgateが必要なページも同様にSKIPする。#52 native clippingは記録のみ。保持画像5項目とPHASE/MEASUREMENT本文は引き続き変更しない。

### multi_qubit_circle_notation / 状態ベクトル表示 (公開確認完了)

原文acf87bfの本文・3組のketリスト・12circleを移植。binary ket 00/01/10/11を元TeXのままMathJaxで表示。circle popupで確率/振幅/位相を確認できる。
- 置換画像/削除credit: なし (画像0)。
- palette / step0 / #52: embed0、対象外。
- questions: 新規なし。

### multi_qubit_superposition / 重ね合わせ状態 (公開確認完了)

原文acf87bfの3状態例・circle24・ket・note1、3個の実験回路JSONとblockラベルをそのまま移植。circle popupのamp/phaseを保持。
- 置換画像/削除credit: なし (画像0)。
- palette: 原文3embedにpaletteなし、すべて `[]`。
- #52 clipping: 公開1440/390で追記。
- questions: 新規なし。本文の確率・位相の説明は変更しない。

型チェック/build成功、新規2ページの構造・全amplitude・MathJax・元palette・sidebarを含む63/63 tests。公開commit **5dedf200b54a41f901bfc088dd604765e0ee6d0e**、Pages **38036334988** success。1440/390本文diff0/TeX diff0/counts一致/errors0/overflowなし。状態ベクトルはcircle12/ket47、重ね合わせはcircle24/ket13/note1/embed3。全embed running、norm1/one-hot |000⟩でstep0確認。JSON `/tmp/qtw-port-<slug>.json`、original/ours screenshot `/tmp/qtw-port-<slug>-<original|ours>-{1440,390}.png`。clip detailを最終checkpointへ記録する。

### multi_qubit_operation / 複数量子ビットでの演算 (公開確認完了)

原文3つのX演算例、前後circle48と実験embed3を保持。`X_bit1_ket_pair.png` / `X_bit2_ket_pair.png` / `X_bit3_ket_pair.png` は新規 `KetPairs.astro` の色付きペア/双方向arrow/MathJax ketへ置換。各circleをクリック・キーボードfocusするとXOR partnerを同時highlightし、対応するbinary番号をscreen readerへ伝える。これは演算ペアの図示であり、色を量子確率と偽らない。元のbefore/after amplitude図とGPU実験はそのまま。
- 削除credit: なし (原画像credit行なし)。
- palette: 原文全3embedにpaletteなし、すべて `[]`。
- questions: 新規なし。#52 clipのみ確認して記録。

### operator_pair / 演算ペア (公開確認完了)

`ket_label_in_binary.png` / `bit1_ket_pair.png` / `bit2_ket_pair.png` / `bit3_ket_pair.png` を同じ `KetPairs.astro` に置換。8個の空円/decimal ket/binary ket、およびbit1/2/3の同色pairを再現。画像相当のlabel/TeXはdata-original-image内として本文diffからだけ除外する。初期pair色は原文と同じ対応、selectionはpointer/keyboard両対応。
- 削除credit: なし (原画像credit行なし)。
- palette / step0 / #52: embed0、対象外。
- questions: 新規なし。

型チェック/build成功、73/73 tests。原文body構造/circle48/元JSON・palette・MathJaxに加え、bit1/2/3のXORペア選択、keyboard Enter、mobile overflow、画像7点不使用を確認。

公開commit **454a6969b179bc1d9e1215cdc1b304a34413c543**、Pages **38036870830** success。1440/390で本文diff0/本文TeX diff0/errors0/overflowなし。元bodyのcircle48/TeX・3回路JSONは維持、画像3/4->0、新illustrationのMathJax ketは演算+24、演算ペア+64。意図したimage-equivalent count差として記録する (元count一致と偽らない)。3embed running/norm1/|000⟩でstep0確認。JSON `/tmp/qtw-port-<slug>.json`、native crops `/tmp/qtw-native-multi_qubit_operation-<0..2>-{1440,390}.png`。

### random_byte_generator / ランダムバイトジェネレータ (公開確認完了)

原文の8量子ビット回路2個・before/after circle48・注3・本文を保持。`H_bit1_ket_pair.png` / `H_bit2_ket_pair.png` / `H_bit3_ket_pair.png` をKetPairsのH-labelled pair図に置換し、pointer/keyboardで演算pairをhighlightできる。Hは図ラベルRegular、色はpairを示すだけで確率を捏造しない。元の実際のamplitude変化は別のcircle48とGPU回路で確認する。
- 削除credit: なし (原画像にcredit行なし)。
- palette: 元2embedにpaletteなし、両方 `[]`。
- #52 clip: 公開で記録する。8wire/256状態のsceneでもclippingはSKIP/STOPにしない。
- questions: シミュレータ測定を物理的な量子乱数と同一視しないという既存MEASUREMENTの注記を引き継ぐ。原文は変更しない。

型チェック/build、53/53 targeted tests成功。KetPairsをresponsive幅にして390でも8つのket/circleが一度に見えるようにし、arrowのviewBoxとpaddingを同じ比率で追従させる。小さなprose gateのBold/図Regularは共通layoutが維持する。

公開commit **dc87b3daa80efc22eea0fbc367a7ac2493cd8339**、Pages **38037319710** success。1440/390で本文diff0/本文TeX diff0/errors0/overflowなし。circle48/note3/embed2・元の8wire JSONを維持、画像3->0、image-equivalent ket +24 (body ket11 -> total35)。2embed running、256次元GPU状態・norm1・one-hot |00000000⟩でstep0確認。

全8embed×1440/390 = 16起動を公開で再確認した。`/tmp/qtw-multi-scenes.json` は全step0/norm1、palette=[]、running。native screenshots `/tmp/qtw-scene-<slug>-<index>-{1440,390}.png`、390 contact `/tmp/qtw-multi-scenes-390-contact.png`。#52 notes:
- multi_qubit_superposition: 390px全3embedの状態パネルが横scroll。embed3はRx/末尾Measureとblockラベルが右側でclip。embed1/2のgate自体は可視。
- multi_qubit_operation: 390px全3embedでRx/末尾X/blockの右端がclip、状態パネルも横scroll。
- random_byte_generator: 390px逐次Hのembed1で右側のH/Measureがclip、compact embed2の全8wire gateは可視。状態パネルは両幅とも下端でclipするため#52のnative height/layout記録に含める。1440pxでは全gateが可視。
- multi_qubit_circle_notation / operator_pair: native embedなし。

高宮さん決定どおりこれらのclipを理由に停止・本文変更・native code変更はしない。保持画像5項目、PHASE/MEASUREMENT本文は未編集。#53条件付きgateは今回の5ページに存在せず、bb84_circuitは引き続き **#53 待ち / SKIP**。

KetPairsの公開pointer選択を1440/390×DPR1/2×3ページで確認し、各8button・pair2選択 (binary-only図は1選択) とresponsive幅350pxを確認。SVGのX/HはRegular図ラベル。screenshots `/tmp/qtw-pairs-<slug>-<width>-dpr<dpr>{,-selected}.png`、metadata `/tmp/qtw-pairs-live-interaction.json`。目視でcircle8/ket全番号・binary ketの視認性・双方向arrow・focus色を確認。原文比較 `/tmp/qtw-port-<slug>-compare-{1440,390}.png`。画像置換に元credit行がなかったため今回の削除creditは全5ページ **なし**。

今回の新規移植 **5ページ**。次はmulti_qubit_phase_gate。時間制限のため未着手、未検証ページをpushしていない。

## 2026-10-10 PR #54 / 本文内scroll (公開確認完了)

ユーザー追加指示により移植は再開せず、pinを **dba8ed696f366af78c714ae956683b44777386e8** (PR #54) に更新。clean detached `verify/tutorial-narrow` からBinaryen123でembed/standalone再build。本文/TeX/回路JSON/palette/creditは未変更。

実WebGPU Chromiumで25ページ×390/1440を1ページずつ再現。beforeは13ページ22箇所 (幅別23件、50ケース中14ケース) に横/縦inner scroll。4列circle wrap、自然幅に応じた静的関係図/数式fit、binary labelのcell幅修正でlocal-after 50ケースすべてinner scroll0/overflow0/errors0、全embed running。回帰testはred→green、typecheck/build成功。全箇所のpage/element/原因/fix/before-after screenshotを [content-overflow.md](./content-overflow.md) に記録。スクロールを単に隠す修正やnative canvasの縮小はしていない。

公開commit **5ee202e90ed7c064f52727c15c107612d11a1553**、Pages **38039509444** success。公開版で同じ25ページ×390/1440 = **50ケースすべてinner scroll0/document overflow0/errors0** を確認。全embed running、`/tmp/qtw-scroll-after.json`、全ページ・全修正箇所のbefore/after画像を保存。主要画像 `/tmp/qtw-noscroll-{before,after}.png`。

phase/index/qubit/qni_intro(2)/x_gate(2)の **7embed** を390pxで個別に目視し、phase9-token paletteの5+4 wrap、index/qni_intro末尾Measure、qubit末尾Rz/Ry、x_gate末尾Pまで可視でclipなし。画像 `/tmp/qtw-pr54-after-<slug>-<index>-390.png`、比較beforeも同prefix-beforeで保存。GPU readbackで全7件norm1/one-hot初期状態を確認 (`/tmp/qtw-pr54-after.json`)。qni_introの非表示state panelは診断時だけ有効化し、falseへ戻してから画像保存した。native canvasのhost縮小はしていない。

最終全suite **144 tests passed (3.1m)**、typecheck/build成功。今回初めて全suiteを通した際に発見した旧仕様のtest (置換済みH画像、削除済み画像credit、indexの旧note ID/外部link、図24pxの物理寸法固定) も現仕様へ更新し、本文は未変更。所有browser/serverは終了、次ページ移植は未着手。#53待ちは変更なし。

## 2026-10-11 PR #56 pin / 条件付きBB84再開

pinを **f819e353a6e0f4249331d048abe9763d7a464432** (PR #56) に更新。clean detached `verify/tutorial-conditional` からBinaryen123でembed/standalone再build。既存25ページ/22embedの原文・回路JSON・paletteは未変更。まずpinのみ公開し、既存embedのrunning/step0/errorsと条件付きgateのlive動作を確認してからbb84_circuitを復帰する。06:54 hard stop。

pin commit **0a59435eb4664361cf5817dceba1846b3c628c82**、Pages **38087743083 success**。既存22embed×390/1440 = **44起動すべてrunning/step0/norm1/errors0**。`/tmp/qtw-pr56-existing.json`、画像 `/tmp/qtw-pr56-existing-<slug>-<index>-<width>.png`。pin時の全144test成功。公開standaloneで条件1→適用、0→skip、未定義→skip、同名変数は最新の先行測定を読む、未来の測定は先読みしない、元BB84全回路がload/norm1/8状態のone-hotになることをGPU readbackで確認。`/tmp/qtw-pr56-behavior.json` / `/tmp/qtw-pr56-conditional-<case>.png`。全8 named tokensを維持。simulationはGPU-only。

### bb84_circuit / BB84 回路 (公開確認完了)

#53待ちを解除。原文の3wire/全39cols JSONをそのまま保持し、Measure>aliceX/aliceH/eveX/bobH、X<aliceX/eveX、H<aliceH/bobHを削除・無条件化しない。原文prose・TeX unchanged、画像/Orbitなし、credit削除なし、palette **[]**。本文H8/X4/MEASUREMENT4はBold、nativeはRegular。note2/ket15/embed1を保持。local original比較1440/390でtext diff0/TeX diff0/counts一致/errors0。native内の長い回路/block label/8-state gridのclip/panはnote only。原文の「イブの確率/ボブの不一致約半分」のmodel説明は既存質問として保持し、書き換えない。

### multi_qubit_phase_gate / PHASE ゲート (公開確認完了)

phase_bit{1,2,3}_ket_pair.pngの3枚を、元の4色pairとPHASE双方向arc/MathJax ketを持つinteractive KetPairsへ置換。focus/pointer/keyboardでXOR pairを選択する。元画像にcredit行なし、削除creditなし。図labelはRegular、共通prose Bold規則を維持。元amplitude circle **52**、body ket/TeX、note0/Orbit0、3wire JSONを保持。palette **["P(π/4)"]**。8circle before/after 6列は共通4列grid wrapで390のHTML inner scrollを防ぐ。local1440/390でtext diff0/本文TeX diff0/errors0/overflowなし、intentional counts差は画像3→0/diagram ket +24。native state gridは横pan/clip、host canvasを縮小しない。

### partial_measurement / 1 ビット測定 (公開確認完了)

元の20circle、紫の確率4labelと2本の測定分岐説明図、ket8/TeX、本文を保持。元SVGのdivider/down arrowを使い、確率labelをcircle中心へgridで配置。画像置換なし、credit削除なし、embed/palette/Orbit/noteなし。local1440/390でtext diff0/TeX diff0/counts一致/errors0/overflowなし。native clip/step0は対象外。物理乱数とシミュレータの区別の既存質問は変更しない。

### 既存複数bit 390px 再確認 (note only)

- multi_qubit_circle_notation: embedなし。本文4列wrapを維持。
- multi_qubit_superposition: embed3。gate/Measureは可視、全3state panelで8×1のcircle gridが横pan/clip。
- multi_qubit_operation: embed3。末尾Xは3回路とも可視、全3state panelは同じ横pan/clip。
- operator_pair: embedなし。MathJax binary labelとinteractive図にHTML scrollなし。
- random_byte_generator: embed2。逐次Hの後半H/Measureが右でclip、compact回路は全8wire gate可視。両state panelの下端がclip。

画像 `/tmp/qtw-pr56-existing-<slug>-<index>-390.png`、8embed contact `/tmp/qtw-pr56-recheck-390-contact.png`。これはnative rendering/panであり、computed overflow auto/scrollを持つHTML/MathJaxのinner scrollとは別。指示どおりnative変更・host縮小はせずnoteのみ。全ページのHTML内横/縦scroll回帰を再実行する。次はswap_gate、未着手。

公開commit **235e63d3947d0c15d1ba53be654f57e49a4f2edd**、Pages **38088666612 success**。新3ページすべてoriginal/live1440/390のtext diff0/本文TeX diff0/errors0、BBC/partialのcounts一致、PHASEのintentional画像置換差を確認。BBCとPHASEの各2幅native開始はrunning/GPU norm1/one-hot初期状態、BBCは8状態・全8 named tokensを保持。`/tmp/qtw-port-{bb84_circuit,multi_qubit_phase_gate,partial_measurement}.json`、全ページ画像 `/tmp/qtw-port-<slug>-{original,ours}-{1440,390}.png`。既存の保持画像・PHASE/MEASUREMENT本文・creditは未編集。

公開 **28ページ×390/1440 = 56ケース**を実WebGPU Chromeで1ページずつ監査し、computed overflow auto/scrollのHTML内横/縦scroll0/document overflow0/errors0、全embed running。`/tmp/qtw-scroll-pr56-after.json`、画像 `/tmp/qtw-scroll-pr56-after-<slug>-<width>.png`。embedのない再確認2ページの390画像も同prefixで保存。native pan/clipは上記note-onlyのまま保持。

prose H/X/MEASUREMENT Bold16px、PHASE図label RegularとXOR pair選択を、新3ページ×1440/390×DPR1/2で公開確認。`/tmp/qtw-pr56-glyphs.json`、`/tmp/qtw-pr56-<slug>-<width>-dpr<dpr>-{glyphs,selected}.png`。最終 **158 tests passed (4.4m)**、build/typecheck成功。条件付きembedのrunning/step0/flag exportと適用/skip/未定義のGPU動作を `tests/bb84-conditional.spec.ts` に固定した。

build運用注意: `pnpm build` はnative WASMを再buildしない。pin変更時は必ずclean pinned sourceを `bash scripts/fetch-qni-webgpu.sh <source>` に渡してembed/standaloneを生成し、その後 `QNI_WEBGPU_SOURCE=<source> pnpm build` する。今回も最終local/public確認はその手順で生成したPR #56 bundleで行った。

## 2026-10-11 PR #55 / max-wire-count 前提作業 (07:04 checkpoint)

中断したSWAP/CNOT/SWAPパズルの未公開draftはstashに保持し、先に既存28ページを更新。pin **785c8b786c9eb0b7cb48d435d8215aaf45177ea1**、clean source `verify/tutorial-wire-limit` からembed/standaloneをBinaryen123で実際に再buildした。PR #56のnamed conditional gatesを含む履歴であることも確認。

`qni-webgpu-circuit` の `max-wire-count` を正の整数としてparseし、`startEmbed` の `maxWireCount` に渡す。属性なしはsettings key自体を省略する。変更/削除で旧runnerを破棄して再起動し、不正値は起動せず既存error UIを使う。本文/JSON/palette/creditは未変更。

元 `origin/main:apps/tutorial/<slug>.html` と `_plugins/mini_qni_filter.rb` を照合。直接HTMLは1、mini_qni filterの実装は2。WRITEの元HTMLにはmax属性がないが、直接HTMLの1という指定と元の1wire図に従った。未移植 `decrement_circuit` の直接図には4が明記されているため、移植時に元属性を照合する。値はページ内embed順。

| ページ | max-wire-count |
| --- | --- |
| index | 2 |
| qpu | embedなし |
| what_qpu_do_faster | embedなし |
| quantum_circuit | embedなし |
| qni_intro | 2, 1 |
| p_bit | embedなし |
| superposition | embedなし |
| qubit | 2 |
| phase | 1 |
| circle_notation | embedなし |
| cpu_vs_qpu_operations | embedなし |
| h_gate | 1 |
| x_gate | 1, 1 |
| phase_gate | 2 |
| write_operation | 1, 1 |
| measurement_operation | 1 |
| no_cloning_theorem | embedなし |
| gate_combination | 1, 1 |
| quantum_key_distribution | embedなし |
| bb84_protocol | embedなし |
| bb84_circuit | 1 |
| multi_qubit_circle_notation | embedなし |
| multi_qubit_superposition | 1, 1, 1 |
| multi_qubit_operation | 1, 1, 1 |
| operator_pair | embedなし |
| random_byte_generator | 1, 1 |
| multi_qubit_phase_gate | 1 |
| partial_measurement | embedなし |

fixture `tests/fixtures/original-wire-limits.json` と各ページ属性の回帰テストを追加。parserの整数化・省略・変更・不正値も含め **45 tests passed**、build/typecheck成功。実WebGPU Chromiumのlocal確認は全24embed×390/1440=48開始すべてrunning/step0/GPU norm1/errors0。全28ページ×2幅=56ケースでshadow DOMを含むHTML内横/縦scroll0/document overflow0/errors0。`/tmp/qtw-pr55-existing.json`、`/tmp/qtw-scroll-pr55-local.json` と同prefixの全ページ/全embed画像。読み込んだ既存3/8wire回路をmax=1で切り詰めていないこともGPU dimensionで確認。

native canvasのpan/clipはHTML scrollとは区別し、hostを縮小せずnote-onlyとして高宮さんの判断待ち。公開commit **b80759fb1b5e744fbc856453d1199f03eb4066ea**、Pages **38090061738 success**。公開24embed×2幅=48開始すべてrunning/step0/norm1/errors0/max属性一致、公開28ページ×2幅=56監査でHTML内横/縦scroll0/document overflow0/errors0。`/tmp/qtw-pr55-existing.json`、`/tmp/qtw-scroll-pr55-public.json`。前提の公開確認を終えてからstashしたdraftを復元した。

## 2026-10-11 SWAP系列 / CPHASE STOP (07:22 checkpoint)

### swap_gate / SWAP ゲート

元の2回路JSONと本文を保持。画像置換/credit削除なし。palette `[[],[]]`、直接HTMLのmax-wire-count `[1,1]`。有効SWAPと別列の無効SWAPをそのまま残す。1440/390の本文/TeX diff0/errors0、2embed×2幅のrunning/step0/norm1。新たなHTML scroll修正なし、nativeのgate/state panelは390でも可視。

### cnot_gate / CNOT ゲート

`2qubits_bit2_ket_pair.png` 1枚を4状態/2色/decimal・2bit binary MathJax labelを持つinteractive KetPairsに置換。選択はXOR 2、例えば1と3。元画像にはcredit行なし、credit削除なし。共通componentにqubits=2を追加し、既存8状態図のdefault=3を維持。元16 amplitude circles、note1、3回路JSON、本文/TeXを保持。図labelはRegular、prose glyphはBold。palette `[[],[],[]]`、直接HTMLのmax-wire-count `[1,1,1]`。1440/390の本文/TeX diff0/errors0、3embed×2幅のrunning/step0/norm1。4列図が自然幅256pxで収まりHTML inner scrollなし。画像→図の差としてket label8個追加。390では最初の長い回路の後半gateがnative canvasで右clip、state panelは可視。nativeの変更/host縮小なし。

### swap_from_cnots / SWAP パズル

元のキーボードの説明/本文と初期2wire JSONを保持。画像置換/credit削除なし。palette `[["X","•","Measure"]]`、直接HTMLのmax-wire-count `[1]`。1440/390の本文/TeX diff0/errors0、embed×2幅のrunning/step0/norm1。HTML scroll修正なし、390でpalette/gate/state panel可視。native上限1でも元から存在する2wireを切り詰めず、既存wireへの編集を許す。

### 確認とSTOP

新3ページのoriginal/local 1440/390比較、12開始、390/1440×DPR1/2のprose Bold・図Regular・XOR選択を確認。`/tmp/qtw-port-{swap_gate,cnot_gate,swap_from_cnots}.json`、original/ours全ページ画像、`/tmp/qtw-swap-new-<slug>-<index>-<width>.png`、`/tmp/qtw-swap-<slug>-<width>-dpr<dpr>-{glyphs,selected}.png`。GPU最終vectorではSWAP、3-CNOT SWAP、Bell状態、control+PHASE、単独PHASE、3種類のCZが期待値と一致。

次のCPHASEでは、元の「同角度PHASE 3個はCCPHASEと等価」というハンズオンがnativeで成立しない。実GPUでは独立PHASEとして7状態が回転するため、上流修正が必要なSTOP。issue **https://github.com/qniapp/qni-webgpu/issues/57**、再現/期待値/実画面は [cphase-blocker.md](cphase-blocker.md)。未公開draftは `/tmp/qtw-blocked-cphase/` に退避し、route/fixture/TOCから除外。本文の改変・別ゲートへの置換・上流修正はしていない。CPHASE/entanglement以降は公開せず、次回は#57解決確認から再開する。

新3ページの質問: 追加なし。既存の保持画像/PHASE・MEASUREMENT本文に関する質問は未変更。全native clip/panはnote-onlyとして高宮さんの判断待ち。公開commit **2f71ca310214fa8e80ab93cebe37db87f2811fd2**、Pages **38091269521 success**。CPHASEを除いた最終 **195 tests passed (1.9m)**、build/typecheck成功。公開新3ページの1440/390 original比較も本文/TeX diff0/errors0、12開始のGPU初期状態を再確認。公開DPR1/2のBold/Regularとpair選択も確認済み。SWAPの無効回路を実GPU Chrome390でdragして正しい同列SWAPへ修正し、`Qniで開く` が修正済みJSONを出すことを確認 (`/tmp/qtw-swap-quiz-drag.{json,png}`)。

| 新ページ | max-wire-count (embed順) | palette (embed順) |
| --- | --- | --- |
| swap_gate | 1, 1 | [], [] |
| cnot_gate | 1, 1, 1 | [], [], [] |
| swap_from_cnots | 1 | [X, •, Measure] |

公開全31ページ/30embedの追加統合監査は `/tmp/qtw-scroll-shipping-public.json` に1ページずつ保存する。62ケースを対象にHTML/shadow DOMのscrollとGPU step0/norm1/max属性を同時確認し、途中結果も保存する。07:28のhard stopを優先し、最終完了数は実行log `/tmp/qtw-shipping-public-audit.log` とこのJSONで確認する。前提の既存28ページ/24embedは公開56/48ケース完了、新3ページは公開6/12ケース完了済み。CPHASEは#57解決待ちのSTOPであり未公開。

## 2026-10-11 BB84 本文の明示的訂正 (07:39 checkpoint)

高宮さんの明示的な例外許可により、`bb84_protocol` の4文と `bb84_circuit` の3文だけを訂正。07:29に `gh pr list -R qniapp/qni --state all` とbb84/イブ/250のsearchを再実行し、OPENの **[qniapp/qni #572](https://github.com/qniapp/qni/pull/572)** を発見した。authorはyasuhito、head **fbe76c9bbe348bf8ec8cafa8e125dfc56ab911b3**。PR diffを取得し、全7文の文言をそのまま採用した。07:25時点の未発見情報より後の確認結果である。

PRの `{% qpu_operation h %}` は既存 `<h-gate>`、`{% ket 0/1 %}` は既存 `<Ket label="0/1" />` に対応させた。literal Unicode ketや別TeX表記は導入しない。guaranteeを高確率の判断へ、唯一の攻撃を可能な攻撃の一つへ、H適用分の推測50%/全体75%、チェック不一致25%/1,000文字中約250文字へ変更。元の「置こる」もPRどおり「起こる」とする。

7文のbefore/after・PR/head・旧本文/TeX・旧source SHA256を `tests/fixtures/bb84-text-corrections.json` に保存。変更後sourceからその7文だけを逆変換して旧SHAと一致するテストにより、本文以外のHTML/JSON/設定/style/importも無変更と保証する。表示本文は旧全文に許可差分だけを適用して比較し、MathJaxはprotocol22式のまま、circuit16式→18式 (新しいket2個のみ) を許可する。画像/credit/palette/max-wire-count/回路/既存の質問は変更しない。

最終 **201 tests passed (3.5m)**、build/typecheck成功。実WebGPU Chromeのoriginal/local390/1440で許可分以外の本文/TeX diff0/errors0。shadow DOMを含むHTML内横/縦scroll0/document横overflow0、BBCのGPU初期状態も確認。両ページ×2幅×DPR1/2で新しいHのprose Bold16pxと既存ket表示を実画面で確認。`/tmp/qtw-port-bb84_{protocol,circuit}.json`、`/tmp/qtw-scroll-bb84-text-local.json`、`/tmp/qtw-bb84-text-<slug>-<width>-dpr<dpr>[-kets].png`。公開commit **99f03891453343ebef8186399fc7077ea98beaeb**、Pages **38092316574 success**。公開2ページ×390/1440=4ケースすべて許可分以外の本文/TeX diff0/errors0。shadow DOMを含むHTML内横/縦scroll0/document横overflow0、BBCは2幅ともrunning・GPU norm1・初期one-hot8状態。Hのprose Bold16pxと既存ket表記を公開2ページ×2幅×DPR1/2でも確認。`/tmp/qtw-port-bb84_{protocol,circuit}.json` (commit99f0389)、`/tmp/qtw-scroll-bb84-text-public.json`、`/tmp/qtw-bb84-text-glyphs.json` と同prefixの公開画面。native pan/clipは従来どおりnote-only、host拡縮や上流変更なし。

旧本文の差分を一括で無視するのではなく、7文の完全一致whitelistとket2個の追加だけを許可する。原文との比較の例外はこの2ページ/7文に限定する。BB84の確率に関する従来の質問はこの明示的な訂正で解消し、他の保持画像/本文/ネイティブclippingに関する質問は未変更。


## 2026-10-11 量子もつれ / 超密度符号化 (08:30 hard stop)

高宮さんの明示指示により **cphase: #57 待ち / SKIP**。#57 の解決はこの後のページを進める前提ではなくなった。ただし同じ CCPHASE 動作が必要な後続ページも #57 待ちとして SKIP する。今回の4ページは同角度 PHASE の複数配置を使わず、#57 に依存しない。sidebar 順に entanglement → disentangle → entanglement_operation → discriminating_bell_states を移植。

| ページ | 画像置換 | 削除クレジット | 原 palette (embed順) | max-wire-count (embed順) | scroll修正 / 質問 |
| --- | --- | --- | --- | --- | --- |
| entanglement | sidenote の entanglement_circuit.png → 自作の3段階 Bell 回路 / 4状態の対話図。初期化、H、CNOTを選択可能 | なし (元画像に記載なし) | [] | 1 | 3列32px幅と自然高でsidenote内に収める。追加質問なし |
| disentangle | 画像なし。元の7 authored HTML circuitsを原JSONのままinteractive embed化 | なし | [] ×7 | 1 ×7 | 元の流れ・3 sidenotes・4 circlesを維持。追加質問なし |
| entanglement_operation | 画像なし。28 circles、1 sidenote、2表、元PHASE/Z/X/Y図と矢印を維持 | なし | [] ×3 | 1 ×3 | static PHASE図はRegular。本文ゲート名は原文の文字のまま。追加質問なし |
| discriminating_bell_states | drone_field_abcd.png → 自作4区画対話SVG (A/B/C/Dと00/01/10/11、なし/Z/X/Yの対応) | なし (元画像に記載なし) | embedなし | embedなし | minmax(0,1fr)の2×2自然サイズ図。追加質問なし |

各 max は元の `apps/tutorial/<slug>.html` の `data-max-wire-count` を個別照合した。今回すべてdirect HTMLの1であり、mini_qni-filterの2やdecrement_circuitの4を一括適用していない。max1で元の2-wire回路を切り詰めない。palette の原文指定は全11回路でなしなので []。旧Qni UI画像は今回の4ページにはなく、既存の保留質問・保持画像・creditsは変更しない。prose glyphは既存Bold判定を継続し、data-original-image内とstatic diagram / native labelsはRegular。

原文で実行ボタンを含むentanglementのembedにのみ、右下のoptional `run-button` を追加した。同期 `circuitJSON()` で現在の編集済み回路を得て、既存のdestroy/start queueを用いてGPU-onlyで再起動する。既存embedはattributeなしでボタン非表示。mock testで再実行・current JSON・同時live runner=1・attribute removal時に再起動しないことを確認。実GPUでも390/1440、DPR1/2で各3回再実行し、原回路不変・running・step0/norm1を確認。実行ボタンはcanvas外の既存44px footer内で、native描画を覆わない。上流変更なし、CPU/WebGL fallbackなし。

ローカル原文比較は4ページ×1440/390で本文/TeX diff0、errors0。自作画像の追加図要素はdata-original-image内だけを比較から除外し、元sidenoteのcaptionは比較対象に残す。HTML/shadow DOMの横/縦scrollbar、document横overflowは8ケースとも0。DPR1/2のRegular図ラベルと対話状態を確認。全11 embed×2幅=22起動はrunning、step0/norm1。最終GPU確率も7個のdisentangle回路、X/Z/X+PHASEの3個のBell測定、entanglementの00/11相関を確認済み。ネイティブ内部clipは許可された範囲なのでSTOP・問題項目にしない。

### 次ページでSTOP: superdense_coding_circuit / #59

原回路は `{"cols":[...],"title":"Superdense Coding"}`。この完全なJSONを実GPU embedに渡すと `invalid circuit JSON` で起動エラー。最小の `{"cols":[["|0>"]],"title":"Superdense Coding"}` もerror、titleなしだけ同じGPUでrunning。上流parserはcols直後に `}` を要求するためtitleを受理しない。**[qni-webgpu #59](https://github.com/qniapp/qni-webgpu/issues/59)**、[superdense-blocker.md](superdense-blocker.md)、[再現画面](images/superdense-title.png) に記録。

これは#57ではない上流変更が必要な停止条件。title削除・JSON書換えの回避策は公開せず、ページ/TOC/fixtureは除外、draftは `/tmp/qtw-blocked-superdense/` に保持。teleportation以降には進まない。公開commit/Pagesと公開検証は次のcheckpointに記録する。


### 08:27 公開検証完了 checkpoint

公開commit **4db9d0065a2afb6d317fd694ccc3f08ea31b4f3a**、Pages **38094755071 success**。build/typecheck/diff-check成功、保留superdenseを除いた最終 **221 tests passed (3.9m)**。通常fetch/rebase/push、author Yasuhito Takamiya、force-pushなし。

公開の新4ページ×390/1440は本文/TeXの原文比較diff0、errors0。公開DPR1/2 (16ケース) のRegular図ラベル、4区画の対応、Bell図の3状態、実行ボタン12回のGPU再起動とstep0/norm1・原JSON不変も確認。テストで追加したmock再実行は編集済みJSONの保持も確認している。画像置換2件以外の原文・sidenotes・表・circle amplitudes・原回路は変更しない。

公開全 **35ページ×390/1440=70ケース、0 failures**。本文/shadow DOM内の横/縦scrollbar、document横overflow、console/page errorsはすべて0。全 **41 embed×2幅=82起動**でrunning / step0 / norm1 / 原max-wire-count属性を確認。統合資料は `/tmp/qtw-scroll-bell-public.json`、`/tmp/qtw-bell-public-audit.log`。新ページ比較は `/tmp/qtw-port-{entanglement,disentangle,entanglement_operation,discriminating_bell_states}.json`、図/再実行は `/tmp/qtw-bell-glyphs.json`、最終11 GPU結果は `/tmp/qtw-bell-behavior.json`。

今後の再開点は superdense_coding_circuit の **#59 待ち**。cphase は高宮さん指示の **#57 待ち / SKIP** を継続する。今セッションのowned 4339 previewと全検証browserは終了した。


## 2026-10-11 PR #58 circuit-block padding (08:47 hard stop)

高宮さん指定の **[qni-webgpu PR #58](https://github.com/qniapp/qni-webgpu/pull/58)** により、`qni-webgpu.ref` を **958ee0d1a188701ca8ab2069d16868995564f38c** に更新。移植はやり直さず、本文・原JSON・palette・max-wire-count・glyph・画像置換・credits・ページ構造は変更していない。cphaseは#57待ち、superdense_coding_circuitは#59待ちのまま。

clean detached `/home/yasuhito/Work/qni-webgpu-worktrees/verify/tutorial-block-padding` の指定refから `scripts/fetch-qni-webgpu.sh` でembedとstandaloneを実際に再buildし、その後Astro build。Binaryen123 / -Oz / bulk-memory / nontrapping-float-to-intを維持。GPU-only、CPU/WebGL fallbackなし。build/typecheck/diff-check成功、**221 tests passed (4.1m)**。

実 Chromium / AMD WebGPUで全 **35ページ×390/1440=70ケース、0 failures**。HTML/shadow DOM内の横/縦scrollbar、document横overflow、console/page errorsは0。全 **41 embed×2幅=82起動** はrunning、step0/norm1、原max属性を維持。資料: `/tmp/qtw-scroll-pr58-local.json`、`/tmp/qtw-pr58-local-audit.log`。

indexとbb84_circuitを両幅で目視。PRの32px block padding、2px rule、24px label band、28px label line-height、58px circuit shiftの描画を確認。上/下のlabelとruleの間隔、およびstate panelとの分離を確認した。native内部clip/panは許可された範囲であり、問題・STOP理由にはしない。スクリーンショットとstep0確認: `/tmp/qtw-pr58-{before,local}-blocks.json`。

| ページ・幅 | 更新前公開 | 更新後ローカル |
| --- | --- | --- |
| index 390 | [before](images/pr58-before-index-390.png) | [PR58](images/pr58-local-index-390.png) |
| index 1440 | [before](images/pr58-before-index-1440.png) | [PR58](images/pr58-local-index-1440.png) |
| bb84_circuit 390 | [before](images/pr58-before-bb84_circuit-390.png) | [PR58](images/pr58-local-bb84_circuit-390.png) |
| bb84_circuit 1440 | [before](images/pr58-before-bb84_circuit-1440.png) | [PR58](images/pr58-local-bb84_circuit-1440.png) |

公開後に同じ全ページ監査と4スクリーンショットを再確認し、commit/Pagesを次のcheckpointに記録する。


### PR58 08:41 公開 checkpoint

公開commit **0d90c985225eb71938f42dade6687c0066b8c974**、Pages **38095623411 success**。公開全35移行ページの70ケース、41 embedの82起動を再確認し、HTML/shadow DOM内の横/縦scrollbar、document横overflow、console/page errors=0、running / step0 / norm1。palette/max属性は元のまま。本文・原回路・画像置換・creditsは変更なし。

ナビゲーション外の multi-1 / multi-3 / multi-7 / stress-qubit-circle も390/1440で確認した。追加8ケースのscroll/errors=0、11追加embed×2幅=22起動はrunning / step0 / norm1。これらのstep0は原first-columnのH/X/Yに応じたGPU確率と照合 (H等は0/1の各0.5、X/Yは1)。合計 **全39 builtページ・78ケース、全52 embed・104起動**。追加のローカル/公開比較も成功。資料は `/tmp/qtw-scroll-pr58-public.json`、`/tmp/qtw-pr58-public-audit.log`、`/tmp/qtw-pr58-extra-{local,public}.json`。

公開index / bb84_circuitの390/1440を目視し、ローカル新pinと同じ余白・label/rule・state panel配置を確認。画像とstep0資料: `/tmp/qtw-pr58-public-blocks.json`。

| ページ | 公開390 | 公開1440 |
| --- | --- | --- |
| index | [画像](images/pr58-public-index-390.png) | [画像](images/pr58-public-index-1440.png) |
| bb84_circuit | [画像](images/pr58-public-bb84_circuit-390.png) | [画像](images/pr58-public-bb84_circuit-1440.png) |

新たな本文scroll修正・質問・上流変更なし。#57/#59保留ページの移植は再開していない。owned preview 4340と検証browserを終了し、08:47より前に終了する。
