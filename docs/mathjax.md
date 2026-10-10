# MathJax 導入 / h_gate (2026-10-10)

## 期限 / 状態

10:03:56 JST 開始、28分の hard limit、約24分で実装を止めて push / 記録 / 終了する。独立した `feat/ket-notation` を origin/main `4b6b0a3` に合わせて開始。中止された ket-notation 改名には未コミット変更も push もなかった。qni-webgpu.ref の f4cd605 は維持。

## 原文の一次資料

原文 qni origin/main は `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d`。読み取りは git show のみ。

- `apps/tutorial/_layouts/default.html:14-18`: id=MathJax-script、async、相対 self-hosted `./vendor/mathjax/es5/tex-mml-chtml.js`。**原文は jsDelivr ではない**。
- `apps/tutorial/_plugins/ket_tag.rb:5-11,16`: label を strip し `{% ket 0 %}` を `\(|0\rangle\)` にする。ket は Qni custom element ではない。
- `apps/tutorial/vendor/mathjax/es5/tex-mml-chtml.js:1`: MathJax 3.2.2。npm mathjax@3.2.2 の同ファイルと SHA-256 `300480069078b5892d2363a2b65e2dfbbf30fe5c80f83edbfecf4610fd093862` が一致。
- `_layouts/default.html`、`src/application.js`、`_config.yml`、`_plugins` に独自 MathJax config はない。したがって combined component の既定値を使用する。CHTML / TeX font、TeX と MathML 入力、assistive MathML / context menu を持つ。独自 macros はない。
- default layout は math の有無を判定せず読み込む。h_gate の `{% ket %}` は12個、値・順番は 0,1 / 1,1,0 / 0,1,0,1 / 0,1 / 0 (原文行21 / 65-66 / 79-81 / 143 / 213)。

## 実装 checkpoint (10:09 JST)

MathJax **3.2.2** を完全固定。`scripts/copy-mathjax.mjs` が npm package の es5 配布物と LICENSE を public/mathjax にビルド時コピーする。生成物は gitignore。MathJax engine は数式ページだけ、layout の `hasMath` flag によって条件付きでロードする。既定の TeX macros / delimiters / menu / assistive MathML は変えない。TeX 専用の tex-chtml は MathML *入力* parser だけを省き、MathML *accessibility output* と menu は維持する。

`Ket.astro` は原文と同じ TeX 文字列を出力するだけ。h_gate の原文に対応する12か所だけを戻し、plain-text kets / circle labels / circuit JSON は変えない。手書き CHTML、shim CSS、shim 用の34,160-byte font とライセンスコピーは削除。`rg 'mjx-' src` は0件。runtime の CHTML / stylesheet は実 MathJax が生成する。

startup.ready は defaultReady をそのまま呼び、startup.promise 解決時に `mathjax-typeset-complete` を performance.mark する。現時点は defer を使用し、async / CDN / self-host / 元の combined component の比較結果で最終決定する。

型チェック、Astro build、関連 **12/12 tests** 成功。1440/390pxの12 ket / assistive MathML / bbox22.296875×21px / font19.12px、context menu が実際に開くこと、非 math ページに request がないこと、19 H / 24 circles / hover と属性更新を検証した。

## 配信方式の比較 / 選択 (10:15 JST)

各構成で3 fresh browser contexts と、同じ page の reload を測った。cold は HTTP cache が空の新規 context、warm は同じ context の reload。GPU driver / OS cache をリセットした意味ではない。gmktec の実 Chromium 152、Vulkan / unsafe WebGPU / force-device-scale-factor=1、1440px。MathJax resource の transferSize を合計し、CDP encodedDataLength も保存。CDN は jsDelivr の実 URL、self-host はローカル gzip HTTP origin なので、差を GitHub Pages での CDN 対 self-host の厳密な優劣とは解釈しない。startup.promise 解決時の mark は font の最終 paint 時刻ではない。

ローカル h_gate の3回中央値:

| 構成 | load cold/warm ms | typeset cold/warm ms | MathJax transfer cold/warm bytes |
| --- | ---: | ---: | ---: |
| shim before | 67.0 / 29.4 | 非該当 | 34,493 / 0 |
| self tex-chtml defer | 157.2 / 150.6 | 126.9 / 110.1 | 300,501 / 0 |
| self tex-chtml async | 161.8 / 133.9 | 111.1 / 121.8 | 300,501 / 0 |
| CDN tex-chtml defer | 1,104.1 / 79.5 | 837.0 / 47.0 | 290,829 / 0 |
| CDN tex-chtml async | 1,115.6 / 80.7 | 844.7 / 68.3 | 290,829 / 0 |
| self tex-mml-chtml async | 153.2 / 146.0 | 115.8 / 126.0 | 302,926 / 0 |
| static Node CHTML | 72.3 / 109.6 | ビルド時のみ | 36,129 / 0 |

shim の typeset は存在せず、fonts.ready proxy は cold80.8 / warm55.2ms。static の fonts.ready proxy は134.4 / 119.0ms。CSS/JS scheduling と測定のばらつきがあるので runtime promise と同一の指標としては扱わない。

**採用: npm self-hosted tex-chtml@3.2.2 + defer + hasMath gate**。MathML 入力が不要な h_gate で最小の combined component を使い、原文の assistive MathML と context menu は削らない。外部 CDN 障害や別 origin の round trip に依存しない。async/defer のローカル差は小さく逆転もあるため、評価順序が予測可能な defer を選ぶ。WebGPU の preload / driver warm-up は head の早い段階に残る。

静的 prototype は mathjax-full@3.2.2 / liteAdaptor / TeX / CHTML / AssistiveMmlHandler を一時ディレクトリに入れて作成。12 ket の変換23.7ms (import後)、共通 adaptive CSS9,496 bytes、assistive MathML付き、MathJax runtime JSなし。**今回は採用しない**: 原文の MathJax menu を zero-runtime-JS で維持できず、build時に browser の font metrics を測れない。原文の119.5% scaleを合わせるには em16/ex8.45 を仮定する必要があった。静的 HTML/CSS と browser metrics の保守を新たに持つより、原文と同じ実 engine を使う。

TeX FindTeX 既定 delimiters は inline `\\(` / `\\)`、display `$$` / `$$` と `\\[` / `\\]`。single `$` は既定では無効。processEscapes / processEnvironments / processRefs はtrue。実 document で packages=base,ams,newcommand,noundefined,require,autoload,configmacros、enableMenu=true / enableAssistiveMml=true を確認。独自 macros はなし。

公開 shim の before も cold/warm 各3回保存済み: load中央値1,103.4 / 350.8ms、font-ready proxy1,054.0 / 356.3ms、transfer34,460 / 0 bytes。実装 deploy 後に同じ公開 URL で after を測る。生データは `/tmp/qtw-mathjax-perf.json`、static prototype は `/tmp/qtw-mathjax-static.{html,json}`。CDNやlocalhostの結果を公開URLの before/after と混ぜない。
