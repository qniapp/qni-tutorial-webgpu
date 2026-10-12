# 自前クイズ（Orbit 置き換え）共有仕様

qni-webgpu eng による共有仕様（高宮さん依頼）

対象: qniapp/qni-tutorial-webgpu（Astro）と qniapp/qni `apps/tutorial`（Jekyll）。両方で同じ見た目と動きにする。
基準実装: qni-tutorial-webgpu ブランチ `feat/native-quiz`（`src/components/orbit-quiz.ts` / `orbit-quiz.css`、2026-10-12 時点）。この仕様は基準実装と矛盾しないように書いている。値を変えるときは、仕様と両リポジトリを同時に更新する。

---

## 0. 決定事項（qni eng 草案 `/workspace/qni-worktrees/quiz-spec.md` との差）

qni 側ブランチ `replace-orbit-quizzes`（e041754・4359e81、未 push）は草案に沿って作られている。以下の点は**本仕様を優先**するので、そのブランチは作り直すこと。

| 項目 | 草案 | **本仕様の決定** | 理由 |
|---|---|---|---|
| 要素名 | `<quiz-set>` / `<quiz-card>` に改名 | **元の `<orbit-reviewarea>` / `<orbit-prompt>` のまま** | 16 ページの HTML を 1 バイトも変えずに済む（変換スクリプトも不要）。`content_with_margin.css` もそのまま使える。webgpu 側のテスト `orbit-reviewarea[color="blue"]` とも一致する |
| 属性名 | `*-attachments` を `*-image` に改名し、`color` を削除 | **改名も削除もしない**（`question` `answer` `question-attachments` `answer-attachments` `cloze` `color`） | 元の属性値をバイト単位で保持するため |
| 操作 | 「答えを見る ⇄ 答えを隠す」のトグル。採点は何度でも押し直せる | **答えを見る → ○/× → やり直す** の一方向（§4） | 基準実装に合わせる |
| クラス名 | `quiz-card__*`（BEM） | **`orbit-quiz-*`**（§2.3） | 基準実装に合わせる |
| 配色 | Tailwind の zinc / sky | **Flexoki 系の固定 hex**（§3） | 基準実装に合わせる。両サイトとも同じ hex 値を素の CSS に書く |
| 結果文言 | 「正解！」「不正解（もう一度確認しましょう）」 | **「正解」「不正解」**（アイコン付き） | 説明文を足さない（高宮さんの条件） |
| リストの意味付け | `role="list"` / `listitem`、`aria-label="確認クイズ"` | **カードごとに `role="group"`**。セットにはラベルを付けない | 「確認クイズ」は新しい文言にあたるため足さない |

---

## 1. 在庫（qni origin/main a0865ad）

- 16 ページに `<orbit-reviewarea>` が 18 個、`<orbit-prompt>` が 113 個（what_qpu_do_faster だけが 3 セット）。
- 内訳: テキスト Q&A 50、画像添付ありの Q&A 24（`question-attachments` / `answer-attachments`。`answer=""` で答えが画像だけのものもある）、cloze 39。**選択式は無い**。
- 全セットが `color="blue"`。添付はすべて絶対 URL（`https://qniapp.github.io/qni/images/…`）。
- TeX `$…$` を含むプロンプトは 12 個（circle_notation、qubit、superposition、what_qpu_do_faster）。cloze の穴の中にもある（`{$|0\rangle$}`）。表示数式 `$$\begin{bmatrix}…\end{bmatrix}$$` も 1 件ある。
- `**太字**` は 2 件（index「**量子コンピュータ**の名前の由来は?」、qpu「**現時点で**」）。
- 属性値の中に改行があるのは 1 件（qpu の `question`）。

## 2. マークアップとデータ形式

### 2.1 ソース（著者が書く HTML。既存のまま）

```html
<orbit-reviewarea color="blue" class="mt-5">
  <orbit-prompt question="…" answer="…"></orbit-prompt>
  <orbit-prompt question="…" answer="" answer-attachments="https://…/x.png"></orbit-prompt>
  <orbit-prompt cloze="ブロッホ球では、状態 $|0\rangle$ は{北極点}に対応する"></orbit-prompt>
</orbit-reviewarea>
```

