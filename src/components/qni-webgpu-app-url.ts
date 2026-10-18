// Official standalone destination, independent of the tutorial's asset base.
export const QNI_APP_BASE_URL = 'https://qniapp.github.io/qni-webgpu/'

/** Preserve the complete serialized circuit, including any additional keys. */
export function buildQniAppUrl(circuitJson: string): string {
  return `${QNI_APP_BASE_URL}#${encodeURIComponent(circuitJson)}`
}
