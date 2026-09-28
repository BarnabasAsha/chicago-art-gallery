import {
  ACESFilmicToneMapping,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'

const MAX_PIXEL_RATIO = 2

export function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  const renderer = new WebGLRenderer({
    antialias: true,
    canvas,
    powerPreference: 'high-performance',
  })

  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))

  return renderer
}
