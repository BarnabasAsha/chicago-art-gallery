import { Color, Fog, Scene } from 'three'

const GALLERY_BACKGROUND = 0xd8d3c8

export function createScene(): Scene {
  const scene = new Scene()
  scene.background = new Color(GALLERY_BACKGROUND)
  scene.fog = new Fog(GALLERY_BACKGROUND, 30, 52)

  return scene
}
