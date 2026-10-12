/** Startup estimate in canvas CSS pixels. The ready runner owns exact geometry. */
export function estimateEmbedHeight(circuit: string, palette: string | null, maxWireCount: number | undefined, showStatePanel: boolean, width: number): number {
  let wires = 1
  let blocks = false
  try {
    const cols = JSON.parse(circuit).cols as unknown[][]
    for (const col of cols) for (let row = 0; row < col.length; row++) {
      const token = col[row]
      if (typeof token === 'string' && (token.startsWith('{') || token.startsWith('['))) blocks = true
      // Quirk multi-wire tokens include their span in the suffix.
      const span = typeof token === 'string' ? Number(token.match(/(?:QFT†?|Amps|Probability|Density)(\d+)$/)?.[1] ?? 1) : 1
      if (token !== 1 && token !== null) wires = Math.max(wires, row + span)
    }
  } catch { /* Invalid input is reported by the runner, not layout. */ }
  wires = Math.max(wires, Math.min(2, maxWireCount ?? 2))
  if (wires < Math.min(16, maxWireCount ?? 16)) wires++
  let shift = 0
  try {
    if (palette !== null) {
      const parsed: unknown = JSON.parse(palette)
      if (!Array.isArray(parsed)) throw new TypeError('Invalid palette')
      const count = parsed.length
      const fit = Math.max(1, Math.floor((width - 16 - 64 + 8) / 48))
      const rows = Math.ceil(count / fit)
      shift = 128 - (rows ? rows * 40 + (rows - 1) * 8 + 40 : 0)
    }
  } catch { /* Keep the full-palette estimate. */ }
  const outset = blocks ? 58 : 0
  const lastLine = 8 - shift + outset + 256 + 56 * (wires - 1)
  const bottom = lastLine + 28 + outset
  return Math.ceil(Math.max(lastLine + 40 + 16 + outset,
    bottom + (showStatePanel ? 16 + 32 + 160 + 64 : 16)) + 8)
}
