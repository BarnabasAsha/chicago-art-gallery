import { PerspectiveCamera } from 'three'

const FIELD_OF_VIEW = 55
const NEAR_CLIPPING_PLANE = 0.1
const FAR_CLIPPING_PLANE = 100

export function createCamera(aspectRatio: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    FIELD_OF_VIEW,
    aspectRatio,
    NEAR_CLIPPING_PLANE,
    FAR_CLIPPING_PLANE,
  )

  camera.position.set(0, 1.65, 5)
  camera.lookAt(0, 1.5, -2)

  return camera
}
