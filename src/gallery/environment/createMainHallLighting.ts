import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SpotLight,
  type Material,
} from 'three'
import {
  MAIN_HALL_BACK_Z,
  MAIN_HALL_FRONT_Z,
  MAIN_HALL_WIDTH,
  WALL_HEIGHT,
} from './galleryLayout'

interface MainHallLightingOptions {
  fixtureMaterial: Material
  housingMaterial: Material
}

const TRACK_OFFSETS = [-4.15, 4.15]
const SPOTLIGHTS_PER_TRACK = 3
const TRACK_LENGTH_RATIO = 0.5

export function createMainHallLighting({
  fixtureMaterial,
  housingMaterial,
}: MainHallLightingOptions): Group {
  const lighting = new Group()
  lighting.name = 'main-hall-track-lighting'

  const hallLength = MAIN_HALL_FRONT_Z - MAIN_HALL_BACK_Z
  const trackLength = hallLength * TRACK_LENGTH_RATIO
  const trackCenterZ = (MAIN_HALL_BACK_Z + MAIN_HALL_FRONT_Z) / 2
  const railGeometry = new BoxGeometry(0.026, 0.032, trackLength)
  const connectorGeometry = new CylinderGeometry(0.013, 0.013, 0.05, 12)
  const headGeometry = new CylinderGeometry(0.052, 0.064, 0.14, 18)
  const lensGeometry = new CylinderGeometry(0.043, 0.043, 0.008, 18)

  for (const x of TRACK_OFFSETS) {
    const rail = new Mesh(railGeometry, housingMaterial)
    rail.name = 'main-hall-lighting-track'
    rail.position.set(x, WALL_HEIGHT - 0.055, trackCenterZ)
    lighting.add(rail)

    const wallDirection = Math.sign(x)

    for (let index = 0; index < SPOTLIGHTS_PER_TRACK; index += 1) {
      const z =
        trackCenterZ -
        trackLength / 2 +
        (trackLength * (index + 1)) / (SPOTLIGHTS_PER_TRACK + 1)

      const fixture = new Group()
      fixture.name = 'main-hall-adjustable-spotlight'
      fixture.position.set(x, WALL_HEIGHT - 0.07, z)

      const connector = new Mesh(connectorGeometry, housingMaterial)
      connector.name = 'spotlight-connector'
      connector.position.y = -0.025

      const head = new Group()
      head.name = 'spotlight-head'
      head.position.y = -0.105
      head.rotation.z = -wallDirection * 0.16

      const casing = new Mesh(headGeometry, housingMaterial)
      casing.name = 'spotlight-casing'

      const lens = new Mesh(lensGeometry, fixtureMaterial)
      lens.name = 'spotlight-lens'
      lens.position.y = -0.074

      head.add(casing, lens)
      fixture.add(connector, head)

      const light = new SpotLight(0xffedcf, 18, 8, 0.48, 0.72, 1.6)
      light.name = 'main-hall-artwork-spotlight'
      light.position.set(x, WALL_HEIGHT - 0.21, z)
      light.target.position.set(
        wallDirection * (MAIN_HALL_WIDTH / 2 - 0.2),
        1.9,
        z,
      )

      lighting.add(fixture, light, light.target)
    }
  }

  return lighting
}
