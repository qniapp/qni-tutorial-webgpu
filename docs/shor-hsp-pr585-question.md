# 原qni PR585の追加1文（承認・適用済み）

2026-10-11 20:11の依頼で、この第7文の正確なbefore→afterを高宮さんが明示承認。適用・公開検査は `porting.md` 最新追記を参照。以下は未承認時の歴史的記録。最新照会では#585はMERGED/head c960caacで、指定29d5ebf2はこの第7文をまだ含まない旧commitだった。

2026-10-11 20:03。qniapp/qni open PRを再確認し、[PR585](https://github.com/qniapp/qni/pull/585) `Correct complexity and gcd wording in Shor HSP tutorial` を検出。head `c960caacb3586e25397fca93e7f7e684bceaee83` のsourceと、このboxが正確にR1〜R6だけ適用した `docs/shor-hsp-approved-source.html` を比較した。

R2/R3/R4/R5の行折り返し差を除けば、追加の本文差は次の1文。**R1〜R6の承認には含まれておらず、「Change nothing else」なので未適用。** product/Golden/approved snapshotに第7変更を追加しない。

## 質問・正確な追加fix案（未適用）

before:

```text
このため、古典コンピュータではショアのアルゴリズムを使ってもやはり指数時間かかってしまいます。
```

after (PR585):

```text
このため、古典コンピュータでは、ショアのアルゴリズムの手順をそのまま使っても、最悪の場合は指数時間かかってしまいます。
```

**この第7変更も承認しますか？** 順次列挙手順/最悪の場合という明確化として合理的だが、最新の明示承認を越えて自動適用しない。TeX/数値/画像/JSON差はこの文にはない。

20:04の原実サイトはまだこの差を含まず、実公開shor_hspとの4case比較はR1〜R6だけで成功した。証拠 `tests/fixtures/shor-hsp-public-nongpu-verification.json`。今後PRがmerge/deployされ原サイトに第7変更が現れたら、現Goldenとの比較はSTOPする。これを隠すためのwhitelist追加や原sourceの書換えは行わない。shor_fxは別のU定義問題で既にSTOP、後続も未移植。
