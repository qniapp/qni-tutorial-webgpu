// Authored prose gets bold glyphs, never diagrams, palettes or native embeds.
export const isInlineProse = (element: Element) =>
  element.closest('p, li, .sidenote, .marginnote') !== null &&
  element.closest('figure, quantum-circuit, circuit-step, circuit-dropzone, palette-dropzone, .qc-operation, [data-original-image]') === null
