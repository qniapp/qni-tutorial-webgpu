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


## 2026-10-11 テレポーテーション系列 (09:14 hard stop)

高宮さん指示で **cphase: #57 待ち / SKIP**、**superdense_coding_circuit: #59 待ち / SKIP**。#57/#59の修正をこの後のページに進む前提から外し、sidebarの次のteleportation_circuitから再開。同角度複数PHASEによるCCPHASEが必要な後続ページは引き続き#57待ちでSKIPする。今回の3ページはいずれにも依存しない。pinはPR58の958ee0d1a188701ca8ab2069d16868995564f38cを維持し、上流変更なし。

| ページ | 置換 | 削除credits | palette (embed順) | max-wire-count (embed順) | scroll対応 / 質問 |
| --- | --- | --- | --- | --- | --- |
| teleportation_circuit | 画像なし。原7 HTML circuits、原ket4をそのままinteractive embed / 既存Ketに移行 | なし | [] ×7 | 1 ×7 | 元のoverflow-scroll/p-8 editor shellを固定サイズnative embedへ。追加質問なし |
| cascading_teleportation | 画像なし。原HTML circuit、原display/inline TeXを維持 | なし | [] | 1 | 同上。長い日本語arrow式も自然表示、追加scroll修正なし。質問なし |
| long_distance_entanglement | 画像なし。原HTML circuit、原display TeXとket4を維持 | なし | [] | 1 | 同上。challengeのqniapp.netリンクは原文のまま保持 (旧UI画像なし)。質問なし |

各原HTMLのdata-max-wire-countを個別確認して全9個とも1。mini_qni-filterの2を流用せず、元の3/5/4-wireをmax1で切り詰めない。palette指定は9個ともなく[]。旧Qni UI画像・画像creditsは原文に存在しない。原7+1+1 JSON、block名、Bloch、Measure、classical control X/Z、P(π/4)/Tを保持。元にrun_circuit_buttonがあるteleportationの後6個、cascading、long_distanceには既存optional GPU-only再実行ボタンを付ける。prose gateは原文の文字表記で、原inline SVG gateは今回なし。既存Bold/Regular contextは維持。

ローカル各ページ390/1440で本文/TeX diff0、errors0。本文/shadow DOM内の横/縦scrollbar、document横overflowは6ケースとも0。原overflow-scroll wrapperを残さず、native内部clip/panは許容範囲として問題項目にしない。新9 embed×2幅=18起動はrunning、step0/norm1。build/typecheck/diff-check成功、最終 **233 tests passed (4.3m)**。

startupだけでなく原アルゴリズムの最終GPU状態も32試行で照合した。未訂正のbit反転は2番目の測定値と一致、Xだけの訂正後の位相反転は1番目の測定値と一致。X/Z訂正後は0、+、H-P(π/4)-Hの元状態をAliceに復元。2段teleportationも同じ複素状態をCarolへ復元し、long-distanceではbit1/4の一致だけでなくBellのcoherenceも確認した。fidelity≈1、norm≈1、32/32成功。standalone readbackはstate panelが描画される実利用サイズ1440×1100で実施した (小さい720pxの検証viewportではpanel未描画によるreadback未readyになったため、テスト設定を修正。native/本文は変更していない)。資料: `/tmp/qtw-teleport-behavior.{mjs,json,log}`。

### 次ページでSTOP: increment_circuit / 原JSON訂正待ち

最後の6番目の原JSONに `["1"]` がある。nativeではそのembedだけinvalid circuit JSON、原サイトでも `Unknown operation: 1` のpageerror。これは元JSON自体の誤記であり、最小 `["1"]` はerror、数値 `[1]` は同じGPUでrunning。**高宮さんに `["1"]` → `[1]` の訂正許可を質問して待つ**。原JSONを黙って書換えず、qni-webgpuを未知gateを受理する方向にも変更していない。[increment-blocker.md](increment-blocker.md)、[実画面](images/increment-string-one-error.png)に記録。

incrementおよび後続decrementはroute/TOC/fixturesに含めず未公開。draftは `/tmp/qtw-blocked-arithmetic/`。decrementの6 authored図=4、後のHTML embed=1は個別確認済みだが、incrementでSTOPしたので公開しない。先行テレポーテーション3ページだけを公開検証してcheckpointする。


### 09:08 公開 checkpoint / 原JSON訂正許可待ち

公開commit **e770f9acb22b82091897158a139b0735d905dd25**、Pages **38097100440 success**。新3ページの公開390/1440原文比較は本文/TeX diff0、errors0。公開DPR1/2 (12ケース) の原ket/矢印式とnative Regular glyphを確認。画像/creditsの削除なし。palette/max属性は全9 embedで[]/1の原指定を維持。

公開全 **38移行ページ×390/1440=76ケース、0 failures**、全 **50 embed×2幅=100起動** がrunning / step0 / norm1。HTML/shadow DOMの横/縦本文scrollbar、document横overflow、console/page errors=0。ナビゲーション外のmulti-1/3/7とstressページも8ケース、22起動で同じ確認を再実施し、合計 **全42 builtページ / 84ケース、全61 embed / 122起動**。資料: `/tmp/qtw-scroll-teleport-public.json`、`/tmp/qtw-teleport-public-audit.log`、`/tmp/qtw-pr58-extra-teleport-public.json`。3ページの原文比較は `/tmp/qtw-port-{teleportation_circuit,cascading_teleportation,long_distance_entanglement}.json`、DPRとnative画像は `/tmp/qtw-teleport-{glyphs,native}-*.png` と `/tmp/qtw-teleport-glyphs.json`。

高宮さんへの未回答質問は **incrementの最後の原 `["1"]` を `[1]` に訂正してよいか**。許可までincrement/decrement以降は停止する。cphase #57待ち / superdense_coding_circuit #59待ちのSKIPは継続。原JSONの書換えや上流変更は行わない。owned preview 4342 / 全検証browserを停止し、09:14前に終了する。


## 2026-10-11 PR #60 / CPHASE復帰 (09:45 hard stop)

**現在: cphaseは#57解決、SKIP解除、公開対象に復帰。** 上記の#57待ち・STOP記述は過去のcheckpoint。superdense_coding_circuitは#59待ち / SKIPのまま。increment/decrementは訂正許可待ちとして触らず、route/fixture/TOCにも含めない。

`qni-webgpu.ref` をPR #60 merge **64b7bb5de1eaecdfcc221bfabe0ed14ffe53ca28** に更新。clean detached source `/home/yasuhito/Work/qni-webgpu-worktrees/verify/tutorial-cphase` を作り、`scripts/fetch-qni-webgpu.sh` で **embed + standaloneを実際に再ビルド** (Binaryen123、GPU-only)。その後Astro build/typecheck/diff-checkを実施した。上流コード変更、CPU/WebGL fallback、native scalingなし。既存ページの本文/JSON/palette/max/glyph/creditsは変更していない。

### cphaseページ報告

- 原文/TeXを保持。原4 HTML circuitsのJSON、17 circuit-step / 36 dropzones / 17 PHASE / 17 controlの等価図、32 qubit-circle、12本文ketを維持。本文の改変で等価性を回避していない。
- image `phase_bit3_ket_pair.png` だけを既存自作 **interactive KetPairs(bit3, PHASE)** に置換。原4色・ペア0/4,1/5,2/6,3/7・8ket・PHASE矢印を維持し、click/keyboardでペア選択可能。原文側にこの画像のcreditはないため、**削除creditsなし**。旧Qni UI画像もないので追加質問なし。
- 元paletteを個別確認して **[[], [], ["P(π/4)","•"], ["P(π)","Z","•"]]**。元data-max-wire-countは全4個 **1**。mini_qni-filterの2を流用せず、原3-wire回路をmax1で切り詰めない。
- proseの原小gate glyphは今回なく、17 PHASE/control等価図はRegular、既存のprose Bold contextを維持。390/1440・DPR1/2でglyph/ket/interactive図を目視・選択確認した。
- 原editorのoverflow-scroll shellは除去。8-circleは既存4列の自然なresponsive配置、CZ等価図は上/下のπラベルが切れないよう **padding-block:16px**。本文/shadow DOMの横/縦inner scrollbar、document横overflowなし。native内clip/panは許可された範囲であり問題項目にしない。
- original/live390/1440の本文/本文TeX diff0、errors0。画像1→0、replacement内MathJax8個追加だけが意図的な図差。原図外のstep/dropzone/gate/circle数は一致。

### 実GPUの意味検証

390/1440各幅で元4回路と8変形をstandaloneへ読み込み、最後のGPU state vectorを原文の期待複素振幅と直接照合: **24/24成功**。ページ上の4 embedと5ハンズオン変形でも、実native gateへpointerを移して最終stepを選び、各elementのreadStateVectorで **18/18成功**。幅/有paletteによるnative geometry差は検証側のpointer座標で扱い、製品を縮小・改造していない。両方ともnorm≈1、console/page errors0。

- 単独PHASE: 状態4/5/6/7のみπ/4回転。
- control+PHASE、control/target交換、2同角PHASE: 状態5/7のみπ/4回転。
- 2control+PHASE、3同角PHASE: **状態7だけ0.25+0.25i、状態0-6はsqrt(1/8)+0i**。位相を3回ではなく1回だけ適用してCCPHASEと等価。
- CZ: control+P(π)、交換表記、2P(π)、control+Z、controlのみで、状態5/7だけ符号反転して同じvector。

独立な参照としてqni CLIの3H + P(π/4) control0,1 target2もrun --latexで確認し、111のみ(1+i)/4、他7状態sqrt(2)/4だった。GPU検証資料: `/tmp/qtw-pr60-{local,public}-behavior.json` / `-embed-behavior.json` と同prefixのscript/log。解決前の実画面は [cphase-blocker.md](cphase-blocker.md) に歴史として保持し、現在の状態を解決に更新。

### ローカル回帰と公開確認

最終 **237 tests passed (4.0m)**、build/typecheck/diff-check成功。ローカル全39移行ページ×2幅=78ケース / 全54 embed×2=108起動でrunning/step0/norm1、errors0、本文/shadow DOM inner scrollbars0。CPHASEの16px上padding後も2幅で再確認。原頁比較 `/tmp/qtw-port-cphase.json`、回帰 `/tmp/qtw-scroll-pr60-local.json`、tests `/tmp/qtw-pr60-final-tests.log`、native build `/tmp/qtw-pr60-native-build.log`。公開結果とcommit/Pagesは次のcheckpointに追記する。


### 09:41 公開 checkpoint / #57解決

公開 **b6f96be79f32b26408dc72e044e38041f494277f**、Pages **38098985963 success**。公開CPHASE 390/1440の本文/本文TeX diff0、errors0、原図外のgate/step/circle counts一致、palette/maxを保持。DPR1/2でRegular等価図・12本文ket・自作4ペア選択・上下πラベルを確認。旧Qni UI画像/追加質問/削除creditsなし。

公開standalone **24/24**、公開ページ内embed **18/18** の複素GPU vector照合に成功。CCPHASE=同角3PHASEは状態7だけπ/4回転、2PHASE=CPHASEの対称性、単独PHASE、CZ各表記も本文どおり。実画面 [390](images/pr60-three-phases-390.png) / [1440](images/pr60-three-phases-1440.png)、詳細 `/tmp/qtw-pr60-public-{behavior,embed-behavior}.json`。

公開全 **39移行ページ / 78ケース、54 embed / 108起動** はrunning/step0/norm1、console/page errors0、HTML/shadow DOM内の横/縦scrollbar0、document横overflow0。multi-1/3/7/stressの4ページも両幅で追加確認し、8ケース / 22起動で同じ結果。合計 **全43 builtページ / 86ケース、全65 embed / 130起動**。回帰 `/tmp/qtw-scroll-pr60-public.json`、追加 `/tmp/qtw-pr58-extra-pr60-public.json`、原文比較 `/tmp/qtw-port-cphase.json`、DPR `/tmp/qtw-cphase-public-glyphs.json`。native canvasのclip/panは許容範囲。

**cphaseは#57待ちではなく、解決・公開済み。** superdense #59待ち / SKIP、increment/decrement原JSON訂正許可待ちは維持し未変更。owned preview 4343と検証browserを終了。09:45 hard stopを守り、docs-only Pagesの最終状態は終了時に報告する。


## 2026-10-11 算術演算再開 / 許可されたincrement訂正 (10:22 hard stop)

CPHASEは前セッションで公開/GPU検証完了。docs-only checkpoint 43abeb3 / Pages **38099314664 success**も確認したので、移植や検証をやり直していない。pin **64b7bb5de1eaecdfcc221bfabe0ed14ffe53ca28** 維持。

高宮さんが **increment_circuitの第6回路末尾だけ `["1"]` → `[1]` をAPPROVED**。その1トークンだけを訂正し、他の原JSON、本文、測定、block、gate、paletteは変えない。raw original fixtureの文字列1は残し、`tests/increment-correction.spec.ts` で逆訂正すると原6回路と完全一致することを確認。他の原文訂正への一般的な許可には拡張しない。[increment-blocker.md](increment-blocker.md) の現在状態を解決に更新。

### increment_circuit

元draft `/tmp/qtw-blocked-arithmetic/` を復帰し、原6 circuits、原proseのX/H/control glyph、説明と段階を保持。画像なし、削除creditsなし、旧Qni UI画像/追加質問なし。paletteを個別確認して **[[],[],["X"],["X","H"],["X","H"],["X","H"]]**、max-wire-countは **1×6**。max1でも元4-wireを切り詰めない。原editorのoverflow-scroll shellを除去し、390/1440本文/shadow DOMの横/縦inner scrollbar、document横overflowは0。prose glyphは共通Bold、native labelsはRegular。

original/live390/1440の本文/TeX diff0、native errors0。原サイトの6番目だけUnknown operation:1は許可された訂正対象であり、移行後は6個すべてrunning。12起動でstep0/norm1、修正した末尾も受理される。原図/本文のその他の差はない。対象tests9件と訂正guard1件、build/typecheck/diff-check成功。

最終GPU状態も13試行で確認: 0→1、1→2、4-wire入力1→2、1/5の重ね合わせ→2/6の重ね合わせ (各1/2)、最後の測定8試行は2または6のみ。13/13成功、norm≈1。資料 `/tmp/qtw-inc-local-behavior.json`、`/tmp/qtw-inc-local-new.log`、`/tmp/qtw-port-increment_circuit.json`、`/tmp/qtw-scroll-inc-local.json`。まずincrementを公開し、その後sidebar順のdecrementから進む。


### increment公開 / Pages成功

内容 **d38338f487ae232f375e86f02030b4252f55b060**。最初のPages38099749423は新しい訂正guardのNode型importでtypecheck失敗し、未公開だった。依存を増やさず、guardを実際のpage DOM取得へ変更した **167aaa9f4290d4e532db5d13e808b41061fb9b92** / **Pages38100067128 success** で公開済み。修正後typecheck成功、実DOM訂正guardも1/1成功。原JSON訂正や製品コードの追加変更なし。

### decrement_circuit

sidebar順で復帰。原7 JSON/本文/TeXを無訂正で保持。原図6個のmax-wire-countを **4×6**、後のHTML embedは **1**、paletteは **[]×7**。画像/削除credits/旧Qni画像/追加質問なし。元の4-wireを保持。最後のGPU状態は、最初のincrement図が入力1→2、途中のXキャンセル/相殺4図が状態0、逆increment図が0→15 (4-bit wraparound)、最後の原HTML例が1/5→0/4 (各1/2)。原7回路すべて最終状態とnorm≈1を確認。

### addition_circuit

原3 JSON/本文/TeXを保持。palette **[]×3**、max **1×3**、7-wireを切り詰めない。画像/削除credits/追加質問なし。最初の2例のGPU出力は52/56各1/2、a=4/8でb=3不変。最後は35/39/103/107各1/4、低4bitのa=3/7/7/11、b=2/6との相関も保持。

### subtraction_circuit

原2 JSON/本文/TeX/補数表を保持。palette **[]×2**、max **1×2**、7-wireを保持。画像/削除credits/追加質問なし。GPU第1例34/36/49/51各1/4 (a=1/2/3/4)、第2例78/79/93/94各1/4、低4bit13/14/15=-3/-2/-1の確率1/4,1/2,1/4。両方とも上位入力を保持。

### multiplication_circuit

原1 JSON/本文/TeX/筆算・uncomputationの説明を保持。元の角括弧block開始とbrace終端も書き換えない。palette **[]**、max **1**、元10-wireを保持。画像/削除credits/追加質問なし。GPU出力状態110のみ、a=2/b=3/m=6/tmp=0、norm1。nativeの10-wire canvas clip/panは許容し、scaleやupstream修正はしていない。

4ページのoriginal/live390/1440は本文/TeX diff0、原circuits/counts保持、native errors0。26起動step0/norm1、本文/shadow DOMの横/縦scrollbar/document横overflow0。nativeだけの固定canvas clipは許容。本文glyphは共通Bold、diagram/nativeはRegular。原overflow-scroll editor shellを既存native frameに置換、余分なscrollfixなし。build/typecheck/diff-check成功、全 **258 tests (4.5m)** 成功。最終GPU状態は原13回路すべて照合成功。資料 `/tmp/qtw-arithmetic-source-probe.json`、`/tmp/qtw-arithmetic-{local-live,local-new,local-scroll,all-tests}.log`、`/tmp/qtw-port-<slug>.json`。公開後確認を追記する。


### 算術4ページ公開 / quantum_logic

算術4ページ **6de5af88ba96b96fc1e0558532d5003a0badb860 / Pages38100417794 success**。公開390/1440 original比較の本文/TeX diff0、8ケースscroll/errors0を確認。incrementも公開本文比較passed、公開最終GPU13/13成功。

次の **quantum_logic** をsidebar順に移植。原7 mini_qniは正式pluginの `json.gsub!(/[\r\n]/, ' ')` を忠実に適用 (block labelの改行を空白へ、勝手な訂正ではない)。それに原HTML authored NOR図1個を加え、原DOM順の計8 JSON/本文/ket2/真理値表を保持。mini paletteは **["|0>","|1>"]×7**、原NOR図は **[]**。原DOM順のmaxは **[2,2,2,2,2,2,1,2]**。元3-wireを上限2でも切り詰めない。画像/削除credits/旧Qni画像/このページの追加質問なし。原calloutのmy-0/px-4/!w-full/!pb-0もCSSへ反映して原間隔を保持。

390/1440のoriginal/live本文/TeX diff0、16起動running/step0/norm1、native errors0、本文/shadow DOM横/縦scrollbar/document横overflow0。実GPU truth-table **30/30**: NOTの2入力、AND/XOR/NAND/OR/OR分解/NOR2表記の4入力ずつ。論理出力が一致し、XOR対象以外の入力と、ORのuncomputation後のa,bも保持。全 **262 tests (2.4m)** 成功、最終CSS後の対象tests/typecheck/buildも成功。6新ページの390/1440 DPR1/2 **24ケース** でprose glyph Bold/16px、native Regular、表示を確認。

資料 `/tmp/qtw-logic-local-behavior.json`、`/tmp/qtw-logic-{local-live,local-new,local-scroll,all-tests,final-tests}.log`、`/tmp/qtw-arithmetic-glyphs.json`。公開後確認を追記する。

### 次ページ superposition_quantum_logicでSTOP

原26-column/5-wire circuitは正常に動くが、原文の式・脚注・真理値表・入力組・d/e説明と一致しない。原回路は `(a OR NOT b) AND c`、e=1の低3bitは4/5/7。脚注の `a || !b && c` は別の述語になり、入力(1,0,0)で違いを実GPU再現した。高宮さんへ原JSONを維持して説明だけ訂正する許可を質問。詳細 [superposition-logic-blocker.md](superposition-logic-blocker.md)。このページと後続はroute/fixtureを作らず未公開。第6incrementの訂正許可を他の訂正に拡張していない。#59待ち/SKIPも維持。


### 10:15 公開最終checkpoint

**quantum_logic公開 f184067ef8b78a5dc72dfdf4f61fdcf619d4dc54 / Pages38100883089 success**。新6ページすべて公開original/live390/1440比較がpassed、本文/TeX diff0。許可されたincrement末尾以外の原JSON訂正なし、画像/削除creditsなし。

公開最終GPU確認: increment **13/13**、decrement〜multiplicationの原13回路 **13/13**、quantum_logic truth-table **30/30**。合計 **56/56** 成功、norm≈1。本文記載の値・負数表現・入力保存・tmp=0を確認。資料 `/tmp/qtw-{inc,arithmetic,logic}-public-behavior.json`。

local/public全 **45移行ページ / 90ケース、81 embed / 162起動** はrunning/step0/norm1、console/page errors0、HTML/shadow DOM横/縦inner scrollbar0、document横overflow0。decrementの原図5番目(0-based index5)はWRITEなしで最初のXがstep0に実行されるので、step0を常にbasis0とする旧audit仮定だけ修正し、状態1を検証した。製品変更ではない。最終状態15も別GPU照合済み。資料 `/tmp/qtw-scroll-arithmetic-final-{local,public}.json`。

公開multi-1/3/7/stressも8ケース / 22起動でerrors/scroll0、running/step0/norm1。合計 **全49 builtページ / 98ケース、全92 embed / 184起動**。資料 `/tmp/qtw-pr58-extra-arithmetic-final-public.json`。公開DPR1/2の新6ページ24ケースもprose Bold/16px、native Regular確認。`/tmp/qtw-arithmetic-glyphs.json`、`/tmp/qtw-arithmetic-public-glyphs.log`。

**STOP位置はsuperposition_quantum_logic、原説明の訂正許可待ち。** 論理式のgrouping・脚注・入力組・真理値表・d/eの説明を回路に合わせてよいか、高宮さんへ質問した。原回路や後続を無断変更/公開していない。CPHASEは完了済み、#59は待ち/SKIP維持。owned preview4344/検証browserは終了。main/worktreeを通常pushで同期し、最終docs-only Pages状態は終了時に報告する。


