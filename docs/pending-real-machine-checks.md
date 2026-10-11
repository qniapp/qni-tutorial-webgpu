# 実機確認待ち（2026-10-12 / GPUなしbox）

gmktecはこのboxから到達不可・SSHなし。以下は**未実行**。新ページの純粋な数学/非GPU DOM/layout検査はnative GPU検査の代わりにならない。GPU desktopへrepo/dependenciesを用意して実行する。

## Published native pages: 全件引き継ぎ

```sh
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-eigenphases-gpu.mjs
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs quantum_phase_estimation_circuit
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs phase_kickback
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/check-qpe-gpu.mjs shor_fx
```

各scriptはreal adapter/running/step0/norm/全signed stateの実読戻しを検証し、手動のcolumn選択・undo/redo-only/trashなし/JSON復元・Regular labels/all gates visible・390/1440×DPR1/2・active-column native scroll確認を要求する。元run-buttonがある場合は再生、元measurementがある場合は測定を検査する。readbackはtest-onlyのon-demand診断で、production自動readback/CPU fallbackを追加しない。

qpe_output/shor_hsp/**新shor_r**は回路0。running/step0/norm/readback/toolbar等は**該当なし**、確認用回路を追加しない。shor_u以降は未移植なので架空URL/script commandを用意しない。

## 既存4失敗: 実機確認待ち（font/browser/layout切り分け）

```sh
QNI_WEBGPU_SOURCE=/path/to/qni-webgpu pnpm build
pnpm exec playwright test tests/ket.spec.ts tests/content-overflow.spec.ts
```

- `tests/ket.spec.ts`: 390/1440各1件。期待font19.12px/22.296875×21px、このbox実19.424px/22.640625×27px。
- `tests/content-overflow.spec.ts`: 390/1440各1件。変更していない旧ページwrapperが内側scroll判定。

これは非GPUの4layout guardだが、gmktecと同じfonts/Chromiumで再現するまで実機確認待ちとして保持する。Chromium152とbox153/Noto Sansの差が原因とはまだ断定しない。期待値緩和・共有CSS変更・安易なretryで隠さない。native GPU監査をこれらの成功で代用しない。詳細 `new-machine-layout-blocker.md`。
