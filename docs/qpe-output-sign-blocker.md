# qpe_output: QFT名と「周期2」 — 解決済み

2026-10-11 19時の再開指示で、高宮さんが **Aの表の5置換すべてとBの1文だけ** を明示承認。適用した。他の本文/数値/16円/残るTeXは不変。正確な原/approved source、guard、比較・公開記録は `porting.md` 末尾。以下は承認前の履歴であり、現在のSTOPではない。

2026-10-11 18時。QPEのoption A承認はQPEページだけに適用し、この別ページへ拡張しない。phase_kickbackの次をsidebar順で調査し、以下でSTOP。**qpe_outputと後続shor_hsp以降は未公開、route未作成、原文/TeX/16円は無変更。** 18:26のopen PRは全0件、同ページPRなし。

原source `apps/tutorial/qpe_output.html`（SHA256はanalysis fixture）。

- description（5行）と本文/式（13/37/46/50行）の合計5か所が「逆QFT/逆 QFT」。
- 同じページでπ/4の正位相ランプをその演算にかけて2を得ると説明。
- 既刊の正角「逆QFT」は周波数→位相、承認後のQPE後半は負角「QFT」（位相→周波数）。したがって、このページの呼称は今回承認されたQPEおよび既刊と矛盾する。
- 37行の「周期2」は、16標本中2周期の**周波数2**のこと。原ランプの1周期は8標本であり、2標本ではない。

## Python解析

`a_j=(1/4)exp(iπj/4)`、N=16。有限Fourier和で負符号はk2/確率1（100%）、既刊の正符号「逆QFT」はk14/確率1（100%）。

- 負: 360×2/16=45°=π/4。
- 正: 360×14/16=315°（−45°）で、原文の45°ではない。
- 周期8標本、周波数2、16間隔分720°、720/16=45°。H例の360×8/16=180°=πも正しい。
- 原16円の±0.17678等は閉形式と小数5桁で一致。画像0/credits0/回路0、palette/max-wire-count/run-buttonは該当なし。

これは数学の閉形式評価で、GPU実行でも回路CPU simulatorでもない。

一時ディレクトリに保存する解析結果も、コマンドでは相対ファイル名を指定する。

```sh
python3 scripts/analyze-qpe-output-source.py ../qni/apps/tutorial/qpe_output.html --output qpe-output-analysis.json
```

永続 `tests/fixtures/qpe-output-blocker-analysis.json`。GPUExecuted:false。

## 高宮さんへの質問 / 正確な提案（未適用）

**A: 逆QFT呼称の5か所だけをQFTへ変更してよいか？**

| 場所 | before → after |
|---|---|
| description | `位相キックバックと逆QFTの結果を固有位相として解釈する` → `位相キックバックとQFTの結果を固有位相として解釈する` |
| 冒頭 | `出力である逆 QFT` → `出力である QFT` |
| 37行 | `これを逆 QFT にかけると` → `これを QFT にかけると` |
| 46行TeX | `\times 逆 QFT の結果` → `\times QFT の結果` |
| 50行 | `で見た逆 QFT` → `で見た QFT` |

**B: 周期/周波数の1文だけを訂正してよいか？**

`周期 2 が得られます。 周期が 2 ということは` → `周波数 2 が得られます。 周波数が 2 ということは`。

他の本文/数値/16円/リンク/残るTeXを変更しない。Aでは式の入力TeX1個の「逆」だけが消えることをwhitelistする必要がある。まだA/Bいずれも未承認なので適用せず、移植後本文/TeX/3901440/DPR/scrollの検証は実施していない。
