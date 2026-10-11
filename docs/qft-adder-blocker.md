# qft_adder: block序数と前ページURLでSTOP

2026-10-11、hard stop16:28。inside_the_qftの承認2訂正を公開・GPU/本文/全11toolbar/scroll/DPR検証した後、sidebar次のqft_adderを確認し、以下2件の承認を質問した。未承認のまま移植/公開を止めた。

## 1. コアblockは左から4番目

原mainと原liveの**3回路**のJSONが一致することを390/1440実Chromiumで確認した。第2回路のblock順は:

1. a=3
2. b=1
3. 逆QFT
4. a+=b
5. QFT

原文 `a += b のブロック (左から 3 番目)` は、3番目の逆QFTと食い違う。

提案:

```text
a += b のブロック (左から 3 番目)
```

→

```text
a += b のブロック (左から 4 番目)
```

原回路のblockを移動したり、a/bの初期化blockを結合したりしない。原写真 `/tmp/qtw-qft-adder-original-1440-1.png` (390も取得)。長い原回路は原親の水平scrollがあるため、写真右側は親viewport外では白になるが、原liveのdata-jsonにも同じ5ラベルが含まれ、最初の3ラベルと4番目の開始位置が画像で確認できる。

## 2. 前ページlabelとhrefが一致しない

frontmatter:

```yaml
prev: QFT の内部
prev_url: ./inverse_qft.html
```

原サイトfooterの「QFT の内部」を実際にclickした結果 (390/1440とも):

- href: `./inverse_qft.html`
- destination: `https://qniapp.github.io/qni/inverse_qft.html`
- destination heading: **逆 QFT**

同じ原sidebarの「QFT の内部」は正しくinside_the_qft.htmlへlinkしており、footerだけが違う。原サイト最接近の操作で誤遷移を再現した。

提案するfrontmatterだけの訂正:

```yaml
prev_url: ./inverse_qft.html
```

→

```yaml
prev_url: ./inside_the_qft.html
```

資料 `/tmp/qtw-qft-adder-original-prev-{390,1440}.png`、`/tmp/qtw-qft-adder-prev-link-results.json`。

## 数値と回路

元3JSON (22/52/12列) は各7-wireで正しい。aはq0..3、bはq4..6。palette属性なし (移植時[]×3)、max-wire-count1×3、run-buttonなし。第2JSONのtitle **QFT で足し算** は保持する。

- 初期a=3/b=1はindex19=16×1+3、amp+1/100%。
- 通常加算とQFT加算はa=4/b=1、index20、amp+1/100%。
- 逆QFT終了prefix25列: index16+jのamp=(1/4)exp(i3πj/8)、各6.25%。
- 加算終了prefix37列: 同じindex16+jのamp=(1/4)exp(i4πj/8)、各6.25%。
- bの各bitを制御とするコアは角度2π×2^qa×2^qb/16を追加し、全体としてexp(i2πjb/16)を掛ける。周波数3+1→4は正しい。
- 元のcontrolled dot数は19、新コア9で、control削減の説明も正しい (targetゲートはいずれも9)。
- 入力のない単独コアJSONは|0⟩から|0⟩/100%。これはその初期値に対する結果で、コアの加算効果を示す検証とは区別する。加算効果は上の逆QFT後/コア後/最終のsigned値で証明した。
- 元第2JSONのコア9角だけをテスト用に負にする52列回路は3-1=2、b=1保存、index18、amp+1/100%。引算可能という本文も正しい。原JSONにこの変更を書かない。

公開WebGPU pin348992f5d7926d326eaa0f678fa8d89f0894ff54/実Chromium/AMD Vulkan/390・1440で、原3JSON×両幅 **6/6**、prefix2・初期値・引算×両幅 **8/8**、計 **14/14 signed値/確率成功**、norm≈1/errors0。CPU量子simulator fallback/本番readback/上流変更なし。永続 `tests/fixtures/qft-adder-blocker-verification.json` に原JSON・原liveのラベルと該当段落・誤linkの実click・元6GPU結果・4テストJSON・8GPU結果を保存した。

## 状態・範囲

qniapp/qniのopen PRは#579 (inside_the_qft、head9019a7927c550d885d765cf8dec4b7d33634ba01) で、qft_adderに関連するPRなし。#579は前ページの承認2訂正と一致するが、余分なinspector class順序は採用しない。

このページは画像0/置換0/credits削除0/sidenote1/Orbit0。**未公開、route/移植fixture未作成、本文/URL/JSON無変更。** 移植後のtext/TeX/scroll/DPR/toolbar/step0は未検証。2訂正のみを承認するか質問済み。その他の本文・角度・数値・回路は変えず、eigenphases以降も停止する。

資料 `/tmp/qtw-next-qft_adder.html`、`/tmp/qtw-qft-adder-original-*`、`/tmp/qtw-qft-adder-prev-link-*`、`/tmp/qtw-qft-adder-stage-*`。