| 属性 | 意味 |
|---|---|
| `color` | アクセント色。`blue`（既定、全セットがこれ）。ほかに red / orange / yellow / green / cyan / purple / magenta も受け付ける（§3.1） |
| `question` / `answer` | Q&A の問題と答え。`answer` は空でもよい |
| `question-attachments` / `answer-attachments` | 画像 URL。空白区切りで複数指定できる |
| `cloze` | この属性があれば cloze カードになる。トップレベルの `{…}` が穴 |

- 元の属性値はバイト単位で保持する。全角・半角の `?`、空白、改行、`\rangle` などもそのまま残す。
- **問題文・答えには何も足さない**。プロンプト、選択肢、見出し、説明文も追加しない。例外は画像の alt テキストだけで、高宮さんの決定により §2.5 の表から付ける（マークアップには書かない）。
- qni（Jekyll）: マークアップは Liquid を通らない素の HTML として書く。属性値に `{{` や `{%` を含めてはならない（cloze の `{` は 1 文字だけなら Liquid は無視するので安全）。将来 cloze の先頭が `{{` / `{%` になる場合は書き方を変える（`{% raw %}` は使わない）。
- 外部スクリプト `https://js.withorbit.com/orbit-web-component.js` は削除する（webgpu は各ページから、qni は `_layouts/default.html` から）。

### 2.2 テキストの解釈（表示時のみ。元の属性値は変えない）

