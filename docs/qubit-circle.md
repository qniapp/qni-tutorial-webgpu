# 軽量な本文用 qubit-circle

## 開始 / 調査 (2026-10-10 08:05 JST)

制限時間 28 分、約 24 分で終了処理。保護された Qni / WebGPU 作業ツリーは変更せず fetch と git show のみ。参照は旧 Qni `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d`、WebGPU master `f4cd605fbf85030ebc4a7dd0f3a84b98e0b3f99f`。ピンは変更しない。

旧ソース: `packages/elements/src/qubit-circle-element.ts:9-22`、`apps/tutorial/_plugins/qubit_circle_filter.rb:8-54`、`apps/tutorial/css/qubit_circle.css`。旧要素は Catalyst + jtml + Complex.js + Tippy、要素ごとの Shadow DOM。`data-amplitude` が複素数文字列であり、**data-amplitude-real/imag や magnitude/phase 属性は存在しない**。magnitude/phase は私有 getter (`:194-212`)。CSS 円を magnitude 倍にし、上向きの 50% 長・2px 幅の位相線を負の位相角で回転。旧色は sky-500、slate-500、slate-900。hover は brightness(0.9)。旧 popup は hover のたび Tippy を作り、leave で destroy。real/imag は符号付き小数 5 桁、確率は符号付き小数 4 桁 %、位相は符号付き小数 2 桁 ° (`:160-188`、`packages/elements/src/util.ts:5-7`)。

## WebGPU の正確な定数

本文は state panel の振幅円に合わせる。回路に配置する Amplitude Display の矩形/クリアランスとは区別する。

| 定数 | 値 / 参照ファイル:行 |
| --- | --- |
| 円のセルサイズ / 線幅 | 1-3 qubits:64/2、4:48/2、5-6:32/2、7+:16/1。`apps/web/src/constants.rs:77-87` |
| zoom | size=自然サイズ×zoom、stroke=max(0.5,自然線幅×zoom)、gap=(自然線幅+1)×zoom。`render/state_panel_layout/geometry.rs:35-43` |
| 半径 | radius=size/2、inner_radius=max(0,radius-stroke/2)。同上:42-43 |
| 円盤 | inner_radius×sqrt(clamp(re²+im²,0,1))。`gpu/shaders/state_render.wgsl:91-100` |
| 円盤の縁 | 半径>=1.5 のとき 1px の内側 stroke、中心線半径=fill_radius-0.5。同上:101-118 |
| 位相線 | dir=(-sin(phase),-cos(phase))、長さ inner_radius、幅 stroke、丸い終端。prob>0 のときのみ。同上:121-133 |
| 外枠 | radius 中心、幅 stroke、ゼロ振幅には別色。同上:135-148 |
| hover | 円盤/枠/針の RGB×0.9。同上:93-95 |
| 背景 / 円盤 | paper #FFFCF0 / blue-200 #92BFDB。`colors.rs:158,170,181,188`、`gpu/params.rs:69-75` |
| 円盤の縁 | blue-400 #4385BE。`colors.rs:172,189` |
| 非ゼロ / ゼロの枠 | tx-2 #6F6E69 / ui-2 #DAD8CE。`colors.rs:162-163,191-192` |
| 位相線 | tx #100F0F。`colors.rs:164,193` |

## 実装方針

`qw-qubit-circle` は非衝突名。SVG を一回構築し、属性更新では数値属性と ARIA だけを更新する。Shadow DOM、Tippy、複素数ライブラリー、WebGPU は使用しない。共有 CSS と document の pointer/focus イベントによる一つの tooltip を使う。旧 H ページの 24 個の円を、元の位置・値に対応する三つの図に戻す。

## 実装 / 対象テスト (08:13 JST)

同じ教材作業ツリーで別タスクの Sidenote 編集が進行していたため、`/home/yasuhito/Work/qni-tutorial-webgpu-worktrees/feat/qubit-circle` に分離した。この文書は指定された元の docs パスにも同期している。別タスクの未コミット変更はステージしない。公開済みの Sidenote は rebase で保持し、H ページの import の競合だけ両方を残して解決した。

| 旧属性 / 指定 | 新要素での扱い |
| --- | --- |
| `qubit-circle` | タグだけ `qw-qubit-circle` に変更 |
| `data-amplitude` | 保持。実数 / a±bi / i / 科学記数法。空白も可 |
| `data-amplitude-real`, `data-amplitude-imag` | **追加**。どちらかがあると旧文字列より優先。不在の成分は 0 |
| magnitude / phase | 旧新とも入力属性ではない。複素振幅から算出 |
| `data-ket`, `data-qubit-count` | 保持。ケットラベル / ヘッダー |
| `data-hide-phase` | 保持。ゼロ振幅の針は属性を変更せず自動的に非表示 |
| `data-show-popup-{header,amplitude,probability,phase}` | 保持。値 `false` は無効。値の三つの flag がなければ全値を表示 |
| `data-popup-template-id` | 廃止扱い。任意 HTML を読まず共有 tooltip を使う |
| `data-dark-mode` | 互換属性だが色は変えない。WebGPU の現行 Light テーマに一致 |
| 旧 `h-8/w-8`, `h-12/w-12`, `h-16/w-16` | `data-size=base/lg/xl` に変更。セル 32/48/64、線幅 2 |
| 小さいサイズ | `data-size=sm` はセル 16、線幅 1。数値 16-256 も可 |
| `magnitude-*` 色クラス | 移植しない。WebGPU の意味色を使用 |

