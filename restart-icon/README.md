# 再実行ボタンの比較

`shor_fx` ページの最初の埋め込みを Playwright で撮影した。
画面幅 1280px、画面高さ 1000px、デバイスピクセル比 2。
右下の画像は同じ位置の 440 × 400 CSS px の領域を切り出した PNG（880 × 800px）。

- `restart-before-bottom-right.png`: 変更前。枠外の丸い再生ボタン。
- `restart-after-bottom-right.png`: 変更後。状態バー右端の円形の矢印。
- `restart-before-embed.png` / `restart-after-embed.png`: 「Qniで開く」のタブも含めた埋め込み全体。

変更前は撮影時の既定ブランチ: チュートリアルの main `c0b6a632a68288736abb245521eba9f8cf43180a` と
qni-webgpu の master `348992f5d7926d326eaa0f678fa8d89f0894ff54`。
変更後はチュートリアルの `2befa1419387e8cedaa7b38d44474e7be423a980` と
qni-webgpu の `51a14e48a4334bee97a638e598dd996a23d3de0a`。
Chromium の headed モードと SwiftShader の WebGPU テスト設定で、実際の wasm を描画した。
本番に CPU や WebGL の代替処理は追加していない。実機 GPU での比較は別途行う。

この回路は高さが足りず、状態パネルが回路の一部を隠す。これは変更前後で共通であり、
今回の画像はボタンの配置を比較するためのもの。
