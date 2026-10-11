# grover_iteration: 2回の丸め訂正は承認済み、9回目の数値確認でSTOP

2026-10-11。PR #63 (pin 348992f5d7926d326eaa0f678fa8d89f0894ff54) の公開全55ページ・110ケース・210起動・全210ツールバーの確認を最優先で完了した。その後、高宮さんの「数値は正しく」の指示に従い、原文の前提からPythonで解析した。

## 原文の前提

原文は冒頭に「4量子ビット回路」、答を1111、0000等を「答でない」と記す。原回路は4-wireを|0000>からH×4で一様重ね合わせにし、pANDの4点で1111だけを位相反転する。したがって n=4、N=2^n=16、M=1。SATの14-wireや複数解の例ではない。

## 2回反復の解析

Python `math` で、k=2として次を計算した。これは指示された解析式の評価であり、CPUで量子状態ベクトルをシミュレーションする代替経路ではない。

1. sinθ = √(M/N) = √(1/16) = 0.250000000000000
2. θ = asin(0.25) = **0.252680255142079 rad** (14.477512185929925°)
3. (2k+1)θ = 5θ = **1.263401275710393 rad** (72.387560929649620°)
4. P = sin²(5θ) = **0.908447265625000**
5. 100P = **90.844726562500000%**。小数第1位は **90.8%**。

原JSON無変更の実Chromium/AMD WebGPU結果は **90.84466975183183%** (390/1440で一致)。解析値との差0.000056810668170 percentage pointsは単精度誤差の範囲で、90.8%への丸めが一致する。

**条件付き承認が成立したため「約90.9%」→「約90.8%」1か所だけを訂正**し、`docs/grover-iteration-approved-source.html` に保存した。元へ逆置換すると原sourceがbyte相当で完全一致し、3JSONは無変更。この2回反復の確認は解決済み。

## 別の数値: 9回目は99.9%でなく99.2%

原文は「9回目で99.9%の確率を得ます」と書く。原liveの段落と3JSONが取得したsourceに一致することも確認した。

同じ N=16/M=1、k=9 の解析値は:

- 19θ = **4.800924847699494 rad**
- P9 = **0.992181860020537**
- 100P9 = **99.218186002053700%** → **99.2%**

原第3回路(4反復)の反復部12列が毎回同じことを確認し、**検証用だけ**に同一12列を5回追加した9反復回路を実GPUで実行。390/1440とも **99.21797226588893%**、errors0、norm≈1。原JSONを勝手に修正・最適化したのではなく、「さらに繰り返す」本文の動作を同じ反復で検証した。3反復の原prefixも **96.1318034678925%** →96.1%、4反復は58.1703%→58.2%で本文と整合する。

「99.9%→99.2%」は2回反復の1か所承認の範囲外なので、**公開前にSTOP**した。高宮さんへ **追加で99.9%を99.2%へ1か所訂正してよいか** と質問している。

## 状態と資料

- grover_iteration routeは未作成、未公開。multiple_marked_values以降も停止。
- 原palette[]×3/max-wire-count1×3、各4-wire、17/29/53列。画像0、削除credits0。移行後の本文diff/390・1440scroll/step0はまだ検証していない。
- 永続解析結果 `tests/fixtures/grover-iteration-analysis.json`、3/9回の実GPU結果 `tests/fixtures/grover-iteration-k3-k9-gpu-verification.json`。
- `/tmp/qtw-grover-iteration-analytic.json`、`/tmp/qtw-grover-iteration-original-gpu-results.json`、`/tmp/qtw-grover-iteration-k3-k9-{circuits.json,gpu.mjs,gpu-results.json,gpu.log}`。
- 原live段落 `/tmp/qtw-grover-iteration-original-nine-prose.json`、screenshot `/tmp/qtw-grover-iteration-original-99_9.png`。
- CPU fallback/本番readback/上流コード変更なし。hard stop14:22。
