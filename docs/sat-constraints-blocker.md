# sat: Cond2が各箱の条件をORで結ぶためSTOP

2026-10-11。phase_logic・phase_logic_combinationは承認どおり訂正・公開し、390/1440のlive・GPU確認も成功。その直後の `sat`（充足可能性問題）を調べたところ、原の「追加条件2」の式と説明が一致しないため停止。route/fixtureは作らず、本文/回路を変更していない。

## 原liveでの反例

原文 `qniapp/qni:apps/tutorial/sat.html`、原live `https://qniapp.github.io/qni/sat.html` のCond2をそのまま取得して評価した。本文は「それぞれの箱には高々1つの数が入ります」とするが、式はAの10ケース、Bの10ケース、Cの10ケースの**全30項をORで連結**している。これは「少なくともどれか1箱がexactly-one」を意味し、全箱に条件を要求していない。

true変数を **A0,B0,B1,C0だけ**、残りをfalseにすると:

- Cond1 (各箱に少なくとも1個): true
- 原Cond2: true (A0の項とC0の項が成立)
- 意図された条件「全箱で高々1個」: false (B0とB1が同時true)

これはCond2単独の反例で、パズル全ヒントも満たすという主張ではない。原HTMLの式を直接評価し、論理式の数値やconnectiveを変更して再現したものではない。

証拠 `/tmp/qtw-sat-original-constraints.{mjs,json,log}`、原liveのCond2 screenshot `/tmp/qtw-sat-cond2-original.png`。原式・30項・成立項0/20・代入値を保存した。

## 原量子回路のGPU確認

別に、原125列/14-wire JSONを公開standaloneの実Chromium/AMD WebGPU (pin ef652682c23d89427f6f39bb6bee1ec6fae9bb1e) で無変更で実行した。起動成功、page errors0、norm **0.9999997615814351**。状態0〜15が各約1/16、8だけ実振幅 **-0.2499999701976776**、他は正、補助wireは0。A1/A4/B1=0、B4=1の位相反転は本文の最終答042と整合する。

最終回路が一致することだけで、途中のSAT定式化の不一致を容認しない。原回路を変更してCond2に合わせる回避策は使わない。資料 `/tmp/qtw-sat-original-gpu.{mjs,json,log}`。診断browserは終了済み。

## 高宮さんへの質問

**Cond2を箱ごとのexactly-one OR式に括り、(A条件) AND (B条件) AND (C条件) とする訂正を承認してよいか？** Cond1と合わせて各箱の値が1個になる。今回のphase2ページへの承認をSAT原文訂正へ拡張しない。他の式の完全な意味検証はまだ完了していないので、この訂正だけでSAT全体の正しさを保証するとは記録しない。

移植予定の原palette **[]**、原HTML max-wire-count **1**、14-wireを切り詰めない。原画像crack_the_code.jpg/sat_result_state_vector.pngは未置換、credits削除0。移行後の本文diff/390・1440のscroll/step0は未実施。許可とその後の原文整合確認までsat・後続grover_iam以降を公開しない。