## 2026-10-11 PR #61 / title付き超密度符号化回路 (10:50 hard stop)

前checkpoint **0e12a87aae8be2aecb9409e7242cd91dd95e12ce / Pages38101253147 success** を確認。incrementの承認済み1トークン訂正、decrementの4×6/HTML1、足し算・引き算・かけ算・quantum_logicはすべて既に公開済みなので再移植しない。停止位置は `superposition_quantum_logic` の原説明訂正許可待ち。

上流PR #61が **ef652682c23d89427f6f39bb6bee1ec6fae9bb1e** でマージ済みと確認し、`qni-webgpu.ref` を更新。clean detached checkout `verify/tutorial-title` から `scripts/fetch-qni-webgpu.sh` でembed/standaloneの両WASMを実再ビルド。Binaryen **version_123**、`-Oz --enable-bulk-memory --enable-nontrapping-float-to-int`。upstream変更/CPU fallback/本番readbackなし。ログ `/tmp/qtw-pr61-native-build.log`。

### superdense_coding_circuit

保留draftを復帰。**原JSONのroot `"title":"Superdense Coding"` を含む全27列/7-wire回路をそのまま保持**。Bell回路・Swap・名前付きMeasure>bit1/bit2・X<bit1/bit2・送信制御X/Z・Bell測定の構造も未変更。原palette **[]**、max-wire-count **1**、元7-wireを切り詰めない。原の実行ボタンも保持。本文・順序・00/01/10/11の説明を無訂正で移植。画像/削除credits/旧Qni UI画像/このページの追加質問なし。本文に原glyph tagはなく、共通Bold規則を維持、native glyph/labelsはRegular。

390/1440 original/liveは本文/TeX diff0、原JSON・counts一致、errors0。両幅の本文/shadow DOM横/縦inner scrollbar/document横overflow0。ユーザー承認のnative回路内水平panで最後のBell測定blockを表示できることを実際に確認し、canvasをscale/隠すCSSやupstream修正は入れていない。

GPU最終状態 **40/40** 成功 (4送信値を固定する診断8試行、原ランダム生成回路32試行、各390/1440)。最終状態は0/33/66/99だけ、入力q0/q1と受信q5/q6が一致、他のwireは0、norm≈1。固定00/01/10/11すべてを確認。診断のH→X/空への変更はテストのみで製品原JSONには適用しない。独立qni CLIの超密度符号化referenceもseed42/16shotsで4入力すべての送受信一致 (00:4,01:3,10:6,11:3)。

titleは起動・`circuitJSON()`に基づく現在回路リンク・再実行・実ドラッグ編集後も保持。standaloneではdocument titleとURLも **Superdense Coding**。tutorial側のdocument title **超密度符号化回路 | Qni Tutorial** は保持。DPR1/2×390/1440の4ケースで編集・再実行・native pan後を確認。書き換えやtitle削除の回避策は不要になり、**#59待ち/SKIPは解決**。[superdense-blocker.md](superdense-blocker.md) を現在解決＋歴史記録に更新。

build/typecheck/diff-check成功、既存と新ページの全 **266 tests (3.5m)** 成功、追加title-link guard2件も実Chromium/AMD GPUで成功。再ビルド後の全 **46移行ページ / 92ケース、82 embed / 164起動** はrunning/step0/norm1、errors/本文/shadow DOM scrollbar0。CPHASE新parser回帰の最終GPU vector24/24成功、同角3PHASE=CCPHASEを維持。

資料 `/tmp/qtw-pr61-local-{behavior,interactions}.json`、`/tmp/qtw-pr60-pr61-local-behavior.json`、`/tmp/qtw-pr61-title-real-tests.log`、`/tmp/qtw-pr61-local-audit.log`、`/tmp/qtw-scroll-pr61-local.json`、`/tmp/qtw-port-superdense_coding_circuit.json`。検証初期のrelative hrefにbaseを指定しないURL解析とドラッグ座標/待機不足はharnessだけを修正。製品に変更を加えて検証を通したものではない。公開確認は追記する。

### sidebarの続行位置

超密度符号化の後のテレポーテーション3ページと算術5ページ、quantum_logicは完了済み。その次は **superposition_quantum_logicでSTOP**。原JSONは正常だが、本文/脚注のAND優先順、正しい入力組、真理値表、d/e説明が回路と異なる。[superposition-logic-blocker.md](superposition-logic-blocker.md) の訂正許可は今回も明示されていないため、そのページ以降は未公開のまま。許可されたincrement訂正を他の原文訂正へ拡張しない。


### 10:40 公開checkpoint / #59解決

公開 **17c91dc2fd6147ddff0e125289c400898b32000f / Pages38102185647 success**。pin **ef652682c23d89427f6f39bb6bee1ec6fae9bb1e**、両WASM実再ビルド済み。superdenseの原全27列/7-wire/`title`を保持し、palette[]/max1/原実行ボタンもそのまま。本文/TeX diff0、原JSON/counts一致、画像/削除credits/追加画像質問なし。390/1440本文scroll/errors0、Bell測定blockは承認されたnative水平panで表示。現行の**#59待ち/SKIPを解決**。

公開最終GPU状態はstandalone **40/40**、実ページのnative embed **10/10** で送信q0/q1と受信q5/q6が一致 (00/01/10/11、状態0/33/66/99)、norm≈1。ページ内はnative水平pan後にBell測定列を選択してreadbackしたので、起動/step0だけで動作済みと判断していない。両幅・DPR1/2 **4/4** で原titleが再実行/実ドラッグ編集/現在回路リンクに保持され、standalone document title/URLも原title、tutorial document titleは日本語ページ名のまま。

全 **46移行ページ / 92ケース、82 embed / 164起動** の公開・local監査はrunning/step0/norm1、console/page errors0、body/content/shadow DOM内の横/縦scrollbar/document横overflow0。multi-1/3/7/stressも8ケース/22起動で同じ結果。合計 **全50 builtページ / 100ケース、全93 embed / 186起動**。CPHASEの24最終GPU vector回帰成功、新しいtitle parserでも同角3PHASE=CCPHASEを保持。最終実Chromium/AMD GPU設定で **268 tests (2.6m)** 全成功、typecheck/build/diff-check成功。

資料 `/tmp/qtw-pr61-public-{behavior,embed-behavior,interactions}.json`、`/tmp/qtw-scroll-pr61-{local,public}.json`、`/tmp/qtw-pr58-extra-pr61-{local,public}.json`、`/tmp/qtw-pr61-final-real-tests.log`、`/tmp/qtw-port-superdense_coding_circuit.json`。pan/editのDPR screenshotは `/tmp/qtw-pr61-public-pan-<width>-dpr<dpr>.png`、原回路の最終embedは `/tmp/qtw-pr61-public-embed-final-<width>-<input>.png`。本文は無訂正、metadataを落とす回避策なし。

**停止位置はsuperposition_quantum_logicの原説明訂正許可待ち**。increment/decrement〜quantum_logicを再移植していない。質問は、原JSONを維持し、式/脚注・入力組・真理値表・補助bit d/e説明を原回路 `(a OR NOT b) AND c` に合わせて訂正してよいか。明示承認までこのページ以降は未公開。owned preview4345/取り残された本セッションtest preview4322/検証browserを終了。docs-only Pagesの最終状態は終了時に報告し、10:50 hard stopを守る。


## 2026-10-11 10:50 再開指示 / 文言確定待ちと次ページの停止 (11:20 hard stop)

高宮さんの指示に従い、Firstmateの確認済みの文言が届くまで、次の2ページは未公開を維持する。

| ページ | 状態 |
| --- | --- |
| `superposition_quantum_logic`（重ね合わせ上での論理演算） | **訂正文言承認済み、待機解除** (10:57の追記参照) |
| 直後の `phase_logic`（位相論理演算） | **待機解除**、承認ページ公開後に続行 |

どちらもroute/fixtureを作らず、確定前の文言や回路を公開していない。pin **ef652682c23d89427f6f39bb6bee1ec6fae9bb1e**、公開済みの移植と#57/#59解決は変更しない。

### phase_logic_combination（位相論理演算の組合わせ）: STOP、未公開

上記2ページの後、sidebar順で最初のページ。原文と原JSONをorigin/mainから取得し、公開standaloneの実Chromium/AMD WebGPUで原26列/4-wire JSONを実行した。原回路は **`(a OR NOT b) AND c`**。4/5/7だけ実振幅-0.3535533547401428、0/1/2/3/6は同じ絶対値で正、他の状態/虚部0、norm≈1、起動/page errors0。

本文の文字式 **`a OR (NOT b) AND c`** は通常のAND優先順では `a OR ((NOT b) AND c)`、答は1/3/4/5/7となる。原回路と「4/5/7だけ反転」という結果説明・画像は整合するが、文字式に必要な括弧がない。このページも文言確定対象に含めるかを高宮さんへ質問し、**ここでSTOP**。原本文/原JSONを勝手に訂正したり、後続のsat以降へ進んだりしていない。

画像 `phase_logic_result.png` と `quantum_logic_result.png` は旧Qniの円表示パネル2枚。再開時の自作対話的状態表示への置換方針を質問したが、今回は未置換、**削除credits0**。原paletteなしなので **[]**、原HTML max-wire-count **1** を確認した (4-wireを切り詰めない)。移行ページがないため、移行後の本文diff/390・1440のscroll/step0検証は未実施で、合格とは記録しない。

詳細 [phase-logic-combination-blocker.md](phase-logic-combination-blocker.md)。証拠 `/tmp/qtw-phase-combination-original-gpu.{mjs,json,log}`、原JSON `/tmp/qtw-phase-combination-original.json`。診断用browserは終了済み、serverを新規起動していない。今回の製品変更/公開ページ追加は0、既存ページを再移植していない。docs-only checkpointを通常pushし、Pages結果は終了時に報告する。


## 2026-10-11 10:57承認 / superposition_quantum_logic の訂正と移植 (11:30 hard stop)

高宮さんから確定した6項目の訂正を明示承認。**superposition_quantum_logicの待機解除**、直後のphase_logicも待機解除。今回の承認をphase_logic_combinationへ拡張しない。

| 項目 | 訂正前 → 承認された訂正後 |
| --- | --- |
| 式5か所 | `a OR (NOT b) AND c` → `(a OR (NOT b)) AND c` |
| 脚注コード | `a \|\| !b && c` → `(a \|\| !b) && c` |
| true入力1組 | `(1, 0, 0)` → `(0, 0, 1)`。残り `(1, 0, 1)`, `(1, 1, 1)` は維持 |
| 真理値表の結果見出し | `a OR (NOT b)` → `(a OR (NOT b)) AND c` |
| 真理値表 | 000→0, **001→1**, 010→0, 011→0, 100→0, **101→1**, 110→0, **111→1**。true行の太字を001/101/111にする |
| d/e説明 | NOT/ORの出力をd/eとする説明 →「NOT は b 自身を反転するだけで済みますが、OR と AND 演算にはそれぞれ出力用のビットが必要なので、`a OR (NOT b)` の結果を d (ビット 4), d AND c の結果を e (ビット 5) に出力しています。」 |
| 読み出し文 | 「3 ビットなら答は 8 通り」→「3 ビットなら入力は 8 通り」 |

式を含む実装導入文は式の括弧だけを訂正して維持。uncompute文、ket、**「答は4,5,7」** を維持。承認された箇所以外の本文・順序・TeXを変更していない。原26列/5-wire JSONを**完全にそのまま**保持し、raw fixtureとDOM一致guardで固定。原palette **[]**、原HTML max-wire-count **1**、5-wireを切り詰めず、原に実行ボタンがないので追加しない。

原 `quantum_logic_result.png` は **LogicResultIllustration.astro** の自作対話的32円表示へ置換。状態0,1,2,3,6,20,21,23の振幅1/√8、他は0、原画像と同じ16列×2行。各状態の振幅/12.5%/位相をhover/focusで確認できる。原画像にcredits記載がないため**削除credits0**。画像の外に新しい説明文を足さず、390の狭い円にketが重なった初期表示は置換図内だけのCSSで除き、5-bitのketはpopup/ariaに保持。共通prose Bold/native Regular規則を維持。

実Chromium/AMD WebGPUで、実ページ内のnative回路を水平panして最終列を選択した **18/18** 比較成功 (原uniform状態＋8入力、各390/1440)。e=1は入力4/5/7だけ、dは0へ復帰、a/b/cは保持。原uniformは出力0/1/2/3/6/20/21/23各1/8、norm≈1。H→X/空の8入力診断はtestだけで製品JSONに適用していない。起動時はstep0/norm1、起動/console/page errors0。native水平panを許し、body/shadow DOMの横/縦inner scrollbar/document横overflow0。

original liveのDOMへ承認6項目だけを診断用に適用して比較し、390/1440で**追加本文diff0、TeX diff0、errors0**。原JSON属性は別に完全一致。tests/superposition-logic-corrections.spec.tsは式5か所/脚注/true組/全真理値表/指定d/e説明/uncompute/ketの原TeX比較に加え、承認版の全文normalized textをguard。fixtures/superposition-logic-approved-text.jsonはoriginalを6項目だけ訂正した期待文、raw original JSON fixtureは無変更。

最終 **274 tests (2.4m)** 全成功。置換図の最終CSS後の承認guard2件も再実行成功。typecheck/build/diff-check成功。DPR1/2×390/1440の置換図4ケースで、32円/ket非重複/|10100⟩/12.5%/overflow0を実見確認。検証初期のwide最終列クリックが回路外に出た点とpercent表記12.5000%はharnessだけを修正。

資料 `/tmp/qtw-superlogic-local-{embed-behavior,figure}.json`、`/tmp/qtw-port-superposition_quantum_logic.json`、`/tmp/qtw-scroll-superlogic-local.json`、`/tmp/qtw-superlogic-{all-tests,final-target,final-types,final-build}.log`。pin **ef652682c23d89427f6f39bb6bee1ec6fae9bb1e** 維持、embed/standaloneは前の実再ビルド済みのものを使用し、upstream/CPU fallback/本番readbackを追加していない。公開とlive確認は追記する。


### 11:19 公開確認 / phase_logicで新たな数値ブロッカー

**superposition_quantum_logic公開成功:** `9ea6016cd8ca9c34ab0139607cfdf8ae6316eed8` / **Pages38104392423 success**。390/1440の公開比較で、承認6項目を適用した原文からの**追加本文diff0・TeX diff0・console/page errors0**。原26列/5-wire JSON・palette[]・max1を維持。起動はstep0/norm1、body/content/shadow DOMの横/縦inner scrollbar/document横overflow0。実ページnativeをpanして最終列を選んだ **18/18 GPU比較成功** (原uniform＋8入力、各幅)。e=1は4/5/7だけ、d=0へ復帰、a/b/c保持。DPR1/2×390/1440の置換32円図 **4/4** でpopup振幅/12.5%/5-bit ket・非重複・overflow0確認。置換1画像/削除credits0、原ket・「答は4,5,7」・uncompute文を保持。共通prose Bold/native Regularを維持。

公開資料 `/tmp/qtw-port-superposition_quantum_logic.json` (commit=public)、`/tmp/qtw-superlogic-public-{embed-behavior,figure}.json`、`/tmp/qtw-scroll-superlogic-public.json`、対応ログ。最終274tests/typecheck/build/diff-check成功。本文/脚注の待機は解除済みで、未承認の原文変更を足していない。

公開live確認後、直後の **phase_logic（位相論理演算）** をsidebar順で確認し、新たなSTOP条件を再現。pAND/pOR/pNAND/pNOR/pXORの2-qubit重ね合わせ図5組は入力/出力4状態に±0.70711が入り、各図のnorm **2.0000182084** (約200%)。原pANDのWRITE直後にH×2を置く診断コピーを実GPUで走らせると `[+0.4999999702,+0.4999999702,+0.4999999702,-0.4999999702]`、norm **0.9999998808**。原の符号・論理は合うが、振幅の大きさが約√2違う。

**質問: 5組・40個の図用振幅だけを符号保持で ±0.70711→±0.5 と訂正してよいか？** 1-qubit pNOTの0.70711、原6回路JSON、本文は維持する。許可なしに数値を直さず、phase_logicのroute/fixtureを作っていない。その次のphase_logic_combinationの括弧も未承認のため、このページ以降は未公開。

phase_logicの原paletteは6 mini_qniすべて **["|0>","|1>","H"]**、正式pluginのmax-wire-count **2×6**。原画像amplitude_amplification_overview.pngは既存自作interactiveへの置換候補だが、STOPのため未置換/削除credits0。移行後の本文diff/390・1440のscroll/step0は未実施なので合格と記録しない。文言待機解除とは別の、**図の振幅訂正許可待ち**。[phase-logic-amplitude-blocker.md](phase-logic-amplitude-blocker.md) にoriginal live・GPU証拠と質問を記録し、phase_logic_combinationの歴史記録にも現状を付記した。

owned preview4346と診断browserを終了。今回の追加公開はsuperposition_quantum_logicのみ。docs-only checkpointを通常pushして結果を終了時に報告し、11:30 hard stopを守る。


## 2026-10-11 11:24承認 / phase_logic・phase_logic_combination (11:54 hard stop)

高宮さんが3項目を明示承認: phase_logicの5重ね合わせ図の40振幅だけ **±0.70711→±0.5**、phase_logic_combinationの文字式2か所だけ **a OR (NOT b) AND c→(a OR (NOT b)) AND c**、同ページの旧Qni円表示PNG2枚を自作対話的状態表示へ置換し該当creditsを削除。原本文/原JSONへの他の訂正は承認に含めない。両ブロッカー文書を「解決＋歴史記録」へ更新。

### phase_logic（位相論理演算）

5図・40振幅だけ訂正し、1-qubit pNOTの0.70711/本文/TeX/原6回路JSON/212 authored circles/2sidenotesを維持。raw fixtureの元振幅を保持し、40のindex whitelistと逆変換guardで他の振幅を無変更と確認。6 mini_qniの原palette **["|0>","|1>","H"]×6**、正式pluginのmax-wire-count **2×6**。pXORの原3-wireを切り詰めず、他は1/2-wireを維持。元のrun-buttonなしを維持。

amplitude_amplification_overview.png→既存の自作 **AmplificationIllustration** (クリック/Enter/Spaceで対象をマークする) に置換。原にcredits文なし、**削除credits0**、旧Qni editor画像なし。既存置換図の意図しない狭いket重なりは図内pseudo-labelを非表示にし、状態情報はpopup/ariaに保持。28静的circle図だけ既存fit-contentで幅を合わせ、native canvasはscaleせず水平panを維持。proseのX/PHASE/MEASURE/CONTROL glyphはBold、静的図/labels/nativeはRegular。

GPU最終vector **56/56** 成功 (各390/1440、pNOTの2basis+uniform、pAND/pOR/pNAND/pNOR/pXORの4basis+uniform)。位相反転はpNOT:0、pAND:3、pOR:1/2/3、pNAND:0/1/2、pNOR:0、pXOR:1/2。pXOR補助wireは0へ復帰。uniform振幅は1-wire約±1/√2、2-wire約±0.5で正規化、訂正図と一致。診断の入力H/X追加はtestのみ、製品JSONに追加しない。

### phase_logic_combination（位相論理演算の組合わせ）

文字式の承認された括弧だけ2か所訂正。他の本文/TeX/原26列・4-wire JSONは維持。原palette **[]**、原HTML max-wire-count **1**、4-wireを切り詰めず、原run-buttonなしを維持。

phase_logic_result.png→**LogicResultIllustration(states0〜7,negative4/5/7,wireCount4)**、quantum_logic_result.png→同componentの元5-wire結果 **0/1/2/3/6/20/21/23**。原と同じ2行構成、4-wireは8列×2、5-wireは16列×2。hover/focusで振幅/確率/位相/bit ketを確認できる。画像以外に新しい説明文を足さず、原に画像credits文なしなので **削除credits0**。承認外のcreditsは削除していない。

実ページのnativeをpanして最終列を選択し **18/18 GPU比較** 成功 (原uniform＋8入力、各幅)。state4/5/7だけ負、他0/1/2/3/6は正、各1/√8。dは0へuncomputeされ、a/b/c保持。固定basisの符号も正しく、norm≈1。元のBoolean5-wire結果との比較図も前ページで検証済みの結果を保持。

### 共通確認

390/1440で本文/TeXは**承認2括弧以外diff0**、原JSON/counts一致、console/page errors0。起動step0/norm1、body/content/shadow DOM横/縦inner scrollbar/document横overflow0、native内部panは可。DPR1/2×390/1440の8ケースでprose Bold/図Regular・errors/overflow0、狭幅の元円図と置換図を実見確認。

全 **282 tests (2.9m)** 成功。最終図CSS後の4 approved全文/40振幅逆変換guard＋4原構造guard **8/8** 成功、typecheck/build/diff-check成功。初回guardがfont/ResizeObserverによる静的fit完了前の幅を測った点は、fonts.ready＋実幅pollを待つ検証へ修正し、不安定なsleepやnative clipping変更で回避していない。

資料 `/tmp/qtw-phase-two-local-{behavior,glyphs}.json`、`/tmp/qtw-phase-combination-local-embed-behavior.json`、`/tmp/qtw-port-{phase_logic,phase_logic_combination}.json`、`/tmp/qtw-scroll-phase-two-local.json`、`/tmp/qtw-phase-two-{all-tests,final-target-fixed,final-types,final-build}.log`。originalを承認どおりにtest-only DOM変更して全文比較し、期待全文を2 approved-text fixturesに固定。文字式以外の本文変更を許容しない。pin **ef652682c23d89427f6f39bb6bee1ec6fae9bb1e** 維持、GPU-only、Binaryen123、upstream/CPU fallback/本番readbackなし。公開live確認後にsidebar直後のsatへ進む。


