import {expect} from '@playwright/test'
// #4 (7aab860) で承認された SAT オラクルの短縮を、承認済み修正後の回路 (*-fixed.json) に
// 適用する変換として表す。想定外の形の回路は例外にする。
//
// negateSandwichedControls: 区間 ({ラベル 〜 }) ごとに
//   1. 制御ビットを X で挟んだ • を ◦ (負制御) に置き換え、その制御ビット上の X を取り除く
//   2. 節の否定 (制御 X ゲートに隣接するターゲット上の X) を単独の列に分け、その制御 X ゲートの反対側へ移す
//      (ターゲット上の X とそのターゲットへの制御 X は可換)
//   3. ゲートが残らなくなった X だけの列を除く
// inlineAncillaNegativeControls:
//   4. 一時ビット w が [X w] と [制御 → w] で w = ¬(制御の積) として計算済みの間、◦w をその制御の積で置き換える
//      (¬w = 制御の積)。t2・t7 が t1 を使わず A4・B4 を直接見るようになる書き換え
type Col = (string | number)[]

const isLabel = (col: Col) => typeof col[0] === 'string' && /^[{}[\]]/.test(col[0])
const isControlled = (col: Col) => col.includes('•') || col.includes('◦')
const targetOf = (col: Col) => {
  const xs = col.flatMap((g, w) => (g === 'X' ? [w] : []))
  if (xs.length !== 1) throw new Error(`controlled column must have exactly one target: ${JSON.stringify(col)}`)
  return xs[0]
}
const targets = (col: Col | undefined, w: number) => !!col && isControlled(col) && col.includes('X') && targetOf(col) === w
const targetX = (w: number): Col => [...Array(w).fill(1), 'X']
const isOracleSegment = (cols: Col[]) =>
  cols.every(col => col.every(g => g === 1 || g === 'X' || g === '•')) && cols.some(col => col.includes('•') && col.includes('X'))

export type NegationStats = {negatedControls: number; removedControlXs: number; movedTargetXs: number; removedCols: number}

function negateSegment(cols: Col[], stats: NegationStats): Col[] {
  const flipped = new Set<number>(), out: Col[] = []
  let pending: number | undefined
  cols.forEach((col, i) => {
    if (col.includes('•')) {
      targetOf(col)
      out.push(col.map((g, w) => (g === '•' && flipped.has(w) ? (stats.negatedControls++, '◦') : g)))
      if (pending !== undefined) (out.push(targetX(pending)), pending = undefined, stats.movedTargetXs++)
      return
    }
    col.forEach((g, w) => {
      if (g !== 'X') return
      const prev = targets(cols[i - 1], w), next = targets(cols[i + 1], w)
      if (prev && next) throw new Error(`X on wire ${w} at column ${i} is between two gates targeting it`)
      // 直前のゲートのターゲット上の X はその前へ、直後のゲートのターゲット上の X はその後ろへ移す
      if (prev) (out.splice(out.length - 1, 0, targetX(w)), stats.movedTargetXs++)
      else if (next) pending = w
      else if (cols.some(c => c.includes('•') && c[w] === '•')) (flipped.has(w) ? flipped.delete(w) : flipped.add(w), stats.removedControlXs++)
      else throw new Error(`X on wire ${w} at column ${i} is neither a control nor a target`)
    })
  })
  if (flipped.size) throw new Error(`X on control wires ${[...flipped]} is not undone within the segment`)
  return out
}

