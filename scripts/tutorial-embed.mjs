import { readFileSync } from 'node:fs'
import { PinnedEmbed } from './fetch-qni-embed.mjs'

/** Build-time page policy. A release has one directory and one module identity. */
export class TutorialEmbed {
  static pages = [
    'h_gate', '', 'qni_intro', 'measurement_operation', 'multi_qubit_superposition',
    'random_byte_generator', 'cnot_gate', 'swap_gate', 'entanglement',
    'entanglement_operation', 'teleportation_circuit', 'cascading_teleportation',
    'long_distance_entanglement', 'increment_circuit', 'quantum_logic',
    'quantum_phase_estimation_circuit', 'shor_qft', 'bb84_circuit',
    'superdense_coding_circuit', 'amplitude_probability', 'basis_inner_product',
    'global_relative_phase', 'matrix_adjoint', 'tensor_product_state',
    'entangled_state', 'unitary_observable', 'multi-3', 'multi-7', 'inside_the_qft',
  ]

  static enabled(page, env = process.env) {
    const key = `QNI_${(page || 'index').replaceAll('-', '_').toUpperCase()}_PREBUILT`
    // Retain QNI_H_GATE_PREBUILT; every other page has the same override shape.
    const value = env[key]?.trim() || env.QNI_EMBED_PREBUILT?.trim()
    return !['0', 'false', 'off'].includes(value?.toLowerCase())
  }

  static async directories(env = process.env, preview = process.argv.includes('preview')) {
    const pages = preview ? [] : this.pages.filter(page => this.enabled(page, env))
    if (!pages.length) return {}
    await PinnedEmbed.fetch()
    const sha = readFileSync('qni-embed.ref', 'utf8').trim()
    return Object.fromEntries(pages.map(page => [page, `qni-webgpu-prebuilt/embed-${sha}/`]))
  }
}
