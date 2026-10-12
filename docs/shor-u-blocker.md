# shor_u: U1〜U4承認済み・原PNG保持＋PR589注記で解決

2026-10-12 09:31の最新指示で原PNG/credit保持と直下のPR589 exact noteを適用。I1の画像訂正/ownedSVG置換は撤回。現在の移植/公開検査はporting.md参照。以下は歴史的な承認前提案とSTOP記録。

2026-10-12 08:52の依頼で高宮さんが以下U1/U2=1996/U3/U4をexact承認。これらは再質問しない。原図の新たなbase/exponent逆転を発見し、owned置換/route作成前に停止した。現在の質問は [shor-u-image-label-blocker.md](shor-u-image-label-blocker.md) のI1だけ。以下は既承認案の歴史的提案・数値記録。

2026-10-12。承認C1/C2だけのshor_rを公開した次のsidebarページを調査。**shor_uは未移植・route未作成・未公開、原文/TeX/JSON/3×256円/画像4枚無変更。shor_qft以降も停止。** 同ページopen PRなし（08:13全0件）。shor_fx A承認をこのページへ転用しない。Bは却下済みで再提案しない。

原最新source `docs/shor-u-original-source.html`。Python証拠 `tests/fixtures/shor-u-blocker-analysis.json`、3箇所のexact label提案 `tests/fixtures/shor-u-ket-proposals.json`、文献年の根拠 `tests/fixtures/vedral-bibliography-evidence.json`。

```sh
python3 scripts/analyze-shor-u-source.py docs/shor-u-original-source.html --output /tmp/shor-u-analysis.json
```

## 正しい数値・保持すべきmetadata

1 JSON（8wire）/差0、palette[[]]、max-wire-count[1]、run1。画像4枚、qubit-circle768個（256×3）。振幅は各表16個+0.25でsum squared=1、xの各確率6.25%。

初期f値=[1]×16、最初のcontrolled shift後=[1,2]×8、最後=[1,2,4,8]×4。純粋な4bit左rotate1/2とpow(2,x,15)が全x0..15で一致。1000(8)→0001(1)、16mod15=1も正しい。各表の非ゼロ**配置と振幅**は正しい。GPUや量子回路CPU simulatorを動かした値ではなく、作者の表を数学/古典bit位置置換と比較した。

画像置換/credits削除0（未移植）。引用sidenote・図のsourceは維持する。原legacy Qniの最大16という言及は今回変更提案しない。新WebGPUの上限へ黙って置換しない。

## U1: Uの説明

原「各Uはa modNを計算」は前ページの「現在値をa倍してmodNを取る」定義と違う。N15/a2/current8なら現在値掛け算は1、constant a modNは2。前ページAと同じ欠落だが、このページの変更は未承認。

before:

```text
この実装では、U ゲートの一つひとつは \(a\,mod(N)\) を計算するのでした。
```

after（未適用）:

```text
この実装では、U ゲートの一つひとつは現在の値を \(a\) 倍し、\(mod(N)\) した値を書き込むのでした。
```

TeX1→2になる案。他のa^x modNの式は保持、Bのidentity文は追加しない。

## U2: 引用年2021

リンク先arXivのcitation_dateは**1995/11/16**。同論文 DOI **10.1103/PhysRevA.54.147** のCrossref/APS出版metadataは **1996/07/01**、publisher American Physical Society。2021ではない。

原noteの `(2021)` → **`(1996)`**（刊行年）だけへ変更してよいか？ title/authors/arXiv URLは維持する案。arXiv初稿年1995を意図するならその選択を指示してほしい。根拠metadata取得URLとdateをfixtureに保存。

## U3: 3つの図でket241が重複し242が欠ける

全表の0-based位置242が241とラベルされている。これら3箇所だけ `qubit_circle: 241`→`qubit_circle: 242`。本物の位置241ラベル/全振幅/全JSONは変更しない。

### grid0（初期）のexact before→after

```text
{{ '0.25' | qubit_circle: 241, 'base' }} {{ '0' |
        qubit_circle: 241, 'base' }}
```

→

```text
{{ '0.25' | qubit_circle: 241, 'base' }} {{ '0' |
        qubit_circle: 242, 'base' }}
```

### grid1（shift1）のexact before→after

```text
{{ '0' | qubit_circle: 241, 'base' }} {{ '0.25' |
        qubit_circle: 241, 'base' }}
```

→

```text
{{ '0' | qubit_circle: 241, 'base' }} {{ '0.25' |
        qubit_circle: 242, 'base' }}
```

### grid2（shift2）のexact before→after

```text
{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |
        qubit_circle: 241, 'base' }}
```

→

```text
{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |
        qubit_circle: 242, 'base' }}
```

各before substringが全文に1回だけ出ることを検査した。grid1の位置242の振幅+0.25は正しい（x15/target2）、ラベルだけが誤り。

## U4: 図のaxis説明

表はf(x)の0..15見出しを横に並べ、xの0..15行見出しを縦に並べているが、本文が逆に説明している。初期の非ゼロはcolumn1に縦に並び、f=1/x一様という数値は正しい。

- `の値は列方向 (縦方向) に読みます。` → **`の値は列番号 (横方向) から読みます。`**
- `x の値は行方向 (横方向) に読みます。` → **`x の値は行番号 (縦方向) から読みます。`**

これら2substringだけの案。既存f(x)式・x text・図header/順序は保持。末尾「元グラフを90度回転」はx右/f上→f右/x下の時計回り90度と整合するため、不要な変更は提案しない。

## 質問

**U1/U2/U3/U4の上記正確な変更だけを承認しますか？** 未承認なので何も適用しない。TeXはU1の1→2以外不変、labelだけ3件、引用年だけ1件、axis proseだけ2件。後続移植も行わない。

移植後390/1440/DPR/text/TeX/scroll/GPU検査は未実施。新公開ページではないので架空native監査commandを作らない。承認後に原1回路の初期/shift各signed値とnativeUIの実機確認待ちauditを用意する。
