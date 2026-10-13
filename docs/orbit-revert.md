# クイズを Orbit 埋め込みに戻す（2026-10-13）

Orbit の埋め込み（`https://js.withorbit.com/orbit-web-component.js`）が復旧したため、高宮さんの決定でクイズを Orbit に戻した。

## 戻したもの

- #3（aa4606c）のうち自前クイズへの置き換え部分: 19 ページの Orbit script 行（元と同じ行・位置）、`src/components/orbit-quiz.ts` / `orbit-quiz.css`（content-with-margin の `orbit-reviewarea` 幅指定を含む）、TutorialLayout の import、`tests/quiz.spec.ts`、既存テストの調整（`img:not(orbit-prompt img)`、bb84 のベースライン補正）。
- #5（8549f32）を git revert: index の傍注 `index-note-5` と 2 文、ported-pages のテスト調整、#5 のスクリーンショット。
- #6/#7 の alt の仕組み: `src/components/orbit-quiz-alt.ts`（`QUIZ_IMAGE_ALT`）と `docs/quiz-alt.md` を削除し、`docs/quiz-spec.md` からも alt の記述を除いた。Orbit は iframe 内で画像を表示するので alt を付けられない（高宮さんの決定）。

## 残したもの

- `tests/restart.spec.ts` の再試行（#3 で追加）。Enter/Space での再起動直後にランナーがキーを受け付けない競合への対策で、Orbit とは無関係なテストの安定化なので残した。
- #6/#7 の `public/images/basic_quantum_circuit.png`（画像の復元）、`docs/quiz-spec.md`（冒頭に未使用の注記を追加）、#4 などの後続変更。

## basic_quantum_circuit.png の URL

Orbit は withorbit.com の iframe 内で描画するので、サイト相対 URL は withorbit.com 側で解決されて壊れる。`question-attachments` を文字列リテラルの `https://qniapp.github.io/qni-tutorial-webgpu/images/basic_quantum_circuit.png` にした。

この URL は #6 のデプロイで既に配信されており（HTTP 200、sha256 `32f9dbe4…9bb6` でリポジトリのファイルと一致）、ローカルの preview で quantum_circuit の Orbit カードを開くと iframe 内に画像が表示されることを確認した（`docs/screenshots/orbit-revert/quantum_circuit-attachment-1440.png`）。

## 検証

- `QNI_WEBGPU_SOURCE=/workspace/qni/qni-webgpu pnpm run build`、`pnpm run typecheck` 成功。
- Playwright（ported-pages, original-content, sidenote, circuit-display, inline-glyphs, bb84-text-source, h-gate-page-fixes, real-gpu, restart）: 194 passed、7 failed。失敗は origin/main（977bd2f）でも同じ 7 件で、この変更とは無関係:
  - ported-pages の sat / grover_iam（1440・390）: #4 で回路を変えたが fixture が元の回路のまま。
  - real-gpu の H-gate ランナー、restart の Enter / Space: この環境の headless Chromium（SwiftShader）でランナーの canvas が表示されず `running` にならない。
- スクリーンショット（`docs/screenshots/orbit-revert/`、Chromium で Orbit の iframe を実際に読み込んで撮影）: h_gate のクイズ 1440/390、h_gate で "Show Answer" を押した状態 1440、index の該当段落 1440/390（390 は傍注を開いた状態も）、quantum_circuit の画像付きカード 1440。
