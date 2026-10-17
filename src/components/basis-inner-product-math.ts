export type ComplexValue = [real: number, imaginary: number]

/** Complex arithmetic for the normalized two-component states in the figure. */
export class InnerProductMath {
  static conj([re, im]: ComplexValue): ComplexValue { return [re, -im] }

  static mul([ar, ai]: ComplexValue, [br, bi]: ComplexValue): ComplexValue {
    return [ar * br - ai * bi, ar * bi + ai * br]
  }

  static add([ar, ai]: ComplexValue, [br, bi]: ComplexValue): ComplexValue {
    return [ar + br, ai + bi]
  }

  static abs2([re, im]: ComplexValue): number { return re * re + im * im }

  static state(angleDegrees: number, phaseDegrees: number): [ComplexValue, ComplexValue] {
    const t = angleDegrees * Math.PI / 360
    const phase = phaseDegrees * Math.PI / 180
    return [[Math.cos(t), 0], [Math.sin(t) * Math.cos(phase), Math.sin(t) * Math.sin(phase)]]
  }

  static format([re, im]: ComplexValue): string {
    const r = Number(re.toFixed(4)), i = Number(im.toFixed(4))
    if (i === 0) return String(r)
    if (r === 0) return `${i}i`
    return `${r} ${i < 0 ? '−' : '+'} ${Math.abs(i)}i`
  }
}
