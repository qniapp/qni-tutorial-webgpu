# ふろく no_cloning_theorem_proof: bra因子順序でSTOP

2026-10-12 10:39、shor_qft公開/公開source5・原比較4成功後、sidebar次pageを確認。**ふろく「クローン禁止定理の証明」は未移植**。src routeなし。本文/TeX無変更・未公開、後続も停止。保存原 `docs/no-cloning-proof-original-source.html`。image/credit/circuit0、palette/max/runはN/A。viewport/TeX/scrollはpage未移植のため未検査。

PR検索page名[]、cloning検索で歴史的 **#97 MERGED（2022-02-19）head6edcb7d873113bbb07a83e4e385e76643d690724** を発見（証明を追加したPR）。新修正PRなし。

## mismatch（標準テンソル積表記の場合）

`|🍎>|0>` は `|🍎>⊗|0>` なので随伴は **`<🍎|⊗<0|`**。tensor productの随伴は因子順を逆転しない。原の `<0|<🍎|` は標準順序では別のbra。次の2displayにも同じ逆順が残り、後続の `<🍎|👶><0|0>` への展開に一致しない。ket同士のjuxtapositionは行列積ではなくtensor productなので、(AB)†=B†A†という通常の行列積規則をそのまま使えない。

Python証拠（unitary/gate executionなし、CPU/GPU量子simulatorではない）:

```sh
python3 scripts/analyze-no-cloning-proof-source.py docs/no-cloning-proof-original-source.html --output /tmp/no-cloning-proof-analysis.json
```

`tests/fixtures/no-cloning-proof-blocker-analysis.json`:

- 🍎=|1>=[0,1]、0=[1,0]。入力ket |🍎>⊗|0>=[0,0,1,0]、正しいbraも[0,0,1,0]、原の逆順bra=[0,1,0,0]。
- 原のbraと元ketの内積0、正しい随伴の内積1。
- 👶=|+>=[1/√2,1/√2]の場合、原のbra×(|👶>⊗|0>)は0、正しい内積は1/√2。後続の`<🍎|👶><0|0>`=1/√2と一致するのは修正後。
- no-cloning結論そのものは正しい。修正後のs=s²→s∈{0,1}は、s=1/√2の非直交状態と矛盾する。

もし原が『braはketと逆順で書いて内側から縮約する』という非標準の暗黙規約を意図しているならその説明がない。勝手に修正せず、**標準tensor順のB1〜B3へ直すexact案を承認しますか？** 未適用。

## B1 第一式の随伴display（1substring）

before:
```text
(\langle 0|\langle 🍎|)U^{\dagger}_{CLONE}
```
after:
```text
(\langle 🍎|\langle 0|)U^{\dagger}_{CLONE}
```

## B2 大きなdisplay第一行のbra（1substring）

before:
```text
(\langle 0|\langle🍎|)U^{\dagger}_{CLONE}U_{CLONE}
```
after:
```text
(\langle🍎|\langle 0|)U^{\dagger}_{CLONE}U_{CLONE}
```

## B3 U†U除去後、同じbra因子順でgrouping明示（1substring）

before:
```text
\Rightarrow &\langle 0|\langle🍎|👶\rangle|0\rangle =
```
after:
```text
\Rightarrow &(\langle🍎|\langle 0|)(|👶\rangle|0\rangle) =
```

その他の本文/絵文字/仮定U/入力ket/出力bra/右辺/最後のinner-product展開/結論を変更しない。数値を追加しない。上記beforeは原に各1回だけ出ることをscriptでassert済み。該当するdisplay TeX2入力だけ変更（第一display1、同じ第二display内B2/B3）。実装と可読性/overflow検査は承認後。未移植pageへの架空GPU URL/commandは作らない。

今回のnativeGPU全件と四旧layout failuresは**実機確認待ち**、`docs/pending-real-machine-checks.md`のcommandsを保持。数学診断をGPUの代替と称さない。
