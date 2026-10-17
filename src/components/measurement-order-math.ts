export type MeasurementBasis = 'Z' | 'X'
export type MeasurementOutcome = 1 | -1

/** Real Ry states; all angles are in degrees. */
export class MeasurementOrder {
  static state(theta: number): [number, number] {
    const half = theta * Math.PI / 360
    return [Math.cos(half), Math.sin(half)]
  }

  static firstProbability(theta: number, basis: MeasurementBasis, outcome: MeasurementOutcome): number {
    const angle = theta * Math.PI / 180
    const expectation = basis === 'Z' ? Math.cos(angle) : Math.sin(angle)
    const p = (1 + outcome * expectation) / 2
    // Exact zeros make impossible branches unambiguous at the slider endpoints.
    return p < 1e-14 ? 0 : p > 1 - 1e-14 ? 1 : p
  }

  static conditionalProbability(firstBasis: MeasurementBasis, first: MeasurementOutcome, secondBasis: MeasurementBasis, second: MeasurementOutcome): number {
    return firstBasis === secondBasis ? Number(first === second) : 0.5
  }

  static jointProbability(theta: number, firstBasis: MeasurementBasis, first: MeasurementOutcome, secondBasis: MeasurementBasis, second: MeasurementOutcome): number {
    return this.firstProbability(theta, firstBasis, first) * this.conditionalProbability(firstBasis, first, secondBasis, second)
  }

  static marginalSecond(theta: number, firstBasis: MeasurementBasis, secondBasis: MeasurementBasis, second: MeasurementOutcome): number {
    return this.jointProbability(theta, firstBasis, 1, secondBasis, second) + this.jointProbability(theta, firstBasis, -1, secondBasis, second)
  }

  static expectation(theta: number, firstBasis: MeasurementBasis, secondBasis: MeasurementBasis): number {
    return this.marginalSecond(theta, firstBasis, secondBasis, 1) - this.marginalSecond(theta, firstBasis, secondBasis, -1)
  }

  static eigenstate(basis: MeasurementBasis, outcome: MeasurementOutcome): [number, number] {
    return basis === 'Z' ? (outcome === 1 ? [1, 0] : [0, 1]) : [Math.SQRT1_2, outcome * Math.SQRT1_2]
  }

  static percent(p: number): string { return `${Number((100 * p).toFixed(1))}%` }

  static tableSummary(theta: number, firstBasis: MeasurementBasis, secondBasis: MeasurementBasis): string {
    const cells = ([1, -1] as const).flatMap(first => ([1, -1] as const).map(second =>
      `(${first === 1 ? '+1' : '−1'}, ${second === 1 ? '+1' : '−1'}) は ${this.percent(this.jointProbability(theta, firstBasis, first, secondBasis, second))}`
    ))
    return `${firstBasis} → ${secondBasis}：${cells.join('、')}。次の ${secondBasis} は +1 が ${this.percent(this.marginalSecond(theta, firstBasis, secondBasis, 1))}、−1 が ${this.percent(this.marginalSecond(theta, firstBasis, secondBasis, -1))}、期待値は ${Number(this.expectation(theta, firstBasis, secondBasis).toFixed(3))} です。`
  }

  static summary(theta: number, firstBasis: MeasurementBasis, secondBasis: MeasurementBasis): string {
    const sign = (s: MeasurementOutcome) => s === 1 ? '+1' : '−1'
    const outcomes = [1, -1] as const
    const branches = outcomes.map(first => {
      const p = this.firstProbability(theta, firstBasis, first)
      const conditional = outcomes.map(second => `${sign(second)} は ${this.percent(this.conditionalProbability(firstBasis, first, secondBasis, second))}`).join('、')
      const joint = outcomes.map(second => `(${sign(first)}, ${sign(second)}) は ${this.percent(this.jointProbability(theta, firstBasis, first, secondBasis, second))}`).join('、')
      return `最初の ${firstBasis} 結果 ${sign(first)} は ${this.percent(p)} です。${p === 0 ? 'この枝は実現しません。以下は仮にこの固有状態を準備した場合です。' : ''}次の ${secondBasis} の条件付き確率は ${conditional} です。同時確率は ${joint} です。`
    }).join(' ')
    return `θ = ${theta}° です。${firstBasis} → ${secondBasis} の順に測定します。${branches} 2 回目の ${secondBasis} の周辺確率は +1 が ${this.percent(this.marginalSecond(theta, firstBasis, secondBasis, 1))}、−1 が ${this.percent(this.marginalSecond(theta, firstBasis, secondBasis, -1))} です。2 回目の期待値は ${Number(this.expectation(theta, firstBasis, secondBasis).toFixed(3))} です。`
  }
}