visible SVG の寸法はセル + stroke (base は 34px)。WebGPU の外枠はセル半径の外にも stroke/2 出るため、その縁を切らず描く。SVG は 4 図形、共有 CSS 一枚、document の委譲イベントだけ。属性更新は既存 SVG の数値を変更する。aria-label は全値を含み、Tab focus / Escape にも対応。tooltip は一つだけ遅延生成し、位置は画面内に収める。実数・虚数は小数 5 桁、確率 4 桁、位相 2 桁で旧書式を維持。描画の probability は WebGPU と同様 0-1 に clamp するが、tooltip は元の振幅の確率を表示する。

型チェック、Astro ビルド、新規 4 件 + 既存 inline H 2 件の **6/6 テスト成功**。属性変更、科学記数法、i、1-i、不正値、丸い位相線の方向・長さ、共有 tooltip、focus/Escape、旧 H ページの 24 個を確認した。ストレスページはナビから非リンクで `?n=200|500|1600`、WebGPU をロードしない。define/最後の connectedCallback と二段 rAF の paint proxy を記録する。

## 公開 / 初回実機測定 (08:22 JST)

- `1b046594048ae969332bde6b38fb79720f76ba9f` を fetch/rebase 後に公開。[Pages 38003458206](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/38003458206) 成功、build 2m33s / deploy 8s。
- gmktec / Chromium 152 / AMD rdna-3 で DPR 1/2 の実マウス hover を確認。50% と 180° を持つ別々の円で旧書式の値が表示された。console/page error なし。
- live のストレス 200/500/1600 を各 3 回、各 2 秒のスクロールと 20 hover で測定し `/tmp/qtw-qc-stress.json` に保存。GPU API 呼び出し / wasm 転送は全実行 0。
- 検証中、scroll/focus のタイミングで tooltip が消える競合を見つけた。共有 tooltip を画面内の active circle に追従させるよう修正し、scroll 後の keyboard tooltip の回帰テストを追加した。比較画像は WebGPU 初期化・focus によるスクロールが落ち着いてから再撮影する。

## 最終の公開実機検証 / 完了 (08:28 JST)

修正コミット `20a722e3e7f265d7286ebdd89d7f9171be1f724d`。[Pages 38004194014](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/38004194014) 成功、build 2m26s / deploy 10s。fetch/rebase は各 push 前に実施。

DPR 1 と 2 は Chromium 自体に `--force-device-scale-factor=1/2` を指定。併用フラグは `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan`。ホスト gmktec、Chromium 152.0.7977.82、AMD rdna-3。公開ページで circle #2 の +0.70711、+50.0000%、+0.00° と、circle #7 の -0.70711、+50.0000%、+180.00° を実マウス hover で確認。両 DPR と全ストレス実行の console/page errors は 0。

比較対象の本文円だけ `data-size=64` に変更し、埋め込みは H 回路に変更して同じ 50% の円を比較した。円盤 #92BFDB、外枠 #6F6E69、位相線 #100F0F、背景 #FFFCF0 の正確な RGB が両画像に存在することを検証。1px の青い rim は DPR 1 ではアンチエイリアスで混色し、DPR 2 では両方に #4385BE の不透明画素もある。SVG と SDF は端の AA が異なるが、半径・色・上向き位相の見た目は一致する。SVG は外半径 32、内半径 31、円盤半径 **21.92031**、比率 **0.70710678**。画素から推定した WebGPU 円盤半径は DPR 1:22.5、DPR 2:22.0 (量子化込み、差 1 CSS px 未満)。本文の本来の base サイズを変更して公開したわけではない。

公開 URL:

- https://qniapp.github.io/qni-tutorial-webgpu/h_gate/
- https://qniapp.github.io/qni-tutorial-webgpu/stress-qubit-circle/?n=1600

### Live ストレス結果

各 n で独立した browser context を 3 回。以下は 3 回の中央値。スクロールは各約 2 秒、hover は各 20 回。

| n | define→最終 upgrade ms | paint proxy ms | JS heap MiB | CDP DOM nodes | scroll median/p95 ms | hover median/p95 ms |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 200 | 6.0 | 14.2 | 1.46 | 1,858 | 16.7 / 16.7 | 1.4 / 1.8 |
| 500 | 15.3 | 22.6 | 2.22 | 4,558 | 16.7 / 16.7 | 2.0 / 2.5 |
| 1600 | 37.5 | 70.4 | 2.85 | 14,458 | 16.7 / 16.8 | 4.1 / 4.9 |

paint は upgrade 終了から二段 rAF までの layout/paint proxy であり、実際の GPU 実行時間ではない。hover は renderer が実マウス pointerover を受けた時刻から、表示された tooltip を確認する次の rAF までで、OS/入力転送遅延は含まない。heap は CDP Performance.getMetrics の JSHeapUsedSize、強制 GC なし。native DOM のバイト数は含まない。CDP DOM nodes は一時的な parser ノードも含み、実際の DOM element 数も JSON に保存。全 9 実行で WebGPU requestAdapter / wasm resource が **0**。1600 個の初回構築は約 38ms、paint proxy は約 70ms に増えるが、その後のスクロールは 60Hz 相当で維持された。

保存物: `/tmp/qtw-qc-live.json`、`/tmp/qtw-qc-stress.json`、`/tmp/qtw-qc-compare-dpr1.png`、`/tmp/qtw-qc-compare-dpr2.png`。ハーネスは `/tmp/qtw-qc-measure.mjs`、画像検証は `/tmp/qtw-qc-images.py`。比較画像は目視確認済み。中間画像を削除し、開始したサーバー/ブラウザーは全て停止。最後の対象テスト 6/6 成功。約 24 分に達する前に結果をコミット・push して終了する。
