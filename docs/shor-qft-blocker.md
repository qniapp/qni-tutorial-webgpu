# shor_qft: Q1/Q2 exact承認・解決済み

2026-10-12 10:16の依頼で高宮さんが以下Q1/Q2をexact承認。他変更を適用しない。移植/公開成績とPR比較はporting.md参照。以下は承認前のSTOP・exact提案・数学証拠の歴史的記録。

2026-10-12 09:53。shor_uのPages/公開source5/原比較4を確認してから次pageを調査。**shor_qftは未移植・route未作成・未公開、本文/TeX/JSON/256円無変更。後続も停止。** shor_r/Uの承認を転用しない。

最新原main61e757cのsource `docs/shor-qft-original-source.html` を保存。open/merged PRをpage名で検索して[]、直近10PRも確認、該当修正なし。量子回路1（8wire）/palette[[]]/max-wire-count[1]/run1、画像0/credits0、256circleのbefore-QFT table。QFTのnegative P6個は既存のQFT規約と一致、勝手に変えない。『3つおき』は同じf列で3つのzeroを挟むx0/4/8/12と整合するので変更しない。『にだけに』というgrammarも今回変更案に含めない。

## Pythonの数学検算（GPU/CPU量子simulatorではない）

一時ディレクトリに保存する解析結果も、コマンドでは相対ファイル名を指定する。

```sh
python3 scripts/analyze-shor-qft-source.py docs/shor-qft-original-source.html --output shor-qft-analysis.json
```

`tests/fixtures/shor-qft-blocker-analysis.json`:

- authored tableはf(x)=2^x mod15の全x0..15と一致、16個+0.25、sum squared1。
- 各fのcosetへ有限負Fourier和を計算：測定0/4/8/12各25%、他0、全joint signed係数のnorm1。JSON gateを実行していない数学計算で、GPU実読戻しとは無関係。
- 4/16=1/4、8/16=1/2、12/16=3/4、既約分母**4/2/4**。0/16=0から有用な候補なし、再測定。
- 候補r2：gcd(2+1,15)=3 / gcd(2−1,15)=1。
- 候補r4：gcd(4+1,15)=5 / gcd(4−1,15)=3。
- 原候補r8：gcd(16+1,15)=1 / gcd(16−1,15)=15。**非自明な因数が得られない。**

r2は真のorder4ではないが、候補として非自明factor3を与えN/3=5が得られる。真のorderを返すと誤って断言せず『候補』とする。既承認shor_rと同じ数値だが、このpageの改変は別承認が必要。

## Q1 最後の段落のexact案（未適用）

before:

```text
最後の測定で 0, 4, 8, 12 のいずれかが求まることを確認してください。
  これを連分数アルゴリズムにかければ、\(r = 4, 8\) が得られます。 そして gcd を計算して実際に \(N =
  15\) の約数として正しい 3, 5 が求まります。 長い道程でしたが、\(15 = 3 \times 5\)
  の因数分解を実行するショアのアルゴリズムができました!
```

after:

```text
最後の測定で 0, 4, 8, 12 のいずれかが求まることを確認してください。
  これを連分数アルゴリズムにかけると、\(r = 2, 4\) が候補として得られます。
  測定値 4、8、12 を 16 で割って既約分数にすると、分母はそれぞれ 4、2、4 になります。
  測定値 0 からは有用な候補が得られないので、測定をやり直します。
  そして gcd を計算して、結果が 1 より大きく \(N = 15\) より小さい非自明な因数かチェックします。
  非自明な因数が得られたら、\(N\) をその因数で割ってもう一つの因数を求めます。
  \(r = 4\) の場合には正しい 3, 5 が求まります。 長い道程でしたが、\(15 = 3 \times 5\)
  の因数分解を実行するショアのアルゴリズムができました!
```

候補4/8→2/4、分母/0再試行、gcdが1や15を返した場合を成功と誤認しない判定、相方N/divisor説明、r4成功3/5・最後の15=3×5は維持する。旧r=4,8を1入力変更、N/r4のTeX2入力追加。他の文/TeX/JSONは変更しない。

## Q2 表のketラベルexact案（未適用）

0-based位置242がket241と重複。振幅0と正しい位置241ラベルは保持し、**後者ラベル1個だけ**:

before:

```text
{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |
        qubit_circle: 241, 'base' }}
```

after:

```text
{{ '0' | qubit_circle: 241, 'base' }} {{ '0' |
        qubit_circle: 242, 'base' }}
```

## 質問 / 今の状態

**Q1/Q2のこのexact案を承認しますか？** 未適用。元JSONのQFT/Measure/palette/max/run、他全本文/TeX/全amplitudeを保持する。

未移植なので390/1440/DPR/text/TeX/scroll/GPUのpage検査は未実施、診断embedや架空GPU commandを作らない。承認後に原1回路のsigned Fourier値/測定分布/nativeUIを実機確認待ちとして監査scriptへ足す。今回既存＋新shor_uのGPU全件と4旧layout失敗はpending-real-machine-checks.mdのcommandsで**実機確認待ち**。