### 11:43 公開checkpoint / satのCond2でSTOP

**phase_logic・phase_logic_combination公開成功**: `91efaaccc66ccbf5eefff51a864cfd512feeef0a` / **Pages38105712568 success**。3項目の承認のみを適用し、原本文はphaseでは全文無変更、combinationは括弧2か所以外無変更。6＋1原JSONを完全に維持。phaseの40振幅以外は212元円のamplitude/ket/sizeを保持、1-qubit pNOTの0.70711も保持。原ket/TeX/sidenotes/順序を保持し、paletteはphase=[WRITE0,WRITE1,H]×6/max2×6、combination=[]/max1。元3/4-wireも切り詰めず、prose Bold/図・native Regularを維持。

phaseはamplitude_amplification_overview.png→既存自作interactive、combinationはphase_logic_result.png/quantum_logic_result.png→自作interactive状態表示。**計3画像置換、原にcredits文なしのため削除0**、他のcredits削除なし。combinationの4-wire画像は8列×2、5-wire比較画像は16列×2を維持。どちらも原run-buttonなしを維持。

公開390/1440は **承認以外本文diff0・TeX diff0・console/page errors0**、原JSON属性一致。起動step0/norm1、body/content/shadow DOM横/縦inner scrollbar/document横overflow0。native内部水平panは許容され、canvasをscaleするCSSなし。実Chromium/AMD GPU最終vector **74/74** 成功 (phase56/combination18)。phaseの6真理値表・uniform状態の符号、pXOR補助0を確認。combinationは4/5/7だけ位相反転、d=0へ復帰しa/b/c保持。DPR1/2×390/1440の8ケースもprose Bold/図Regular・scroll/errors0、置換図の実見成功。

全 **49移行ページ / 98ケース、90 embed / 180起動** のlocal/public監査はrunning/step0/norm1/errors/body・shadow scroll0。multi-1/3/7/stressの追加8ケース/22起動も同じ結果。合計 **全53 builtページ / 106ケース、全101 embed / 202起動**。全282tests＋追加approved guard4件成功、最終target8件も成功、typecheck/build/diff-check成功。

公開資料 `/tmp/qtw-phase-two-public-{behavior,glyphs}.json`、`/tmp/qtw-phase-combination-public-embed-behavior.json`、`/tmp/qtw-port-{phase_logic,phase_logic_combination}.json` (commit=public)、`/tmp/qtw-scroll-phase-two-final-{local,public}.json`、`/tmp/qtw-pr58-extra-phase-two-final-public.json`。pin ef652682c23d89427f6f39bb6bee1ec6fae9bb1e、Binaryen123、GPU-only維持、upstream/CPU fallback/本番readbackなし。

公開live確認後、sidebar直後の **sat（充足可能性問題）** を確認してSTOP。原「追加条件2」はA/B/Cのexactly-one条件30項を全てORで結ぶため、「それぞれの箱に高々1個」を要求できない。原liveからCond2を取得し **A0/B0/B1/C0だけtrue** を代入するとCond1/Cond2はtrue、Bに2個入り意図条件はfalse。これはCond2の反例で、全ヒントを同時に満たすという主張ではない。

satの原125列/14-wire回路は別途GPUで起動成功、状態0〜15各約1/16、8だけ位相反転、補助wire0、norm0.9999997616、page errors0。最終答042は本文と一致するが、途中の定式化の不一致を容認して移植しない。**質問: Cond2を箱ごとのOR式に括り、A条件 AND B条件 AND C条件へ訂正してよいか？** 他の式の完全検証も未完了で、今回のphaseへの承認をSAT原文へ拡張しない。

[sat-constraints-blocker.md](sat-constraints-blocker.md)、`/tmp/qtw-sat-original-{constraints,gpu}.{mjs,json,log}` に証拠保存。sat原palette[]/HTML max1、14-wireを保持する予定。原画像2枚は未置換/削除credits0。移行後本文diff/390・1440のscroll/step0は未実施。route/fixtureなし、sat・grover_iam以降は未公開。

owned preview4347/検証browserを終了。docs-only checkpointを通常push、Pages最終状態は終了時に報告。11:54 hard stopを守る。


## 2026-10-11 12:02 SAT文言承認 / 原t5回路不一致でSTOP (12:31 hard stop)

高宮さんからSATの4項目だけ明示承認。原の配置に曖昧さはなく、指定どおりのJekyll原稿を **[sat-approved-source.html](sat-approved-source.html)** に保存した。これはsrc/pagesの移行routeではなく未公開の原稿。逆変換すると原sourceと**byte単位で完全一致**、原125列/14-wire JSONも**byte一致で無変更**。他の原文を訂正していない。

1. **Cond2**: 全30項のOR → 箱ごとの10項を括り、A条件 ∧ B条件 ∧ C条件。A/B/C先頭の `( A0`/`( B0`/`( C0` を `(( A0`/`(( B0`/`(( C0`。A/B末尾は `∧ A9)) ∧ // A には数がちょうど 1 つ入る。かつ、` / B同文、C末尾は `∧ C9))   // C には数がちょうど 1 つ入る`。元のdouble space `∧  A9` 等を含め、指定のCond1同様の改行/記法を維持。
2. **説明**: 「ほかの数 1, ..., 9 とすべての箱 B, C について同様に考えると、論理式は次のようになります。」→「ほかの数 1, ..., 9 についても同様に考えて OR でつなげると、「A には数がちょうど 1 つ入る」という論理式になります。B, C についても同じ論理式を作り、3 つを AND でつなげると次のようになります。30 個の項をすべて OR でつないでしまうと、どれか 1 つの箱で成り立つだけで true になってしまうので注意してください。なお、この論理式は「ちょうど 1 つ」を表すので、追加条件 1 も含んでいます。」
3. **誤字4つ**: 暗唱番号→暗証番号、アリゴリズム→アルゴリズム、得られてしいまいます→得られてしまいます、巡回サラリーマン問題→巡回セールスマン問題。
4. **Hint1前提**: 「たとえばヒント 1 の論理式は次のように短い論理式に変換できます。」→「たとえばヒント 1 の論理式は、ほかのヒントから A8, B8, C8 が false と分かることを使うと、次のように短い論理式に変換できます。」

承認Cond2はA0/B0/B1/C0のみtrueの旧反例をfalseにし、042を表すA0/B4/C2のみtrueをtrueにすることを直接確認。Cond2ブロッカーは承認済みとして歴史記録に更新した。

### 公開前に原t5と本文の別不一致を実GPUで再現

原のq0/q1/q2/q3は **A1/A4/B1/B4**。block名と式は **t5 = ¬A4 ∨ ¬B4** だが、原のt5 input/controlは **q1,q2 (A4,B1)** を使い、実際は **¬A4 ∨ ¬B1**。元のuncomputeもq1,q2を使う。

入力 **A1=0,A4=1,B1=0,B4=1** に対して、記載式はt5=0、原prefixを実行したGPUはt5=1。最終basis **378**、bit8=1、norm **1**、page errors0。test-onlyコピーの初期Hを固定入力へ置換し、t5までの原prefixを実行したが、t5のgate/control操作は無変更。承認原稿の原JSONも無変更。全回路の最終答042が一致しても、本文の「ひとつひとつの項を計算して一時bitへ出力」と整合しないのでSTOP。

**質問: 原JSON維持の指定を解除して、t5のB1側操作をB4へ移し、そのuncomputeも対応して修正することを承認できるか？** 承認なしに回路/block label/本文を追加訂正しない。sat・直後grover_iam以降は未公開。

詳細 [sat-t5-blocker.md](sat-t5-blocker.md)、資料 `/tmp/qtw-sat-t5-{diagnostic.json,gpu.mjs,gpu.json,gpu.log,gpu.png}`。原palette **[]**、原HTML max-wire-count **1**、14-wireを維持する予定。原画像2枚は未置換/credits削除0。sat_result_state_vector.pngは旧Qniのblock labels・popupを含むため、再開時の置換について確認が必要。未移植なので本文diff/390・1440 scroll/step0/prose glyph検証を合格とは記録しない。

今回の製品変更とSAT公開は0。承認された本文訂正を失わないよう原稿をcommitし、従来の公開済みページを再移植していない。診断browser終了済み、server新規起動なし。docs-only checkpointを通常pushし、Pages状態を終了時に報告する。


## 2026-10-11 12:20 t5承認 / 12:28 Hint4追加承認 / 指定PR版との同期質問で公開保留

前の作業を捨てずに継続。高宮さんがSol/Opusの独立レビュー (`/tmp/qtw-sat-review-{sol,opus}.md`) の **t5計算38〜42＋uncompute103〜107だけ** を明示承認。0-based col、q2=B1→q3=B4、他のtoken/125列/14-wire/block labels/冗長XXは保持。original/fixed JSONを `tests/fixtures/sat-circuit-{original,fixed}.json` に保存し、専用testは差分index配列を完全一致で固定。

### 最終JSON差分 (0-based)

| col | before | after |
|---|---|---|
| 38 | `[1,"X","X"]` | `[1,"X",1,"X"]` |
| 39 | `[1,"X","X"]` | `[1,"X",1,"X"]` |
| 40 | `[1,"•","•",1,1,1,1,1,"X"]` | `[1,"•",1,"•",1,1,1,1,"X"]` |
| 41 | `[1,"X","X",1,1,1,1,1,"X"]` | `[1,"X",1,"X",1,1,1,1,"X"]` |
| 42 | `[1,"X","X"]` | `[1,"X",1,"X"]` |
| 103 | `[1,"X","X"]` | `[1,"X",1,"X"]` |
| 104 | `[1,"X","X",1,1,1,1,1,"X"]` | `[1,"X",1,"X",1,1,1,1,"X"]` |
| 105 | `[1,"•","•",1,1,1,1,1,"X"]` | `[1,"•",1,"•",1,1,1,1,"X"]` |
| 106 | `[1,"X","X"]` | `[1,"X",1,"X"]` |
| 107 | `[1,"X","X"]` | `[1,"X",1,"X"]` |

### 実GPU照合

実Chromium/AMD WebGPUの公開standalone、pin ef652682c23d89427f6f39bb6bee1ec6fae9bb1eでfixed fixtureを実行。全16basis入力 (q0..q3=A1,A4,B1,B4) に対し、初期4Hだけtest用X/空セルへ置換し、各block末尾までの原prefixを実行。q4..q13を全て読み、計算済み項は本文式、未計算項は0と照合し、入力4bit保持とnormも確認。

| 検査 | 成功 |
|---|---|
| t1〜t10各block末尾 | 各16/16、合計160/160 |
| uncompute後の補助10bit=0・入力保持・符号 | 16/16 |
| H入力の全125列 | 1/1 |
| 合計 | **177/177** |

H入力の全回路は状態0〜15のみ各約1/16、**index8だけ約-0.25**、他約+0.25、補助bit0、norm≈1で答042。結果は `tests/fixtures/sat-gpu-verification.json`、script/log `/tmp/qtw-sat-all-gpu.{mjs,log}`。最初のharnessはhash-only navigationが再bootしないため旧prefixを読んだので、caseごとにabout:blankを挟む実document navigationへ修正して再確認した。製品/CPU fallback/本番GPU readbackを変更していない。

### 中断時点のSAT原稿と検証

未公開Astro原稿はpalette[]/max-wire-count1、14-wireを保持。crack_the_code.jpgは元の手書きパズル画像として保持。sat_result_state_vector.pngは旧Qni labels/popupを含むため、自作SatStateIllustrationへの置換を作業中。32状態を一度に描き、rangeで全16384状態を確認できる。14bitket、振幅/確率/位相popup、index8の-0.25/6.25%を保持し、16368の零状態を切り捨てない。原にcredits文なし、削除0。これらのpage/component/test変更はworktreeに残しているが、PR文言の確認が済むまでcommit/pushで公開しない。

最初の全suiteは289成功/3失敗 (SATの長いpreによる390幅1022px)。未公開原稿のpreをpre-wrap/overflow-wrapへ変更し、native canvasのscaleやclippingでは隠していない。再build後、当該3ケースを含むtarget **6/6成功** (`/tmp/qtw-sat-wrap-target.log`)。typecheck/build成功。中断前の全文比較harnessは承認paragraphのDOM patch未完了で本文diff1、390幅も未修正時の結果だったため、**本文diff/live/page GPU最終動作を合格と記録しない**。実ページの全状態確認と公開live確認は未完了。

### Hint4追加承認とPR #575の相違

12:28の追加指示でHint4訂正そのものは明示承認された。新説明「7,3,8=×はどの箱にも入らない」、9変数のHint4 pre、確定変数3→9、Hint1前提「ほかのヒントから」→「ヒント4から」。原285行付近の最適化説明は無変更で保持する。

ただし同指示の「指定PR最終版に合わせ、相違時はPR版を使う」と、PRの現head **b0d1c105ee0edbc2d20f3f45439d595bbe2eecab** の実内容が競合。12:29〜12:35にdiff/contents/headを再確認したが、PRは旧Hint4説明・旧3-item list・旧3変数・「ほかのヒントから」のまま。**質問: PR更新を待つか、今回明示されたHint4の4訂正をPR版より優先するか？** Hint4を訂正してよいかという未承認質問ではなく、どの最終文言へ同期するかの確認。勝手に旧文言を最終版として公開しない。

PRの回路JSONはfixed fixtureと全体で完全一致、10列差分も同じ。class並べ替え以外の追加回路差分なし。[sat-pr575-sync-blocker.md](sat-pr575-sync-blocker.md) に記録。**SATとgrover_iam以降は未公開**。コード作業を保存したまま、docsと確定GPU fixturesだけcheckpointする。owned preview4348/検証browserを終了。hard stopは最新の13:02を適用。


### 12:41 PR同期解決 / SAT公開準備

PR #575が **9ed17873eeb3f278e00eaafb539c724f35918b2c** に更新。Hint4の新説明・9変数pre・3→9の確定変数・Hint1「ヒント4から」は高宮さんの追加指定と完全一致 (改行/空白以外の差なし)。元285行付近の最適化説明は無変更。t5の125列JSONもfixed fixtureと全体で完全一致。指定PR優先条件を満たしたので同期質問は解決、作業を再開した。Hint4は未決質問ではない。保存原稿を承認最終版へ更新した。

承認追加diffは、旧「このヒントが言っていることは次の3つ」→「7,3,8=×はどの箱にも入らない」の指定文、旧3-item list→Hint4のA/B/C全9否定pre、3変数→9変数列挙、Hint1「ほかのヒント」→「ヒント4」。これ以外の既承認原稿/本文/TeX/JSONは変更しない。全文期待fixture **sat-approved-text.json** で固定し、390/1440のguard **2/2** 成功。原liveをPRの承認された本文部分だけtest-onlyで変更して比較し **本文diff0/TeX diff0/errors0**。harnessでraw Liquid nmargin_noteタグをDOMへ混ぜた点は、タグを除外して既存sidenoteを保持する比較へ修正した。

原125列/14-wire、palette **[]**、原max-wire-count **1**、原run-buttonなしを保持。proseゲートglyphは原に0個で、共有Bold設定を維持。native/図はRegular、MathJax3.2.2/Qni/実験版/Qniで開くを保持。JSON差分は指定10列だけ、冗長XX/ラベル/他115列を保持。

**sat_result_state_vector.png→自作SatStateIllustration**、32状態ずつrangeで全16384状態へ到達可能。14bitket、index8の振幅-0.25/6.25%/180°、他0〜15の+0.25、16以降の0を保持。元手書きパズル **crack_the_code.jpgは保持** (画像内署名も保持)。原に別credits文なし、**削除credits0**。旧Qni popup/block labelsのPNGは公開assetsへ持ち込まない。

実ページのnativeをpanして最終列を選択し **34/34 GPU検証** 成功 (390/1440それぞれ原H＋16basis)。補助10wire=0・入力保持、8だけ負、uniform16状態各1/16、norm≈1。standalone177/177と合わせて **211/211**。資料 `/tmp/qtw-sat-local-embed-behavior.json`、`tests/fixtures/sat-gpu-verification.json`。製品回路に診断Xを加えず、本番GPU→CPU readbackなし。

local390/1440はbody/content/shadow inner scrollbar/document横overflow/errors0、step0/running/norm1、native内部panのみ許容。DPR1/2×両幅の4ケースはerrors/overflow0、図/native Regularを確認。pre折返しで静的式の長い行だけを表示幅へ合わせ、native canvasをscaleしていない。最初の289成功/3SAT幅失敗は修正後target6/6、最終全文guard2/2、typecheck/build/diff-check成功。全suite再実行は公開準備時に進行中で、成功数は確認後に記録する。

資料 `/tmp/qtw-port-sat.json`、`/tmp/qtw-scroll-sat-final-local.json`、`/tmp/qtw-phase-two-local-glyphs.json` (SAT4ケースの再実行結果)、`/tmp/qtw-sat-{golden-tests,final-tests,final-types,approved-build}.log`。公開live確認後にsidebar順でgrover_iamへ進む。


### 12:53 SAT初回公開と状態図登録の補正

初回内容commit **078adba** / **Pages38109541877 success**。全 **292tests (6.5m)** 成功、最終全文guard2/2も成功。原のHint4追加承認以外の本文は維持し、PR9ed17873と一致。

公開後の置換図E2Eでcustom element未登録を検出した。SAT原にcircle tagが0個なのでpage generatorがqubit-circle importを付けず、自作SatStateIllustrationも登録を自分でimportしていなかった。実ページのnative GPUとは別の図の問題。component自身のscriptへ **import './qubit-circle'** を追加し、親ページの偶然のimportに依存しないよう修正。原本文/JSON/図の値を変更していない。

登録とpopupを実際に確かめるguardへ強化し **2/2成功**。DPR1/2×390/1440の図 **4/4成功**、状態8の-0.25/6.2500%と14bit aria、末尾16383の14個の1/振幅0へ到達、overflow/errors0。最初の図harnessはketをtooltip textContentで探したがketはaria側にあるので、実tooltip確率＋aria ketへ照合対象を修正した。caption/data attrsだけの検査で済ませない。資料 `/tmp/qtw-sat-local-figure.json`、`/tmp/qtw-sat-circle-tests.log`。登録補正を公開してから最終live確認する。


### 12:58 SAT最終公開確認 / grover_iamの旧SATコピーでSTOP

**SAT公開完了**: 内容 **078adba** / Pages38109541877 success、状態円の独立登録補正 **d21c4b4** / **Pages38109863067 success**。公開390/1440は承認以外本文diff0/TeX diff0/console-page errors0/body-content-shadow scroll0/document横overflow0、running/step0/norm1。palette[]/max1、125列/14-wire、run buttonなし、冗長XX/labels保持。MathJax/Qni/実験版/Qniで開く保持、proseゲートglyph原0個・共通Bold設定維持、native/図Regular。

公開実nativeの16basis＋Hを両幅で **34/34成功**。登録補正後もHの最終状態を両幅 **2/2成功**、index8のみ負、補助0、norm≈1。standaloneの各t1〜t10 160＋復元16＋H1の **177/177** と整合。永久記録 `tests/fixtures/sat-gpu-verification.json` と **sat-page-gpu-verification.json**。DPR1/2×390/1440の公開置換図 **4/4**、振幅-0.25/確率6.2500%/位相180°、14bit aria、末尾16383=0の到達を確認。画面を実見し、重なる小ketの表示は図内だけ抑制し、popup/ariaとrangeで状態情報を保持。

原手書きパズルJPEG/画像内署名は保持、旧Qni状態PNGだけ自作図へ置換、credits文削除0。全292tests成功、最終の登録/全文/10列差分/16384状態到達guard2/2成功、typecheck/build/diff-check成功。原liveは途中でPR575の承認文言へ更新されたため、比較harnessを更新済みHint4に対してもidempotentにした。製品を変えて比較を通していない。

公開資料 `/tmp/qtw-port-sat.json` (commit=public)、`/tmp/qtw-sat-public-{embed-behavior,figure}.json`、`/tmp/qtw-sat-final-public-embed-behavior.json`、`/tmp/qtw-scroll-sat-public.json`、`/tmp/qtw-sat-{final-tests,circle-tests,final-types}.log`。今回全体の新しい全ページ公開監査を行ったという主張はしない。最後の全体監査はphase2時点であり、SATは個別に公開確認した。

その直後の **grover_iam（折り返し変換）** をsidebar順で確認しSTOP。最新upstream mainの3番目の回路は **原SAT125列とbyte相当JSON完全一致のprefix＋折り返し変換** (計134列/14-wire)。t5/uncomputeも旧q2=B1のまま。A1=0,A4=1,B1=0,B4=1の原prefixでGPU状態378、t5(bit8)=1、本文の¬A4∨¬B4は0、norm1/errors0を再現した。資料 `/tmp/qtw-grover-t5-{diagnostic.json,gpu.mjs,gpu.json,gpu.log,gpu.png}`。SAT承認を別ページへ自動拡張しない。

**質問: grover_iamの3番目の回路へ、SATと同じ10列 (38〜42/103〜107) の修正を適用してよいか？** 原3回路のpalette[]×3/max1×3、2/4/14-wireを切り詰めない予定。画像はamplitude_amplification_overview.png 1枚、未置換/credits削除0。grover_iam route/fixtureは未作成、本文/JSON無変更、移行後diff/scroll/step0は未検証。後続grover_iteration以降も未公開。

owned preview4348/検証browser終了、main/worktreeを通常fetch/rebase/pushで同期。13:02 hard stopを守り、最後のdocs-only Pages状態を終了時に報告する。


## 2026-10-11 13:05 grover_iam第三回路のt5訂正承認 / hard stop13:35

高宮さんが **grover_iam第三回路のみ** にSATと同じ10列修正を明示承認。変更前にraw data-json文字列のSAT prefixを抽出し、修正前SAT raw JSONと **UTF-8 byte相当で完全一致**、cols0〜124とfixtureも完全一致と確認。proofを `grover-iam-source-prefix.json` (raw両文字列＋SHA256) に保存した。列番号はSATと同じ0-based 38〜42/103〜107。

