# phase_logic: 承認された40振幅の訂正で解決

**現在の状態: 解決。** 2026-10-11 11:24に高宮さんが5組・40振幅だけの ±0.70711→±0.5 を明示承認した。1-qubit pNOT・本文・原6回路JSONは無変更。移植・公開確認は [porting.md](porting.md) 末尾。

以下は承認前の歴史的なSTOP記録。

2026-10-11。高宮さんの承認により `superposition_quantum_logic` を訂正・公開し、390/1440のlive確認も成功したため、sidebar直後の `phase_logic`（位相論理演算）の確認に進んだ。このページの文言待機は解除済みだが、新たに原図の数値不一致を見つけたため **振幅訂正の許可待ちでSTOP**。移植route/fixtureは作っていない。

## 原のlive表示で再現

qniapp/qni `apps/tutorial/phase_logic.html` と原live `https://qniapp.github.io/qni/phase_logic.html` を確認。

pAND/pOR/pNAND/pNOR/pXORの2-qubit重ね合わせ図5組は、入力4状態も出力4状態もそれぞれ `±0.70711` としている。各図の入力は4×0.70711² = **2.0000182084** で、確率合計が約200%。正規化された2-qubit一様状態の振幅は各0.5 (確率25%) である。位相の符号の違いは保持してよいが、振幅の大きさが原回路と一致しない。

## 原pAND回路の実GPU比較

原JSON `{"cols":[["|0>","|0>"],["{pAND"],["•","•"],["}"],[1]]}` を使用し、パレットから2つのHを準備する状況を再現するため、診断コピーでWRITE直後に `["H","H"]` を挿入した。製品・原JSONは変更していない。

実Chromium/AMD WebGPU、公開standalone、pin `ef652682c23d89427f6f39bb6bee1ec6fae9bb1e` の最終状態:

- 実振幅: `[+0.4999999701976776, +0.4999999701976776, +0.4999999701976776, -0.4999999701976776]`
- 虚部: 全0、norm **0.999999880790714**、page errors0
- 3だけ位相反転する本文・回路の論理は正しいが、原図の振幅約0.70711とは異なる

証拠 一時ディレクトリの `qtw-phase-logic-original-repro.{mjs,json,log}`、`qtw-phase-logic-original-gpu.png`、診断JSON `qtw-phase-pAND-diagnostic.json`。原liveの5図・各8振幅も保存。診断用browserは終了済み。

## 高宮さんへの質問

**pAND/pOR/pNAND/pNOR/pXORの重ね合わせ図5組・40個の図用振幅だけを、符号を保持したまま `±0.70711 → ±0.5` と訂正してよいか？** 1-qubit pNOTの0.70711は維持する。原6回路のJSON・本文は変更しない。許可があるまでphase_logicとその後を公開しない。

移植予定の原設定は6 mini_qniともpalette `["|0>","|1>","H"]`、正式mini_qni pluginのmax-wire-count **2**。原画像 `amplitude_amplification_overview.png` は既存の自作対話的AmplificationIllustrationに置換できるが、今回は未置換・削除credits0。移行後の本文diff/390・1440のscroll/step0検証は未実施。

その次の `phase_logic_combination` の論理式の括弧も [別の未承認項目](phase-logic-combination-blocker.md) として残る。今回のsuperposition承認を別ページの本文や図の数値へ拡張しない。
