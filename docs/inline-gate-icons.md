# 本文中の量子ゲート図記号

## 開始記録 (2026-10-10 07:37 JST)

- 制限時間は 28 分、約 24 分で終了処理。チュートリアルだけを変更し、push 前に fetch/rebase。`qni-webgpu.ref` は変更しない。
- 旧 Qni は `origin/main` の `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d` を git show で参照。WebGPU は保護されたチェックアウトを変更せず、git show で参照。削除予定の feat/tutorial-embed 作業場所は使用しない。
- 現在のピンは #47 統合後の `f4cd605fbf85030ebc4a7dd0f3a84b98e0b3f99f`。既存の埋め込み・アプリ公開処理と Binaryen 123 を維持する。

## 調査の中間記録 (07:41 JST)

- 旧教材は Jekyll/Liquid の HTML ページ 68 個。`qpu_operation_tag.rb` が本文用ゲート要素を出力し、`qubit_circle_filter.rb` が振幅・位相の図を出力する。`mini_qni_filter.rb` はシミュレーター、回路、パレット等を生成するため、本文図記号の件数から除外する。
- `src/application.js` は `@qni/elements` と Stimulus コントローラー群を読み込む。CSS は Tailwind と `@qni/elements/dist/qni`。レイアウトは別途 Orbit と MathJax を読み込む。
- WebGPU の H 字形は `apps/web/assets/icons/h.svg` の Geist 由来の塗りつぶしパス。背景は Rust の描画処理による角丸矩形で、Flexoki cyan-400、字形は paper 色。旧 Qni の手描き風の線 SVG と同一ではない。
- 試作は Astro コンポーネントと未登録の独自タグ `qw-h-gate`。ビルド時に実際のピンの SVG を git show で取得し、ブラウザーでは SVG/CSS だけを描画する。JS、WebGPU、フォントのダウンロードは図記号自体には不要。

## 旧教材の要素一覧

件数は旧 Qni の上記リビジョンにある HTML ページ 68 個を対象とする概数。本文と本文中の静的な説明図を含み、`quantum-simulator`、`circuit-editor`、`quantum-circuit`、パレット、円表示パネルの中身は除外した。git show で取り出した原文からこれらの領域を除き、`rg -o` で開始タグ、`qpu_operation`、`qubit_circle` を数えた。共通レイアウトの反復展開分は数えていない。

| タグ | 概数 | 作り方 | 動作 |
| --- | ---: | --- | --- |
| `h-gate` | 109 | H の線 SVG、Catalyst、共通ゲートテンプレート・CSS | 裸の本文は静止。属性・親要素に応じて hover/ヘルプ/ドラッグ |
| `x-gate` | 47 | X/⊕ SVG、同じ仕組み、円形の本体 | 同上 |
| `y-gate` | 4 | Y SVG、同じ仕組み | 同上 |
| `z-gate` | 6 | Z SVG、同じ仕組み | 同上 |
| `phase-gate` | 66 | 位相 SVG、同じ仕組み＋角度属性 | 本文は静止。角度変更・ヘルプ等は可能 |
| `measurement-gate` | 17 | メーター SVG＋値の領域、Catalyst、ゲート CSS | 本文は静止。回路内では測定値・条件属性を更新 |
| `control-gate` | 37 | 制御点 SVG、Catalyst、ゲート CSS | 本文は静止。回路用の hover/ドラッグ等は可能 |
| `write-gate` | 34 | ケット括弧 SVG＋値の領域、`data-value=0/1` | 本文は静止。属性変更で 0/1 を更新 |
| `swap-gate` | 9 | 交換記号 SVG、Catalyst、ゲート CSS | 本文は静止。回路用操作は可能 |
| `rnot-gate` | 12 | √X SVG、Catalyst、ゲート CSS | 静的説明図。回路用操作は可能 |
| `qubit-circle` | 1,634 | Liquid フィルター→Catalyst、jtml、Shadow DOM の CSS 円・位相線・ケット | 属性更新で描き直す。hover で Tippy の振幅/確率/位相表示。連続アニメーションではない |

