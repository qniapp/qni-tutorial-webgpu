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

## 15. MEASUREMENT 命令 (`measurement_operation`) - 移植・公開確認待ち

本文、14 qubit-circle、ket、Orbit8・注釈2を維持。原文のtransition/branch-arrow SVGをそのまま使い、measurement-gateは元タグの軽量native glyph。旧simulatorは同じ `{"cols":[["|0>"],["H"],["Measure"]]}` のnative editable embedへ置換。元図は最初からcustom elementsなのでPNG置換なし。旧UI差: inspector/run-circuit-button/circle-notation配置はnative toolbar/state windowとは異なる。本文の「原理的に予測できない乱数」は物理量子測定の説明であり、ブラウザシミュレータは物理乱数源ではないが、忠実移植のため本文は変更しない。後で説明を更新してよいか質問として残す。

typecheck/build成功。全体test runは工具35s timeoutで29件まで成功して中断 (テスト失敗ではない)。owned orphan previewを停止し、measurementの両幅2/2 targeted testsを再実行成功。既存36/36 regressionsはX/PHASEで成功。公開比較を追記する。新規ページはこれで終了し、次はno_cloning_theorem。
