# 超密度符号化回路: title 付き原 JSON の起動ブロッカーは解決

**現在の状態: #59 解決。** PR #61 のマージcommit `ef652682c23d89427f6f39bb6bee1ec6fae9bb1e` へpinを更新し、embed/standaloneを実再ビルドした。元の `"title":"Superdense Coding"` を含む全JSONで起動、GPUの送受信一致、現在回路リンク・再実行・実ドラッグ編集後のtitle保持を確認。390/1440とDPR1/2で検証済み。title削除やCPU fallbackでの回避はしていない。最新公開結果は [porting.md](porting.md) 末尾。

以下は解決前の歴史的なSTOP記録。

2026-10-11。`superdense_coding_circuit` は未公開だった。#57とは別の停止条件。

- 上流 pin: `785c8b786c9eb0b7cb48d435d8215aaf45177ea1`
- 原文: `qniapp/qni` の `apps/tutorial/superdense_coding_circuit.html`
- 原回路は `{"cols":[...],"title":"Superdense Coding"}`。palette `[]`、`max-wire-count=1`。
- 実 Chromium / AMD WebGPU で元の完全な JSON を embed に渡すと `data-state=error`。
- console: `量子回路の起動に失敗しました。 invalid circuit JSON: expected {"cols":[...]} with supported gates`

最小再現:

```json
{"cols":[["|0>"]],"title":"Superdense Coding"}
```

結果は `error`。比較用の `{"cols":[["|0>"]]}` は同じブラウザー、同じ embed、同じ GPU で `running`。この比較は診断のみで、元ページの title を消す回避策は公開していない。

原因箇所は上流 `apps/web/src/url_circuit/parser.rs` の `parse_cols`。`cols` 配列の直後に `}` を要求し、root の `title` を受け付けない。元の JSON の受理とメタデータの保持・現在回路リンクの round-trip は上流側で対応が必要。チュートリアル側では本文・原 JSON の改変や CPU fallback を行わない。

作業時の再現資料: 一時ディレクトリの `qtw-superdense-title-repro.json`、`qtw-superdense-start-blocker.png`。保留 draft は `qtw-blocked-superdense/`。