export function negateSandwichedControls(cols: Col[]) {
  const stats: NegationStats = {negatedControls: 0, removedControlXs: 0, movedTargetXs: 0, removedCols: 0}
  const out: Col[] = []
  for (let i = 0; i < cols.length; i++) {
    const end = typeof cols[i][0] === 'string' && /^[{[]/.test(cols[i][0] as string) ? cols.findIndex((col, j) => j > i && isLabel(col)) : -1
    if (end < 0 || !isOracleSegment(cols.slice(i + 1, end))) { out.push(cols[i]); continue }
    const body = negateSegment(cols.slice(i + 1, end), stats)
    stats.removedCols += end - i - 1 - body.length
    out.push(cols[i], ...body, cols[end])
    i = end
  }
  return {cols: out, ...stats}
}

export function inlineAncillaNegativeControls(cols: Col[]) {
  const defs = new Map<number, Map<number, string>>(), out: Col[] = []
  let inlinedControls = 0
  cols.forEach((col, i) => {
    if (!isControlled(col)) {
      col.forEach((g, w) => {
        if (g !== 'X') return
        const own = targets(cols[i - 1], w) || targets(cols[i + 1], w)
        if (!own && [...defs].some(([a, c]) => a === w || c.has(w))) throw new Error(`X on wire ${w} at column ${i} changes a defined ancilla`)
      })
      return out.push(col)
    }
    if (!col.includes('X')) {
      // pAND のような位相の列は変えない
      if (col.some((g, w) => g === '◦' && defs.has(w))) throw new Error(`phase column ${i} has a negative control on a defined ancilla`)
      return out.push(col)
    }
    const target = targetOf(col), controls = new Map<number, string>()
    col.forEach((g, w) => {
      if (g !== '•' && g !== '◦') return
      const expanded = g === '◦' && defs.get(w)
      if (expanded) inlinedControls++
      for (const [v, h] of expanded || [[w, g] as const]) {
        if (controls.has(v) && controls.get(v) !== h) throw new Error(`conflicting controls on wire ${v} at column ${i}`)
        controls.set(v, h)
      }
    })
    if ([...defs].some(([a, c]) => a !== target && c.has(target))) throw new Error(`column ${i} changes a wire used by a defined ancilla`)
    const next: Col = [...Array(target).fill(1), 'X']
    for (const [v, h] of controls) { while (next.length <= v) next.push(1); next[v] = h }
    const isNot = (c: Col | undefined) => JSON.stringify(c) === JSON.stringify(targetX(target))
    if (defs.has(target)) {
      // アンコンピュート: 計算したときと同じ制御で、直後に X が続くこと
      if (JSON.stringify([...controls].sort()) !== JSON.stringify([...defs.get(target)!].sort()) || !isNot(cols[i + 1])) throw new Error(`column ${i} does not uncompute ancilla ${target}`)
      defs.delete(target)
    } else if (isNot(cols[i - 1])) defs.set(target, controls)
    out.push(next)
  })
  return {cols: out, inlinedControls}
}

// 古典的な基底状態への作用 (行き先 + 1 に符号を付けたもの) を、与えた基底状態ごとに計算する。
// X・•・◦ とラベル列だけを扱う。
export function classicalAction(cols: Col[], inputs: number[]): number[] {
  return inputs.map(s => {
    let state = s, sign = 1
    for (const col of cols) {
      if (isLabel(col)) continue
      if (col.some(g => g !== 1 && g !== 'X' && g !== '•' && g !== '◦')) throw new Error(`unsupported column ${JSON.stringify(col)}`)
      if (!col.every((g, w) => (g === '•' ? state >> w & 1 : g === '◦' ? ~state >> w & 1 : 1))) continue
      const xs = col.flatMap((g, w) => (g === 'X' ? [w] : []))
      if (xs.length) for (const w of xs) state ^= 1 << w
      else sign = -sign
    }
    return sign * (state + 1)
  })
}

// SAT オラクル (sat の回路 125 列) に #4 の変換を適用し、各段が意図どおりであることを確かめて結果を返す
export function applyPr4ToSatCircuit(fixedCols: Col[]): Col[] {
  expect(fixedCols).toHaveLength(125)
  const negated = negateSandwichedControls(fixedCols)
  expect({...negated, cols: negated.cols.length}).toEqual({cols: 83, negatedControls: 26, removedControlXs: 116, movedTargetXs: 18, removedCols: 42})
  // 制御 X ゲートは順序も含めてそのままで、変わったのは • → ◦ だけ
  const dotted = (cols: Col[]) => cols.filter(isControlled).map(col => col.map(g => (g === '◦' ? '•' : g)))
  expect(dotted(negated.cols)).toEqual(dotted(fixedCols))
  // 残った X だけの列は、節の否定 (ターゲット上の X 1 つ) だけ
  for (const col of negated.cols.filter(col => !isLabel(col) && !isControlled(col) && col.includes('X'))) expect(col).toEqual(targetX(col.indexOf('X')))
  // ラベル・初期化・pAND など、オラクルの X 以外の列はそのまま
  expect(negated.cols.filter(col => !col.includes('X'))).toEqual(fixedCols.filter(col => !col.includes('X')))
  const inlined = inlineAncillaNegativeControls(negated.cols)
  expect(inlined.inlinedControls).toBe(4)
  // 変わるのは t2・t7 とそのアンコンピュートの 4 列で、◦t1 (4 番目のビット) が ◦A4 ◦B4 になるだけ
  const changed = negated.cols.flatMap((col, i) => (JSON.stringify(col) === JSON.stringify(inlined.cols[i]) ? [] : [[i, col, inlined.cols[i]]]))
  expect(changed).toEqual([
    [16, ['◦', 1, 1, 1, '◦', 'X'], ['◦', '◦', 1, '◦', 1, 'X']],
    [41, [1, 1, '◦', 1, '◦', 1, 1, 1, 1, 1, 'X'], [1, '◦', '◦', '◦', 1, 1, 1, 1, 1, 1, 'X']],
    [68, [1, 1, '◦', 1, '◦', 1, 1, 1, 1, 1, 'X'], [1, '◦', '◦', '◦', 1, 1, 1, 1, 1, 1, 'X']],
    [78, ['◦', 1, 1, 1, '◦', 'X'], ['◦', '◦', 1, '◦', 1, 'X']],
  ])
  // 意味の確認: 1〜3 段は全基底状態で、4 段は一時ビットが |0> の入力で、短縮前と同じ作用 (置換と符号)
  const start = (cols: Col[]) => cols.findIndex(col => col[0] === '{t1 = B4 ∨ A4')
  expect(fixedCols.slice(0, start(fixedCols))).toEqual(inlined.cols.slice(0, start(inlined.cols)))
  const all = [...Array(1 << 14).keys()], inputs = [...Array(16).keys()]
  const action = (cols: Col[], states: number[]) => classicalAction(cols.slice(start(cols)), states)
  expect(action(negated.cols, all)).toEqual(action(fixedCols, all))
  expect(action(inlined.cols, inputs)).toEqual(action(fixedCols, inputs))
  expect(action(inlined.cols, inputs).map(v => Math.abs(v) - 1)).toEqual(inputs)
  return inlined.cols
}
