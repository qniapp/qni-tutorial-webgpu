# 左サイドバー (目次)

## 原文の出典

qniapp/qni `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d` の `apps/tutorial` (`git show origin/main:...` で参照)。

- 章と順序: `_data/navigation.yml:1-171`。15 章、68 ページ。
- 描画: `_includes/navigation.html:1-18`。章見出しは `text-sm font-bold uppercase tracking-wide text-blue-600`、項目は `pl-4 pr-2 py-2 text-sm font-medium rounded-md`。現在ページは `bg-blue-100 text-gray-900`、その他は `text-gray-500`、hover は `bg-blue-50`。`new: true` の項目には緑の "new" バッジがある。
- desktop: `_includes/static_sidebar_for_desktop.html:1-13`。`md` (768px) 以上で fixed `w-64` (256px)、全章を常に展開。
- mobile: `_includes/off_canvas_menu_for_mobile.html:1-40` と `_layouts/page.html:5-19`。`md` 未満でメニューボタンが off-canvas の `role=dialog` を開く (`max-w-xs`、灰色 backdrop、閉じるボタン)。

| 章 | ページ (slug) |
| --- | --- |
| イントロダクション | はじめに (`./`)、QPU とは (qpu)、QPU は何が得意? (what_qpu_do_faster)、量子回路 (quantum_circuit)、Qni 入門 (qni_intro) |
| 量子ビット | 確率的ビット (p_bit)、重ね合わせ状態 (superposition)、量子ビット (qubit)、位相 (phase)、状態ベクトル表示 (circle_notation) |
| QPU 命令その 1 | CPU 命令との違い (cpu_vs_qpu_operations)、X ゲート (量子 NOT) (x_gate)、**H ゲート (h_gate)**、PHASE ゲート (phase_gate)、WRITE 命令 (write_operation)、MEASUREMENT 命令 (measurement_operation)、CLONE 命令!? (no_cloning_theorem)、組合わせゲート (gate_combination) |
| 量子暗号通信 | 量子鍵配送 (quantum_key_distribution)、BB84 プロトコル (bb84_protocol)、BB84 回路 (bb84_circuit) |
| 複数量子ビット | 状態ベクトル表示 (multi_qubit_circle_notation)、重ね合わせ状態 (multi_qubit_superposition)、複数量子ビットでの演算 (multi_qubit_operation)、演算ペア (operator_pair)、ランダムバイトジェネレータ (random_byte_generator)、PHASE ゲート (multi_qubit_phase_gate)、1 ビット測定 (partial_measurement) |
| QPU 命令その 2 | SWAP ゲート (swap_gate)、CNOT ゲート (cnot_gate)、SWAP パズル (swap_from_cnots)、CPHASE ゲート (cphase)、量子もつれ (entanglement) |
| 超密度符号化 | もつれをほどく (disentangle)、もつれを操作する (entanglement_operation)、ベル状態の判別 (discriminating_bell_states)、超密度符号化回路 (superdense_coding_circuit) |
| 量子テレポーテーション | テレポーテーション回路 (teleportation_circuit)、多段テレポーテーション (cascading_teleportation)、長距離間の量子もつれ (long_distance_entanglement) |
| 算術演算 | インクリメント回路 (increment_circuit)、デクリメント回路 (decrement_circuit)、足し算回路 (addition_circuit)、引き算回路 (subtraction_circuit)、かけ算回路 (multiplication_circuit) |
| 論理演算 | 量子論理ゲート (quantum_logic)、重ね合わせ上での論理演算 (superposition_quantum_logic)、位相論理演算 (phase_logic)、位相論理演算の組合わせ (phase_logic_combination)、充足可能性問題 (sat) |
| グローヴァー探索 | 折り返し変換 (grover_iam)、グロヴァー反復 (grover_iteration)、複数の振幅を増幅 (multiple_marked_values)、折り返しの仕組み (grover_iam_indetail) |
| 量子フーリエ変換 (QFT) | パターンの読み出し (readout_of_patterns)、逆 QFT (inverse_qft)、QFT の内部 (inside_the_qft)、QFT 足し算 (qft_adder) |
| 量子位相推定 | 固有位相 (eigenphases)、量子位相推定回路 (quantum_phase_estimation_circuit)、位相キックバック (phase_kickback)、量子位相推定の出力 (qpe_output) |
| ショアの因数分解 | 別問題に帰着する (shor_hsp)、`\(a^xmod(N)\)` の計算 (shor_fx)、周期 `\(r\)` を求める (shor_r)、`\(a^xmod(N)\)` の実装 (shor_u)、周期パターンの読み出し (shor_qft)。5 件とも `new: true` |
| ふろく | クローン禁止定理の証明 (no_cloning_theorem_proof) |

