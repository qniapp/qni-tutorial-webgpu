# 再実行ボタンの比較

`shor_fx` ページの最初の埋め込みを Playwright で撮影した。
画面幅 1280px、画面高さ 1000px、端末倍率 2。
右下の拡大画像は同じ位置の 440 × 400px の領域を切り出した PNG。

- `restart-before-bottom-right.png`: 変更前。枠外の丸い再生ボタン。
- `restart-after-bottom-right.png`: 変更後。状態バー右端の円形の矢印。
- `restart-before-embed.png` / `restart-after-embed.png`: タブも含めた埋め込み全体。

変更前はチュートリアルの `37f0339` と qni-webgpu の `348992f`。
変更後は `feat/restart-in-status-bar` と `feat/embed-restart-button` の実装。
Chromium の headed モードと SwiftShader の WebGPU テスト設定で、実際の wasm を描画した。
本番に CPU や WebGL の代替処理は追加していない。実機 GPU での比較は別途行う。
