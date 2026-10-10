# 移植済み本文の内側scroll解消

2026-10-10。移植追加・本文/TeX/回路JSON/palette/creditの変更なし。qni-webgpu pinはPR #54の `dba8ed696f366af78c714ae956683b44777386e8`。

## 再現と検証

- 実Chromium152/Vulkan WebGPUで、sidebarの移植済み25ページを1ページずつ390/1440で検査した。
- before: 50ケース中14ケース、13ページ22箇所に内側scrollあり。ベクトル数式1箇所は両幅で縦scrollしたため、幅別の検出は23件。
- 判定: 可視の本文要素とopen shadow DOMを再帰探索。`scrollWidth > clientWidth` / `scrollHeight > clientHeight` かつ該当軸のcomputed overflowがauto/scrollなら失敗。document overflow、console/page errors、全embed runningも検査。
- `node /tmp/qtw-scroll-audit.mjs before`: red。回帰test `tests/content-overflow.spec.ts` も390でredを確認後、修正して390/1440の2test green。
- local-after: 全50ケースscrollbars0/document overflow0/errors0、全native embed running。`/tmp/qtw-scroll-after-local.json`。
- raw寸法超過も別途記録する。ただしMathJaxの画面外assistive MathML、circleの余白内ketラベル、desktopの予約済み右欄sidenoteは内側scrollではない。accessibilityを削除・clipして判定を偽装しない。
- MathJax/分割不可能な矢印図には `fit-content` を使い、自然幅が収まらない場合のみCSS zoomで縮小。ResizeObserverでtypeset/font/viewport変更に追従し、高さは内容に合わせる。native canvasには適用しない。
- 6/8circle列は390で4列gridに折り返す。順番・amplitude・tooltip・ketは不変。
- 演算ペア図はbinary ketのfont-sizeを390で12pxにし、grid cellのmin-content幅超過を防ぐ。図のminimum widthも撤廃。scrollbarを隠すだけのoverflow:hiddenは追加していない。

## 修正箇所と画像

各行の画像stemは `/tmp/qtw-scroll-` の後に続く。before画像は `before-<stem>.png`、local-afterは `after-local-<stem>.png`、公開afterは `after-<stem>.png`。例えば `/tmp/qtw-scroll-before-qni_intro-390-scroll-audit-0.png` / `/tmp/qtw-scroll-after-qni_intro-390-scroll-audit-0.png`。

| page | element / 原因 | fix | screenshot stem |
|---|---|---|---|
| what_qpu_do_faster | 8成分ベクトル3本のp.overflow-auto、MathJax descenderが高さを21px超過 | 自然高さ＋下余白 | what_qpu_do_faster-390-scroll-audit-0 / what_qpu_do_faster-1440-scroll-audit-0 |
| qni_intro | state-vector-example、8circle固定横列468px | 4列wrap | qni_intro-390-scroll-audit-0 |
| qubit | 振幅二乗和のp.overflow-x-auto、split数式419px | 数式fit | qubit-390-scroll-audit-0 |
| cpu_vs_qpu_operations | 命令→逆演算図、固定幅508px | 連続矢印図fit | cpu_vs_qpu_operations-390-scroll-audit-0 |
| x_gate | Xを2回適用する図、固定幅385px | 図fit、desktop中央配置維持 | x_gate-390-scroll-audit-0 |
| h_gate | Hを2回適用するqc-figure-scroll、固定幅400px | 図fit | h_gate-390-scroll-audit-0 |
| phase_gate | PHASEと逆PHASEの図、固定幅512px | 図fit | phase_gate-390-scroll-audit-0 |
| bb84_protocol | 送信状態4パターン図、caption＋状態列437px | 関係図全体fit | bb84_protocol-390-scroll-audit-0 |
| multi_qubit_circle_notation | 3bitの8circle列468px | 4列wrap | multi_qubit_circle_notation-390-scroll-audit-0 |
| multi_qubit_superposition | 1bit目Hの8circle列 | 4列wrap | multi_qubit_superposition-390-scroll-audit-0 |
| multi_qubit_superposition | 2bit目Hの8circle列 | 4列wrap | multi_qubit_superposition-390-scroll-audit-1 |
| multi_qubit_superposition | 3bit目Hの8circle列 | 4列wrap | multi_qubit_superposition-390-scroll-audit-2 |
| multi_qubit_operation | 1bit目Xのbefore/after列468px | 両状態列4列wrap、親column縮小可 | multi_qubit_operation-390-scroll-audit-0 |
| multi_qubit_operation | 2bit目Xのbefore/after列468px | 同上 | multi_qubit_operation-390-scroll-audit-1 |
| multi_qubit_operation | 3bit目Xのbefore/after列468px | 同上 | multi_qubit_operation-390-scroll-audit-2 |
| operator_pair | binary ket対応図、labelがcell幅を6px超過 | 狭幅binary font/min-width修正 | operator_pair-390-scroll-audit-0 |
| operator_pair | 1bit目演算ペア図、同原因 | 同上 | operator_pair-390-scroll-audit-1 |
| operator_pair | 2bit目演算ペア図、同原因 | 同上 | operator_pair-390-scroll-audit-2 |
| operator_pair | 3bit目演算ペア図、同原因 | 同上 | operator_pair-390-scroll-audit-3 |
| random_byte_generator | 1bit目Hのbefore/after列468px | 両状態列4列wrap、親column縮小可 | random_byte_generator-390-scroll-audit-0 |
| random_byte_generator | 2bit目Hのbefore/after列468px | 同上 | random_byte_generator-390-scroll-audit-1 |
| random_byte_generator | 3bit目Hのbefore/after列468px | 同上 | random_byte_generator-390-scroll-audit-2 |

主要before `/tmp/qtw-noscroll-before.png`、after `/tmp/qtw-noscroll-after.png`。全ページfull-page screenshotsは `/tmp/qtw-scroll-{before,after}-<slug>-{390,1440}.png` (indexはindex)。本文内scrollと、interactive native editor内のstate-grid pan/zoomは別の機構である。nativeはその機能・表示を削除しない。

PR #54対象の390px screenshotは `/tmp/qtw-pr54-{before,after}-<slug>-<embed index>-390.png`。対象はphase(1)、index(1)、qubit(1)、qni_intro(2)、x_gate(2)の計7embed。公開commit `5ee202e90ed7c064f52727c15c107612d11a1553`、Pages **38039509444 success**。公開afterも全50ケースinner scroll0/document overflow0/errors0。7embedのpalette/gate/panelを目視しclipなし、全7件GPU norm1/one-hot初期状態。全144test green、typecheck/build成功。公開JSON `/tmp/qtw-scroll-after.json` / `/tmp/qtw-pr54-after.json`、native比較contact `/tmp/qtw-pr54-before-after-contact.png`。checkpointはdocs/porting.md。