共通ゲートは `packages/elements/src/*-gate-element.ts` の `@controller` で登録される。`gate-element-helpers.js` と `IconableMixin` が SVG を Shadow DOM の `part=body/icon` に入れ、外側は Tailwind 由来のサイズ・形状・意味色の CSS を使う。Catalyst/jtml のほか、ドラッグ用の XState/Interact.js、ヘルプ用 Tippy を含む。裸の本文要素にはドロップゾーンがないため、ドラッグ機能は通常有効にならない。`qubit-circle` は Complex.js と `@qni/common` も使い、Tippy のアニメーションは明示的に無効化されている。

見落とし防止のため、記事中で検出したが本文図記号ではない要素も記録する。`circuit-step` 約 24、`circuit-dropzone` 約 115 は説明用の回路図を組む構造要素。`orbit-reviewarea` 約 18、`orbit-prompt` 約 113 は外部 Orbit スクリプトの対話式復習カードであり、ゲート図記号ではない。`bloch-display`、rx/ry/rz、S/T/QFT 等はパッケージに登録されるが、この範囲の本文用出現は確認されなかった。大きな埋め込みの `quantum-simulator` 等は別用途。

## WebGPU の見た目と選択肢

- 正式な字形は `apps/web/assets/icons/*.svg`。`scripts/extract-gate-svg.py` が Geist (H は Regular 400) のパスを抽出し、rsvg-convert または ImageMagick で同名 PNG も生成する。対応 PNG を `build.rs` でアルファ/RLE/SDF に変換して `gate_icon_alpha.rs` を生成する。`src/icons/svg_icon.rs`、`sdf_icon.rs` が描画し、本体の形状は `gate_body.rs`。文字・本体色は `colors.rs`、通常 UI フォントとフォールバックは `app.rs`。
- H の角丸比は Rust の 6px/40px = 0.15。本体 `#3AA99F` は Flexoki cyan-400、字形 `#FFFCF0` は paper。SVG の字形をそのまま使えば、ブラウザーフォントの違いを避けて埋め込みと合わせられる。

| 選択肢 | 利点 | 制約・判断 |
| --- | --- | --- |
| **Astro `<QwHGate />`、ビルド時 SVG 内包** | JS/追加通信/WebGPU 不要。ピンと一致。ベクターで高 DPI に対応。意味づけを SSR 可能 | 静的な説明に最適。新しい種類は明示的に追加。今回採用 |
| 小さな `qw-*-gate` カスタム要素 | HTML だけで再利用でき、属性変更や軽い操作に対応 | 登録・初期化・ライフサイクル・JS が必要。本文の静止図には不要 |
| SVG sprite / `<use>` | 多数の重複を減らせる | ID の名前空間、ページごとの定義、外部参照に注意。量が増えてから検討 |
| `<img>` / CSS mask | 資産キャッシュを使える | 色の継承・代替テキスト・外部通信が増える。単一図には過剰 |
| 旧 `@qni/elements` を読み込む | 旧教材と同じ操作 | 大きな依存関係と旧色/字形が入る。`h-gate` 等の登録衝突があるため非推奨 |

衝突回避: 旧名 `h-gate` は使わず、`qw-h-gate` で出力する。今回のタグは JS に登録しない静的なラッパーである。将来旧 Qni と混在しても旧 Catalyst が H 要素として処理しない。汎用化するなら `<Gate name="H" />` の Astro API から `qw-*` を出力する設計がよい。

アクセシビリティ: ラッパーは `role=img`、`aria-label=H ゲート`、`title` を持ち、内部 SVG は aria-hidden。操作ではないため tabindex やボタンの役割を付けない。装飾だけの用途には将来 aria-hidden の選択肢を用意できる。本文のフォントに合わせて 1em 四方、vertical-align=-0.125em とし、行高を広げない。現在のアプリは Flexoki Light のみなので、ダークモードでも無条件の色反転はしない。将来テーマを追加する場合は本体/字形の CSS 変数をアプリと同じ色に揃える。

## 試作とローカル検証 (07:44 JST)

