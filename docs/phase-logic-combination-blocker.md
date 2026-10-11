# 位相論理演算の組合わせ: 論理式の括弧が未確定のため停止

**現在の状態:** superposition_quantum_logicは承認6項目で訂正・公開済み、phase_logicの文言待機も解除済み。ただしphase_logicの原図の振幅が不正なため[そのページでSTOP](phase-logic-amplitude-blocker.md)。このページの括弧訂正は未承認で、未公開を維持する。以下は10:50時点の歴史的な診断記録。

2026-10-11。`superposition_quantum_logic` と直後の `phase_logic` は、高宮さんの指示により **文言確定待ち**。Firstmateの確認済みの文言が届くまで未公開を維持する。この2ページを飛ばした最初のページ `phase_logic_combination` を調べたところ、同じ論理式の不一致があるため、ここで停止した。ページ・回路・画像は移植していない。

## 原文と回路

原文: qniapp/qni `apps/tutorial/phase_logic_combination.html`。

本文には `a OR (NOT b) AND c` が2回ある。通常のAND優先順なら `a OR ((NOT b) AND c)` である。a,b,cを低位bit0,1,2とすると、真となる入力は1,3,4,5,7。

一方、原26列・4-wire JSONは、bをNOTし、dへ `a OR NOT b` を計算し、c,dへCZを適用してから補助操作をuncomputeする。したがって述語は **`(a OR NOT b) AND c`**。本文の段階説明と「4,5,7のみ位相反転」はこの回路に対応するが、記載された文字式の通常の優先順とは異なる。

## 実GPUでの再現

公開standalone、pin `ef652682c23d89427f6f39bb6bee1ec6fae9bb1e`、実Chromium/AMD WebGPUで原JSONをそのまま実行した。

- 状態0,1,2,3,6: 実振幅 +0.3535533547401428
- 状態4,5,7: 実振幅 -0.3535533547401428
- その他の状態: 0、虚部: 0、norm≈1
- 起動エラー・page error: 0

1/3は位相反転せず、原文の文字式をAND優先で解釈した結果にはならない。原JSONを変更して合わせる回避策は取らない。

資料 `/tmp/qtw-phase-combination-original-gpu.{mjs,json,log}`、原JSON `/tmp/qtw-phase-combination-original.json`。診断用ブラウザーは終了済み。

## 未着手の移植内容

原paletteなしなので `[]`、原HTML `data-max-wire-count="1"`、元4-wireを維持する予定。原画像 `phase_logic_result.png` と `quantum_logic_result.png` は旧Qniの円表示パネル。自作の状態表示への置換候補だが、今回の停止時点では未置換・credits削除0。原本文・回路・画像を無断変更していない。公開ページがないため、移行後の本文diff、step0、390/1440のスクロール監査は未実施。

**高宮さんへの質問: このページもFirstmateの文言確定対象に含め、原JSONを維持して文字式を `(a OR NOT b) AND c` とする確認済みの文言を提供してよいか？ 円表示パネル2枚も、再開時に自作の対話的な状態表示へ置換する方針でよいか？** 確定するまでこのページと後続の `sat` 以降は移植・公開しない。
