# increment_circuit: 原JSONの文字列 "1" でSTOP

2026-10-11。increment_circuit と後続ページは未公開。cphase #57 / superdense_coding_circuit #59 とは別の原文訂正待ち。

原 `qniapp/qni` の `apps/tutorial/increment_circuit.html` の最後 (6番目) の回路は、末尾が `..., ["}"] , ["1"]]}`。この文字列 `"1"` は数値の空slot `1` とは異なる。

- 原サイト `https://qniapp.github.io/qni/increment_circuit.html` を実Chromiumで開くと、最後の回路で **`Unknown operation: 1`** のpageerror。
- qni-webgpu pin `958ee0d1a188701ca8ab2069d16868995564f38c` のembedでは6番目だけ `data-state=error` / `invalid circuit JSON: expected {"cols":[...]} with supported gates`。前の5個はrunning。
- 最小の `{"cols":[["|0>"],["1"]]}` はerror。
- 診断用の `{"cols":[["|0>"],[1]]}` だけ同じGPU/同じembedでrunning。数値1への変更は診断のみで公開していない。

[再現画像](images/increment-string-one-error.png)。作業時の詳細 `/tmp/qtw-increment-string-one-repro.json`、`/tmp/qtw-increment-start-repro.png`。

**高宮さんへの質問: 最後の `["1"]` を `[1]` に訂正してよいでしょうか？** 原文JSONを変更する例外許可が必要。これは元サイトもエラーになる誤記であり、qni-webgpu側に未知のgateを無条件に受理させる変更は行わない。

increment/decrementのdraftは `/tmp/qtw-blocked-arithmetic/` に保持。decrementの元wire上限は6 authored diagramsが4、後のinteractive HTML embedが1で個別確認済みだが、incrementでSTOPしたためdecrementも公開・TOC登録していない。原文・gate・計算結果を書き換える回避策、CPU/WebGL fallback、上流コード変更は行っていない。
