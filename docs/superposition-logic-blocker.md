# superposition_quantum_logic: 原説明と原回路の不一致でSTOP

**現在の状態: 文言確定待ち。** 2026-10-11 10:50の高宮さんの指示により、Firstmateが確定中の説明を待つ。直後の `phase_logic`（位相論理演算）も文言確定待ちとして未公開を維持する。その次の `phase_logic_combination` でも同じ式の不一致を再現し、[停止理由](phase-logic-combination-blocker.md)を記録した。

2026-10-11。sidebar順のquantum_logicまで進めた後、このページの原JSONを実Chromium/AMD WebGPU standaloneで実行した。回路自体は正常に動くが、元の論理式・脚注・入力組・真理値表・d/eの説明が同じ意味になっていない。increment第6回路の1トークン以外には訂正許可がないため、このページと後続は未公開。原JSONやupstreamを変更して回避しない。

原資料: qniapp/qni `apps/tutorial/superposition_quantum_logic.html`、公開原版 https://qniapp.github.io/qni/superposition_quantum_logic.html 。

## 実際の回路

a,b,cは第1,2,3 wire、つまり低位bit0,1,2。NOT bはb自身に実行。d (bit3) に `a OR NOT b`、e (bit4) に `c AND d` を計算し、dと入力にかけた操作をuncomputeする。したがって述語は **`(a OR NOT b) AND c`**。

原5-wire/26-column JSONをそのままGPU実行すると、状態0,1,2,3,6,20,21,23に各1/8、他は0。e=1は20/21/23、低3bitでは4/5/7。norm≈1。

再現資料 `/tmp/qtw-superposition-logic-original-gpu.{mjs,json,log}`。診断のみで最初のH3個をX/空/空に替えて入力(a,b,c)=(1,0,0)を準備すると、最終状態1のみ、e=0になる。原本や製品にはこの変更を入れていない。資料 `/tmp/qtw-superposition-logic-diagnostic-gpu.{mjs,json,log}`。

## 訂正許可が必要な説明

- 本文の `a OR (NOT b) AND c` と脚注 `a || !b && c` は通常のAND優先規則では `a OR ((NOT b) AND c)`、回路とは別の式。回路に合わせるなら `(a OR NOT b) AND c` / `(a || !b) && c` とする。
- 原文の正しい入力組 `(1,0,0), (1,0,1), (1,1,1)` はwireのa,b,c順では一致しない。回路では `(0,0,1), (1,0,1), (1,1,1)`。
- 真理値表の見出し `a OR (NOT b)` はcを落としており、本文の述語になっていない。行の(0,0,1)は1、(1,0,0)は0であるべき。
- 原説明「NOT bの結果をd、a OR dの結果をe」では回路を説明できない。NOT bはin-place、dへOR、eへANDである。

**高宮さんへの質問: 原JSONを維持し、上記の式・脚注、入力組、真理値表、補助bitの説明だけを回路に合わせて訂正してよいか？** 原JSONを書き換えるか、式に合わせて真理値表や答を5通りへ変更するような別解は勝手に選ばない。
