# SAT: Hint4明示訂正と指定PR版の優先順位を確認するため公開保留

2026-10-11 12:28の割込み指示で、Hint4の4訂正も明示承認された。Hint4を訂正する許可そのものは未決ではない。ただし同じ指示は「PR qniapp/qni#575の最終文言に合わせ、相違したらPR版を使う」と指定する。

12:29/12:30/12:32/12:35に `gh pr view 575 -R qniapp/qni --json headRefOid` とdiff/contentを確認した。headは **b0d1c105ee0edbc2d20f3f45439d595bbe2eecab**。そのファイルには次が残る:

- 「このヒントが言っていることは次の3つです。」
- A≠7、B≠3、C≠8の旧3-item bullet list (Hint4の9変数preなし)
- 「3つの変数 A7,B3,C8 の値はfalse」
- Hint1前提「ほかのヒントから A8,B8,C8 がfalse」

つまり追加承認4項目と指定PR版の双方に同時には合わせられない。原稿を勝手に旧文言へ確定して公開せず、**PR更新を待つか、今回指定のHint4文言をPR版より優先するか**を質問してSTOP。原行285付近の最適化説明は変更しない。

PRのt5 JSONは当方fixed fixtureと**JSON全体で完全一致**。PRによる10列変更は同一で、冗長XX/125列/14-wire/labels保持。PRのCSS class並べ替えは本文/回路の変更ではなく、旧editorを新nativeへ置換する当方に持ち込むものではない。

中断前からの作業は捨てず、SAT Astro原稿・自作状態図・fixtures・testsをworktreeに保存したままにする。これらは公開していない。t1..t10/復元/全回路の実GPU結果は [sat-gpu-verification.json](../tests/fixtures/sat-gpu-verification.json)、original/fixed fixturesも保存。GPUの成功を、未確定な全文や公開UIの成功として記録しない。
