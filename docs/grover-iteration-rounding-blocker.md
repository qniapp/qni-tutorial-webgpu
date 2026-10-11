# grover_iteration: 2回反復確率の小数第1位表記について確認するためSTOP

2026-10-11。grover_iamの承認10列訂正を公開・live確認した直後、sidebar次のgrover_iteration（グロヴァー反復）を調べた。

原live `https://qniapp.github.io/qni/grover_iteration.html` の本文は2回反復で「約90.9%」と書く。原JSONを無変更で実Chromium/AMD WebGPUの公開standalone (pin ef652682c23d89427f6f39bb6bee1ec6fae9bb1e) に読み、390/1440で一致する結果を得た:

| 反復 | index15の確率 | 小数第1位 | 本文 |
|---|---|---|---|
| 1 | 47.26560860872411% | 47.3% | 約47.3% |
| 2 | **90.84466975183183%** | **90.8%** | **約90.9%** |
| 4 | 58.170341234676926% | 58.2% | 58.2% |

2回反復のstate15実振幅は約+0.9531247、他状態は約+0.078125、虚部0、norm≈1、page errors0。回路計算の誤りではなく、本文の小数第1位の丸め差についての質問。近似値だから重大な確率誤差という主張はしないが、出力に合わせて90.8と表示する訂正は勝手に行わない。

原liveの該当段落とdata-json3回路がローカル原fixtureと一致することも確認。資料 `/tmp/qtw-grover-iteration-original-{circuits.json,gpu.mjs,gpu-results.json,gpu.log,prose.mjs,prose.json,prose.log}`、実段落screenshot `/tmp/qtw-grover-iteration-original-90_9.png`。GPU6ケースとも同じ結果、browser終了済み。

**高宮さんへの質問: 本文の「約90.9%」1か所だけを「約90.8%」へ訂正してよいか？** 原3JSONは変更しない。Grover IAMのt5承認は本文訂正に拡張しない。

grover_iteration route/fixtureは作成せず、本文/JSON無変更、未公開。原palette[]×3/max-wire-count1×3、各4-wire。画像0、credits削除0。移行後の本文diff/390・1440 scroll/step0は未検証。multiple_marked_values以降も停止した。
