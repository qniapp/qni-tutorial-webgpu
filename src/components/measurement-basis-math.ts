export type ComplexAmplitude = { re: number; im: number }
export type MeasurementState = readonly [ComplexAmplitude, ComplexAmplitude]
export type MeasurementQuestion = 'Z' | 'X' | 'Y'

export class MeasurementBasisMath {
  static readonly questions: readonly MeasurementQuestion[] = ['Z', 'X', 'Y']

  /** Angles are in degrees; the global phase is fixed by a real first amplitude. */
  static state(theta: number, phi: number): MeasurementState {
    const half = theta * Math.PI / 360
    const phase = phi * Math.PI / 180
    return [{ re: Math.cos(half), im: 0 },
      { re: Math.sin(half) * Math.cos(phase), im: Math.sin(half) * Math.sin(phase) }]
  }

  static hadamard([a, b]: MeasurementState): MeasurementState {
    return [{ re: (a.re + b.re) / Math.SQRT2, im: (a.im + b.im) / Math.SQRT2 },
      { re: (a.re - b.re) / Math.SQRT2, im: (a.im - b.im) / Math.SQRT2 }]
  }

  static sAdjoint([a, b]: MeasurementState): MeasurementState {
    return [{ ...a }, { re: b.im, im: -b.re }]
  }

  static absSquared(a: ComplexAmplitude): number { return a.re * a.re + a.im * a.im }

  static bloch([a, b]: MeasurementState) {
    return { X: 2 * (a.re * b.re + a.im * b.im),
      Y: 2 * (a.re * b.im - a.im * b.re), Z: this.absSquared(a) - this.absSquared(b) }
  }

  static recipe(question: MeasurementQuestion): readonly ('H' | 'S†')[] {
    return question === 'Z' ? [] : question === 'X' ? ['H'] : ['S†', 'H']
  }

  static premeasurement(state: MeasurementState, question: MeasurementQuestion, step = this.recipe(question).length): MeasurementState {
    return this.recipe(question).slice(0, step).reduce<MeasurementState>(
      (current, gate) => gate === 'H' ? this.hadamard(current) : this.sAdjoint(current), state)
  }

  static probabilities(state: MeasurementState): readonly [number, number] {
    return state.map(a => Math.max(0, Math.min(1, this.absSquared(a)))) as [number, number]
  }

  static format(n: number): string { return (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3) }
  static percent(n: number): string { return `${(100 * n).toFixed(1)}%` }
  static amplitude(a: ComplexAmplitude): string {
    return `${this.format(a.re)} ${a.im < -0.0005 ? '−' : '+'} ${this.format(Math.abs(a.im))}i`
  }
}
