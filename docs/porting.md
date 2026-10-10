# 原文ページの順次移植

順序は `src/data/toc.ts`。原文は qniapp/qni origin/main `acf87bfa9b377ca37ff2f9f733a9011cbf34be1d` の `apps/tutorial` を git show で参照する。未対応機能が必要なページでは判断を利用者に返し、そのページと後続ページを移植しない。

## 1. はじめに (`index` / サイトルート) - STOP・未移植

2026-10-10 12:19 JST。原文 `apps/tutorial/index.html:1-9` のtitleは「はじめに」、sectionは「イントロダクション」、descriptionは「実践による量子コンピュータプログラミング」。現行indexは従来の実験版トップページのままで、本文の忠実移植はまだ行っていない。sidebarはファイル有無でリンクを導出するため、以前からこの既存indexに「はじめに」のリンクを表示しているが、本文が移植完了という意味ではない。

### STOPの理由と位置

原文 `index.html:104-106` の mini_qni 回路:

```json
{"cols":[["|0>","|0>"],["{量子もつれ"],["H"],["•","X"],["}"],["Measure"],[1,"Measure"]]}
```

`{量子もつれ` / `}` は原文で表示される回路グループの開始・終了注釈。原文 `packages/elements/src/quantum-circuit-element.ts:1323-1327` はこのラベルを `CircuitBlockElement` に設定する。公開原文の quantum-circuit でも `circuit-block` の `data-comment="量子もつれ"` を確認した。

現行WebGPU pin `f4cd605fbf85030ebc4a7dd0f3a84b98e0b3f99f` ではこれを表現できない。`apps/web/src/url_circuit/decode.rs` の `summarize_circuit_json` (98行付近) は全tokenを `token_to_gate` で検証し、未知tokenは失敗になる。グループ注釈はgate tokenの対応表にない。`build_gates` (174行付近) の未知tokenを読み飛ばす経路を使っても、ラベルとグループ枠を失うため忠実な移植にはならない。

### 実ユーザーに近い環境での再現

ソースの推測だけでなく、公開h_gateの既存 `qni-webgpu-circuit` に原文JSONをそのまま設定して確認した (検証ブラウザ内だけの操作。公開ファイルは変更していない)。gmktec Chromium **152.0.7977.82**、Node **22.23.2**、`--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan --force-device-scale-factor=1`。

| viewport | data-state | 画面のstatus | console |
| --- | --- | --- | --- |
| 1440px | error | 量子回路を起動できませんでした。 | invalid circuit JSON: expected {"cols":[...]} with supported gates |
| 390px | error | 同上 | 同上 |

原文の公開indexから取得した回路JSONは上記と一致し、グループlabelは「量子もつれ」。成功時のzero-errors条件は満たせないため、移植を開始せず停止した。本文・画像・Orbit・注釈・header「実験版」・footerには変更なし。QPUとは等、後続ページにも進んでいない。

保存:

- `/tmp/qtw-port-index.json`: compatibility-check-only、両幅のエラー、原文JSON・group label、blocked=true。
- `/tmp/qtw-port-index-blocked-webgpu-{1440,390}.png`: 実際の起動失敗表示。
- `/tmp/qtw-port-index-blocked-original-1440.png`: 原文の埋め込み回路。
- `/tmp/qtw-port-index-check.mjs`: 再現手順。

これは移植完了比較ではないので、normalized本文diff・完了版compare画像・成功したembedの結果は作っていない。製品コードに変更がないためtypecheck/buildや移植テストの追加も行っていない。ブラウザはfinallyで停止し、サーバーは起動していない。今回はcheckpointのdocsだけを通常pushする。ページの移植deployはない。

### 高宮さんへの質問 (未決定)

**この回路の「量子もつれ」グループ注釈をどう扱いますか?**

1. WebGPU本体で原文のグループ開始/終了token、表示、JSON保持を実装し、新しいpinを公開してから「はじめに」を忠実移植する。
2. このページだけ、グループ注釈を省略してよいと明示的に承認する (計算とlabel表示は別問題。原文の可視ラベルは失われる)。今回は承認がないので省略していない。
3. 「はじめに」は保留し、明示的な順序変更の承認を得て「QPUとは」へ進む。今回はsidebar順の指定があるので飛ばしていない。

いずれの選択肢も実行していない。判断後にこの節を更新して再開する。
