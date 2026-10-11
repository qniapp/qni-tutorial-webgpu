# shor_u: axmodN.pngの出力 x^a と a^x が逆でSTOP

2026-10-12 08:54、U1/U2(1996)/U3/U4のexact承認後、owned図の設計前に原図を読んで発見。**shor_uのroute未作成・未移植・未公開。shor_qft以降は開始しない。** 既承認U1〜U4を撤回/再質問するものではなく、画像の別の式1個について追加承認を求める。

## 原図と不一致

原asset `../qni/apps/tutorial/images/axmodN.png`（1342×776、SHA256 `a58880daae7dc6ca78fc303d3b3015f9b5a23df01fca0096326d0a7cde5ee5a0`）。右側、1を初期値とする出力registerのラベルは **x^a mod N**（xがbaseline、aがsuperscript）。

しかし図のcontrolはx0/x1/…/xm、各Ctrl MULT MODの定数はa^(2^i)とその逆数。したがってxのbinary bitに応じて掛けると、出力は **a^x mod N**。本文/title/filename axmodN/最後の数値表もa^xを表す。元PNGの文字を見過ごしてowned SVGへ誤記を転写することも、無承認で直すこともしない。

## Python（量子CPU/GPU simulatorなし）

```sh
python3 scripts/analyze-shor-u-image-label.py
```

- a2/x3/N15、x bit0/1が1なので2^(2^0)×2^(2^1) mod15 = 2×4 mod15 = **8**。
- 正しいa^x = 2^3 mod15 = **8**。
- 原図ラベルx^a = 3^2 mod15 = **9**（不一致）。
- 原最後の表：x3/f8、ket56の振幅+0.25、x3/f9のket57は0。こちらも8を支持。

数学/古典binary bit選択の検算のみで、native GPU実行/readback/CPU量子回路シミュレーションではない。証拠 `tests/fixtures/shor-u-image-label-blocker-analysis.json`。

## I1 exact提案（未適用）

owned SVG/MathJaxへ置換する**この出力ラベル1個だけ**:

```text
x^a mod N
```

→

```text
a^x mod N
```

TeXなら `x^{a}\operatorname{mod}N` → `a^{x}\operatorname{mod}N`。制御bit名、a^(±2^i)定数、wire/黒white band/交差swap/ellipsis/0・1ラベル/全本文・JSON・768円・引用URL・文献年1996は変更しない。単なるstyled glyphの置換ではなくbase/exponentの数学訂正なので、U1-U4の承認には含めない。

**質問：I1を追加承認しますか？** 承認後に他図の忠実なowned置換・U1-U4の移植・全非GPU検査を行う。元PNGや本文を勝手に書換えず、完成前にrouteを公開しない。次ページにも進まない。

## PR / source

08:54 fetch mainのshor_uは保存原 `docs/shor-u-original-source.html` とbyte一致。PR#588はOPEN、head `30a450fdb403b0cc1edc4cecbeeae306580fb3e0`。保存原へU1/U2(1996)/U3三件/U4二件を**仮**適用し、PR headのsourceとwhitespace-normalized全文一致を確認（byte一致とは称さない）。production/docs-approved sourceへはまだ適用していない。PR#588はこの画像ラベルを変更していない。`tests/fixtures/shor-u-pr588-comparison.json` 保存。

## 未実施 / metadata

原JSON1（8wire）・palette[[]]・max-wire-count[1]・run1は変更0。画像置換0/credits削除0、原768円の配列/振幅/ketラベルは変更0（U3の承認は保持）。Vedral scholarly引用は維持する。4枚はいずれも数理/回路図で旧Qni UIではないが、I1未承認のためowned置換前にSTOPした。

route未作成なので本文/TeX/3901440/DPR/scroll/typecheck/build/公開検査はまだできていない。新しいshor_u GPU commandも未作成（架空auditを提示しない）。既存4nativeページと4旧layout失敗は `pending-real-machine-checks.md` のcommandsで**実機確認待ち**、gmktecへのSSH/GPU実行は行わない。
