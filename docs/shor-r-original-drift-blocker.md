# shor_r: PR#587のD1/D2承認済み（解決済み）

2026-10-12 08:40の依頼で高宮さんがD1/D2をexact承認。他変更なしで適用し、最新原f7569b20との本文/18TeXのraw差0を390/1440×DPR1/2で確認。公開検査の続報はporting.md参照。以下は承認前のSTOP・質問・証拠の歴史的記録。

**当方は承認C1/C2をexact適用して公開済み。新しい原文の2語句を取り込まない。** port b94fd4f / Pages38183978622 success、公開source/layout/axis/TeX検査5/5成功。元sourceの最初のlocal比較08:16はC1/C2 whitelistだけで4/4成功。しかし原PR#587が**08:23:47 JST**にmergeされたため、公開比較時の原文が変更された。

PR https://github.com/qniapp/qni/pull/587
head `cb5e82e8bba966b9926e8bda089248f4e9214124`、latest original main `f7569b20c7d61b170d1bd90b92f84b46f043061f`。

保存原 `docs/shor-r-original-source.html` と承認案 `docs/shor-r-approved-source.html` は変更しない。新原 `docs/shor-r-pr587-source.html` を別保存。`tests/fixtures/shor-r-pr587-drift-analysis.json` はPR API/2差分、`shor-r-public-original-drift-verification.json` は4条件のraw本文/MathJax入力/JSON。

## Exact approved→PR#587差（未承認・未適用）

D1:

```text
を計算し、
```

→

```text
を計算して、
```

D2:

```text
\(r = 4\) の場合には因数 3 と 5
```

→

```text
\(r = 4\) の場合因数 3 と 5
```

この2件を承認sourceに仮適用してwhitespaceを除くと最新原文と全文一致することをPythonで確認。**追加差は文言2箇所のみ**。C1/18TeX/description/数値/因数3&5/回路0は一致。承認C1/C2は説明文のexact全文承認であって、この後の別修正は自動承認とは解釈しない。

## 4条件の検査結果を隠さない

390/1440×DPR1/2で全4件:

- 当方本文→C1/C2 approved golden: **一致**。
- 当方TeX18→golden、最新原TeX18→当方、description、JSON[]: **一致**。
- 最新原本文→当方、**C1/C2だけ**のwhitelist: **不一致/STOP**（上記2語句）。
- 公開専用5テストは**5/5成功**、内側scroll/文書横overflow/console/page errors0。

```sh
# 通常strictは初回不一致でthrow
QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs shor_r
# 全4条件の証拠だけ集める。whitelistを緩和しない、失敗exit1を維持。
QTW_COMPARE_COLLECT_FAILURES=1 QTW_AUDIT_URL=https://qniapp.github.io/qni-tutorial-webgpu/ node scripts/compare-qpe-original.mjs shor_r
```

後者の実結果 `STOP shor_r: 4/4 comparison cases failed; no additional edits are authorized`、exit1。これを成功と報告しない。参照log 一時ディレクトリの `qtw-r-public-{tests,compare,compare-all}.log`。GPUExecuted:false。

## 質問/停止

**C1/C2 exactの現在の本文を維持するか、D1/D2の2語句も追加承認するか？** 今は維持がdefault。取り込み・source golden/whitelist更新・公開本文の再編集はしない。新変更のpushは証拠/docs/script診断のみ。shor_uにも独立の未承認修正があるためrouteは作らず、以降へ進まない。
