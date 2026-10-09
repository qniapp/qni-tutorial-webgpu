# モダナイズ案 (草案)

旧 Qni Tutorial を移す際の候補。既存リポジトリは変更しない。

| 現行技術 (固定版) | 置換案 | 理由 | 工数 |
|---|---|---|:---:|
| Jekyll 4.4.1 / Liquid 4.0.4 | Astro 7.3.8 のページ・レイアウト | Ruby 依存をなくし、型付き部品へ移す | M |
| `mini_qni_filter.rb` / `qubit_circle` 等の自作 Ruby プラグイン (版なし) | Astro 部品と TypeScript、図は段階移植 | HTML 文字列生成と旧 Qni タグへの依存を除く | L |
| esbuild 0.28.1 と www まで含む連鎖ビルド | Astro の標準ビルド | サイトに不要な www ビルドを切り離す | M |
| Catalyst 1.8.1 / jtml 0.5.1 | 標準 Custom Elements と Qni WebGPU | 属性・接続・破棄を小さな TS 部品に限定する | L |
| `@qni/simulator` 0.0.87 の CPU 計算と Dedicated Worker | Rust/wasm + WebGPU | 旧計算器と Worker 通信を除く。計算結果の同等性検証は必要 | L |
| Stimulus 3.2.2 (サイドバー) | 小さな TypeScript 部品 | 開閉だけのためのフレームワークを不要にする | S |
| Tailwind 3.4.19 (elements は 3.2.7) / PostCSS 8.5.26 / Autoprefixer 10.5.6 | Astro の部品内 CSS と CSS 変数 | 二重の版管理と記事内の大量の装飾クラスを減らす | M |
| interactjs 1.10.28 / XState 4.38.3 / Tippy 6.3.7 | WebGPU 側の編集 UI、記事側は標準 DOM | ドラッグ・状態管理・ポップアップの重複実装を避ける | L |
| MathJax 3.2.2 / Orbit 外部スクリプト (版指定なし) | 数式は維持または KaTeX を評価、復習はまず `details` | 表記の互換性と復習履歴の必要性を別々に判断する | M |
| tutorial 専用テストなし。共有 Jest 30.4.2 / ts-jest 29.4.11 / Web Test Runner 1.0.0 / RuboCop 1.86.1 | TypeScript と Playwright、必要なら Vitest | 配信パス・本文・回路操作を新サイトで直接検証する | M |
| Ruby 4.0.2 + Jekyll の Pages ビルド、configure-pages v6 / upload-pages-artifact v5 / deploy-pages v5 | withastro/action v6 + deploy-pages v5、WebGPU は SHA 固定ビルド | 公式 Astro 手順へ統合する。配信基盤は維持する | S |

- 版は旧リポジトリの `apps/tutorial/Gemfile.lock`、`pnpm-lock.yaml`、同梱 MathJax、`.github/workflows/pages.yml` の実値。主な実装は `apps/tutorial/package.json`、`_plugins/`、`src/serviceworker.js`、`packages/elements/src/`。`serviceworker.js` は PWA の Service Worker ではなく `new Worker()` で使う。
- S は局所変更、M は複数部品の移植、L は挙動の再実装と検証。Astro と WebGPU は決定済み。残りは提案で、全ページの移植や依存更新は未実装。
- 数式・振幅図・復習履歴をどこまで残すか先に決める。パレット制限、デバイス共有、複数回路の分離は WebGPU 側の後続作業。