- `src/components/QwHGate.astro` が `qni-webgpu.ref` の実際の SHA から H SVG を git show で取得し、字形を変更せず内包する。CI の標準参照先は `.qni-webgpu-source`。ローカルは `QNI_WEBGPU_SOURCE=/home/yasuhito/Work/qni-webgpu` を指定し、保護された作業ツリーを変更せず git オブジェクトだけを読む。
- `h_gate.astro` の最初の説明文に一つだけ挿入した。手描きの H や代替フォントは使っていない。本体の CSS だけを Rust の形状/色に合わせた。
- 型チェック、Astro ビルド、Node 22 による対象の **2 テスト**が成功。アクセシブルなベクター、非登録タグ、16px/1em、行高以内、baseline の CSS、色を確認。
- 最初のテストは Node 型の未導入を避けるよう修正。Astro の SSR では import.meta.url が出力側になるため、ビルドの作業ディレクトリー基準でピンを読むよう修正した。いずれも修正後のビルド/テストが成功。

## 公開記録 (07:50 JST)

- 実装コミット `46738ef855b164f6b6f639b711b20af446e713c4` を fetch/rebase 後に通常 push。
- [Pages 実行 38001127068](https://github.com/qniapp/qni-tutorial-webgpu/actions/runs/38001127068) が成功。ビルド 2 分 35 秒、公開 11 秒。ピンを変更せず、既存の二種類の WebGPU ビルドと本文 SVG を公開した。
- 続いて実機 Chromium で DPR 1/2 の行内配置・基線・色を測定した。

## 実機の公開検証と完了記録 (07:59 JST)

対象: [公開 H ゲート教材](https://qniapp.github.io/qni-tutorial-webgpu/h_gate/)。ホスト `gmktec`、Chromium **152.0.7977.82**、GPU vendor `amd` / architecture `rdna-3`。`--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan` と、各ケースに `--force-device-scale-factor=1/2` を使用。

| 確認項目 | DPR 1 | DPR 2 |
| --- | --- | --- |
| 本文のフォント / アイコン寸法 (CSS px) | 16 / 16×16 | 16 / 16×16 |
| 行高 (CSS px) | 28 | 28 |
| アイコン下端 - 実測した基線 (CSS px) | +2 | +2 |
| 行の範囲内 | 成功 | 成功 |
| 本体色 / 埋め込み H の画像中の色 | 両方 RGB 58,169,159 | 両方 RGB 58,169,159 |
| 埋め込み canvas バックバッファー | 1070×606 | 2140×1212 |
| console error / page error | 0 / 0 | 0 / 0 |

H 字形と角丸、色が同じ系列であることを比較画像でも確認した。1em の小さな Regular 字形は DPR 1 では通常のサブピクセルのアンチエイリアスになり、DPR 2 では線の内側に paper 色の不透明ピクセルも現れる。画像を引き伸ばした CSS ではなく、実際にベクターを各 DPI で描画した。比較画像の拡大パネルは検査用の nearest-neighbor 拡大であり、製品の描画方式ではない。スクリーンショットは整数画素に切り出されるため、幅 16 CSS px の要素でも端の余白を含む 17/34 画素の画像になる。

最初の検証ハーネスでは本文のスクロール前の座標で撮影して範囲外になったため、測定と撮影のスクロール位置を揃えた。また Playwright の context-only DPR エミュレーションは wasm 側の解像度と一致しなかったため、Chromium 自体の device scale factor も揃えて再実行した。最終ケースでは上記のバックバッファーと DPR の一致を確認済み。

保存物:

- `/tmp/qtw-inline-live.json`: 寸法、基線、ピン、実機 GPU、エラー、ピクセル色の比較。
- `/tmp/qtw-inline-compare-dpr1.png`
- `/tmp/qtw-inline-compare-dpr2.png`
- `/tmp/qtw-inline-verify.mjs`: 最終検証のハーネス。

最終の対象テストは新規 2 件＋既存コンポーネント 16 件の **18/18 成功**。型チェックと Astro ビルドも成功。開始したテスト用サーバーとブラウザーは終了済み。比較画像二枚は依頼どおり保持し、検査用の中間画像は削除した。保護された二つのチェックアウト、廃止予定の worktree、ピンには変更を加えていない。

次の段階は H 以外の Astro 図記号と、属性で変化する `qubit-circle` の API 設計。今回の制限時間内では一つの H 図記号の試作だけに留めた。
