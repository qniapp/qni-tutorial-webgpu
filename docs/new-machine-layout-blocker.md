# 新機械の既存ページ回帰検査: 4件のlayout不一致（確認待ち）

2026-10-11 17:19。新しいeigenphasesとは別に、非GPUのDOM/図/本文回帰spec27本を実行し **290件中285成功・5失敗**。新ページ追加に伴うsidebarの期待リスト漏れ1件は、`tests/sidebar.spec.ts` のported集合末尾へ `eigenphases` を追加して再検証し成功。製品sidebarは正しく新ページへリンクしていた。

残り4失敗は、**今回変更していない既存ページ**に対する次のguard。不一致を隠すためのretry追加・期待値緩和・共有CSS変更は行っていない。

- `tests/ket.spec.ts` のh_gate寸法guard（390/1440の2件）:
  - font-size: 期待19.12px → 実19.424px
  - width: 期待22.296875px → 実22.640625px
  - height: 期待21px → 実27px
  - 12ketの内容、typeset完了mark1、shadowなし、document overflow=falseは一致。
- `tests/content-overflow.spec.ts`（390/1440の2件）: qni_intro、phase、x_gate、phase_gate、write_operation、measurement_operation、multi_qubit_circle_notation、multi_qubit_superposition、multi_qubit_operation、multi_qubit_phase_gate、cphaseの既存overflow-auto/x-auto wrapperが縦scrollと検出される。390だけwhat_qpu_do_fasterのmatrix-illustrationも横scroll。新eigenphasesはfailure一覧に入っていない。

原資料 `/tmp/qtw-nongpu-regressions.log`。Node26.8.2、Playwright Chromium **153.0.8010.12**、この箱の `fc-match system-ui` / `fc-match sans-serif` は **Noto Sans Regular**。従来gmktecは記録上Chromium152.0.7977.82。フォント/browser差が原因かどうかは、まだ同一環境比較をしていないので断定しない。実GPUではなくDOMの既存guardの不一致。

eigenphases自身は非GPUの390/1440×DPR1/2で本文/TeX/JSON・glyph・scroll・errorsを検査し成功。共有layoutや既存ページを変更せず、原サイトとの実ブラウザー差も承認2語句だけ。詳細 `docs/porting.md` 末尾。

## 質問 / 提案する次の確認（未適用）

**まずgmktecと同じフォント・Chromium環境で以下4件を再検証し、環境差と実際のレイアウト不具合を切り分けてよいか？** 確認前に固定寸法期待値をこの箱の値へ書き換えない。フォントを合わせても同じなら、scroll要素の実寸・画面を採取し、対象CSSを限定した正確なfixを別途承認に出す（今は原因不明なので共有overflowを一括visibleにする等は提案・適用しない）。

```sh
pnpm exec playwright test tests/ket.spec.ts tests/content-overflow.spec.ts
```

nativeのGPUチェックをこの4件で代用しない。sidebar順の次ページは既に `qpe-sign-blocker.md` の符号判断でSTOP中、後続も進めない。
