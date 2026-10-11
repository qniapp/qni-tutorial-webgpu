# shor_fx: A承認・B却下（解決済み）

2026-10-11 21:09の最新依頼で、高宮さんはAだけ承認、Bは却下して原文のままを指示。N以上identityの文は追加しない。直前のローカル公開holdはbranch作成と読取りだけで中断し、最新依頼で解除。未編集のwip branchからmainへ戻ってAだけ移植する。以下は歴史的な質問記録、最新結果はporting.md参照。Bを再度未承認blockerとして扱ったり、公開前提として要求しない。

2026-10-11。承認されたshor_hsp R1〜R6を公開した次のsidebarページを調査。**shor_fxは未移植・route未作成・未公開、原文/TeX/JSON/画像4枚を変更していない。shor_r以降も停止。** shor_hspの承認をこのページへ拡張しない。

原全文は `docs/shor-fx-original-source.html`、数値と原JSON/metadataは `tests/fixtures/shor-fx-blocker-analysis.json`。qniapp/qni open PRは19:42に全0件、同ページPRなし。latest origin/mainと取得済みsourceがbyte一致した。

```sh
python3 scripts/analyze-shor-fx-source.py ../qni/apps/tutorial/shor_fx.html --output /tmp/shor-fx-analysis.json
```

## 確認できた数値・metadata

- 4bitは0..15の16値。N15/a2でf(0)=1、x0..15のf(x)=[1,2,4,8]×4。
- 4controlの適用回数1/2/4/8、選ばれた回数の和はすべてのx0..15でxと一致。別registerを1に初期化して掛け合わせるとpow(2,x,15)に一致。
- 原JSON **2回路・差0**。1つ目は4wire/H4、2つ目は8wireでtargetのLSBを1、残り3bitを0で初期化。prepared productの振幅は1/4が16個、norm1。これはHの解析的product式であり、量子回路CPU simulator/製品fallback/GPU読戻しではない。
- 原palette **[[],[]]**、max-wire-count **[1,1]**（4/8という実wire数へ勝手に変更しない）、run-button2。
- 4画像: `shor_xtimes_u.png`, `shor_us.png`, `shor_us_and_inv_qft.png`, `shor_mod15.png`。3枚は抽象回路図、1枚は算術グラフ。調査した第3図の実ラベルは **QFT** であり、filenameのinv_qftだけを理由に逆QFTへ直す必要はない。画像は今回は置換せず、credits削除0。Qiskit sidenote/linkも未変更。

## A: まとめが本文のU定義と一致しない

本文はUを「現在の値をa倍し、mod(N)した値を書き込む」と定義するが、まとめは「a mod(N)を計算できるゲートU」。現在値に掛けるという部分が落ちている。

具体例 N15/a2/現在値8: 定義通りなら2×8 mod15=**1**、a modNなら2 mod15=**2**。同じ値ではない。文脈上省略した意図があっても、文字通りの定義との違いを黙って補完しない。

### 正確なfix案A（未適用）

before:

```text
\(a\,mod(N)\) を計算できるゲート U があったときに
```

after:

```text
現在の値を \(a\) 倍し、\(mod(N)\) した値を書き込むゲート U があったときに
```

この後の `a^x mod(N)` と他本文は保持する。AはTeX1入力を2入力へ変更するため、承認後にその差だけをwhitelistする必要がある。

## B: 有効値だけの説明か、全16状態でのゲート定義か

本文通りのmodular multiplicationはa/Nが互いに素なら0≤y<Nの範囲でpermutationとなる。今回のlessonで1から到達する値1/2/4/8には問題がない。

ただし、4bitの全16basis状態へ同じ式を無条件に適用すると、N15/a2では **y0→0 / y15→0** と衝突する。distinct outputs15個で、full16次元のunitaryではない。原文に有効subspaceだけを説明する意図があるなら、その範囲/残りの状態の扱いはまだ書かれていない。

標準的な候補は0≤y<Nでay modN、y≥Nはidentityとする拡張。N15では15を15へ写せば0..15のpermutationとなり、入力1からの元の計算結果をすべて保持する。Pythonで確認済み。ただしこれは**作者が選ぶ定義の明確化**であり、未承認で追加しない。

### 正確なfix案B（未適用）

U定義の次のsubstringを置換し、1文だけ追加する:

before:

```text
した値を書き込んでくれるものとします。
```

after:

```text
した値を書き込んでくれるものとします。
  ただし、ここでは \(a\) と \(N\) が互いに素であることを前提とし、現在の値が \(N\) 以上の状態は U で変えないものとします。
```

Bはa/N/NのTeX3入力を追加する案。具体的な15の回路JSON・初期化・1/2/4/8の結果は不変。

## 質問

**AとBをこの正確なbefore→afterだけで変更してよいか？** 作者の意図が有効subspaceだけの説明なら、Bのidentity拡張を選ばず、その範囲だけを明示する別案を指示してほしい。本文の追加/新しいgate/domain決定を勝手に行わない。

このページのGPU/本文layout検査は未実施。未公開なので実機commandを存在しないroute/scriptへ向けて作らない。承認後の移植では2つのnative preparation回路をそのまま保持し、実機確認待ちにする。必要な監査はrunning/step0/norm、4wireの16振幅+0.25、8wireのindex16..31の16振幅+0.25、再生/measurement/undo/redoの元の機能、Regular native labels・3901440/DPR・toolbar表示。専用の実機audit scriptを用意してから正確なcommandを記録する。
