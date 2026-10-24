import { isPorted } from './toc'

const migration = import.meta.env.PUBLIC_QNI_TUTORIAL_MIGRATION
const base = import.meta.env.BASE_URL
// These additions have no page in the legacy tutorial navigation.
const newOnly = new Set([
  'amplitude_probability', 'global_relative_phase', 'basis_inner_product',
  'matrix_adjoint', 'unitary_observable', 'tensor_product_state', 'entangled_state',
])

export const isAvailable = (slug: string): boolean => migration ? !newOnly.has(slug) : isPorted(slug)
export const href = (slug: string): string => slug === '' ? base : `${base}${slug}${migration ? '.html' : '/'}`