実回路は **134列 (0〜133)**、追加折り返し部は **125〜133の9列**。指示中の「135-col」は実データと1ずれるが、134列を指定した本文と原JSONに従って、余計な列は足していない。原3回路の列数は17/17/134、wire数2/4/14。追加9列も無変更で保持。

### 第三回路のJSON diff

| col | before | after |
|---|---|---|
|38|`[1,"X","X"]`|`[1,"X",1,"X"]`|
|39|`[1,"X","X"]`|`[1,"X",1,"X"]`|
|40|`[1,"•","•",1,1,1,1,1,"X"]`|`[1,"•",1,"•",1,1,1,1,"X"]`|
|41|`[1,"X","X",1,1,1,1,1,"X"]`|`[1,"X",1,"X",1,1,1,1,"X"]`|
|42|`[1,"X","X"]`|`[1,"X",1,"X"]`|
|103|`[1,"X","X"]`|`[1,"X",1,"X"]`|
|104|`[1,"X","X",1,1,1,1,1,"X"]`|`[1,"X",1,"X",1,1,1,1,"X"]`|
|105|`[1,"•","•",1,1,1,1,1,"X"]`|`[1,"•",1,"•",1,1,1,1,"X"]`|
|106|`[1,"X","X"]`|`[1,"X",1,"X"]`|
|107|`[1,"X","X"]`|`[1,"X",1,"X"]`|

第一/第二JSONは無変更。第三の他124列・labels・冗長XX・初期化・pAND・追加折り返し9列は無変更。original/fixed fixturesと `grover-iam-corrections.spec.ts` がexact diffとprefix、追加部の無変更を固定する。全本文/TeX/ket順序/1sidenote/原run-buttonなしを保持。Golden全文fixtureでguardし、raw原liveとの比較も本文diff0/TeXdiff0。

### 実GPU (local準備)

| 回路 | 最終結果 | standalone/実page |
|---|---|---|
| 2qubit AND＋折り返し | index3のみ、amp約-1、確率約100%、位相180° | 各2/2 |
| 4qubit AND＋折り返し | index15約-0.6875/47.2656%、他約-0.1875/3.5156%、全非零位相180° | 各2/2 |
| SAT＋折り返し (14wire) | index8約-0.6875/47.2656%、他0〜15約-0.1875/3.5156%、全非零位相180°、補助q4〜q13=0 | 各2/2 |

390/1440で **standalone6/6＋実native6/6**。normは約0.99999976/0.99999960/0.99999960、本文の100%/約47.3%/約3.5%/答14bit00000000001000と一致。全vectorを読み、index16以降の確率和 **leakage=0** と確認し、補助を戻した後の追加折り返し部も評価した。実pageはnative canvasをpanして最終H列をクリックし、表示状態を読み取った。製品のGPU→CPU readback/CPU fallbackは追加しない。

`tests/fixtures/grover-iam-gpu-verification.json` と `/tmp/qtw-grover-iam-{gpu-results,local-embed-results}.json`、script/logに保存。新しい本文数値・phase・answer不一致は見つかっていない。

### UI/画像/palette/検証

palette **[]×3**、原HTML max-wire-count **1×3**、2/4/14-wireを切り詰めない。prose H/MEASURE glyphはBold、図/nativeはRegular。MathJax3.2.2/Qni/実験版/Qniで開く維持。390/1440はbody/content/shadow inner scrollbar/document横overflow/errors0、running/step0/norm1。DPR1/2×両幅の4ケースでprose Bold/native Regular/overflow/errors0、実スクリーンショット確認。

**amplitude_amplification_overview.png→既存自作AmplificationIllustration** (32 circles、クリック/Enter/Spaceでマーク位置を変更) へ置換。原にcredits文なし、**削除0**。component自身がqubit-circleをimportし、親にstatic circleがなくても確実に登録する。16状態図のdata-qubit-count4も明示し、0000等のariaを正しくする。値/見た目/元の未置換画像creditsは変更しない。

全 **298tests (5.9m)** 成功、追加Golden全文＋exact diff guard最終2/2成功、typecheck/build/diff-check成功。原文の「今回はこの繰り返し変換」等は承認外なので変更しない。公開live確認後にsidebar順でgrover_iterationへ進む。pin ef652682c23d89427f6f39bb6bee1ec6fae9bb1e/Binaryen123/GPU-only維持、upstream変更なし。


### 13:24 grover_iam公開live成功 / grover_iterationの丸め表記質問でSTOP

**grover_iam公開完了**: **9dca24c** / **Pages38111099412 success**。公開390/1440は原文diff0/TeX diff0/console-page errors0、body/content/shadow内scroll/document横overflow0、全3起動running/step0/norm1。palette[]×3/max1×3、2/4/14-wire保持、原run-buttonなし、MathJax3.2.2/Qni/実験版/Qniで開く/1sidenote保持。prose H/MEASURE Bold、図/native Regularはlocal DPR1/2で確認。新しい文章訂正なし。

公開実nativeで各幅3回路 **6/6成功**、2qubit target3=-1/100%、4qubit target15=-0.6875/47.2656%、SAT target8=-0.6875/47.2656%、他0〜15=-0.1875/3.5156%、全非零phase180°。SAT q4〜q13への確率leakage **0**、norm≈1。追加125〜133の9列まで実行し、補助を0に戻した状態で4未知bitの確率を増幅したことを確認。standalone6/local-native6/public-native6の **18/18**、`grover-iam-gpu-verification.json` に公開結果/phaseDegreesも保存。

自作AmplificationIllustrationの公開DPR1/2×390/1440 **4/4**、circle登録/hover-focus確率/4bitket/Enterでマーク変更/上下32circles対応/scroll-errors0を確認。値は既存generic overviewを維持し、本文の1回折返し具体例とは混同しない。原PNGを自作対話図へ1枚置換、credits削除0。親pageにcircleタグが0でもcomponent自身のimportで動作する。図のoriginal-image marker内以外に新しい説明を足していない。

資料 `/tmp/qtw-port-grover_iam.json` (public)、`/tmp/qtw-grover-iam-public-{embed-results,figure}.json`、`/tmp/qtw-scroll-grover-iam-public.json`。全298tests＋最新raw prefix/Golden/exact10列/interactive guard2/2成功、typecheck/build/diff-check成功。

今回、全 **51移行ページ / 102ケース、94embed / 188起動** のpublic監査を更新し、errors/body-shadow scroll0/running/step0/norm1。追加multi1/3/7/stressの8ケース/22起動も同じ結果。合計 **全55 built pages / 110ケース、105embed / 210起動**。資料 `/tmp/qtw-scroll-grover-iam-public-full.json`、`/tmp/qtw-pr58-extra-grover-iam-public-full.json`。これは起動とレイアウトの全体監査であり、全既存回路の教育的最終挙動を今回再検証したという主張ではない。

次の **grover_iteration（グロヴァー反復）** をsidebar順で確認しSTOP。原liveとlatest upstream mainの第2回路 (4qubit/2回反復) を無変更でGPU実行するとtarget15は **90.84466975183183%** (390/1440で一致)。小数第1位は **90.8%** だが、本文は **約90.9%**。これは近似値の丸め差についての質問で、回路計算が誤りだという主張ではない。第一回路の47.2656%→約47.3%、第四回反復の58.1703%→58.2%は本文と整合。

**質問:「約90.9%」1か所だけを「約90.8%」へ訂正してよいか？** 原3JSONは変更しない。原liveの段落とJSON3回路が取得sourceと一致することも確認し、実段落screenshotを保存。詳細 [grover-iteration-rounding-blocker.md](grover-iteration-rounding-blocker.md)、`/tmp/qtw-grover-iteration-original-{circuits.json,gpu-results.json,prose.json}`。

grover_iteration原palette[]×3/max1×3、各4-wire、画像0/削除credits0。route/fixtureなし、原本文/JSON無変更、移行後diff/scroll/step0は未実施。multiple_marked_values以降も未公開。owned preview4349/検証browser終了、main/worktreeを通常pushで同期。13:35 hard stopを守り、最後のdocs-only Pagesは終了時に報告。


## 2026-10-11 PR #63: 埋め込みのゴミ箱ボタン削除 / hard stop13:57

