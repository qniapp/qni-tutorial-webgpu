import { InnerProductMath as C, type ComplexValue } from './basis-inner-product-math'

export type StateVector = [ComplexValue, ComplexValue]
export type Matrix2 = [StateVector, StateVector]
export type GateName = 'X' | 'Z' | 'H' | 'S' | 'S†' | 'Ry' | 'SRy'

/** Matrices act on column vectors; angles passed to gate() are radians. */
export class MatrixMath {
  static gate(name: GateName, theta = Math.PI / 3): Matrix2 {
    const c = Math.cos(theta / 2), s = Math.sin(theta / 2), h = Math.SQRT1_2
    switch (name) {
      case 'X': return [[[0, 0], [1, 0]], [[1, 0], [0, 0]]]
      case 'Z': return [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]]
      case 'H': return [[[h, 0], [h, 0]], [[h, 0], [-h, 0]]]
      case 'S': return [[[1, 0], [0, 0]], [[0, 0], [0, 1]]]
      case 'S†': return [[[1, 0], [0, 0]], [[0, 0], [0, -1]]]
      case 'Ry': return [[[c, 0], [-s, 0]], [[s, 0], [c, 0]]]
      case 'SRy': return this.multiply(this.gate('S'), this.gate('Ry', Math.PI / 3))
    }
  }

  static products(matrix: Matrix2, state: StateVector, row: 0 | 1): StateVector {
    return [C.mul(matrix[row][0], state[0]), C.mul(matrix[row][1], state[1])]
  }

  static apply(matrix: Matrix2, state: StateVector): StateVector {
    const a = this.products(matrix, state, 0), b = this.products(matrix, state, 1)
    return [C.add(a[0], a[1]), C.add(b[0], b[1])]
  }

  static transpose(m: Matrix2): Matrix2 {
    return [[m[0][0], m[1][0]], [m[0][1], m[1][1]]]
  }

  static conjugate(m: Matrix2): Matrix2 {
    return [[C.conj(m[0][0]), C.conj(m[0][1])], [C.conj(m[1][0]), C.conj(m[1][1])]]
  }

  static adjoint(m: Matrix2): Matrix2 { return this.conjugate(this.transpose(m)) }

  static multiply(a: Matrix2, b: Matrix2): Matrix2 {
    const columns = this.transpose(b)
    const first = this.apply(a, columns[0]), second = this.apply(a, columns[1])
    return [[first[0], second[0]], [first[1], second[1]]]
  }
}

/** Update a pair of amplitude discs. Positive phase points counterclockwise. */
export function paintState(svg: SVGSVGElement, state: StateVector, label: string): void {
  svg.setAttribute('aria-label', `${label}：α ≈ ${C.format(state[0])}、β ≈ ${C.format(state[1])}。半径は振幅の大きさ、針は右向きから反時計回りの位相です。`)
  state.forEach((z, i) => {
    const group = svg.querySelectorAll('g')[i]
    group.querySelector('[data-disc]')!.setAttribute('r', String(42 * Math.sqrt(C.abs2(z))))
    const needle = group.querySelector('line')!
    needle.setAttribute('x2', String(42 * z[0]))
    needle.setAttribute('y2', String(-42 * z[1]))
  })
}
