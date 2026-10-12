# 実機確認待ち（2026-10-12 / GPUなしbox / sidebar全67pages移植完了）

no-cloning証明ふろくまで移植・公開済み。Math-only appendixは回路/画像/credits0、GPU診断は該当なし。残る未完了は下記のnativeGPU監査全件と既存4layout失敗の実機切り分け。『全pages完了』は実機検証済みを意味しない。

gmktecはこのboxから到達不可・SSHなし。以下は**未実行**。新ページの純粋な数学/非GPU DOM/layout検査はnative GPU検査の代わりにならない。GPU desktopへrepo/dependenciesを用意して実行する。

## Published native pages: 全件引き継ぎ

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-eigenphases-gpu.mjs
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs quantum_phase_estimation_circuit
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs phase_kickback
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs shor_fx
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs shor_u
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs shor_qft
```

各scriptは完全無人でreal adapter/running/step0/norm/全signed stateの実読戻し・native column選択・gate一時削除→undo→redo→undo・旧trash位置無効果・JSON復元・390/1440×DPR1/2・DOM overflowを検査する。失敗しても残りのviewportを実行し、各page/viewportのPASS/FAILと `result.json` を出力、失敗時は非zero終了。元run-buttonがある場合は再生、元measurementがある場合は測定を検査する。readbackはtest-onlyのon-demand診断で、production自動readback/CPU fallbackを追加しない。

既定はheadless。`--headless` または `QTW_HEADLESS=1` で明示でき、表示ありは `--headed` または `QTW_HEADLESS=0`。`--headless` は優先。`QTW_CHROMIUM_PATH=/path/to/chromium` で実行ファイル、`QTW_AUDIT_OUTPUT=/path/to/output` で出力先を変更可能。例:

```sh
QTW_HEADLESS=1 QTW_CHROMIUM_PATH=/usr/bin/chromium node scripts/check-qpe-gpu.mjs shor_qft --headless
node scripts/check-eigenphases-gpu.mjs --headed
```

**qni-webgpu PR #66 のembedが必須。** `element.runner.selectStep(n)` で0-based semantic stepを選択し、`selectedStep()` を照合、`readStateVector()` でGPU完了を待つ。開始前に `stepCount()` がfixtureの非marker列数と一致することを検査する。API欠落は `embed lacks runner.selectStep; requires qni-webgpu #66` でFAIL。marker列 `{label` / `}` / `[label` / `]` はstep数から除外し、author stageのsource列番号はmarkerを含む元JSONからsemantic stepへ変換する。選択にcanvas座標・クリック・wheelは使わない。自動gate削除/undo/redo/旧trash無効果検査だけは最初の可視列とtoolbarのpointer操作を継続する（選択には使わない）。再生はmainの変更に合わせegui状態バーの最後のkeyboard focusをShift+Tab/Enterで操作する。step0は最初の非marker列の初期化ketからtensor積で導出（q0=LSB、`|0> |1> |+> |-> |i> |-i>`）。shor_u/shor_qftのbasis index1を検証する。後続の準備gateはstep0に含めない。

### ローカルdistで実行

公開URLのembedがまだ#66未対応なら、#66対応のqni-webgpu checkoutをbuildしてローカルdistで監査する。pin/page内容はこの変更では更新しない。既存の `fetch-qni-webgpu.sh` はpin一致を要求するため、#66候補のembedだけは直接buildする（生成assetをcommitしない）。

```sh
pnpm install --frozen-lockfile
# #66対応checkout。既存pinのh.svgをgit showできる履歴も必要。
QNI_WEBGPU_SOURCE=/path/to/qni-webgpu
pnpm -C "$QNI_WEBGPU_SOURCE/apps/web" install --frozen-lockfile
bash "$QNI_WEBGPU_SOURCE/apps/web/scripts/build-embed.sh" "$PWD/public/qni-webgpu"
QNI_WEBGPU_SOURCE="$QNI_WEBGPU_SOURCE" pnpm build
pnpm preview --host 127.0.0.1 --port 4321
# 別terminal。URLは末尾 / を付け、実際のbuild base pathを含める。
QTW_AUDIT_URL=http://127.0.0.1:4321/qni-tutorial-webgpu/ node scripts/check-eigenphases-gpu.mjs --headless
QTW_AUDIT_URL=http://127.0.0.1:4321/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs shor_qft --headless
```

`pnpm preview` はdistを現在のAstro base (`/qni-tutorial-webgpu`) でserveする。任意のlocalhost/port/baseを `QTW_AUDIT_URL` に指定可能。他のslugも上記公開URL commandと同様に実行する。GPU adapterがない環境はFAILであり、ローカルserveだけで実機確認済みとはしない。

Regular glyphs・toolbarの外観・all gates visibleは数値assertionではなく、出力先のstep/stage/final/measurementおよび全semantic stepのvisual screenshotsとして保存しパスをログする。API選択は横auto-scrollを保証しないため、全gate可視/active scrollの検査は後日実機で行う。画像は人による後日確認用の証拠であり、無人PASSは字形/可視性の目視確認済みを意味しない。GPUなしboxではend-to-end未実行、実機確認待ちは継続。

**新shor_uは原8wire/1回路。** scriptはstep0とauthor列6/12/17の全256 complex signed成分（512float）をtest-only実読戻し比較し、run replay/undo-redo/Regular/all gates/active scrollも要求する。数学期待値生成と無人scriptの構文/純粋helper検査のみ済みで、boxでGPU実行はしていない。qpe_output/shor_hsp/shor_rは回路0。running/step0/norm/readback/toolbar等は**該当なし**、確認用回路を追加しない。**新shor_qftは原8wire/1回路**。同scriptはbefore-QFT(source17)・最後SWAP(source32)の全signed値/norm、MSB4..7測定後のoutcome0/4/8/12、再生/undo-redo/JSON復元/Regular/all gates/active scrollを要求する。有限Fourier和の期待値を保存しただけで実機GPUは未実行。no-cloning_theorem_proofも回路0なのでGPU監査不要。回路0pageへの架空URL/script commandを用意しない。

## 既存4失敗: 実機確認待ち（font/browser/layout切り分け）

```sh
QNI_WEBGPU_SOURCE=/path/to/qni-webgpu pnpm build
pnpm exec playwright test tests/ket.spec.ts tests/content-overflow.spec.ts
```

- `tests/ket.spec.ts`: 390/1440各1件。期待font19.12px/22.296875×21px、このbox実19.424px/22.640625×27px。
- `tests/content-overflow.spec.ts`: 390/1440各1件。変更していない旧ページwrapperが内側scroll判定。

これは非GPUの4layout guardだが、gmktecと同じfonts/Chromiumで再現するまで実機確認待ちとして保持する。Chromium152とbox153/Noto Sansの差が原因とはまだ断定しない。期待値緩和・共有CSS変更・安易なretryで隠さない。native GPU監査をこれらの成功で代用しない。詳細 `new-machine-layout-blocker.md`。

## 進捗 2026-10-12

gmktec real AMD (rdna-3)、HEAD `6ba43ef` のheadless実機監査: 390/1440 × DPR1/2の全4組合せで eigenphases / phase_kickback / shor_fx / shor_u はPASS。quantum_phase_estimation_circuit / shor_qft は toolbarAudit の waitJSON (`circuitJSONEqual`) のみFAIL。このcommitは残る2件の原因である全identity列の除去とsquare block markerのbrace再エンコードを比較時に正規化する。修正後の実機再確認は未実行。
