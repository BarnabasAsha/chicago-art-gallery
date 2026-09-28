import type { PerspectiveCamera, WebGLRenderer } from 'three'

export function syncRendererSize(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  container: HTMLElement,
): void {
  const width = Math.max(container.clientWidth, 1)
  const height = Math.max(container.clientHeight, 1)
  const pixelRatio = renderer.getPixelRatio()
  const drawingBufferWidth = Math.floor(width * pixelRatio)
  const drawingBufferHeight = Math.floor(height * pixelRatio)
  const canvas = renderer.domElement

  if (
    canvas.width !== drawingBufferWidth ||
    canvas.height !== drawingBufferHeight
  ) {
    renderer.setSize(width, height, false)
  }

  const aspectRatio = width / height

  if (camera.aspect !== aspectRatio) {
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()
  }
}
