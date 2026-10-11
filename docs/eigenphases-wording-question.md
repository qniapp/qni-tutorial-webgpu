# eigenphases: 共有固有状態に対するunique表現の確認

2026-10-11、hard stop16:57。qft_adderの承認2訂正を公開・実公開GPU/本文/scroll/toolbar/DPR/footer実clickまで確認し、sidebar次eigenphasesを確認した。**数値と回路は正しい**が、本文の読み方について確認が必要なため、原文を変更せずSTOPした。

## 確認する解釈

本文は次の2語句を使う:

- `ユニークな状態ベクトル`
- `独自の (固有の) 状態ベクトル`

これを「QPU命令ごとに異なる固有状態」という意味に読むと、同じページの表のZとPHASE Φが同じ|0⟩/|1⟩を固有状態として共有することと食い違う。Z=diag(1,-1)、P(Φ)=diag(1,e^iΦ)だから、Φ≠πでも両basisが共通する。|0⟩はどちらも固有位相0なので、1つの固有状態/固有位相の組だけでは命令を区別できない。

一方で「ユニーク」を単に「固有状態という特別な状態」の意味と読むなら、原文維持という選択もある。**明確な数値誤りとは区別し、原文を維持するか、以下2語句だけを訂正するか質問した。** 完全な全固有状態/位相の組によるスペクトル分解は演算を特徴付けられる。原文が説明するglobal phaseとrelative phaseの関係には数値不一致を見つけていない。追加のphase noteや原回路変更は提案しない。

## 訂正する場合の正確な提案 (各1回、2か所だけ)

```text
ユニークな状態ベクトル
```

→

```text
状態ベクトル
```

```text
独自の (固有の) 状態ベクトル
```

→

```text
固有状態と呼ばれる状態ベクトル
```

ほかの本文・数値・固有位相の説明・36円表示・原2JSONに触れない。承認なしに修正しない。

## 解析と実GPU

c=cos(π/8)、s=sin(π/8)、H=[[1,1],[1,-1]]/√2。

- H(c,s)=(c,s)、固有位相0。
- H(-s,c)=(s,-c)=-(-s,c)、固有位相π。
- c²×100=85.35533905932738%、s²×100=14.644660940672624%。原85.3553%/14.6447%は正しい丸め。
- 原Ry(π/4)は(c,s)、原Ry(5π/4)は(-s,c)を準備する。
- X: (1,1)/√2はphase0、(-1,1)/√2はphaseπ。
- Y: (1,i)/√2はphase0、(1,-i)/√2はphaseπ。
- Z: |0⟩phase0、|1⟩phaseπ。
- P(Φ): |0⟩phase0、|1⟩phaseΦ。GPUはΦ=π/4で確認し、任意Φのdiag(1,e^iΦ)は解析で確認する。

原Ry/Hの準備prefix2+最終2、X/Y/Z/Pの2状態ずつ=12テスト回路。実公開standalone (pin348992f5d7926d326eaa0f678fa8d89f0894ff54) /Chromium/AMD Vulkan/3901440で **24/24 signed全状態/確率成功**、norm≈1/errors0。原|0⟩・|1⟩の相対位相π/全体位相πの説明・H前後の円36個の複素振幅とも一致する。最初のprobeはexpected配列import漏れのReferenceErrorだったため追加して全24件を再実施した。これはharnessの不備で、数値不一致ではない。テスト用回路を本文に追加しない。本番readback/CPU fallback/上流変更なし。

## 原サイトと状態

390/1440の実ブラウザーで原2JSONがsourceと一致、本文の該当段落・表・各mini_qniのmax-wire-count=2を確認した。

- 原2JSON: 各5列/1-wire。mini_qniのmax-wire-count **2×2** を保持する必要がある。
- palette指定なし (移植時 **[]×2**)、run-buttonなし。
- 原36円表示、画像0/置換0/credits削除0/sidenote0/Orbit0。
- 同ページのopen PRなし。#579はinside_the_qft、#580はqft_adderだけ。
- **eigenphases未公開、route/移植fixture未作成、原文/JSON無変更。** 移植後のtext/TeX/scroll/DPR/toolbar/step0は未検証。
- 次quantum_phase_estimation_circuit以降も停止し、原文維持または2語句修正の判断を待つ。

永続 `tests/fixtures/eigenphases-wording-verification.json` に原2JSON/12テストJSON/解析期待値/24GPU結果/原live該当段落・table・limitsを保存した。資料 `/tmp/qtw-next-eigenphases.html`、`/tmp/qtw-eigenphases-original-*` (各mini回路両幅のscreenshot)、`/tmp/qtw-eigenphases-{test-circuits,expected,gpu-results}.json`、`/tmp/qtw-eigenphases-gpu.mjs`。