1. 連続する空白（改行を含む）を半角空白 1 つにまとめ、前後の空白を除く（qpu の改行は空白 1 つになる。HTML の通常表示と同じ）。
2. `$$…$$` は表示数式としてそのまま残す。`$…$` は `\(…\)` に置き換えて MathJax に渡す（§2.4）。
3. 数式の外にある `**x**` は `<strong>`、`*x*` は `<em>` にする。それ以外の Markdown は解釈しない。
4. 文字列は必ず `textContent` / テキストノードとして入れる（`innerHTML` は使わない）。
5. cloze の分解: トップレベルの `{…}` を穴とする。`$…$` の中の波括弧と `\` によるエスケープは本文として扱う。入れ子の `{}` は穴の中身になる。閉じていない `{` は本文として残す。穴が複数あるときも **1 カードで全部の穴を同時に開く**。Orbit は穴ごとに別カードにしていたが、本仕様ではプロンプトの数を増やさない。

### 2.3 生成 DOM（初回の connect 時に 1 回だけ作る。属性が変わったら作り直す）

```html
<orbit-prompt>
  <div class="orbit-quiz-card [is-cloze]" role="group" aria-labelledby="orbit-quiz-N-q"
       data-state="unanswered|revealed|correct|incorrect">
    <div class="orbit-quiz-question" id="orbit-quiz-N-q" [tabindex="-1"(cloze)]>
      問題文
      <!-- Q&A: --> <div class="orbit-quiz-attachments"><img src [alt] loading="lazy" decoding="async"></div>
      <!-- cloze の穴: -->
      <span class="orbit-quiz-blank">
        <span class="orbit-quiz-blank-placeholder">空欄</span>
        <span class="orbit-quiz-blank-answer">穴の中身</span>
      </span>
    </div>
    <!-- Q&A のみ -->
    <div class="orbit-quiz-answer" id="orbit-quiz-N-a" tabindex="-1" hidden>
      <p class="orbit-quiz-answer-text">答え</p>   <!-- answer が空なら作らない -->
      <div class="orbit-quiz-attachments">…</div>
    </div>
    <p class="orbit-quiz-status" role="status"></p>
    <div class="orbit-quiz-actions">
      <button type="button" class="orbit-quiz-button orbit-quiz-reveal" aria-controls="(Q&A: …-a / cloze: …-q)" aria-expanded="false">答えを見る</button>
      <button type="button" class="orbit-quiz-button orbit-quiz-correct" hidden>✓アイコン 正解</button>
      <button type="button" class="orbit-quiz-button orbit-quiz-incorrect" hidden>✗アイコン 不正解</button>
      <button type="button" class="orbit-quiz-button orbit-quiz-retry" hidden>やり直す</button>
    </div>
  </div>
</orbit-prompt>
```

- `<orbit-reviewarea>` は中身を持たないカスタム要素で、スタイル専用。
- アイコンは 16×16 のインライン SVG（stroke 2、`currentColor`、`aria-hidden="true"`）。○/× の役割を果たすのはこの ✓/✗ アイコンと「正解」「不正解」の文字。
- 画像の `alt` は §2.5 の表から付ける。表にない URL の画像には `alt` 属性を付けない（`alt=""` にもしない）。
- 登録時は `customElements.get()` で定義済みかを確認し、二重定義を避ける。

### 2.4 MathJax（決定: 区切りの設定は変えず、`$…$` を変換したうえで typesetPromise を呼ぶ）

- MathJax の設定（`tex.inlineMath`）に `$` を追加することは**しない**。追加すると本文中の `$` まで数式として拾われるおそれがある。両サイトとも MathJax 3 の既定区切り（`\(…\)`、`$$…$$`、`\[…\]`）のまま使う。
- 代わりにクイズ側で `$…$` を `\(…\)` に置き換えてテキストノードに入れる。cloze の穴の中身（`.orbit-quiz-blank-answer`）も、表示前から DOM にあるので同じように処理される。
- 描画後は `MathJax.startup.promise = MathJax.startup.promise.then(() => MathJax.typesetPromise([card]))` で 1 回だけ typeset する。`typesetPromise` がまだ無い（MathJax の読み込み前）ときは何もしない。最初のページ typeset が拾うので問題ない。
- 前提: webgpu では、クイズに TeX があるページ（qubit、superposition、circle_notation、what_qpu_do_faster）に `hasMath` を付ける（設定済み）。qni は全ページで `tex-mml-chtml.js` を async で読み込む。
- `mjx-container` は `max-width:100%; overflow-x:auto`。表示数式の上下マージンは 8px。

### 2.5 画像の alt（高宮さんの決定、2026-10-12）

- **置き場所**: 画像 URL をキーにした JS の表。webgpu は `src/components/orbit-quiz-alt.ts` の `export const QUIZ_IMAGE_ALT: Record<string, string>`、qni は同じ表を素の JS で持つ（キーと文言は同一）。キーは属性に書かれた URL そのまま（`superposition-50-50-phase¼π.png` もエンコードしない）。
- `<orbit-prompt>` には属性を足さない（§6）。ページの HTML も変えない。描画時に `Object.hasOwn(QUIZ_IMAGE_ALT, url)` なら `img.alt` に入れ、無ければ `alt` 属性を付けない。
- 1 つの URL に alt は 1 つ。問題側と答え側の両方で使う画像も同じ文言になる。
- **方針**: 日本語で短く、写っているものだけを描写する。答えを明かす・示唆する情報（確率の数値、「位相」などの状態の名前、答えになるゲートの並びや個数、グラフの形）は書かない。
  - 問題側で使う画像は、解くのに必要な見た目（塗りの有無と大きさ、針の向き）を描写し、確率や位相の言葉には言い換えない。
  - 答え側だけで使う画像は、図の種類と問題文に出ている要素だけを書く。内容は答えの文が伝える。
  - 両方で使う画像は問題側の描写を優先する。答え側の `alt` は答えの表示後にしか読まれない（`hidden` の中にある）。
  - `basic_quantum_circuit.png` は qni 側で 404 だったため、元画像（qni commit f47d1541）をバイト無変更でこのサイトの `public/images/` に置いて配信し、キーは `/qni-tutorial-webgpu/images/basic_quantum_circuit.png`。alt は写っている線・箱・記号だけを描写し、答えになる語は書かない。
- 全 18 URL の文言と、どのカードのどちら側で使うかは `docs/quiz-alt.md` にある。文言を変えるときは、この一覧と両リポジトリの表を同時に更新する。

## 3. 見た目

素の CSS クラスで書く（Tailwind ユーティリティや `@apply` は使わない）。ダークモードは無し（両サイトとも持っていない）。フォントは指定せずページから継承する（webgpu は `system-ui, sans-serif`、qni は Tailwind 既定の sans）。数値はすべて px で書く。

### 3.1 色

| 用途 | 値 |
|---|---|
| アクセント（blue）50 / 600 / 700 | `#E1ECEB` / `#205EA6` / `#1A4F8C` |
| カード背景・ボタン背景 | `#FFFCF0` |
| 枠線・区切り | `#DAD8CE` |
| 文字 | `#100F0F`、補助（やり直す）`#6F6E69` |
| 穴（未回答）の背景・やり直すのホバー | `#F2F0E5` |
| 正解 | 線 `#66800B`、文字 `#536907`、背景 `#EDEECF` |
| 不正解 | 線・文字 `#AF3029`、背景 `#FFE1D5` |
| フォーカスリング | `#205EA6` |

ほかの `color` は 50 / 600 / 700 の 3 つの CSS 変数（`--orbit-quiz-50/600/700`）だけを差し替える。red `#FFE1D5/#AF3029/#942822`、orange `#FFE7CE/#BC5215/#9D4310`、yellow `#FAEEC6/#AD8301/#8E6B01`、green `#EDEECF/#66800B/#536907`、cyan `#DDF1E4/#24837B/#1C6C66`、purple `#F0EAEC/#5E409D/#4F3685`、magenta `#FEE4E5/#A02F6F/#87285E`。

### 3.2 寸法（640px 以上）

- **セット** `orbit-reviewarea`: grid、gap 12px、padding 16px、角丸 12px、背景はアクセント 50、margin `32px 0`、max-width `76ch`。`class="mt-5"` があれば上マージンは 20px（各サイトの既存 `.mt-5` に従う）。
- **カード**: padding `16px 20px`、枠 1px `#DAD8CE`、角丸 8px、背景 `#FFFCF0`、文字 16px / 行高 28px。採点後は枠線の色を正解色または不正解色にし、左に 4px の inset バー（`box-shadow: inset 4px 0 0`）を付ける。
- **問題**: font-weight 600、`overflow-wrap:anywhere`。
- **答え（Q&A）**: 上に 12px のマージン、上 padding 12px、上に 1px 破線 `#DAD8CE`。本文は通常の太さ。
- **cloze の穴**: inline-block、最小幅 4em、最小高さ 28px、margin `0 2px`、padding `0 6px`、下線 2px（アクセント 600）、角丸 `4px 4px 0 0`、背景 `#F2F0E5`、中央揃え。「空欄」は視覚的に隠したテキストとして持つ。答えを表示したら、最小幅 0・背景アクセント 50・文字アクセント 700・太字 700 で穴の中身を見せる。
- **画像**: flex wrap、gap 8px、上に 8px のマージン。各画像は `max-width:100%`、`max-height:160px`、height auto、枠 1px `#DAD8CE`、角丸 4px、背景 `#FFFFFF`。
- **ボタン行**: flex wrap、gap 8px、上に 16px のマージン。
- **ボタン（共通）**: 最小高さ 40px、padding `8px 16px`、枠 1px `#DAD8CE`、角丸 6px、背景 `#FFFCF0`、文字 14px / 20px / 600、アイコンとの間隔 6px。
  - 答えを見る: 塗り（背景と枠はアクセント 600、文字 `#FFFCF0`）。ホバー時はアクセント 700。
  - 正解: 枠 `#66800B`、文字 `#536907`。ホバー時の背景 `#EDEECF`。
  - 不正解: 枠・文字 `#AF3029`。ホバー時の背景 `#FFE1D5`。
  - やり直す: 文字 `#6F6E69`。ホバー時は背景 `#F2F0E5`、文字 `#100F0F`。
- **結果表示** `.orbit-quiz-status`: 上に 12px のマージン、ピル形（角丸 999px、padding `2px 10px`）、14px / 20px / 600、アイコンとの間隔 4px。正解は背景 `#EDEECF`・文字 `#536907`、不正解は背景 `#FFE1D5`・文字 `#AF3029`。`display:flex; width:fit-content`（`inline-flex` にすると、空のときも 28px の行ボックスができて問題とボタンの間が空く）。空のときは `display:none` にせず、margin と padding を 0 にして高さ 0 で残す（§5）。
- **余白カラム**: セットの幅は、各サイトで本文の `<p>` と同じ列にそろえる。
  - webgpu: `@media (min-width:640px) { .content-with-margin > orbit-reviewarea { width:58.333333%; margin-right:auto } }`
  - qni: `css/content_with_margin.css` の `.content-with-margin orbit-reviewarea { @apply md:mr-auto md:w-7/12; }` を**そのまま残す**（要素名を変えないので置き換えは不要）。qni は 768px で切り替わる。両サイトで違ってよいのはこのブレークポイントだけ。
  - qni の草案ブランチでは `quiz-set` に書き換えているが、これは元に戻す。

### 3.3 390px（639.98px 以下）

- セット: padding 12px、gap 8px。カード: padding `12px 16px`。
- ボタン: `flex:1 1 0`、最小高さ 44px。「答えを見る」と「やり直す」は 1 本で横幅いっぱい、「正解」と「不正解」は半分ずつ並ぶ。
- 横スクロールを出さない。長い文字列は `overflow-wrap:anywhere`、行列の数式は `mjx-container` の中でだけ横スクロールする。画像は `max-width:100%`。

## 4. 操作と状態

自己採点だけを行う。間隔反復、保存、正規化した入力の照合、選択肢はいずれも無い。リロードすると未回答に戻る。

### 4.1 正誤判定を自己採点にする理由

- 答えの多くは文章（例: 「出力の 1 ビットから入力の 2 ビットを一意に復元できないから」「AND, OR, NAND, XOR など」「原子 or 電子 or 光子」）、画像だけ（`answer=""`）、または数式である。自由入力を正規化して照合すると、言い換えや表記の揺れを不正解と誤判定する。誤判定は学習者に誤った情報を与えるので、照合しない方が正確である。
- cloze の穴にも「確率(振幅の大きさの2乗)」「半径 1 の球面」「データのエンコード」「$|0\rangle$」など、入力しにくい語や言い換えのある語が多い。cloze だけ入力欄にすると、カードの種類によって操作が変わる。全カードで操作を 1 つにそろえると、キーボード操作とスクリーンリーダーでの使い方も単純になる。
- 元の Orbit も、答えを見たあとに自分で申告する方式（覚えていた / 忘れた）だった。判定の考え方は変えず、間隔反復と保存だけをなくした。

| `data-state` | 表示 | 見えるボタン |
|---|---|---|
| `unanswered`（未回答） | 問題（cloze は穴が空の箱）。答えは `hidden` | 答えを見る（`aria-expanded="false"`） |
| `revealed`（答え表示） | Q&A は答えの領域を表示、cloze は穴を埋めて表示 | 正解 / 不正解 |
| `correct`（○） | 答えを表示したまま、緑の枠と左バー、結果「✓ 正解」 | やり直す |
| `incorrect`（×） | 答えを表示したまま、赤の枠と左バー、結果「✗ 不正解」 | やり直す |

遷移: 答えを見る → `revealed`。正解または不正解 → `correct` / `incorrect`。やり直す → `unanswered`（結果は消える）。答えを隠す操作や、採点後に押し直す操作は設けない。押し直したいときは「やり直す」を使う。状態はカードごとに独立している。

UI 文言はすべて日本語で、次の 5 つに限る: 「答えを見る」「正解」「不正解」「やり直す」「空欄」（「空欄」はスクリーンリーダー向けで画面には出ない）。

## 5. アクセシビリティ

- すべての操作は `<button type="button">` で行い、Tab・Enter・Space で操作できる。
- フォーカスリング: ボタンは `:focus-visible` で 2px `#205EA6`、offset 2px。フォーカス先の問題・答えの領域は 2px、offset 4px。マウスでクリックしたときの `:focus` リングは消す。
- フォーカスの移動: 答えを見る → 表示した内容（Q&A は `.orbit-quiz-answer`、cloze は穴が埋まった `.orbit-quiz-question`。どちらも `tabindex="-1"`）。正解・不正解 → やり直す。やり直す → 答えを見る。
- 結果は `role="status"`（polite）で読み上げる。この要素は空のときもアクセシビリティツリーに残す。`display:none` の live region に内容を入れて同時に表示すると、読み上げられないことがあるため。正誤は色だけで伝えず、アイコンと文字（✓ 正解 / ✗ 不正解）を必ず併記する。
- カードは `role="group"` とし、`aria-labelledby` で問題文を指す。「答えを見る」は `aria-controls` と `aria-expanded` を持つ。
- コントラスト: アクセント 600 の上に `#FFFCF0` の文字、正解・不正解の文字色はいずれも WCAG AA を満たす。
- MathJax の assistive MathML と context menu は既定のまま有効にしておく。
- 色や transition のアニメーションは使わない（`prefers-reduced-motion` で切り替えるものも無い）。

## 6. 既知の制約（今回は対応しない）

- 画像の alt は §2.5 で付けた。ただし alt は答えを書かないので、答えが画像だけのカード（`answer=""`）のうち circle_notation の偏角の 1 枚は、スクリーンリーダーでは答えの中身が伝わらない（superposition の 2 枚は、同じ画像を問題側でも使うので alt で伝わる）。答えの文を足すかどうかは高宮さんが決める。
- cloze の穴が複数あっても 1 回でまとめて開く（§2.2）。
- quantum_circuit の問題画像 `https://qniapp.github.io/qni/images/basic_quantum_circuit.png` は 2026-10-12 時点で 404 だった。qni が元画像を復元した（qniapp/qni#593、commit f47d1541）ので、同じファイルをバイト無変更で `public/images/basic_quantum_circuit.png` に置き、`question-attachments` をこのサイトの `` {`${base}images/basic_quantum_circuit.png`} ``（`/qni-tutorial-webgpu/images/basic_quantum_circuit.png`）に変えた。元ページから変えた属性はこの 1 つだけ。alt は §2.5。ほかの 17 個の画像 URL は 200。
- `<orbit-prompt>` 自身には属性を追加しない（状態はカードの `data-state` に持つ）。webgpu の既存テストが `<orbit-prompt>` の属性を元のページと照合しているため。

## 7. 実装メモ（リポジトリ別）

### qni-tutorial-webgpu（基準実装）
- `src/components/orbit-quiz.ts` と `orbit-quiz.css`（`.ts` から import）を作り、`TutorialLayout.astro` の module script で `import '../components/orbit-quiz'` する。
- 各ページの `<script … orbit-web-component.js>` は削除する。ページの HTML はそのまま。
- Service worker は無い。Astro がハッシュ付きの asset を出すので、キャッシュの扱いは不要。
- 390px でのカード内容幅は 300px（390 − 本文の左右余白 16×2 − セット 12×2 − カード枠 1×2 − カード余白 16×2）。
- テスト `tests/quiz.spec.ts`:
  - クイズのある全 16 ページで、`<orbit-prompt>` と同じ数のカードが未回答で描画されること。問題文と答えが属性と一致すること（書式記号と数式は除く）。`withorbit.com` への通信が無いこと。
  - Orbit の script だけを読み込んでいた 3 ページ（bb84_circuit、multi_qubit_phase_gate、partial_measurement）で、通信と script 要素が無いこと。
  - 未回答 → 答え表示 → 正解 → やり直す → 不正解 の遷移。各状態での表示、`aria-expanded`、`role="status"` の文言、フォーカスの移動。ほかのカードと独立していること。リロードで戻ること。
  - キーボードだけでの操作（Enter、Tab、Shift+Tab、Space）とフォーカスリング。
  - 添付画像 31 枚すべてに `QUIZ_IMAGE_ALT` の alt が付くこと。表のキーとページで使う URL が一致すること。alt にカードの答えの文が含まれないこと。表にない URL の画像には `alt` 属性が無いこと。
  - cloze の穴を全部隠すこと、表示後に太字になること。TeX（インライン、表示数式、穴の中）と Markdown（`**`、`*`）。
  - 1440px と 390px での寸法、色、ボタンの高さ、本文の段落と同じ幅であること、横にはみ出さないこと。
- 既存テストの調整:
  - `main img` を数えるテストは、クイズの添付画像を除く（`main img:not(orbit-prompt img)`）。
  - bb84_circuit のソースハッシュは、削除した Orbit の script 行を戻してから比較する。
  - `tests/restart.spec.ts` は、`running` になった直後で埋め込みがまだキー入力を処理できない場合に備えて、再起動を確認できるまで「フォーカス → Shift+Tab → キー」を繰り返す。この競合は以前からあり、Orbit の script の読み込みでページの起動が約 2 秒遅れていたために表に出ていなかった。origin/main でも Orbit への通信を遮断すると、10 回中 6 回失敗する。

### qni（Jekyll、`apps/tutorial`）
- `src/quiz.js` は素の JS に移植する（型を除くだけで、ロジック・DOM・クラス名・文言は §2〜§5 と同じ）。alt の表は `src/quiz-alt.js` に `export const QUIZ_IMAGE_ALT = {…}` として webgpu と同じキー・文言で置く（§2.5）。`src/application.js` から `import './quiz.js'` し、esbuild の ESM バンドル `application.js` に入れる。**JS から CSS を import しない**。esbuild が `application.css` を出力して Tailwind の出力を上書きしてしまうため。
- `css/quiz.css` には §3 の素の CSS を書く（webgpu 用の `.content-with-margin > orbit-reviewarea` ルールは除く）。`src/application.css` で `@import '../css/quiz';` を `tailwindcss/utilities` より**前**に置く。こうすると `class="mt-5"` のユーティリティが優先される。
- Tailwind の preflight（ボタンの背景の透明化、`p` のマージン 0、`img` の block 化）があっても、§3 のクラスがすべて明示的に上書きするので見た目は変わらない。
- `_layouts/default.html` から Orbit の `<script>` を削除する。MathJax の読み込みは変えない。
- 16 ページの HTML と `css/content_with_margin.css` は**変更なし**。
- Service worker: `serviceworker.js` は `<quantum-simulator data-service-worker>` が使うシミュレータ用の Worker で、Cache Storage は使っていない。クイズはこのバンドルに入れないので、ここは変更しない。`application.js` / `application.css` はファイル名が固定なので、デプロイ直後は GitHub Pages の HTTP キャッシュ（約 10 分）で古い JS が残ることがある。古い HTML と新しい JS、またはその逆の組み合わせでも、customElements の重複定義ガードと「Orbit の script は読み込みに失敗するだけ」という性質で壊れない。
- テスト: web-test-runner（または Playwright）で、未回答 → 答え表示 → ○ / × → やり直す の遷移と、cloze（穴の中の TeX を含む）を確認する。

## 8. index.html の Orbit への言及（クイズではないので別扱い）

index の段落「チュートリアルのもう一つの特長は…」には、余白ノート（「Andy Matuschak 氏による…Orbit を利用しています。…Orbit の利用規約及びプライバシー・ポリシー」のリンク）と、忘却曲線による復習の説明がある。これらは**本仕様の対象外**とし、クイズ置き換えの PR では変更しない（webgpu の実装も変更していない）。

ただし、置き換え後は記述が事実と合わなくなる（復習の出題は無く、利用規約のリンク先は停止したサービス）。修正文は別の PR で用意し、高宮さんの承認を得てから両リポジトリに同じ文面で入れる。案: 余白ノートと利用規約リンクを削除し、復習に関する 2 文を削る。どの文を残すかは高宮さんが決める。

## 9. デザインの手順

- 見た目の設計・変更は pi の `claude-bridge/claude-opus-5-5`（thinking medium）で行う（高宮さんの条件）。webgpu 基準実装のセッション（`--workspace-qni-tutorial-quiz--`）と qni 草案のデザインセッションは、どちらもこの条件で行われた。2 つのデザインのうち webgpu 側を採用する。
- §3 の値を変えるときは、このセッション条件で変更し、仕様と両リポジトリを同じ PR 単位で更新する。