高宮さんの指示で、grover_iamの公開作業完了後の安全な区切りから実施。grover_iterationの「約90.9%→約90.8%」確認は承認待ちのまま。既存ページ・原文・JSON・palette・wire数・図・creditsは再編集せず、`qni-webgpu.ref` だけを **348992f5d7926d326eaa0f678fa8d89f0894ff54** (上流PR #63のmerge) に更新。

clean detached checkout `verify/tutorial-toolbar` から `scripts/fetch-qni-webgpu.sh` を実行し、**埋め込みとstandaloneの両WASMを実際に再ビルド**。Binaryen123、`-Oz --enable-bulk-memory --enable-nontrapping-float-to-int`、Node22.23.2。再ビルド記録 `/tmp/qtw-pr63-rebuild.log`。Astro側も `QNI_WEBGPU_SOURCE` に同じclean checkoutを指定して再ビルド。Astroだけの再ビルドで済ませていない。GPU-only/本番GPU readbackなし/CPU fallbackなし/上流コード変更なし。

### ローカル検証

全 **55公開対象ページ / 110ケース (390/1440)**、**105埋め込み / 210起動**。全てrunning、step0、norm≈1、console/page errors0、本文/内容/Shadow DOM内部scrollbar0、文書横overflow0。通常51移行ページ102ケース188起動と追加multi1/3/7/stressの8ケース22起動を合算。これは全回路の教育的最終結果を再検証したという主張ではない。

**各210個の実描画ツールバーを撮影**して、undo/redoの位置に両矢印が描画され、旧ゴミ箱位置には描画がないことを画素で確認 (各undo/redoは85非背景画素、旧trashは0)。旧公開Hページで同じ確認を先に行うと旧trash159画素が存在し、旧位置のクリックで回路が消去された。新ビルドは **210/210でundo/redoのみ**、旧位置をクリックしても現在の「Qniで開く」回路URLは変わらない。埋め込みのクリック確認だけで原回路を改変していない。

独立した実描画の検証用ホストでも、X追加→undoで元JSON→redoで再追加、旧trash位置クリック無効果、ホストhistory/storage呼び出しなしの **4/4** 成功。上流PR #63はstandaloneのtrashを削除する変更ではなく、standaloneの既存編集機能は保持される。

standaloneは新ビルドでgrover_iamの3回路を390/1440で実行し **6/6**、答3/15/8、確率約100%/47.2656%/47.2656%、SAT補助q4〜q13のleakage0を再確認。全 **298tests (6.7m)**、typecheck/build/diff-check成功。

永続結果 `tests/fixtures/pr63-verification.json`。資料 `/tmp/qtw-scroll-pr63-local.json`、`/tmp/qtw-pr58-extra-pr63-local.json`、`/tmp/qtw-pr63-toolbar-{before,local}-verified.json`、各ツールバー画像/一覧画像、`/tmp/qtw-pr63-actions-local.json`、`/tmp/qtw-pr63-{tests,types,build,local-standalone}.log`。公開後は同じ全ページ/全ツールバーの確認を行い、実公開結果を追記する。force-pushは使わない。


### PR #63 公開全件確認完了 (13:53)

**1240881 / Pages38112691736 success**。pin **348992f5d7926d326eaa0f678fa8d89f0894ff54** の埋め込み＋standalone再ビルドがCIでも成功し、実公開済み。公開全 **55ページ / 390・1440の110ケース / 105埋め込み210起動** でrunning/step0/norm≈1、console-page errors0、本文/内容/Shadow DOM内部scrollbar0、文書横overflow0。元の文言・回路JSON・palette・wire数・図・creditsに変更なし。

公開の全 **210ツールバーでundo/redoのみ**、各矢印85画素、旧trash位置0画素。旧位置クリックで現在回路URLが変わらないことも全件確認。公開ホストでもX追加→undo→redo、旧trash無効果、history/storage副作用なし **4/4**。standaloneはPR #63の仕様どおり元のtrash操作を保持し、埋め込みだけがundo/redoのみとなる。

`tests/fixtures/pr63-verification.json` に公開結果も保存。資料 `/tmp/qtw-scroll-pr63-public.json`、`/tmp/qtw-pr58-extra-pr63-public.json`、`/tmp/qtw-pr63-toolbar-public-verified.json`、実ツールバー画像/一覧画像、`/tmp/qtw-pr63-actions-public.json`。高宮さんの次の指示でhard stopを14:22へ更新し、この全件確認を最優先で完了した。次にgrover_iterationを原文の前提から解析し、承認された条件付き訂正を判断する。


### grover_iteration: 2回反復の解析成立、9回目の数値でSTOP (13:57)

原文の「4量子ビット」「答1111」「答でない0000等」と原pAND4点から **n=4 / N=2^n=16 / M=1**。指示されたPython解析で sinθ=√(1/16)=0.250000000000000、**θ=0.252680255142079rad**、k=2なので **5θ=1.263401275710393rad**、**P=sin²(5θ)=0.908447265625000 / 90.844726562500000%**。原JSONの実GPU **90.84466975183183%** と一致し、小数第1位は90.8%。よって条件付き承認が成立した。

承認された **「約90.9%」→「約90.8%」1か所だけ** の原HTMLを `docs/grover-iteration-approved-source.html` に保存。逆置換で原sourceにbyte相当の完全一致、全3JSON無変更。解析結果 `tests/fixtures/grover-iteration-analysis.json` に保存。この2反復の旧確認事項は解決済み。

ただし「数値は正しく」の方針で他の反復数値も確認すると、原文の **「9回目で99.9%」** は同じ前提と不一致。k=9で **19θ=4.800924847699494rad / P9=0.992181860020537 / 99.218186002053700%**、正しい小数第1位は **99.2%**。

原4反復回路の12列反復部が全て同じことを確認し、検証用にだけ同一部を5回追加した9反復をGPU実行すると、390/1440とも **99.21797226588893%**。原3反復prefixは96.1318034678925%→96.1%、原4反復は58.1703%→58.2%で本文と一致。原liveの99.9段落と3JSONも取得sourceと一致する。原回路を勝手に変更したのではなく、本文の「さらに反復」をそのまま評価した。資料 `tests/fixtures/grover-iteration-k3-k9-gpu-verification.json` と `/tmp/qtw-grover-iteration-k3-k9-*`、`/tmp/qtw-grover-iteration-original-nine-prose.json`、原段落screenshot。

**STOP/追加質問:「99.9%」1か所を「99.2%」へ訂正してよいか？** 2回反復の1か所承認をこの別数値へ拡張せず、**grover_iterationは未公開**、route未作成。sidebar次のmultiple_marked_values以降も停止。原3JSONの17/29/53列、各4-wire、palette[]×3/max1×3保持、画像0/削除credits0。移行後の全文diff/scroll/step0検証は未実施。詳細 [grover-iteration-rounding-blocker.md](grover-iteration-rounding-blocker.md)。GPU-only/本番readbackなし/CPU fallbackなし、Pythonは明示された解析式の評価のみ。PR #63の公開全件確認は完了済み。


## 2026-10-11 grover_iterationの2数値訂正承認 / qniapp/qni#577 / hard stop14:31

高宮さんが「約90.9%→約90.8%」「9回目99.9%→99.2%」の **2か所だけ** を明示承認。#577はopen、head **5d68bbfcfc878b64cd151fb1b594f6802210070e**。PR raw全文を取得し、原sourceの2数値訂正と、3か所のclass順序変更を戻したものが **完全一致** と確認。class順序変更は無視し、反復回数の近似式 `N_iter=floor(π/4 sqrt(2^n))`、5,000回の表記、他本文/全26TeX/ket順/全3JSONは無変更。原の条件n=4、N=2^n=16、答1111だけでM=1。

### Python解析とGPU照合

sinθ=√(M/N)=√(1/16)=**0.250000000000000**、θ=asin(0.25)=**0.252680255142079rad** (14.477512185929925°)。

| k | (2k+1)θ rad | 解析P | 解析100P | GPU100P (390/1440) | 正しい本文 |
|---|---|---|---|---|---|
| 2 | 1.263401275710393 | 0.908447265625000 | 90.844726562500000% | 90.84466975183183% | 約90.8% |
| 9 | 4.800924847699494 | 0.992181860020537 | 99.218186002053700% | 99.21797226588893% | 99.2% |

Python mathの解析式評価は指示されたもの。CPUで量子状態をシミュレーションする代替経路ではない。実GPUはpin348992f、原2反復29列をそのまま使用し、9反復は原4反復53列の12列反復部に同一部を5回追加した **検証専用113列**。記事の3JSONを9反復へ置換していない。両幅で2反復・9反復の **4/4** を確認。GPU/解析の微小差は単精度誤差で、小数第1位の丸めは一致。

2反復state15は実amp **+0.9531247019767761** / phase0°、他15状態は約+0.078125/0°。9反復state15は **+0.9960821866989136** /0°、他15状態は約−0.0228300728/180°。虚部0、norm≈1、errors0。state15=1111以外の全15状態も保存。3反復96.1318034678925%→96.1%、4反復58.170341234676926%→58.2%も原文と一致。

### 移植とローカル確認

`src/pages/grover_iteration.astro` を作成。原3回路 **17/29/53列、各4-wire**、palette **[]×3**、max-wire-count **1×3**、原run-buttonなしを保持。画像0、自作置換0、削除credits0、sidenote0、Orbit0。prose gate tags0で共通Bold設定保持、native Regular。MathJax3.2.2/Qni/実験版/Qniで開く保持、未来の本文リンクは原サイトへ残す。

承認2か所だけを原liveの検証用DOMに適用し、390/1440で全文 **diff0 / TeXdiff0**、全counts一致、起動running/step0/norm≈1、console-page errors0、body/content/Shadow DOM内部scrollbar0、文書横overflow0。DPR1/2×両幅 **4/4** で書体/overflow/errors0、実表示確認。native canvasは水平panし、倍率変更やwire切り詰めで隠していない。

実記事の3回路を最終H列までクリックし、390/1440の **6/6** で1/2/4反復のsigned全16状態を確認。原standalone3回路6/6、3/9回専用4/4と合わせローカル準備 **16/16**。記事の起動step0とは別に最終教育的結果も確認した。全6ツールバーでundo/redo85画素ずつ/旧trash0、旧位置クリックで回路URL無変更。

原fixture `grover_iteration-original.json`、承認全文/TeX `grover-iteration-approved-text.json`、解析 `grover-iteration-analysis.json`、状態結果 `grover-iteration-gpu-verification.json`、検証専用3/9回 `grover-iteration-k3-k9-gpu-verification.json`、承認source `docs/grover-iteration-approved-source.html`。Golden全文＋26TeX＋無変更3JSON＋5,000の数式guardを追加。初回の追加guardだけ、5,000が本文でなくMathJax内にあるのに本文としてassertしたため2件失敗。実表示/元TeXは無変更で正しく、guardを数式契約へ直して2/2成功、全suiteを再検証してから公開する。

旧 [grover-iteration-rounding-blocker.md](grover-iteration-rounding-blocker.md) は **解決済み** へ更新。pin348992f/Binaryen123/GPU-only/本番readbackなし/CPU fallbackなし/上流コード変更なし。PR #63の公開全55ページ・210起動・210ツールバー確認は完了済みの結果を再利用し、再作業していない。公開完了後にsidebar次のmultiple_marked_valuesへ進む。

全suite再検証 **304 tests成功**、最新追加guard2/2、typecheck/build/diff-check成功。MathJax内の5,000を誤って本文としてassertした検証だけを直し、製品表示はそのまま。公開へ進む。


### grover_iteration公開live確認 / 次のmultiple_marked_valuesへ

**f61b674 / Pages38114125426 success**、公開390/1440で承認2数値以外の本文diff0/全26TeXdiff0、元3JSON一致、errors0、body/content/Shadow DOM内scrollbar0/文書横overflow0、running/step0/norm≈1。DPR1/2×両幅4/4でnative Regular/overflow-errors0、prose gate tags0 (共通Bold維持)。原の近似式と5,000表記を無変更、画像0/削除credits0、palette[]×3/max1×3、4-wire×3、原run-buttonなし。公開nativeの最終signed全16状態 **6/6**、2反復90.84467%、4反復58.17034%、ツールバー全6でundo/redoのみ/旧trashなし、旧位置クリックも無効果。永続state結果にnativePublicを追加した。解析2反復90.8447265625%、9反復99.2181860021%と専用GPU9反復99.2179722659%は承認数値90.8/99.2を裏付ける。

資料 `/tmp/qtw-port-grover_iteration.json` (public)、`/tmp/qtw-grover-iteration-public-embed-results.json`、`/tmp/qtw-scroll-grover-iteration-public.json`、`/tmp/qtw-phase-two-public-behavior.json` (今回grover_iteration4ケース)、`/tmp/qtw-pr63-toolbar-grover-iteration-public.json`。全304testsと2/2最終guard/typecheck/build/diff-check成功。PR #577のclass順序変更を採用せず、承認2か所だけを反映した。

### multiple_marked_values（複数の位相反転）ローカル移植

sidebar次の原ページを最新mainから取得。新しい数値の不一致なし。本文/数式/JSONを無変更で `src/pages/multiple_marked_values.astro` へ移植。原2JSON **14/32列、各4-wire**、palette **[]×2**、max-wire-count **1×2**、原run-buttonなし。画像0、自作置換0、credits削除0、sidenote0、Orbit0。共通prose Bold/native Regular、MathJax3.2.2/Qni/実験版/Qniで開くを維持。

実GPUで原一反復/原三反復と、二反復までの原第2回路prefix (cols0〜22の23列、三反復目のoracle直前) を390/1440で照合。検証専用prefixを記事JSONに書き戻していない。target **7/15 = 0111/1111** の両状態を確認:

| 反復 | target各amp/確率 | 他14状態amp/確率 | 本文 |
|---|---|---|---|
| 1 | -0.625 / 39.0625% | -0.125 / 1.5625% | 約39% / 約1.6% |
| 2 | +0.6875 / 47.2656% | -0.0625 / 0.3906% | 約47% |
| 3 | -0.40625 / 16.5039% | +0.21875 / 4.7852% | 16.5% |

全16状態のsigned amp/虚部0/norm≈1を確認。**standalone6/6** と実記事native最終1/3反復 **4/4**、合計 **10/10**。2個のtarget確率を合算して本文の1状態当たり確率と混同しない。N16/M2の原近似最適反復式floor(π/√2)=2も無変更。

390/1440の全文diff0/全TeXdiff0/全counts一致、起動running/step0/norm≈1、console-page errors0、body/content/shadow内scrollbar0/文書横overflow0。DPR1/2×両幅4/4でnative Regular/overflow-errors0。全4ツールバーはundo/redoのみ (85/85/0画素)、旧trash位置クリックでも現在回路URL無変更。

原fixture `multiple_marked_values-original.json`、本文/TeX `multiple-marked-text.json`、結果 `multiple-marked-gpu-verification.json` とGolden全文/TeX/JSON guardを追加。全suite308件と追加Golden2件の検証完了後に公開する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。

multiple_marked_valuesの全suite **308tests成功**、suite開始後に追加したGolden全文/TeX/JSON guard **2/2成功**、合計310ケース、typecheck/build/diff-check成功。公開へ進む。


### multiple_marked_values公開live確認完了 / 14:31 hard stopへ

**79737aa / Pages38114689884 success**。公開390/1440で原全文diff0/TeXdiff0/全counts一致/原2JSON無変更、palette[]×2/max1×2/各4-wire/14・32列/原run-buttonなし、画像置換0/削除credits0/sidenote0/Orbit0。全起動running/step0/norm≈1、console-page errors0、body/content/shadow内scrollbar0、文書横overflow0。native Regular/共通prose Bold、DPR1/2×両幅4/4でoverflow-errors0。追加の文言訂正なし。

公開実nativeの最終signed全16状態 **4/4** 成功、target7/15の各39.0625% (1反復)、16.5039% (3反復)。検証専用2反復prefixの各47.2656%も原文と一致。standalone6/localnative4/publicnative4の **14/14**。全4公開ツールバーでundo/redoのみ、85/85/0画素、旧trash位置クリックで回路URL無変更。`multiple-marked-gpu-verification.json` にnativePublic/toolbarsPublicを保存。

資料 `/tmp/qtw-port-multiple_marked_values.json` (public)、`/tmp/qtw-multiple-marked-public-embed-results.json`、`/tmp/qtw-scroll-multiple-marked-public.json`、`/tmp/qtw-multiple-marked-public-behavior.json`、`/tmp/qtw-pr63-toolbar-multiple-marked-public.json`。全suite308件＋開始後追加Golden2件が成功、typecheck/build/diff-check成功。原数値はすべて整合し、確認事項なし。

PR #63の公開全55ページ/110ケース/210起動/210ツールバー結果は保持し、今回の追加2ページもそれぞれ同じ起動・scroll・undo/redo-onlyを確認した。全ページを今回再監査したという主張ではない。追加2ページの本文/JSON以外を変更せず、pin348992f/Binaryen123/GPU-only、本番readback/CPU fallbackなし。

sidebarの次は **grover_iam_indetail（折り返しの仕組み）**。14:31 hard stopまでに追加ページをE2E検証して公開する時間が足りないため、安全な区切りで止める。次ページのroute/fixtureは作成せず、未公開。新しい確認事項は見つかっていないが、次ページの原文・数値・図の検証は未実施。owned preview4351/検証browserを停止し、main/worktreeを通常pushで同期する。最後の記録だけのPagesは終了時点の状態を報告する。


## 2026-10-11 grover_iam_indetailの位相規約・旧円表示の図でSTOP / hard stop15:00

前の最後の記録 **9b49ec9 / Pages38114923902 success** を確認し、既存PR #63/grover_iteration/multiple_marked_valuesの完了結果は再実施せず保持した。sidebar次の **grover_iam_indetail（折り返しの仕組み）** の最新mainと原liveを確認。原文の25%/平均0.25/左3振幅0/右振幅の大きさ1/100%は解析で整合するが、図の上向き位相と前ページの実回路の位相が全体位相πだけ異なるため、注記の判断を確認してSTOP。

原図の初期実振幅a=(0.5,0.5,0.5,-0.5)、平均μ=0.25、平均についての反射Dでは2μ-a=(0,0,0,+1)、最後は上向き0°/100%。一方、前ページの原第1回路 (無変更17列) のH→X→全1条件Z→X→Hは -D。その公開GPU実結果は、390/1440とも **index3 amp=-0.9999998807907104 / phase180° / probability0.9999997615814351**、他0。折り返し前の原prefix9列では各amp±0.4999999701976776、各prob0.2499999701976785。**4/4成功**、虚部0、norm≈1、errors0。差は全体位相だけなので観測確率の誤りと主張しないが、図の代表状態ベクトルとnative実回路の向きは同じではない。

**提案する追加注記 (元本文/図の数値/既存JSONを保持):**「ここで図示する折り返しと前ページの回路は全体位相がπ異なります。回路では最後の振幅は−1となり位相は下向きですが、観測確率は同じ100%です。」承認前に追加せず、原liveの「位相も上向きになります」段落と回路JSON0件も確認済み。5図の黒い座標文字は透明背景のため白背景合成して読んだ。

原5画像は旧Qniの円表示を利用した図。4枚は座標/平均/反射点を注釈し、最後1枚は円表示の最終状態。ツールバー等の外枠はないが、「旧Qni UI画像は質問」の指示に従い、**座標・平均・反射・最終+1を保持した自作対話図に5枚置換してよいか** と質問した。原に画像credits文なし、削除は0。まだ画像を置換していない。

open PR全件を確認し、同ページを変更するPRなし。open qniapp/qni#577の変更ファイルはgrover_iteration.htmlだけで、今回の注記/図判断の承認ではない。詳細 [grover-iam-indetail-phase-blocker.md](grover-iam-indetail-phase-blocker.md)。永続結果 `tests/fixtures/grover-iam-indetail-phase-verification.json`、資料 `/tmp/qtw-grover-indetail-phase-*`、原live段落 `/tmp/qtw-grover-indetail-original-prose.json` とscreenshot、原図の白背景版 `/tmp/qtw-grover_iam_*-paper.png`。

**grover_iam_indetail未公開、route/ページfixture未作成、原文/画像無変更。** 原JSON0件、palette属性0件/max-wire-count属性0件 (該当なし)。移植後の390/1440本文diff/scroll/errors/step0/toolbarは未検証。追加回路やmax制限を勝手に入れない。次のreadout_of_patterns以降も停止。注記・5図置換の承認を待つ。pin348992f/Binaryen123/GPU-only、CPU fallback/本番readback/上流変更なし、owned診断browserは終了済み。通常pushで記録を同期し、Pagesの終了時状態を報告する。


## 2026-10-11 grover_iam_indetail承認受領 / 原文無変更で5図を移植 / hard stop15:13

高宮さんの回答: **原文そのまま、全体位相の注記は追加しない。5枚は元の座標・平均・反射・最終状態を正確に再現する自作対話図へ置換。** 注記提案は不採用、既存grover_iam回路も無変更。旧ブロッカー文書は解決済みとした。

`src/pages/grover_iam_indetail.astro` と `GroverReflectionIllustration.astro` / `grover-reflection-illustration.ts` を追加。原5画像を5段階の自作SVG対話図に置換し、元の青色/円周/位相/白点/赤い平均点/破線矢印/座標値を保持。原にcreditsなし、削除0。原JSON0件、palette/max-wire-count属性0件 (該当なし)、回路や制限を勝手に追加していない。sidenote0/Orbit0、元近似式等も原文無変更。共通prose Bold維持 (原gateタグ0)、MathJax3.2.2/self-hosted/Qni/実験版を維持。

図はデフォルトだけでなく、クリック・Enter/Space・左右矢印で各状態の座標/振幅/確率を調べられる。5段階の選択強調と説明が同期し、Escapeで説明を閉じる。**調べても元の4状態・座標・平均・反射・最終状態を変更しない**。平均は正規化された新量子状態ではないため、平均/反射段階の説明は座標として明示する。CPUの量子シミュレータではなく、原図の固定参照値を表示する対話図。

解析: 初期a=(0.5,0.5,0.5,-0.5)、各p=0.25=25%。全x座標0、平均y=(0.5+0.5+0.5-0.5)/4=0.25。反射2μ-a=(0,0,0,+1)。左3振幅0、右1/位相上向き0°/確率100%。SVGでは半径56を振幅1とし、原点cyから初期点cy−56a、赤点cy−14、反射点cy−56(2μ-a)を実描画し、全20状態のDOM属性と描画座標を検証する。

実GPUは、原prefix9列の初期状態と、**検証専用D参照回路** (原native -D の17列にZ/X/Z/Xの全体位相−Iを追加した21列) を390/1440で実行。前ページのJSONや記事にこの参照回路は追加していない。原図が定義する平均反射Dを比較し、初期amp±0.4999999701976776/各p0.2499999701976785、最終index3 amp **+0.9999998807907104**/虚部0/p **0.9999997615814351** (上向き/約100%)、他0、norm≈1/errors0、**4/4成功**。既存のnative -Dの負号を隠す変更ではなく、原文/原図の代表ベクトルの規約を保持した検証。全体位相注記は本文に追加しない。永続 `grover-indetail-reference-verification.json`。

ローカル390/1440本文diff0/原TeXdiff0、console-page errors0、本文/Shadow内scrollbar0/文書横overflow0。画像5→0/自作図0→5だけが承認済みcount差。回路0のためstep0/toolbarは該当なし。DPR1/2×両幅4/4、クリック/キーボード/座標不変/最終+1・100%を確認、全5図screenshotを目視した。矢印markerの太さも元図に近い単位指定に調整。原文Golden2＋対話図4の最終 **6/6成功**、typecheck/build/diff-check成功。全suiteの完了後に公開する。

原fixture `grover_iam_indetail-original.json`、全文/TeX `grover-indetail-text.json`、`tests/grover-indetail.spec.ts`、資料 `/tmp/qtw-port-grover_iam_indetail.json`、`/tmp/qtw-scroll-grover-indetail-local.json`、`/tmp/qtw-grover-indetail-figure-*-dpr*-*.png`、`/tmp/qtw-grover-indetail-reference-*`。14:52の再確認ではqniapp/qniのopen PRは0件、同ページPRなし。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。

最初の全suite実行中に最終buildで配信distを入れ替えたため、既存bb84/title-dividerのMathJax待ち2件がtimeoutになった。配信成果物を固定し、buildと並走させず全suiteを最初から再実行した結果 **320tests成功**。製品を変更してtimeoutを隠す修正やretry増加は行っていない。原文/TeX/対話図の最終6/6も成功、typecheck/build/diff-check成功。公開へ進む。


### grover_iam_indetail公開確認完了

**82d7c06 / Pages38116522424 success**。公開390/1440で元本文diff0/原TeXdiff0、画像5→自作対話図5だけが承認済み差、原文無変更/全体位相注記なし。公開Golden2＋DPR1/2対話図4の **6/6成功**、console-page errors0、body/content/shadow内scrollbar0/文書横overflow0。座標/平均/反射/最終+1をクリック/キーボード操作後も不変、右の振幅1/100%、原点/赤点/白点のSVG座標を確認した。原画像creditsなし、削除0。palette/max-wire-countは原に回路0なので該当なし、step0/toolbarも該当なし。共通prose Bold (gateタグ0)/図のRegular/MathJax3.2.2/Qni/実験版を維持。

解析の各25%/平均0.25/反射後0・1/100%を実GPUのD参照で4/4確認、全suite **320tests成功** と最終6/6/typecheck/build/diff-check成功。公開結果を `grover-indetail-public-verification.json` に保存。資料 `/tmp/qtw-port-grover_iam_indetail.json` (public)、`/tmp/qtw-scroll-grover-indetail-public.json`、`/tmp/qtw-grover-indetail-public-tests.log`、公開20スクリーンショット `/tmp/qtw-grover-indetail-figure-*-dpr*-*.png`。前ページnative -DのJSON/上流/pin348992f/Binaryen123を変更していない。本番readback/CPU fallbackなし。

### sidebar次 readout_of_patterns の端点表現でSTOP / hard stop15:13

grover_iam_indetail公開確認後に最新mainと原liveを読み、原回路の準備prefix6列/全21列を公開WebGPUで390/1440照合した。N16のa_j=(1/4)exp(iπj/4)、各p=1/16=6.25%、斜めの±0.17678は±1/(4√2)の小数5桁表示と一致する。負指数QFTではb_k=(1/16)Σ exp(2πi(2-k)j/16)=δ[k,2]、答2/100%も正しい。

ただし原文 **「|15⟩までで位相が2回転」** を厳密に読むと、0から15まで15間隔×45°=**675°=1.875回転** であり、16標本に8標本1周期を2回含むという意味とは異なる。GPUも両幅で最後のunwrapped phase **675.0000096593471° = 1.87500002683152回転**。全16入力signed実部/虚部/各6.25%を確認し、QFT後index2 re **0.9999998807907104**/im **4.5485744948337015e-08**/p **0.9999997615814372**、他0、norm≈1/errors0、**4/4成功**。周波数を1.875に変える提案ではない。

**提案する1か所の修正**: source `{% ket 15 %} までで位相が 2 回転しています。` → `8 個の振幅からなる 1 周期のパターンが 2 回繰り返されています。` 他の本文/45°/周波数2/6.25%/100%/JSON/48円表示は無変更。ユーザーへ承認を質問し、未承認のまま本文を変えずSTOP。同ページのopen PRなし (15:02に全open0件)。原liveの段落/原21列JSONも一致。詳細 [readout-of-patterns-endpoint-blocker.md](readout-of-patterns-endpoint-blocker.md)。

**readout_of_patterns未公開、route/移植fixture未作成。** 原画像0/置換0/削除credits0、palette[]×1 (源にpaletteなし)、max-wire-count1×1、4-wire/21列/run-buttonなし、48円表示/sidenote1/Orbit0。移植後の本文diff/3901440/DPR/scroll/step0/toolbarは未検証。永続 `readout-pattern-gpu-verification.json`、資料 `/tmp/qtw-readout-pattern-*`。inverse_qft以降も停止。owned preview4352と診断browserを終了し、通常pushで記録を同期する。


## 2026-10-11 readout_of_patterns承認済み1訂正を移植 / hard stop15:41

高宮さんが **`{% ket 15 %} までで位相が 2 回転しています。` → `8 個の振幅からなる 1 周期のパターンが 2 回繰り返されています。`** だけを承認。`docs/readout-of-patterns-approved-source.html` の変更を逆に戻すと元source全文に完全一致する。ほかの本文・数値・原JSONを変更しない。旧endpointブロッカー文書は解決済みとした。

`src/pages/readout_of_patterns.astro` を移植。原 **21列/4-wireの1JSON無変更**、palette **[]×1** (源にpaletteなし)、max-wire-count **1×1** (4本をtruncateしない)、原run-buttonなし。原円表示 **48個 (入力16×2/出力16)** の複素振幅/順序/data-ket/lgサイズを無変更。16個の長い列はdesktop8列/mobile4列の自然なgrid折り返しにし、円の大きさを縮小/clip/zoomせず本文内scrollを除去した。ariaの4bit ket幅を明示する。nativeの水平panは通常通り可能。

画像0/自作画像置換0/credits削除0、sidenote1/Orbit0を保持。prose H/PHASE/control/SWAPはBold、native Regular、MathJax3.2.2/self-hosted/Qni/実験版/Qniで開くを維持。将来のinside_the_qftは原Qniへのリンクを維持し、未移植のrouteを捏造しない。open PRは15:12に全0件、同ページPRなし。

解析: a_j=(1/4)exp(2πi·2j/16)。各 |a_j|²=1/16=**6.25%**、位相差45°/周期8/16標本に2周期。軸上±0.25/±0.25i、斜めの±1/(4√2)=±0.1767766952966369は原小数5桁±0.17678と一致。QFTのb_k=(1/16)Σ exp(2πi(2-k)j/16)=δ[k,2]、答 **|2⟩ amp+1/確率100%**、他0。等間隔の位相の平均0で振幅増幅だけでは大きさは均等のまま。端点0→15は675°だが周波数2は変えない。

既存GPU結果で原準備prefix6列/全21列を390/1440全16signed実部/虚部/確率と照合、**standalone4/4**。今回の実記事nativeでも最後のSwap列へpan/クリックし、両幅で **index2 re=0.9999998807907104 / im=4.5485744948337015e-08 / p=0.9999997615814372**、他0、norm≈1/errors0、**2/2成功**。原のラベル/冗長step/Swapを削除していない。永続 `readout-pattern-gpu-verification.json` にnativeLocalを追加。

ローカル390/1440の本文diffは承認1か所以外0、TeXdiffは承認で削除する|15⟩の1件だけ、それ以外0。原48円表示・全counts (変更するket15除く) /原JSON一致。errors0、running/step0/norm≈1、body/content/shadow内scrollbar0/文書横overflow0。DPR1/2×両幅4/4で6個のprose glyphすべてBold/overflow-errors0。全2ツールバーundo/redoのみ (85/85/0画素)、旧trash位置クリックでも現在回路URL不変。390スクリーンショットを目視確認した。

原fixture `readout_of_patterns-original.json`、承認済み全文/TeX `readout-pattern-approved-text.json`、`tests/readout-patterns.spec.ts` は全文inverse whitelist/TeX/原JSON/48振幅/配列/制限/no-scroll/errorsを守る。資料 `/tmp/qtw-port-readout_of_patterns.json`、`/tmp/qtw-readout-pattern-local-*`、`/tmp/qtw-scroll-readout-pattern-local.json`、`/tmp/qtw-pr63-toolbar-readout-pattern-local.json`。typecheck/build/diff-check成功、固定distで全suite完了後に公開する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。

readout_of_patterns: 固定distで全suite **326tests成功**、typecheck/build/diff-check成功。承認1か所だけを反映して公開へ進む。


### readout_of_patterns公開確認完了

**7564c97 / Pages38117749165 success**。公開390/1440で承認1訂正以外の本文diff0、TeXは承認で削除する|15⟩以外diff0、原21列/4-wire JSON無変更、48円表示・palette[]/max-wire-count1/run-buttonなしを保持。errors0、running/step0/norm≈1、body/content/shadow内scrollbar0/文書横overflow0、DPR1/2×両幅4/4/prose全6gate Bold/native Regular。公開native最終signed|2⟩ **2/2成功** (standalone4+localnative2+publicnative2=8/8)、全2ツールバーundo/redoのみ85/85/0画素、旧trash位置クリック無効果。画像置換0/削除credits0/sidenote1/Orbit0。全326tests/typecheck/build/diff-check成功。

15:24に新open **qniapp/qni#578 / heade5af862adb460d9cc7740feb550d38f54f212852** を取得。承認した末尾の本文1修正と完全一致。PRのinspector class順序変更は採用せず、承認済みsourceは1本文編集だけ。inverse_qftへの変更なし。GPU fixtureの使わない旧Grover由来target診断ラベルを削除し、frequency2を明示した (GPU結果や照合条件は元から正しい)。公開結果にnativePublic/toolbarsPublic/glyphsPublicを追加した。

### inverse_qft（逆QFT）本文/数値/JSON無変更で移植

sidebar次の最新mainを確認。同ページのopen PRなし (#578は前ページの承認済み1修正だけ)。原 **20列/4-wireの1JSON無変更**、palette **[]×1** (源にpaletteなし)、max-wire-count **1×1**、原run-buttonなし。原 **32円表示 (入力16/出力16)** の振幅/data-ket/lgサイズ/順序を無変更。自然なdesktop8列/mobile4列gridで縮小/clip/zoomせず、4bit aria ket幅を明示。画像0/自作画像置換0/credits削除0、sidenote0/Orbit0。本文/数値/TeX無変更、共通prose Bold維持 (元gateタグ0)/native Regular、Qni/実験版/MathJax3.2.2/Qniで開くを維持。

解析: 入力 **|2⟩ amp+1/確率100%**、他0。出力a_j=(1/4)exp(2πi·2j/16)、各p=**6.25%**、位相差45°/周期8、軸上±0.25/±0.25i、斜め±1/(4√2)=±0.1767766952966369 (原±0.17678の5桁表示に一致)。原QFTの12gateを逆順にし、H/SWAPは自己逆、全6CPHASE角度は負→正に反転しているので逆演算。末尾のidentity slotを含む原JSONを変更していない。

実GPUで入力までの原prefix5列/全20列を390/1440照合 **4/4成功**。実記事native最終H(q3)へpan/クリックして全16signed実部/虚部/各6.25%を両幅照合 **2/2成功**、norm≈1/errors0。さらに原12gate blockを両順に合成した検証専用回路で全16basisを390/1440確認し、QFT→IQFTとIQFT→QFTの **identity64/64成功**、元basis amp+1/他0に戻ることを実GPUで確認。全70/70の証拠を `inverse-qft-gpu-verification.json` に保存。合成回路は記事に追加していない。

ローカル390/1440本文/TeXdiff0/全counts一致/原JSON一致、errors0、running/step0/norm≈1、本文/content/shadow内scrollbar0/文書横overflow0、DPR1/2×両幅4/4。全2ツールバーundo/redoのみ85/85/0画素、旧trash位置クリック無効果。390スクリーンショットを目視確認。初期preview4354要求は既存4353を使うAstro daemonの仕様で新ポートを起動せず、ERR_CONNECTION_REFUSEDとなったためそのprobe/suiteを停止。既存4353にURLを合わせ、HTTP-ready確認後、固定distで全suiteを最初から再実行 **332tests成功**。製品の不具合や数値不一致ではなく、検証hostの指定を修正した。identity最初のprobeの旧Grover targetラベルもcase%16に直し、64件全件成功。

原fixture `inverse_qft-original.json`、全文/TeX `inverse-qft-text.json`、`tests/inverse-qft.spec.ts`。資料 `/tmp/qtw-port-inverse_qft.json`、`/tmp/qtw-inverse-qft-{gpu-results,local-embed-results,local-glyphs}.json`、`/tmp/qtw-scroll-inverse-qft-local.json`、`/tmp/qtw-pr63-toolbar-inverse-qft-local.json`、`/tmp/qtw-qft-inverse-identity-*`。typecheck/build/diff-check成功。本文・回路・数値の不一致/新しい確認事項なし。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。公開へ進む。


### inverse_qft公開確認完了 / 15:41 hard stopへ

**ee4d539 / Pages38118496993 success**。公開390/1440で原本文/TeXdiff0/全counts一致/原20列4-wire JSON無変更、32円表示の振幅・順序無変更、palette[]/max-wire-count1/run-buttonなし、画像0/置換0/削除credits0/sidenote0/Orbit0。errors0、running/step0/norm≈1、body/content/shadow内scrollbar0/文書横overflow0、DPR1/2×両幅4/4、共通prose Bold (原gateタグ0)/native Regular/Qni/実験版/MathJax3.2.2/Qniで開くを維持。

公開nativeの最終H(q3)を選んで、全16状態のsigned実部/虚部/各6.25%を解析a_j=(1/4)exp(2πi·2j/16)と照合 **2/2成功**。入力|2⟩100%、出力の±0.25/±0.17678等の原5桁表示・周波数2/45°/周期8も確認。standalone4/localnative2/publicnative2/両順全basisのidentity64を合わせて **72/72成功**、norm≈1/errors0。全2ツールバーundo/redoのみ85/85/0画素、旧trash位置クリック無効果。`inverse-qft-gpu-verification.json` にnativePublic/toolbarsPublic/glyphsPublicを保存。全332tests/typecheck/build/diff-check成功。

資料 `/tmp/qtw-port-inverse_qft.json` (public)、`/tmp/qtw-inverse-qft-public-{embed-results,glyphs}.json`、`/tmp/qtw-scroll-inverse-qft-public.json`、`/tmp/qtw-pr63-toolbar-inverse-qft-public.json`。同ページPRなし、#578は前ページの承認1本文編集だけ。今回はreadout_of_patterns→inverse_qftをsidebar順で公開し、新しい本文/数値/JSONの不一致や判断待ちはない。

次の **inside_the_qft（QFTの内部）** は、15:41 hard stopまでに原文/全数値/図/GPU/E2Eを検証して公開する時間が足りないため、route/fixtureを作成せず未着手・未公開のままにする。nextページの検証済みという主張はしない。owned preview4353/診断browserを終了し、通常pushでmain/worktreeを同期する。最後の記録だけのPagesは終了時点の状態を報告する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。


## 2026-10-11 inside_the_qftの上下記述2か所でSTOP / hard stop16:10

前の最後の記録 **16ded7a / Pages38118783708 success** を確認し、完了済みreadout_of_patterns/inverse_qft/PR #63等は再実施せず結果を保持した。sidebar次 **inside_the_qft（QFTの内部）** の最新mainと原liveを実Chromium390/1440で確認。原11JSONがsourceと一致した。

**1. PHASEなしの行:** 短い周波数2準備回路は上からP(π/4)/P(π/2)/P(π)/なし。PHASEがないのは上から4番目 (下から1番目) だが、原文は「この回路では**下から4ビット目**にだけPHASEがありません」。**2. 1の行:** 1xπ/4ミニ回路の入力は上から0/0/1/0。1は上から3番目 (下から2番目) だが、原文は「ここで**下から3ビット目**のみが1なので」。直前の原文には同じ入力を「入力の**上から3ビット目**が|1⟩」と明示しており、記述内でも向きが一致しない。原サイトの2回路スクリーンショットで4本と行位置を確認した。

解析/GPU: 入力は|0100⟩=4、q1=0/q2=1/q3=0なのでπ/2とπ/8制御はoff、π/4制御だけon。H(q0)+CPHASE(π/4)後は **|4⟩ amp1/√2、|5⟩ amp(1+i)/2、各50%**。公開実GPUでは両幅でindex4 input re1/im0/p1、最終index4 re **0.7071067690849304**/im0/p **0.4999999828857291**、index5 re=im **0.4999999701976776**/p **0.499999940395357**。短い周波数2準備回路の全16signed値もa_j=(1/4)exp(iπj/4)と一致、focused **6/6成功**、norm≈1/errors0。

さらに原全11回路を両幅でsigned全状態と解析照合し、**22/22成功**。回路0/1/2/3/5/6は周波数2の一様16状態/各6.25%、回路4は周波数3でa_j=(1/4)exp(i3πj/8)/各6.25%。回路7のπ/4に加え、回路8は|4⟩:1/√2と|6⟩:i/√2、回路9は|0⟩:1/√2と|4⟩:-1/√2、回路10は|4⟩/|12⟩とも1/√2、各50%。P(2π)の恒等、位相単位n×2π/2^N (Nは量子bit数)、周波数3で6π/16とその1/2/4/8倍、SWAPで2(0010)→4(0100)、逆QFTの5block (入力を除く) も整合する。元の16円表示の±0.17678は1/(4√2)の5桁表示と一致。ほかの数値/回路には不一致を見つけていない。

**提案する訂正は2か所だけ**: `この回路では下から 4 ビット目にだけ` → `この回路では上から 4 ビット目にだけ`、`ここで下から 3 ビット目のみが 1 なので` → `ここで上から 3 ビット目のみが 1 なので`。ほかの本文/数字/JSON/図を変えず、正しい回路の入力や行を移す修正はしない。承認を質問してSTOP、未承認のまま原文は変更しない。

15:44に全open PRを確認し、同ページPRなし。qniapp/qni#578はreadout_of_patterns.htmlだけで、今回の2箇所を承認するものではない。詳細 [inside-qft-direction-blocker.md](inside-qft-direction-blocker.md)。永続 `inside-qft-direction-verification.json` にsourceSHA256/原11JSON/原live段落/両幅のGPU6+22結果を保存。資料 `/tmp/qtw-next-inside_the_qft.html`、`/tmp/qtw-inside-qft-original-*` (1440・390各2回路screenshot)、`/tmp/qtw-inside-qft-direction-*`、`/tmp/qtw-inside-qft-all-gpu-*`。

**inside_the_qft未公開、route/移植fixture未作成、原文/JSON無変更。** 原画像0/置換0/削除credits0、paletteなし (移植時[]×11)、max-wire-count1×11、原4-wire/列数20,6,6,21,21,32,26,8,7,6,5/run-buttonなし、16円表示/sidenote0/Orbit0。移植後の本文diff/scroll/step0/toolbar/DPRは未検証。qft_adder以降も停止し、承認を待つ。owned診断browserは終了済み、previewは開始していない。通常pushで記録を同期し、最後の記録だけのPages状態を報告する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。


## 2026-10-11 inside_the_qft承認2訂正を移植 / hard stop16:28

高宮さんが **`この回路では下から 4 ビット目にだけ` → `この回路では上から 4 ビット目にだけ`**、**`ここで下から 3 ビット目のみが 1 なので` → `ここで上から 3 ビット目のみが 1 なので`** の2か所だけを承認。`docs/inside-qft-approved-source.html` の2訂正を逆に戻すと元source全文に完全一致する。その他本文/数値/JSONを変更しない。旧direction文書は解決済みとした。同ページのopen PRなし、15:58の全openは0件。

`src/pages/inside_the_qft.astro` を移植。原 **11JSON/全4-wire/20,6,6,21,21,32,26,8,7,6,5列** を無変更。palette **[]×11** (源にpaletteなし)、max-wire-count **1×11** (4本をtruncateしない)、原run-buttonなし。原16円表示の複素振幅/data-ket/lgサイズ/順序を無変更。自然なdesktop8列/mobile4列gridにして、円の大きさの縮小/clip/zoomなしで本文内scrollを除去し、ariaの4bit ket幅を明示する。nativeの水平panは通常通り可能。画像0/自作画像置換0/credits削除0/sidenote0/Orbit0を保持。

解析は先のdirection文書・GPU22件のとおり。周波数2はa_j=(1/4)exp(iπj/4)、周波数3はa_j=(1/4)exp(i3πj/8)、各6.25%。N量子bit/周波数nの単位角n×2π/2^N、係数1/2/4/8、n3/N4の6π/16とその倍数、P(2π)=I、SWAPで2(0010)→4(0100)、逆QFTの5blockも正しい。単独blockはπ/4:|4⟩1/√2と|5⟩(1+i)/2、π/2:|4⟩1/√2と|6⟩i/√2、π:|0⟩1/√2と|4⟩-1/√2、2π:|4⟩/|12⟩とも1/√2、各50%。16円表示の±0.17678は1/(4√2)の5桁表示に一致。数値やゲートを変更する必要なし。

今回の実記事nativeで全11回路の最後の有効列に水平pan/クリックし、390/1440の全signed実部/虚部/確率を上記解析と照合 **22/22成功**、norm≈1/errors0。standalone全22＋今回native22の44/44、さらに方向用prefix等focused6/6の証拠も保持する。3つの角度π/2/π/4/π/8の制御はq1=0/q2=1/q3=0でπ/4だけon、入力|4⟩100%も確認済み。`inside-qft-direction-verification.json` にnativeLocal/toolbarsLocal/glyphsLocalを追加した。

ローカル390/1440で承認2訂正以外の本文diff0/原TeXdiff0/全counts・16振幅・全11JSON一致、errors0、running/step0/norm≈1、body/content/shadow内scrollbar0/文書横overflow0。DPR1/2×両幅4/4/prose全gate Bold/native Regular、MathJax3.2.2/self-hosted/Qni/実験版/Qniで開く維持。全22ツールバーundo/redoのみ85/85/0画素、旧trash位置クリックでも現在回路URL不変。

原fixture `inside_the_qft-original.json`、承認済み全文/TeX `inside-qft-approved-text.json`、`tests/inside-qft.spec.ts` はinverse whitelist/全TeX/原11JSON/16振幅/制限/no-scroll/errorsを守る。資料 `/tmp/qtw-port-inside_the_qft.json`、`/tmp/qtw-inside-qft-local-*`、`/tmp/qtw-scroll-inside-qft-local.json`、`/tmp/qtw-pr63-toolbar-inside-qft-local.json`。typecheck/build/diff-check成功、固定distで全suite完了後に公開する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。


### inside_the_qft公開確認 / qft_adderでSTOP

inside_the_qft **dfb20f9 / Pages38120464056 success** を公開後に再確認。公開実記事native全11回路×390/1440 **22/22 signed最終ベクトル成功**、standalone22/localnative22/publicnative22=**66/66** (別途focused6保持)。公開390/1440で承認2訂正のみtextdiff0/TeXdiff0/原11JSON・16円値・順序・lgサイズ・counts一致、errors0/running/step0/norm≈1、body/content/shadow内scrollbar0/文書横overflow0、DPR1/2×両幅4/4/本文gate Bold/native Regular、22undo/redo-onlyツールバー85/85/0画素、旧trash位置クリックURL不変。`nativePublic/toolbarsPublic/glyphsPublic/scrollPublic` をfixtureへ保存。**338 tests/typecheck/build/diff-check成功**。公開scroll/toolbarの最初の呼出はenv未指定で旧local4350へのERR_CONNECTION_REFUSEDになったため、公開URLを明示して完全再実施、2幅/22件と0findingsを確認した。検証harnessの宛先問題であり製品の不一致ではない。資料 `/tmp/qtw-port-inside_the_qft.json`、`/tmp/qtw-inside-qft-public-*`、`/tmp/qtw-scroll-inside-qft-public.json`、`/tmp/qtw-pr63-toolbar-inside-qft-public.json`。

16:14確認時に新 **qniapp/qni#579** (head9019a7927c550d885d765cf8dec4b7d33634ba01) がopen。本文は承認2訂正と一致し、余分なinspector class順序変更は採用しない。原コードの変更を広げず、このページの新しい質問はない。

次の **qft_adder** を最新main/原liveの390/1440で確認し、2件でSTOP。**(1)** `a += b のブロック (左から 3 番目)` と書かれるが、原52列JSON・原ブラウザーでラベルはa=3/b=1/逆QFT/a+=b/QFTで、コアは **左から4番目**。**(2)** frontmatter `prev: QFT の内部` に対して `prev_url: ./inverse_qft.html`。原実サイトのfooter「QFT の内部」を両幅で実際にclickすると `/qni/inverse_qft.html`、heading **逆 QFT** に移動した。sidebarの同名linkは正しいinside_the_qftで、footerだけ間違っている。

**提案する正確な訂正:** `a += b のブロック (左から 3 番目)` → `a += b のブロック (左から 4 番目)`、frontmatter `prev_url: ./inverse_qft.html` → `prev_url: ./inside_the_qft.html`。他の本文/数値/JSONを変えず、コアを移動したりprepラベルを結合する修正はしない。承認を質問済み、未承認のまま移植/公開/本文URL変更を止めた。qft_adderを変更するopen PRはなく、#579はinside_the_qftだけ。

qft_adderの数値・回路は正しい。原3JSONは **22/52/12列/各7-wire**、paletteなし (移植時[]×3)、max-wire-count **1×3**、run-buttonなし/title「QFT で足し算」保持が必要。a3/b1初期index19、通常加算とQFT加算はa4/b1最終index20/100%。逆QFT prefix25列はindex16+jでamp(1/4)exp(i3πj/8)/各6.25%、加算prefix37列は同じindex16+jでamp(1/4)exp(i4πj/8)/各6.25%。コアの各CPHASE角は2π×2^qa×2^qb/16で、a(j)・b間の位相exp(i2πjb/16)を加える。3+1を周波数3→4とする動作は正しい。元controlled dot数19→9 (targetゲートはいずれも9) でcontrol削減の説明も整合する。入力のない単独コアは初期|0⟩から最後まで|0⟩/100%。テストだけでコア9角の符号を負にした52列は **3-1=2**/b1保持/index18/100%。原記事の3JSONやゲートを変更しない。

原3回路×両幅GPU **6/6**、IQFT/加算の2prefix・初期input・符号反転引算×両幅 **8/8**、合計 **14/14 signed値/確率成功**、norm≈1/errors0。永続 `qft-adder-blocker-verification.json` に原3JSON/原liveラベル/実footerclick/原GPU6/テストprefix3+引算JSON/GPU8を保存。詳細 [qft-adder-blocker.md](qft-adder-blocker.md)。画像0/置換0/credits削除0/sidenote1/Orbit0。未公開、route/移植fixture未作成、本文/URL/JSON未変更、移植後のtext/TeX/scroll/DPR/toolbar/step0等は未検証。次 **eigenphases** 以降も停止。

資料 `/tmp/qtw-next-qft_adder.html`、`/tmp/qtw-qft-adder-original-*` (両幅3回路/prev-link screenshotとlive)、`/tmp/qtw-qft-adder-prev-link-results.json`、`/tmp/qtw-qft-adder-stage-*`。owned診断browserは終了、preview4353は停止する。通常pushで記録を同期し、記録だけのPagesと内容公開を区別して報告する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし、hard stop16:28。


## 2026-10-11 qft_adder承認2訂正を移植 / hard stop16:57

高宮さんが **`a += b のブロック (左から 3 番目)` → `a += b のブロック (左から 4 番目)`**、**下部prev「QFT の内部」のhrefをinside_the_qftへ** (原frontmatter `prev_url: ./inverse_qft.html` → `prev_url: ./inside_the_qft.html`) の2件だけを承認。`docs/qft-adder-approved-source.html` の2訂正を逆に戻すと元source全文に完全一致。ほかの本文/数値/JSONに触れない。旧blockerは解決済みとした。open PRは#579 (前ページ) のみで、qft_adderの同ページPRはない。

`src/pages/qft_adder.astro` を移植。原 **3JSON/各7-wire/22,52,12列** を無変更、title **QFT で足し算** 保持。palette **[]×3**、max-wire-count **1×3** (7本をtruncateしない)、run-buttonなし。画像0/置換0/credits削除0/sidenote1/Orbit0を保持。sourceのsidenote phase_adderと文内位置/ゲートの順序も保持した。

当サイトにまだ共通prev/next機能がないため、TutorialLayout footerに空なら何も出ないnamed slot `footer-navigation` を1行だけ追加し、qft_adderだけに原label **QFT の内部** と左chevron、44px以上のhit area、`/qni-tutorial-webgpu/inside_the_qft/` への下部linkを置く。未承認の他ページprev/nextを追加しない。見た目を検査したところ最初は既存「ページ一覧」とくっついて見えたため、linkをfit-contentのblock-flexにして別行にした。再build後のfooter画像で両者が独立した行になることを確認。390/1440×DPR1/2の **4/4実clickでinside_the_qft/へ遷移、heading QFT の内部** を確認した。

解析と先の14GPUは保持。a3/b1入力index19、普通の加算とQFT加算はa4/b1/index20/100%。逆QFTprefix25列はindex16+jの(1/4)exp(i3πj/8)/各6.25%、加算prefix37列は(1/4)exp(i4πj/8)/各6.25%、b1を保持する。各CPHASE角2π×2^qa×2^qb/16がphase exp(i2πjb/16)を加え、周波数3→4になる。sourceのcontrols19→9も正しい (targetゲートは両方9)。入力なし単独コアは|0⟩→|0⟩/100%で、この結果だけを加算効果の証明とはせず、2prefixと最終状態を使う。コア9角をテストだけで負にした52列では3-1=2/b1保持/index18/100%、原JSONに符号変更は書かない。

実記事nativeの全3回路を最後の有効列まで水平pan/クリック、390/1440で **6/6 signed最終値/確率成功**、norm≈1/errors0、各state vectorは128状態/7-wireを保持。最初のprobeは前の4-wire用helperの`v.slice(32)`をleakageとみなして、正しいindex20=1をleakage1と誤判定した。原7-wireに合わせて256scalar/128statesを明示し、その外だけをleakageにし、未使用target15も削除して全6件を再実施。製品の数値/回路を直す必要はなく、helperの次元前提の誤りである。原standalone6+stage8+native6=**20/20**、7-wireを確認した。

ローカル390/1440で承認ordinalだけの本文diff0/原TeXdiff0/全counts・全3JSON・sidenote一致、errors0/running/step0/norm≈1、body/content/shadow scrollbar0/文書横overflow0。DPR1/2×両幅4/4/prose全gate Bold/native Regular。全6toolbar undo/redoのみ85/85/0画素、旧trash位置クリックでも現在回路URL不変。fixtureにnativeLocal/toolbarsLocal/footerLocal/glyphsLocal/scrollLocalを保存。資料 `/tmp/qtw-port-qft_adder.json`、`/tmp/qtw-qft-adder-local-*`、`/tmp/qtw-scroll-qft-adder-local.json`、`/tmp/qtw-pr63-toolbar-qft-adder-local.json`。typecheck/build/diff-check成功、固定distの全suiteが終わってから公開する。pin348992f/Binaryen123/GPU-only、本番readback/CPU fallback/上流変更なし。


qft_adder **346 tests/typecheck/build/diff-check成功**、固定dist fullsuite5.8分で成功。16:39確認の新 **qniapp/qni#580** (head6d25cfdedc93f95595c22b429602bf3473dbd0c4) は承認ordinal/prev_urlの2訂正と一致し、余分なinspector class順変更は採用しない。公開前にembed probeのbase設定をさらに点検し、phase名publicだけでは環境変数なしの場合local4353へ行く共通helper仕様を発見した。publicなら公開baseを選ぶようhelperを直し、各resultにbaseも明記し、今回のqft_adderだけでなく前のinside_the_qftの公開22件も実公開URLを明示して再実施する。これは検証harnessの宛先問題で、記事/数値/JSON/本番コード変更ではない。


qft_adder **48d9a42 / Pages38122182373 success** を実公開URLで確認済み。公開native **6/6** (resultにbase=https://qniapp.github.io/qni-tutorial-webgpu/を明記)、standalone原6+stage8+localnative6+publicnative6=**26/26 signed値/確率成功**、norm≈1/errors0。公開390/1440で承認ordinalだけtextdiff0/TeXdiff0/原3JSON・title・sidenote/counts一致、DPR1/2×両幅4/4/proseBold/nativeRegular/running/step0、body/content/shadow scrollbar0/文書横overflow0、6undo/redo-only toolbars85/85/0画素・旧trash位置click URL不変。公開下部「QFT の内部」のhref=/qni-tutorial-webgpu/inside_the_qft/を両幅/DPR1/2 **4/4実click、destination inside_the_qft/・heading QFT の内部** で確認。346 tests/typecheck/build/diff-check成功。fixtureへnativePublic/toolbarsPublic/footerPublic/glyphsPublic/scrollPublic保存、資料 `/tmp/qtw-port-qft_adder.json`、`/tmp/qtw-qft-adder-public-*`、`/tmp/qtw-scroll-qft-adder-public.json`、`/tmp/qtw-pr63-toolbar-qft-adder-public.json`。

inside_the_qftのpublic名probeで実際はlocalを見ていた宛先問題も解決した。実公開URLを明示して全11×両幅 **22/22 signed値成功**、承認2訂正のみ本文diff0/TeXdiff0/全counts一致、DPR4/4/gatesBold/errors0を再実施し、nativePublicにはbaseも明記、glyphsPublicも新結果で置き換えた。前の公開scroll/toolbarはすでにQTW_AUDIT_URLを明示して2幅/22件で検証済み、その結果を保持する。従来のpublic名だけの呼出を公開の証明とは扱わず、今回は実公開22＋standalone22＋local22=66/66に確認し直した。本番コード/原文/原JSONを変える必要はなかった。

### 次eigenphases: 数値は正しいがunique/独自の表現について承認待ち

16:44最新main・原live390/1440を確認した。原2JSON (各5列/1-wire) が一致、mini_qniの原max-wire-countは **2×2**、palette指定なし ([]×2)、run-buttonなし。元36円表示/画像0/置換0/credits削除0/sidenote0/Orbit0。同ページopen PRなし (openは#579/#580)。

H=[[1,1],[1,-1]]/√2、c=cos(π/8)、s=sin(π/8)。H(c,s)=(c,s)は固有位相0、H(-s,c)=(s,-c)=-(-s,c)は固有位相π。c²×100=**85.35533905932738%**、s²×100=**14.644660940672624%** で原85.3553/14.6447は正しい。Ry(π/4)で(c,s)、Ry(5π/4)で(-s,c)を準備する原5列も正しい。X±、Y±、Zの|0⟩/|1⟩、PHASE Φの|0⟩/|1⟩はそれぞれ原表の固有位相0/π/Φに一致する。ZとPHASEは同じ固有状態を共有し、特に|0⟩はどちらも固有位相0でもある。これは異なる命令でも固有状態 (あるいは1つの固有状態/位相の組) を共有できる実例である。完全な全固有状態/位相の組によるスペクトル分解は演算を特徴付けられる。

原Ry/Hの準備prefix2＋最終2、X/Y/Z/PHASEの各±またはbasis2＝計12テスト回路を実AMD WebGPU/3901440で **24/24全signed値/確率成功**、norm≈1/errors0。PHASEはΦ=π/4を実GPUで確認し、任意Φのmatrix diag(1,e^iΦ)も解析した。|0⟩はZ/Pとも+1/phase0で、|1⟩はZで-1/phaseπ、Pπ/4で(1+i)/√2/phaseπ/4。これらのテスト用回路を本文に追加しない。本番readback/CPU fallback/上流変更なし。最初のprobeはexpected配列のimportが不足したReferenceErrorだったため追加し、全24件を再実施した。数値の不一致ではない。

**表現の解釈の質問:** 本文「ユニークな状態ベクトル」「独自の (固有の) 状態ベクトル」を『命令ごとに異なる固有状態』と読むと、同じ表のZとPHASEが|0⟩/|1⟩を共有する事実と食い違う。一方、単に『固有状態という特別な状態』の意味なら原文維持という選択もある。明確な数値誤りとは区別し、**原文維持で移植するか、`ユニークな状態ベクトル` → `状態ベクトル`、`独自の (固有の) 状態ベクトル` → `固有状態と呼ばれる状態ベクトル` の2語句だけを訂正するか** を質問し、承認なしに進めない。その他の本文/数値/36円/原2JSONは変えない。固有位相の説明や追加noteを書き足す提案はしない。

詳細 [eigenphases-wording-question.md](eigenphases-wording-question.md)。永続 `eigenphases-wording-verification.json` に原2JSON/実live段落・table・limits/12テスト回路/解析期待値/24GPU結果を保存。**eigenphases未公開、route/移植fixture未作成、原文/JSON無変更。** 移植後のtext/TeX/scroll/DPR/toolbar/step0等は未検証、次のquantum_phase_estimation_circuit以降もSTOP。資料 `/tmp/qtw-next-eigenphases.html`、`/tmp/qtw-eigenphases-original-*`、`/tmp/qtw-eigenphases-{test-circuits,expected,gpu-results}.json`、`/tmp/qtw-eigenphases-gpu.mjs`。owned browsers終了・preview4353を停止、通常pushで記録を同期し、内容公開と記録だけのPagesを区別する。pin348992f/Binaryen123/GPU-only、hard stop16:57。

## 2026-10-11 eigenphases承認2語句を移植 / 新機械GPUなし / hard stop17:30

今回の明示指示が先の保留・代替案を上書きした。高宮さん承認は **`ユニークな状態ベクトル` → `状態ベクトル`**、**`独自の (固有の) 状態ベクトル` → `固有状態`** の各1回だけ。`固有状態と呼ばれる状態ベクトル` は採用しない。その他の本文/数値/36円表示/TeX/JSONに触れない。`docs/eigenphases-approved-source.html` を逆置換すると原source SHA256 `a2ac117ee7f2e88cdd40d97932c5696881f1ec1c0493a568558f9cfc6be53d7d` と完全一致するsource guardを追加した。旧wording質問は解決済み。

`src/pages/eigenphases.astro` を追加。原 **2JSON/各5列/1-wire** を無変更、palette **[]×2**、max-wire-count **2×2**、原run-buttonなし。原36円の振幅・ket・baseサイズ・順序を保持。元からcustom-tagの円/矢印/H図を既存の軽量部品と原SVGで描画、画像0/画像置換0/削除credits0/sidenote0/Orbit0。本文phaseリンクだけ移植先へ解決する。本文gate10個Bold、図/tableのgate8個Regular、共有header/footer/pinは変更しない。

sourceは既存のshallow qni checkout main `5f342c2b7e3e80b0898ab0c0b9100fa2988dade8` を使用（再cloneなし）。17:05の `gh pr list -R qniapp/qni --state open --json number,title,headRefOid` は0件、同ページPRなし。pin **348992f5d7926d326eaa0f678fa8d89f0894ff54** を維持、上流変更なし。

### この箱で行った検証（GPU検証ではない）

- Python閉形式: c=cos(π/8)、s=sin(π/8)、c²=85.35533905932738%、s²=14.644660940672624%。原85.3553/14.6447の丸めとHの±固有状態が正しい。前回のAMD24件は歴史的証拠として保持し、今回実行したとは主張しない。
- typecheck/build/diff-check成功。Astro buildは `QNI_WEBGPU_SOURCE=/workspace/qni/qni-webgpu pnpm build`。pin不変でWASM再buildはしない。ローカルにnative bundleはまだないため、実公開WASMはCIがpinから構築する。
- `tests/eigenphases.spec.ts` はnavigator.gpuを明示的にundefinedにし、**unsupported状態のまま** source由来の独立Golden全文/9TeX/原2JSON/36振幅、390/1440×DPR1/2、body/content内部scrollbar0/文書横overflow0、console/page errors0を確認。原文との許可差は上記2語句だけ、TeX差0。スクリーンショット `/tmp/qtw-eigenphases-{390,1440}-dpr{1,2}.png`、390/DPR1を目視確認。native canvasの稼働状態の画像ではない。
- 最初のPlaywrightはheadless-shellだけをinstallしたのに既存configがfull Chromium executableを指定していたため起動前に35件失敗。full Chromiumをinstallして製品変更なしで再実行、**37/37成功**（eigenphases4、mock lifecycle31、bb84 Node2）。mock lifecycleはGPU成功の証拠にしない。追加のsource/glyph guard込み **5/5成功**、最終typecheck/diff-check成功。sourceのNode guardは既存方針と同じ `.spec.mjs` に置いた。DOM regressions結果は末尾に記録した。

### 実機確認待ち — 公開eigenphasesの未実施WebGPUチェック

この箱にGPUはない。以下はすべて **実機確認待ち**。GPU成功・native toolbar/step0/normをこの箱で確認済みとは記録しない。各390/1440×DPR1/2、2embedで確認する。

1. 本番pinned bundleの実起動running・errors0、step0のsigned vector |0⟩=(1,0)、norm≈1、初期全gate可視、palette非表示、max2/元1-wire保持。
2. Ry列のsigned GPU readback: (c,s)、(-s,c)、各85.3553/14.6447%（順序に注意）。最後H列: (c,s)、(s,-c)、固有位相0/π、norm≈1。
3. 実canvasのtoolbar **undo/redoのみ**、trashなし・旧位置クリック無効果。一時H削除→undo→redo→undoで回路復元、export JSONも元と一致。
4. GPU稼働時のnative Regular/全gate可視、390/1440×DPR1/2のnativeレイアウト、body/content/Shadow DOM内部scrollbar0・文書横overflow0。今回のunsupported状態のlayout検証では代替しない。

GPU desktop上のコマンド（本番URLを明示。実runner.readStateVectorを使い、モック/CPU fallbackなし）:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-eigenphases-gpu.mjs
```

これは**対話監査**。画面でRy/H列選択、native toolbar編集・旧trash位置操作を行いEnterで進める。signed readback/norm/元JSON復元/errors/scrollはassert、toolbar外観・操作・gate可視性は明示的な手動yes確認として結果に記録する。`/tmp/qtw-eigenphases-gpu/result.json` と各step0/final PNGを保存。GUI環境が必要。scriptのsyntaxだけこの箱で検査し、実GPU実行はしていない。非GPU再現: `pnpm exec playwright test tests/eigenphases.spec.ts tests/eigenphases-source.spec.mjs tests/circuit.spec.ts tests/bb84-text-source.spec.mjs`。追加の全面自動化やpixel比較はorchestratorがgmktecで行ってよい。実機完了後はこの節の待ちを実結果で更新する。

### 次quantum_phase_estimation_circuit: QFT符号不一致でSTOP

原sourceをsidebar順で確認し、**未移植・未公開、phase_kickback以降も停止**。後半図/H全体例の「逆QFT」は正角6個ずつ、120°の3/4bit例は負角。既刊は正角を逆QFT（周波数→位相）、負角をQFT（位相→周波数）と呼ぶため、「後半は逆 QFT 回路そのまま」と120°例が一致しない。

Python閉形式で原数値68.783766%→68.8%、68.489539%→68.5%、17.195942%→17.2%、和85.685480%→85.7%、135°/112.5°・+15°/−7.5°を確認。Hφ=1/2の8/100%は符号どちらでも同じ。正角を120°例に用いるとpeakは3bit5、4bit11（隣10）に反転する。これはGPU結果ではない。

**質問（未承認・未適用）:** 後半図/H全体例の各6CPHASEを負角へ揃え、2block名「逆QFT」→「QFT」、本文「後半は逆 QFT 回路そのままです。」→「後半には、先に説明した QFT 回路を使います。」、まとめ「後半の逆 QFT」→「後半の QFT」にしてよいか？ 原数値/120°JSON/既刊は変えない。証拠・正確な全文置換は [qpe-sign-blocker.md](qpe-sign-blocker.md)、`tests/fixtures/qpe-sign-analysis.json`、再現は `python3 scripts/analyze-qpe-source.py ../qni/apps/tutorial/quantum_phase_estimation_circuit.html --output /tmp/qpe-sign-analysis.json`。

原画像0/credits0、移植する場合はpalette[]×6/max2×1・max1×5/run-button3。今回routeは作らず、移植後checksは一切未実施。原JSON・原文無変更。同ページopen PRなし。通常push前にorigin/mainへrebaseし、force-pushしない。

### eigenphases公開・非GPU確認完了 / 17:23 checkpoint

**9aa03a0 / Pages38124319329 success**。ghでbuild/deploy両job成功を確認。CIがpinned embed/standaloneをビルドし公開した。これはGPUの稼働確認を意味しない。

実公開URLを明示し、非GPUのGolden/source/glyph/JSON/36振幅/scroll/errors guard **5/5成功**、390/1440×DPR1/2の4case（embedはunsupportedのまま）。さらに**元実サイト `https://qniapp.github.io/qni/eigenphases.html` と公開移植ページを実Chromiumで両幅/DPR1/2の4case比較**し、本文は承認2語句だけ・他diff0、原9TeXdiff0、原2JSON一致、source独立Golden一致を確認。原文の無編集textも保存し、比較時だけ承認2語句を適用した。`tests/fixtures/eigenphases-live-verification.json` に両URL/実本文/TeX/JSON/4結果と `WebGPUExecuted:false` を保存。比較script `scripts/compare-eigenphases-original.mjs` はnavigator.gpuをundefinedにし、native稼働を試験しない。

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/compare-eigenphases-original.mjs
```

最初のlocal比較中に長い回帰suiteが終了してowned previewも停止したため、移植ページへの接続がrefusedになった。previewを起動し直しlocal4/4、公開後は公開URL4/4を最初から実施した。製品/本文を修正して接続エラーを隠したものではない。資料 `/tmp/qtw-eigenphases-{live-compare,public-compare,public-tests,targeted}.log`、`/tmp/qtw-eigenphases-live-{original,ours}-{390,1440}-dpr{1,2}.png`、比較JSON。本文以外の既存paper/書体/共有layout/native UI差は維持。

17:22再確認で新open **qniapp/qni#581 / head c5ccb1d3a2fac18a9fc9a431a1cd8852312fa315**。差分は今回承認2語句だけ、PR raw全文が `docs/eigenphases-approved-source.html` と **byte完全一致**。余分な修正なし、同ページの追加質問なし。quantum_phase_estimation_circuitにはPRなし。

### 非GPU回帰の未解決4件（既存ページ・新機械）

27specのDOM/本文/図回帰 **290件中285成功・5失敗**。eigenphases追加に伴いsidebarの固定ported集合へ新slugを加えていなかった1件はtest期待リストへ追加し、source・本文4条件・palette・wire-limit・sidebarを合わせて **8/8再検証成功**。製品sidebarは最初から正しいリンクを表示していた。

残り4件は、今回変更していない既存ページの `ket.spec.ts` 寸法guard×2（期待21px高→実27px、期待font-size19.12→実19.424px）と `content-overflow.spec.ts`×2。新eigenphasesは全体overflow failure一覧に入らず、本文guardは成功。環境はNode26.8.2/Chromium153.0.8010.12/system-ui=Noto Sans Regularで、従来gmktecのChromium152と異なる。原因を環境差と断定していない。

**質問:** まずgmktecと同じフォント/browser環境で再検証して切り分けてよいか？ 固定px期待値の書き換えや共有overflow CSSの一括変更は行わない。詳細・再現commandは [new-machine-layout-blocker.md](new-machine-layout-blocker.md)、原ログ `/tmp/qtw-nongpu-regressions.log`。全suite成功と偽らず、4件を未解決として引き継ぐ。最新typecheck/build/diff-checkは成功。

公開eigenphasesのWebGPU4カテゴリは引き続きすべて **実機確認待ち**、上の対話監査commandでgmktecに引き継ぐ。QPEの符号fixは未承認・未適用・未公開、後続も停止。記録とsidebar期待リストだけを追加で通常pushし、hard stop17:30を守る。

## 2026-10-11 quantum_phase_estimation_circuit: option A承認4項目を移植 / GPUなし / hard stop18:42

高宮さんが `docs/qpe-sign-blocker.md` のoption Aを明示承認。**12個のP角度を負角へ、2block名をQFTへ、後半の本文1文、まとめ1語句だけ**を変更した。`docs/qpe-original-source.html` / `docs/qpe-approved-source.html` と原/fixed fixturesを保存し、原HTMLから承認4置換だけでapproved全文に完全一致するテストを追加。原120°の2例、他本文/全4TeX/数値/4円を変更しない。

### qni eng向け正確なJSON diff

**circuit/column/wireはいずれも0-based、columnは原JSONのblock marker列を含む `cols` index。** circuit 0=mini H固有状態、1=入力・前半図、2=後半単独図、3=H全体例、4=120°/3bit、5=120°/4bit。

| circuit | column | wire | before → after |
|---|---:|---:|---|
| 2 後半単独 | 0 | 0 | `{量子位相推定後半: 逆QFT` → `{量子位相推定後半: QFT` |
| 2 | 4 | 0 | `P(π_2)` → `P(-π_2)` |
| 2 | 5 | 0 | `P(π_4)` → `P(-π_4)` |
| 2 | 6 | 0 | `P(π_8)` → `P(-π_8)` |
| 2 | 8 | 1 | `P(π_2)` → `P(-π_2)` |
| 2 | 9 | 1 | `P(π_4)` → `P(-π_4)` |
| 2 | 11 | 2 | `P(π_2)` → `P(-π_2)` |
| 3 H全体 | 25 | 0 | `{量子位相推定後半: 逆QFT` → `{量子位相推定後半: QFT` |
| 3 | 29 | 0 | `P(π_2)` → `P(-π_2)` |
| 3 | 30 | 0 | `P(π_4)` → `P(-π_4)` |
| 3 | 31 | 0 | `P(π_8)` → `P(-π_8)` |
| 3 | 33 | 1 | `P(π_2)` → `P(-π_2)` |
| 3 | 34 | 1 | `P(π_4)` → `P(-π_4)` |
| 3 | 36 | 2 | `P(π_2)` → `P(-π_2)` |

差分は上記 **14cellだけ（12角+2label）**。JSON shape/列数/他tokenは不変。fixtures `quantum_phase_estimation_circuit-{original,fixed}.json`、`tests/qpe-approved-source.spec.mjs` はこの14行を独立固定し、原JSONへ14cellだけ適用したものがfixed全文と一致、120°の2JSONが完全不変と検査する。

本文: `量子位相推定回路の後半は逆 QFT 回路そのままです。` → `量子位相推定回路の後半には、先に説明した QFT 回路を使います。`。まとめ: `後半の逆 QFT` → `後半の QFT`。説明追加・logの底追加・他ページの符号変更はなし。

### 数値のPython計算

`python3 scripts/analyze-qpe-approved.py`。これは有限Fourier和・固有ベクトル・積状態の解析式であり、回路CPU simulatorや製品fallbackではない。変更した後半のgate列は、無変更120°/4bit例の負角Fourier列と完全一致することもassert。

- H固有状態(-sinπ/8,cosπ/8)の固有位相π。φ=1/2のランプに負Fourier和を適用すると **k=8の確率1（100%）**、他は丸め誤差のみ。targetの固有状態は不変、signed全体はindex8=-s、index24=c。
- 無変更120°/3bit: k3 **68.78376625896216%→68.8%**、135°、誤差+15°。
- 無変更120°/4bit: k5 **68.48953893117378%→68.5%**、112.5°、誤差−7.5°。k6 **17.195941564740515%→17.2%**、135°。和 **85.68548049591429%→85.7%**。
- 3bit分解能45°、4bit22.5°、22.5×8=180°。c²/s²=85.35533905932738%/14.644660940672624%。標準のt式は原4TeXを不変に保つ。
- 永続 `tests/fixtures/qpe-approved-analysis.json` に計算値・GPU照合用signed参照全状態を保存。最初の解析では原circle文字列内の改行をcomplexが解釈できず失敗したため、検証側だけ空白正規化した。記事値/回路修正ではない。GPUExecuted:false。

### 移植・非GPU検査

原6回路 **5/25/18/43/24/37列、1/5/4/5/4/5-wire**。palette **[]×6**、max-wire-count **2×1/1×5**、run-buttonは原通り最後3回路のみ。wireをtruncateしない。旧simulator/直書きdiagramをnative embed6へ置換、元からcustom-tagの4円・矢印/H図は既存部品で表示。**画像0/画像置換0/削除credits0/sidenote0/Orbit0**。prose glyph Bold、figure Regular、MathJax/Qni/実験版/共有header/footer/pin348992fは維持。

最新upstream sourceを18:15にshallow fetchし、QPEとphase_kickbackの原sourceが前の取得本文と同一と確認。open PRは全0件、同ページPRなし。

typecheck/build成功。`qpe-approved-source.spec.mjs` 2件と新ページの非GPU390/1440×DPR1/2 **4/4成功**。原実サイトとのlocal実ブラウザー比較4/4で、承認した2本文編集・14JSON cellだけ、他本文/原4TeXdiff0/source Golden一致。GPUはnavigator.gpu=undefined、全embed unsupportedのまま。body/content/Shadow DOM内部scrollbar0、文書横overflow0、console/page errors0、原4円/パレット/制限/run-button/本文Bold・図Regular一致。スクリーンショット `/tmp/qtw-quantum_phase_estimation_circuit-*.png`。native実稼働確認ではない。

### 実機確認待ち（全6embed、390/1440×DPR1/2）

以下はこの箱で一切実行していない。

1. 本番native running/errors0/step0のone-hot/norm≈1、palette非表示、全gateとblock名可視、元wire保持。
2. 全6回路の最後の有効列（測定回路は測定直前）でsigned全状態を解析fixtureと比較。特に修正H全体はcontrol8/100%、120°の3/4bit例は68.8/68.5/17.2%の測定前分布。
3. 測定後のnorm≈1・control one-hot（H例は8）。原run-button3個のreplayがstep0へ戻ること。
4. 実canvas toolbar undo/redoのみ、trashなし/旧位置クリック無効果、編集→undo→redo→undoで元JSON復元。
5. 稼働時native Regular/全gate可視、両幅/DPR1/2、body/content/Shadow内scroll0/文書横overflow0。

GPU desktopの正確なcommand:

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs quantum_phase_estimation_circuit
```

これは実runner.readStateVectorを使う対話監査。最後の列/測定列の選択、native toolbar操作と外観・全gate可視はGUI上で手動確認してEnter/yes、signed状態/norm/測定one-hot/replay/JSON復元/errors/scrollはassert。結果 `/tmp/qtw-quantum_phase_estimation_circuit-gpu/result.json` とstep0/final PNG。scriptのsyntaxだけこの箱で検査、GPU成功は主張しない。既存 `new-machine-layout-blocker.md` の4回帰は未修正・引き継ぎ、期待値緩和なし。

### QPE公開・非GPU確認完了

**30388f3 / Pages38128273411 success**。18:27にghでbuild/deploy成功確認。公開URLを明示してsource2件＋390/1440×DPR1/2本文/TeX/JSON/4円/glyph/scroll/errors4件 **6/6成功**。元実サイトとの公開4case比較で、承認2本文・14JSON cellだけ、原4TeXdiff0・他本文diff0。`tests/fixtures/qpe-public-nongpu-verification.json` は両実URL・原/移植本文・TeX・JSON・比較結果、WebGPUExecuted:falseを保存。script command: `QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs quantum_phase_estimation_circuit`。

実機確認待ち5カテゴリは未実施のまま。GPU結果であると偽らない。18:15最新main `6e214f1a3e9e229375528c913c7905e1f1b263c1` と原QPE/phase source一致を確認、18:26全open PR0件。

## phase_kickback: 本文/JSON/数値無変更で移植（QPEの次）

原2JSON **18/25列、各5-wire**、palette **[]×2**、max-wire-count **1×2**、原run-buttonなし、block名/spacing/Ry(5π/4)も無変更。元18円の振幅・ket・baseサイズを維持。最初の16円はdesktop8列/mobile4列の自然gridで折り返し、円の縮小/clip/zoom/本文内scrollなし。最初16円には4bit aria幅を明示。

旧simulatorをnative embed2へ、元circle tagsは既存qubit-circleで表示。画像0/画像置換0/削除credits0/sidenote0/Orbit0。本文gate Bold、図Regular、MathJax/共有header/footer/pin不変。原/fixed fixturesは6回路の承認QPEと区別した `phase_kickback-{original,fixed}.json`、diff=[]。`tests/phase-kickback-source.spec.mjs` は全JSON完全一致・18/25列・5-wire・max1/no-runを固定する。

### Python解析

同じ `python3 scripts/analyze-qpe-approved.py` のphase式で、controls1/2/4/8回、全15回を確認。

- Pπ/4例: index16+jのamp=(1/4)exp(iπj/4)、他0。各6.25%、π/4=45°刻み、周期8。ターゲットは|1⟩不変。原斜め成分±0.17678は±1/(4√2)の5桁表示。
- H例: ターゲット(-s,c)、Hの固有位相π。indexjのamp=−s(−1)^j/4、index16+jのamp=c(−1)^j/4。各controlのp=1/16、ターゲットのpはs²/c²=14.64466/85.35534%、π刻みの位相。全32signed参照値をanalysis fixtureに保存。

### 非GPU検査・実機確認待ち

local本文/原4ket-TeX/原2JSON/18円の実サイト比較は390/1440×DPR1/2 **4/4一致**、未承認編集0。非GPUページguard4/4でbody/content/Shadow内部scroll0/文書横overflow0/console-page errors0、unsupported状態、原palette/max/no-run/Bold確認。390/DPR1の円gridと全文を目視。QPEとともにtypecheck/build成功（同じ固定distで検査）。既存ページの全体回帰は現在実行中、結果は終了時に別記録。

以下すべて **実機確認待ち**（両幅/DPR1/2、2embed）: running/step0/norm≈1/実palette非表示/元5-wire保持、最終全32signed GPU readbackを解析と照合、undo/redoのみ・trashなし/旧位置無効果/元JSON復元、native Regular/全gate可視/稼働時body-content-shadow scroll0/横overflow0。run-buttonは原にないので追加/試験しない。

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs phase_kickback
```

実GPU desktopの対話監査（最後の列選択・toolbar外観/編集/可視性は手動確認、signed readback/norm/JSON復元/errors/scrollはassert）。`/tmp/qtw-phase_kickback-gpu/result.json` とPNG。CPU fallback/製品readback/上流変更なし。

### 次qpe_outputの別判断でSTOP

次ページを読み、承認済みQPEの後半QFTと矛盾する逆QFT呼称5か所、周期2（正しくは周波数2、周期8）についてSTOPした。**qpe_outputは未移植・未公開、原文/16円/原TeX無変更、shor_hsp以降も停止。** 原画像/credits/回路0、palette/maxは該当なし。

Pythonで同じπ/4ランプは負Fourier→k2/100%/45°、既刊の正逆QFT→k14/100%/315°、周期8/周波数2、720/16=45°、Hの8→180°を確認。`scripts/analyze-qpe-output-source.py` / `tests/fixtures/qpe-output-blocker-analysis.json`、GPUExecuted:false。

**質問（未承認・未適用）:** description・本文・式の逆QFT呼称5か所をQFTへ、`周期 2 が得られます。 周期が 2 ということは`を`周波数 2 が得られます。 周波数が 2 ということは`へ訂正してよいか？ 正確な5置換・別語句・TeX差は [qpe-output-sign-blocker.md](qpe-output-sign-blocker.md)。今回のQPE option Aをこの別ページへ勝手に拡張しない。

### phase_kickback公開・非GPU確認完了 / 18:36 checkpoint

**82fcbbd / Pages38128755556 success**。ghでbuild/deploy成功を確認。公開source guard1＋390/1440×DPR1/2のDOM/本文/原4ket-TeX/JSON/18振幅/palette/max/no-run/glyph/scroll/errors4件 **5/5成功**。原実サイトと実公開URLの4case比較も未承認diff0/原TeXdiff0/原2JSON一致。`tests/fixtures/phase-kickback-public-nongpu-verification.json` に両URL・原/移植本文・TeX・JSON・4結果、WebGPUExecuted:falseを保存。

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs phase_kickback
pnpm exec playwright test tests/qpe-approved-source.spec.mjs tests/qpe-port-nongpu.spec.ts tests/phase-kickback-source.spec.mjs tests/phase-kickback-nongpu.spec.ts
```

資料 `/tmp/qtw-kickback-{local-compare,final-tests,public-tests,public-compare,pages}.log`、`/tmp/qtw-phase_kickback-live-{original,ours}-{390,1440}-dpr{1,2}.png`。WebGPUはundefinedにしたunsupported状態で、native running/norm/toolbarの成功ではない。上記実機確認待ちを変更しない。

### 全非GPU回帰の結果（既存4件は未解決のまま）

real-GPU/mixed spec8本を除いたDOM/本文/図・mock lifecycle・Node source guardの **344件中340成功/4失敗（2workers、5.2分）**。失敗は前回と同じ `ket.spec.ts`×2、`content-overflow.spec.ts`×2のみ。QPE/phaseページはoverflow failure一覧にない。sidebar・新palette/max契約も成功。suite開始後に追加したphase source guardを含む最終targeted5/5、公開QPE6/6・phase5/5も別途成功。typecheck/build/diff-checkと解析script成功。

既存4件の原因を断定せず、共有CSS/固定寸法期待値の緩和/テストretry追加は行わない。`docs/new-machine-layout-blocker.md` の環境比較質問と原証拠を引き継ぐ。今回ログ `/tmp/qtw-qpe-nongpu-regressions.log`。全suite成功とは記録しない。

QPEは承認4項目だけ、phaseは本文/JSON無変更で順に公開。qpe_outputの逆QFT5か所と周期2は未承認・原文無変更・未公開、後続も停止。最新確認18:33のopen PRは全0件。通常fetch/rebase/push（forceなし）で記録を同期し、owned preview/browserを停止してhard stop18:42を守る。

## 2026-10-11 qpe_output: Aの5か所+Bの1文だけ承認・移植 / GPUなし / hard stop19:39

高宮さんが `docs/qpe-output-sign-blocker.md` のA/Bを明示承認。適用は次の6置換だけ。他本文/数値/16円/残るTeXに触れない。

| 場所 | before → after |
|---|---|
| description | `位相キックバックと逆QFTの結果を固有位相として解釈する` → `位相キックバックとQFTの結果を固有位相として解釈する` |
| 冒頭 | `出力である逆 QFT` → `出力である QFT` |
| 37行 | `これを逆 QFT にかけると` → `これを QFT にかけると` |
| 46行TeX | `\times 逆 QFT の結果` → `\times QFT の結果` |
| 50行 | `で見た逆 QFT` → `で見た QFT` |
| B | `周期 2 が得られます。 周期が 2 ということは` → `周波数 2 が得られます。 周波数が 2 ということは` |

`docs/qpe-output-{original,approved}-source.html` と `tests/fixtures/qpe-output-approved.json` を保存。原source SHA256 `421489783ef03a6fdcde1391b2379bebb12efb8bb0aaf97bdf62314c38d0a751` を固定し、原全文へ上の6置換だけを適用するとapproved全文とbyte一致するguardを追加。TeXは全4入力中3番目の「逆」削除だけを独立whitelistする。旧blockerは解決済み。

原16円のcomplex値/data-ket/baseサイズ/順序を保持し、desktop8列/mobile4列の自然gridで折り返す（縮小/clip/zoom/本文内scrollなし）。4bit aria幅を明示。元からcustom-tagの図を既存qubit-circleで表示、**画像0/画像置換0/削除credits0/sidenote0/Orbit0/回路0**。**palette/max-wire-count/run-buttonは該当なし**。本文phase/Hは共通Bold、図Regular方針・MathJax3.2.2・共有header/footer/pin348992fを維持。本文QPEリンクのhrefだけ移植先へ解決する。

### Python解析と非GPU検査

```sh
python3 scripts/analyze-qpe-output-source.py docs/qpe-output-approved-source.html --approved --output /tmp/qpe-output-approved-analysis.json
pnpm exec playwright test tests/qpe-output-source.spec.mjs tests/qpe-output.spec.ts
QTW_AUDIT_URL=http://127.0.0.1:4322/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs qpe_output
```

閉形式 `a_j=(1/4)exp(iπj/4)` の負Fourierはk2/100%、360×2/16=45°=π/4。周期8/周波数2、16間隔分720°、H例360×8/16=180°=π。原16円の斜め±0.17678は±1/(4√2)の小数5桁表示と一致。原4bitの2^4=16も維持。計算値を `qpe-output-approved-analysis.json` に保存。CPUの回路simulator/製品fallbackではなく数学の有限Fourier和・周期確認、GPUExecuted:false。

typecheck/build/diff-check成功。source guard1と新ページの390/1440×DPR1/2 guard4の **5/5成功**。description/body/全4TeX/16振幅/リンク/回路0/本文Boldを確認、body/content内部scrollbar0・文書横overflow0、console/page errors0。原実サイトとのlocal実ブラウザー比較 **4/4成功**、本文とdescriptionはA/Bのみ、TeX差は指定「逆」削除1か所だけ。比較時だけ原snapshotへ承認置換を適用し、無編集原text/TeXも保持する。新ページの数値・JSONなどを勝手に変更しない。

19:11にshallow fetchしたlatest main `f1bfbfd86448972d59b36e9553099815f6b492d8` のqpe_output/shor_hspは前の取得sourceと一致。qniapp/qni open PRは全0件、同ページPRなし。header/footer/既存ページ/pin変更なし。原UI screenshotなし。

### WebGPU対象と実機確認待ちの範囲

**qpe_outputは回路0なので、running/step0/norm/readback/toolbar等は該当なし。** 不要なembed・palette・wire制限を追加しない。今回の検査はGPUをundefinedにした純粋な本文/TeX/図/layout検査で、GPU成功を主張しない。

前ページQPE/phase_kickbackの実機確認待ちはこのページ公開で解消しない。GPU desktopでの正確な引き継ぎcommandは以下のまま:

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs quantum_phase_estimation_circuit
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs phase_kickback
```

qpe_outputの公開比較・最新非GPU回帰の結果は完了後に記録。既存4件のlayout guard不一致は未修正、期待値緩和なし。sidebar順の次shor_hspで数値/条件/成功判定に不一致を発見し、未承認のまま同ページと後続を停止した。

### qpe_output公開・非GPU確認完了 / 19:33 checkpoint

**8e3964f / Pages38131826927 success**。ghでbuild/deploy成功を確認。公開URLのsource guard1＋390/1440×DPR1/2の本文/description/原4TeX/16振幅/回路0/本文Bold/scroll/errors4件 **5/5成功**。原実サイトと公開移植ページの4case比較も成功。差分はA/Bだけ、MathJax入力の差は3番目の式の「逆」削除1件だけで他3入力は不変。未編集原text/description/TeXと実公開URLを `tests/fixtures/qpe-output-public-nongpu-verification.json` に保存、WebGPUExecuted:false。

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs qpe_output
```

scriptは現在の原実サイトが既に承認通り変更された場合にも、旧版への承認置換と同じGoldenに厳密一致する場合だけ受け付ける。未承認の本文/description/TeX変更を許容する緩和ではない。資料 `/tmp/qtw-output-{local-compare,public-tests,public-compare}.log`、`/tmp/qtw-qpe_output-live-{original,ours}-{390,1440}-dpr{1,2}.png`。390/DPR1の16円と2つの式・全文を目視確認した。既存shared layout差は維持する。

全非GPU回帰は **352件中347成功/5失敗（2workers、5.5分）**。4件は従来の `ket.spec.ts`×2/`content-overflow.spec.ts`×2、qpe_outputはoverflow failure一覧に入っていない。追加1件は `ported-pages.spec.ts` のgrover_iteration1440で `page.goto: Target page, context or browser has been closed`（内容の期待値不一致ではない）。同じ固定distで1worker・その1件だけ再実行し **1/1成功**、製品変更/retry設定追加なし。元suiteを全成功と扱わず、残る既存4件を引き継ぐ。ログ `/tmp/qtw-output-nongpu-regressions.log` / `/tmp/qtw-output-grover-rerun.log`。最新typecheck/build/diff-check・数値解析は成功。

### 次shor_hsp: 計算量・条件・成功判定でSTOP

原source `docs/shor-hsp-original-source.html`、Python証拠 `tests/fixtures/shor-hsp-blocker-analysis.json`。**shor_hspは未移植・未公開、原文/TeX/画像2枚無変更、shor_fx以降も停止。** 19:32のopen PRは全0件、同ページPRなし。

- 正しいN15/a2: [1,2,4,8]×4、r4、gcd5/3、5×3=15。2PNGは算術グラフで旧Qni UIではない、credits文なし。承認後は元軸/値/赤丸/周期注釈を維持した自作SVGへ置換可能だが、今回は置換しない。原回路0、palette/maxは該当なし。
- GNFSはheuristic準指数時間。N≈2^1024のleading L termはlog10≈26.1192。Shorの教科書的cubic termは1024³=1073741824。これらは正確な実operation countではなく、根拠のない原10^278/10^61を新数値で勝手に置換しない。
- 「a<Nなら何でも良い」はboxの互いに素条件に反する（N15/a3は1に戻らない）。
- 偶数rでなければgcd計算不能という一般的主張は不正確。N7/a4/r3ではa^(r/2)=8、gcdの計算が可能。
- N15/a14/r2はgcd15/1、積15でも非自明な因数を得ていない。原「積がN」という成功判定は誤り。gcd結果は常に約数であり、自明な約数かを検査すべき。
- a2/N=2^b−1ではr=bで、周期が必ず指数増大するわけではない。一方N=3^kならr=2·3^(k−1)と大きくなりうる。古典全般に指数時間が必要という未証明の下界ではなく、ここで説明する順次列挙法の最悪時間へ限定する案。

**質問（すべて未承認・未適用）:** R1〜R6の正確なbefore→afterを [shor-hsp-blocker.md](shor-hsp-blocker.md) に記録。具体数値段落をGNFS準指数/Shor多項式の一般論へ、aの条件を互いに素へ、偶数rをこの手順の条件へ、gcd成功判定を非自明な約数へ、r増大を「場合がある」へ、まとめの指数時間を順次列挙法の最悪の場合へ限定してよいか？ 6個のbefore文字列が原sourceに各1回一致することも検査した。原画像/正しい15の例/他本文を変更する提案ではない。

再現: `python3 scripts/analyze-shor-hsp-source.py ../qni/apps/tutorial/shor_hsp.html --output /tmp/shor-hsp-analysis.json`。数学・古典算術の確認だけで、量子CPU simulator/製品fallback/GPU結果ではない。shor_hsp移植後の本文/TeX/3901440/DPR/scroll検査は未実施。回路0なので新規WebGPU検査は該当なし。

通常fetch/rebase/push（forceなし）で記録を同期し、owned preview/browserを停止。qpe_outputに不要なembedを追加せず、前ページの実機確認待ちと既存4回帰は未解決として保持し、hard stop19:39を守る。

## 2026-10-11 shor_hsp: 高宮さんR1〜R6すべて承認 / GPUなし / hard stop20:11

19:41開始。`shor-hsp-blocker.md` とこのtailを再読。高宮さんがR1〜R6を記録の正確なbefore→after通り承認。以下以外の原本文/TeX/正しい15の数値を変更しない。

- **R1**: 根拠のない1024bit/10^278/10^61の説明と3TeXを削除。「古典の因数分解アルゴリズムである『一般数体ふるい法』の実行時間は、入力のビット数に対して準指数時間と見積もられます。」「一方でショアのアルゴリズムは、入力のビット数に対して多項式時間で実行できます。」の2文へ（実sourceでは原の「」を保持）。段落先頭文は維持。
- **R2**: 「aはとりあえずNより小さい整数なら何でも良い」→「aはNより小さく、Nと共通の因数を持たない整数から選ぶ」。NのTeX入力1追加。
- **R3**: 偶数rでしかgcd計算不能→「この手順では、周期rが偶数の場合に上の2つの式を使う」。
- **R4**: gcd結果が因数でない／積がNかで判定→1/Nという自明な約数の場合があり、1より大きくNより小さいかで判定する。
- **R5**: rが必ず指数増大→「指数関数的に大きくなる場合がある」。
- **R6**: 古典全般で指数時間が必要→順次列挙の古典的方法が最悪の場合に入力ビット数に対して指数時間かかる。

全文byte guardは6置換をtestへ独立pinし、原SHA256 `5bc7e636ec570f264e1b5caa5aeacd93302f796dd9d8a2db770765d13214512c` とapproved sourceの一致を確認する。`docs/shor-hsp-approved-source.html` は原の2img参照を保った承認本文snapshot、`src/pages/shor_hsp.astro` はその本文から生成し画像だけ自作componentへ置換。MathJax本文54→52入力、frontmatterのnext用1入力はsnapshotで不変。R1の3削除/R2のN1追加以外の全TeXを独立guardする。description/他本文は不変、はじめにhrefだけ移植先baseへ解決。

### 画像政策・部品境界

`shor_mod15.png` / `shor_mod15_r.png` の **2画像→自作interactive SVG2図**。原16点 [1,2,4,8]×4、青線/白中心point、**X軸0〜15/f(x)軸0〜12**、第2図の赤丸 **(0,1)/(4,1)** を維持。rという追加文字や矢印は原画像にないので作らない。既存credits文0、削除credits0。旧Qni UI画像ではない。Orbit0/sidenote0/回路0/JSON差なし、**palette/max-wire-count/run-buttonは該当なし**（fixtureでは空配列で固定）。header/footer/既存頁/WebGPU pin348992fは変更なし。gate glyph0でBold/Regularの新規対象なし。

`ShorMod15Graph.astro` はboolean1つだけの深い部品。図形/値/軸は不変、クリックと矢印/Home/End/EscapeでSSR点の値をHTML readoutに表示、2図の選択状態は独立。新たなCPU量子simulator/製品fallback/読戻しなし。2モデルで設計比較後、単一Astro SSR+per-instance scriptを採用、custom-element lifecycle/汎用chartを不要な境界として退けた。根拠 `shor-hsp-svg-design.md`。

長い原の不可分TeXは既存 `fit-content` で全入力そのまま収め、自然高さ・縮小だけ。本文/Shadow DOM scrollを作らず、clip/overflow:hiddenは追加しない。SVGは原viewBox全体をresponsive表示、native canvasなし。定義/注意boxの原blue border/background/desktop7/12幅を再実装。

### Python解析・非GPU検査

```sh
python3 scripts/analyze-shor-hsp-source.py docs/shor-hsp-approved-source.html --approved --output /tmp/shor-hsp-approved-analysis.json
pnpm exec playwright test tests/shor-hsp-source.spec.mjs tests/shor-hsp.spec.ts tests/sidebar.spec.ts
QTW_AUDIT_URL=http://127.0.0.1:4322/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs shor_hsp
```

N15/a2: x0..15=[1,2,4,8]×4、最小r4、gcd(15,2²+1)=5/gcd(15,2²−1)=3、5×3=15。N15/a14はr2/gcd15/1で非自明因数なし、N15/a3は非互いに素で1に戻らない、N7/a4/r3ではa^(r/2)=8でgcd計算可能。線形周期のMersenne例/大周期例もPythonで再検査。`shor-hsp-approved-analysis.json` に保存。歴史的GNFS leading model/Shor n³は証拠だけで、削除した数値の新たな置換として本文に挿入しない。

**typecheck/build/diff-check成功、source1＋390/1440×DPR1/2の本文/TeX/図/layout/interaction4＋sidebar5の10/10成功。** body/content内部scroll0・文書横overflow0、console/page errors0。16点の座標/値/軸tick/赤丸/独立クリックkeyboardを確認。原実サイトとのlocal比較4/4成功、本文はR1〜R6だけ、TeXは承認3削除+1追加だけ、description不変。比較snapshotは無編集原を残し、承認テキスト置換でTeX部分を除いた本文と52入力を厳密Goldenへ一致させる（既に承認通りの原サイトも同じGoldenの場合だけ許可）。390/DPR1の全文/2グラフを目視確認した。

19:42のqniapp/qni open PRは全0件、同ページPRなし。latest origin/main `a300a7891fc8a499ce77599fcdc0e561fcf31a4e` と取得済みshor_hsp/shor_fxはbyte一致。実サイト/取得sourceへの無断修正なし。最新全非GPU回帰と公開URL検査は完了後追記する。既存4回帰の期待値を緩和しない。

### 実機確認待ち

**shor_hspは回路0なのでrunning/step0/norm/readback/toolbarは該当なし。** SVG/layout検査をGPU検査成功と称さず、診断用回路を勝手に追加しない。既存QPE/phaseの実機確認待ちは未解消:

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs quantum_phase_estimation_circuit
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs phase_kickback
```

通常fetch/rebase/push（forceなし）でshor_hspを公開しPages成功を確認する。次shor_fxに科学的な定義/まとめの不一致を発見、同ページのrouteは作らず原文/TeX/JSON/画像4枚を変更していない。証拠と正確な提案は次のSTOP記録に保存する。
