import {
  AmbientLight,
  BoxGeometry,
  type BufferGeometry,
  DirectionalLight,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  type Texture,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import type { ArtworkCatalog } from '../../services/createArtworkCatalog'
import type { ArtworkTextureCache } from '../artwork/createArtworkTextureCache'
import { createArtworkRow } from '../artwork/createArtworkRow'
import type { CollisionWorld } from '../interaction/movement'
import {
  getMainHallArtworkCount,
  type MainHallArtworkLayout,
} from './createGalleryArtworkPlan'
import { createGalleryEntrance } from './createGalleryEntrance'
import { createInfiniteHallway } from './createInfiniteHallway'
import { createGalleryPassage } from './createGalleryPassage'
import { createPlankFloorTexture } from './createPlankFloorTexture'
import { createMainHallBench } from './createMainHallBench'
import { createMainHallLighting } from './createMainHallLighting'
import {
  MAIN_HALL_BACK_Z,
  MAIN_HALL_CENTER_Z,
  MAIN_HALL_FRONT_Z,
  MAIN_HALL_PASSAGE_ARTWORK_COUNT,
  MAIN_HALL_WIDTH,
  WALL_DEPTH,
  WALL_HEIGHT,
} from './galleryLayout'

export interface GalleryPrototype {
  collisionWorld: CollisionWorld
  dispose: () => void
  update: (visitorPosition: { x: number; z: number }) => void
}

export async function createGalleryPrototype(
  scene: Scene,
  artworks: Artwork[],
  artworkTextures: Texture[],
  mainHallArtworkLayout: MainHallArtworkLayout,
  artworkCatalog: ArtworkCatalog,
  textureCache: ArtworkTextureCache,
): Promise<GalleryPrototype> {
  const leftWallStart = MAIN_HALL_PASSAGE_ARTWORK_COUNT
  const leftWallEnd = leftWallStart + mainHallArtworkLayout.leftWallCount
  const rightWallStart = leftWallEnd
  const rightWallEnd = rightWallStart + mainHallArtworkLayout.rightWallCount
  const mainHallArtworkCount = getMainHallArtworkCount(mainHallArtworkLayout)

  if (
    artworks.length < mainHallArtworkCount ||
    artworkTextures.length < mainHallArtworkCount
  ) {
    throw new Error(
      `The gallery prototype requires ${mainHallArtworkCount} main hall artworks.`,
    )
  }

  const gallery = new Group()
  gallery.name = 'gallery-prototype'

  const wallMaterial = new MeshStandardMaterial({ color: 0xe8e3d8 })
  const hallwayWallMaterials = [
    wallMaterial,
    new MeshStandardMaterial({ color: 0xaec8c2, roughness: 0.92 }),
    new MeshStandardMaterial({ color: 0xb3c5d0, roughness: 0.92 }),
    new MeshStandardMaterial({ color: 0xd7c79f, roughness: 0.94 }),
  ]
  const ceilingMaterial = new MeshStandardMaterial({
    color: 0xded9cf,
    roughness: 0.95,
  })
  const floorTexture = createPlankFloorTexture()
  const floorMaterial = new MeshStandardMaterial({
    color: 0xffffff,
    map: floorTexture,
    metalness: 0.02,
    roughness: 0.78,
  })
  const frameMaterial = new MeshStandardMaterial({ color: 0x2a2018 })
  const artworkMaterials = artworkTextures.map(
    (texture) =>
      new MeshStandardMaterial({
        map: texture,
        roughness: 0.72,
      }),
  )
  const benchMaterial = new MeshStandardMaterial({
    color: 0xc8c3ba,
    metalness: 0.04,
    roughness: 0.82,
  })
  const mainHallBenchCushionMaterial = new MeshStandardMaterial({
    color: 0x353d49,
    metalness: 0.02,
    roughness: 0.96,
  })
  const mainHallBenchFrameMaterial = new MeshStandardMaterial({
    color: 0x302d2a,
    metalness: 0.08,
    roughness: 0.72,
  })
  const lightFixtureMaterial = new MeshStandardMaterial({
    color: 0xfff8e7,
    emissive: 0xffe8b8,
    emissiveIntensity: 0.78,
    roughness: 0.34,
  })
  const lightHousingMaterial = new MeshStandardMaterial({
    color: 0x62635f,
    metalness: 0.3,
    roughness: 0.56,
  })

  const mainHallLength = MAIN_HALL_FRONT_Z - MAIN_HALL_BACK_Z
  const mainHallCenterZ =
    MAIN_HALL_BACK_Z + (MAIN_HALL_FRONT_Z - MAIN_HALL_BACK_Z) / 2

  const floor = new Mesh(
    new PlaneGeometry(MAIN_HALL_WIDTH, mainHallLength),
    floorMaterial,
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.z = mainHallCenterZ

  const ceiling = new Mesh(
    new BoxGeometry(MAIN_HALL_WIDTH, 0.1, mainHallLength),
    ceilingMaterial,
  )
  ceiling.position.set(0, WALL_HEIGHT, mainHallCenterZ)

  const leftWall = new Mesh(
    new BoxGeometry(WALL_DEPTH, WALL_HEIGHT, mainHallLength),
    wallMaterial,
  )
  leftWall.position.set(-MAIN_HALL_WIDTH / 2, WALL_HEIGHT / 2, mainHallCenterZ)

  const rightWall = leftWall.clone()
  rightWall.position.x = MAIN_HALL_WIDTH / 2

  const passage = createGalleryPassage({
    artworks: artworks.slice(0, MAIN_HALL_PASSAGE_ARTWORK_COUNT),
    artworkMaterials: artworkMaterials.slice(
      0,
      MAIN_HALL_PASSAGE_ARTWORK_COUNT,
    ),
    frameMaterial,
    wallMaterial,
  })
  passage.position.z = MAIN_HALL_BACK_Z

  const leftArtworkRow = createArtworkRow({
    artworks: artworks.slice(leftWallStart, leftWallEnd),
    artworkMaterials: artworkMaterials.slice(leftWallStart, leftWallEnd),
    frameMaterial,
    gap: 0.9,
    maxArtworkSize: { width: 2.3, height: 1.6 },
  })
  leftArtworkRow.position.set(-MAIN_HALL_WIDTH / 2 + 0.17, 2.15, 0.5)
  leftArtworkRow.rotation.y = Math.PI / 2

  const rightArtworkRow = createArtworkRow({
    artworks: artworks.slice(rightWallStart, rightWallEnd),
    artworkMaterials: artworkMaterials.slice(rightWallStart, rightWallEnd),
    frameMaterial,
    gap: 0.9,
    maxArtworkSize: { width: 2.3, height: 1.6 },
  })
  rightArtworkRow.position.set(MAIN_HALL_WIDTH / 2 - 0.17, 2.15, 0.5)
  rightArtworkRow.rotation.y = -Math.PI / 2

  const entrance = createGalleryEntrance({
    artworks: artworks.slice(rightWallEnd, mainHallArtworkCount),
    artworkMaterials: artworkMaterials.slice(
      rightWallEnd,
      mainHallArtworkCount,
    ),
    frameMaterial,
    wallMaterial,
  })
  entrance.position.z = MAIN_HALL_FRONT_Z

  const mainHallBench = createMainHallBench({
    cushionMaterial: mainHallBenchCushionMaterial,
    frameMaterial: mainHallBenchFrameMaterial,
  })
  mainHallBench.position.z = MAIN_HALL_CENTER_Z
  mainHallBench.rotation.y = Math.PI / 2

  const mainHallLighting = createMainHallLighting({
    fixtureMaterial: lightFixtureMaterial,
    housingMaterial: lightHousingMaterial,
  })
  const infiniteHallway = await createInfiniteHallway({
    artworkCatalog,
    artworkStartIndex: mainHallArtworkCount,
    benchMaterial,
    ceilingMaterial,
    floorMaterial,
    frameMaterial,
    lightFixtureMaterial,
    textureCache,
    wallMaterials: hallwayWallMaterials,
  })

  const ambientLight = new AmbientLight(0xffffff, 0.9)
  const keyLight = new DirectionalLight(0xfff4df, 1.8)
  keyLight.position.set(2, 6, 4)
  keyLight.target.position.set(0, 1.5, -9)

  gallery.add(
    floor,
    ceiling,
    leftWall,
    rightWall,
    passage,
    leftArtworkRow,
    rightArtworkRow,
    entrance,
    mainHallBench,
    mainHallLighting,
    infiniteHallway.object,
    ambientLight,
    keyLight,
    keyLight.target,
  )
  scene.add(gallery)

  return {
    collisionWorld: infiniteHallway.collisionWorld,
    update(visitorPosition) {
      infiniteHallway.update(visitorPosition)
    },
    dispose() {
      scene.remove(gallery)
      infiniteHallway.dispose()
      const geometries = new Set<BufferGeometry>()
      const materials = new Set<Material>([
        wallMaterial,
        ...hallwayWallMaterials,
        ceilingMaterial,
        floorMaterial,
        frameMaterial,
        benchMaterial,
        mainHallBenchCushionMaterial,
        mainHallBenchFrameMaterial,
        lightFixtureMaterial,
        lightHousingMaterial,
        ...artworkMaterials,
      ])
      gallery.traverse((object) => {
        if (!(object instanceof Mesh)) return

        geometries.add(object.geometry)

        const meshMaterials = Array.isArray(object.material)
          ? object.material
          : [object.material]

        meshMaterials.forEach((material) => {
          materials.add(material)

          if (object.name !== 'artwork-label') return
          const texture = (material as Material & { map?: Texture | null }).map
          texture?.dispose()
        })
      })

      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      floorTexture.dispose()
    },
  }
}