章名「グローヴァー探索」とページ名「グロヴァー反復」の表記揺れは原文のまま。

## 実装

- `src/data/toc.ts`: 唯一の目次データ。`title` は原文そのまま (TeX 含む)、`slug` は `./` と `.html` を除いた原文リンク (`""` はサイトルート)。移植済み判定 `isPorted()` は `import.meta.glob('../pages/*.astro')` のファイル名から導出するので、ページを追加すれば自動でリンクになる。現在は `index` (はじめに) と `h_gate` の 2 件。はじめにの移植先は現行トップページで、原文の本文とは異なる。
- TeX を含む 3 件は `label` に平文 (`aˣ mod(N) の計算` など) を持つ。MathJax は数式ページでしか読まないため、TeX のままだとページによって表示が変わる。
- `new` は原文との対応のためデータに残すが描画しない。2022 年の新着表示で、未移植バッジと並べると意味が混ざる。
- `tests/fixtures/original-navigation.json` は `navigation.yml` から生成した比較用データ (出典 SHA を含む)。テストは CI で旧リポジトリに依存しない。

### 未移植ページの方針: グレー表示・クリック不可・「未移植」バッジ

外部アイコン付きで原文へリンクする案は採らなかった。理由:

- この実験版の中で回路が GPU で動くページと、旧シミュレータのページが同じ目次に混在すると、利用者はどちらの製品にいるか分からなくなる。
- 68 件中 66 件が外部リンクになると、目次の大部分が「別サイトへの入口」になる。
- 原文は https://qniapp.github.io/qni/ で引き続き読めるので、目次から導かなくても失われるものはない。

章構成全体は見えるので、移植の進み具合もそのまま分かる。未移植項目は `<span>` (フォーカス不可) で、「未移植」は画面上のテキストなので読み上げにも出る。灰色 #B7B5AC は無効項目扱い (WCAG 1.4.3 の対象外)、バッジの文字は muted #6F6E69。

### レイアウト

- breakpoint は原文の Tailwind `md` = 768px。
- 768px 以上: 左 256px の列に `position: sticky; top: 0; height: 100vh` のサイドバー (内部スクロール)。header/main/footer は右列に入る。header の「実験版」・footer の内容とスタイルは変更していない (位置は原文 `md:pl-64` と同様に右へずれる)。
- 768px 未満: header 左端にメニューボタン (`aria-controls`、`aria-expanded`)。ドロワーはネイティブ `<dialog>` の `showModal()`。focus trap、Escape、背後の inert 化はブラウザが担い、JS (`src/components/toc-drawer.ts`) は backdrop クリックで閉じる処理、`aria-expanded` 更新、768px 以上へ広がったときに閉じる処理だけ。モーダル表示中は `html` のスクロールを止める。ドロワーは top layer に出るため、開閉で本文の位置は変わらない (テストで `main` の bounding box を比較)。
- 章は `<details>/<summary>`。現在ページの章だけ初期展開し、それ以外は折りたたむ (原文は全展開)。15 章 68 件を全展開すると現在地が埋もれるため。
- `<nav aria-label="目次">`。desktop 用と drawer 用に同じ `Sidebar.astro` を 2 回描画する (原文も `navigation.html` を 2 回 include)。片方は常に `display: none` か閉じた dialog なので、支援技術に二重には出ない。
- 色は既存の Flexoki 系: 章見出し `--link` #205EA6、項目 `--muted`、現在ページ背景 #DDE7F1、hover `--bg-2`。

### ついでに直したもの

- 768px ではサイドバーの分だけ本文列が 512px になり、H ページ画像クレジットの `physics.stackexchange.com` が右に 5px はみ出して横スクロールが出た。`.margin-note` に `overflow-wrap: anywhere` を追加し、sidenote テストに `scrollWidth <= viewport` を追加した。
- `tests/sidenote.spec.ts` は、以前の原文整理で削除した注釈 (`circuit-help`、`related-pages`) を数えたままで失敗していた。残る 2 件に合わせた。
- サイドバーの `<details>` と footer の入れ子化に合わせて、`original-content.spec.ts` の検査対象を `main details` に、`title-divider.spec.ts` の footer セレクタを `footer p` に変更。

## 検証

- ローカル: typecheck、build、関連 9 spec で 50/50 (新規 `tests/sidebar.spec.ts` 5 件: 原文順序、現在ページ、未移植方針、drawer 開閉、desktop sticky)。
- 公開後の確認結果は下に追記する。
