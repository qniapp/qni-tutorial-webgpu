// Chapters and page order of the original sidebar:
// qniapp/qni acf87bfa9b377ca37ff2f9f733a9011cbf34be1d apps/tutorial/_data/navigation.yml.
// `title` keeps the original text (including MathJax TeX); `label` is a plain
// rendering for the sidebar, which does not load MathJax on every page.
// `slug` is the original link without "./" and ".html" ("" is the site root).

export interface TocPage {
  title: string
  slug: string
  label?: string
  /** Original "new" badge flag; kept for parity but not rendered. */
  new?: boolean
}

export interface TocChapter {
  title: string
  pages: TocPage[]
}

const pageFiles = Object.keys(import.meta.glob('../pages/*.astro'))

export function isPorted(slug: string): boolean {
  return pageFiles.includes(`../pages/${slug === '' ? 'index' : slug}.astro`)
}

export const toc: TocChapter[] = [
  {
    title: 'イントロダクション',
    pages: [
      { title: 'はじめに', slug: '' },
      { title: 'QPU とは', slug: 'qpu' },
      { title: 'QPU は何が得意?', slug: 'what_qpu_do_faster' },
      { title: '量子回路', slug: 'quantum_circuit' },
      { title: 'Qni 入門', slug: 'qni_intro' },
    ],
  },
  {
    title: '量子ビット',
    pages: [
      { title: '確率的ビット', slug: 'p_bit' },
      { title: '重ね合わせ状態', slug: 'superposition' },
      { title: '量子ビット', slug: 'qubit' },
      { title: '位相', slug: 'phase' },
      { title: '状態ベクトル表示', slug: 'circle_notation' },
    ],
  },
  {
    title: 'QPU 命令その 1',
    pages: [
      { title: 'CPU 命令との違い', slug: 'cpu_vs_qpu_operations' },
      { title: 'X ゲート (量子 NOT)', slug: 'x_gate' },
      { title: 'H ゲート', slug: 'h_gate' },
      { title: 'PHASE ゲート', slug: 'phase_gate' },
      { title: 'WRITE 命令', slug: 'write_operation' },
      { title: 'MEASUREMENT 命令', slug: 'measurement_operation' },
      { title: 'CLONE 命令!?', slug: 'no_cloning_theorem' },
      { title: '組合わせゲート', slug: 'gate_combination' },
    ],
  },
  {
    title: '量子暗号通信',
    pages: [
      { title: '量子鍵配送', slug: 'quantum_key_distribution' },
      { title: 'BB84 プロトコル', slug: 'bb84_protocol' },
      { title: 'BB84 回路', slug: 'bb84_circuit' },
    ],
  },
  {
    title: '複数量子ビット',
    pages: [
      { title: '状態ベクトル表示', slug: 'multi_qubit_circle_notation' },
      { title: '重ね合わせ状態', slug: 'multi_qubit_superposition' },
      { title: '複数量子ビットでの演算', slug: 'multi_qubit_operation' },
      { title: '演算ペア', slug: 'operator_pair' },
      { title: 'ランダムバイトジェネレータ', slug: 'random_byte_generator' },
      { title: 'PHASE ゲート', slug: 'multi_qubit_phase_gate' },
      { title: '1 ビット測定', slug: 'partial_measurement' },
    ],
  },
  {
    title: 'QPU 命令その 2',
    pages: [
      { title: 'SWAP ゲート', slug: 'swap_gate' },
      { title: 'CNOT ゲート', slug: 'cnot_gate' },
      { title: 'SWAP パズル', slug: 'swap_from_cnots' },
      { title: 'CPHASE ゲート', slug: 'cphase' },
      { title: '量子もつれ', slug: 'entanglement' },
    ],
  },
  {
    title: '超密度符号化',
    pages: [
      { title: 'もつれをほどく', slug: 'disentangle' },
      { title: 'もつれを操作する', slug: 'entanglement_operation' },
      { title: 'ベル状態の判別', slug: 'discriminating_bell_states' },
      { title: '超密度符号化回路', slug: 'superdense_coding_circuit' },
    ],
  },
  {
    title: '量子テレポーテーション',
    pages: [
      { title: 'テレポーテーション回路', slug: 'teleportation_circuit' },
      { title: '多段テレポーテーション', slug: 'cascading_teleportation' },
      { title: '長距離間の量子もつれ', slug: 'long_distance_entanglement' },
    ],
  },
  {
    title: '算術演算',
    pages: [
      { title: 'インクリメント回路', slug: 'increment_circuit' },
      { title: 'デクリメント回路', slug: 'decrement_circuit' },
      { title: '足し算回路', slug: 'addition_circuit' },
      { title: '引き算回路', slug: 'subtraction_circuit' },
      { title: 'かけ算回路', slug: 'multiplication_circuit' },
    ],
  },
  {
    title: '論理演算',
    pages: [
      { title: '量子論理ゲート', slug: 'quantum_logic' },
      { title: '重ね合わせ上での論理演算', slug: 'superposition_quantum_logic' },
      { title: '位相論理演算', slug: 'phase_logic' },
      { title: '位相論理演算の組合わせ', slug: 'phase_logic_combination' },
      { title: '充足可能性問題', slug: 'sat' },
    ],
  },
  {
    title: 'グローヴァー探索',
    pages: [
      { title: '折り返し変換', slug: 'grover_iam' },
      { title: 'グロヴァー反復', slug: 'grover_iteration' },
      { title: '複数の振幅を増幅', slug: 'multiple_marked_values' },
      { title: '折り返しの仕組み', slug: 'grover_iam_indetail' },
    ],
  },
  {
    title: '量子フーリエ変換 (QFT)',
    pages: [
      { title: 'パターンの読み出し', slug: 'readout_of_patterns' },
      { title: '逆 QFT', slug: 'inverse_qft' },
      { title: 'QFT の内部', slug: 'inside_the_qft' },
      { title: 'QFT 足し算', slug: 'qft_adder' },
    ],
  },
  {
    title: '量子位相推定',
    pages: [
      { title: '固有位相', slug: 'eigenphases' },
      { title: '量子位相推定回路', slug: 'quantum_phase_estimation_circuit' },
      { title: '位相キックバック', slug: 'phase_kickback' },
      { title: '量子位相推定の出力', slug: 'qpe_output' },
    ],
  },
  {
    title: 'ショアの因数分解',
    pages: [
      { title: '別問題に帰着する', slug: 'shor_hsp', new: true },
      { title: '\\(a^xmod(N)\\) の計算', slug: 'shor_fx', label: 'aˣ mod(N) の計算', new: true },
      { title: '周期 \\(r\\) を求める', slug: 'shor_r', label: '周期 r を求める', new: true },
      { title: '\\(a^xmod(N)\\) の実装', slug: 'shor_u', label: 'aˣ mod(N) の実装', new: true },
      { title: '周期パターンの読み出し', slug: 'shor_qft', new: true },
    ],
  },
  {
    title: 'ふろく',
    pages: [
      { title: 'クローン禁止定理の証明', slug: 'no_cloning_theorem_proof' },
    ],
  },
]
