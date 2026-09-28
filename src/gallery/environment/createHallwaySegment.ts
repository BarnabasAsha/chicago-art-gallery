import {
  BoxGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  PointLight,
  type Material,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import { createArtworkRow } from '../artwork/createArtworkRow'
import {
  HALLWAY_SEGMENT_LENGTH,
  HALLWAY_WIDTH,
  WALL_DEPTH,
  WALL_HEIGHT,
} from './galleryLayout'

interface HallwaySegmentOptions {
  artworkMaterials: Material[]
  artworks: Artwork[]
  ceilingMaterial: Material
  floorMaterial: Material
  frameMaterial: Material
  lightFixtureMaterial: Material
  segmentIndex: number
  wallMaterial: Material
}

const ARTWORK_WALL_OFFSET = 0.07

export function createHallwaySegment({
  artworkMaterials,
  artworks,
  ceilingMaterial,
  floorMaterial,
  frameMaterial,
  lightFixtureMaterial,
  segmentIndex,
  wallMaterial,
}: HallwaySegmentOptions): Group {
  if (artworks.length !== 4 || artworkMaterials.length !== 4) {
    throw new Error('A hallway segment requires four artworks and materials.')
  }

  const segment = new Group()
  segment.name = `hallway-segment-${segmentIndex}`

  const floor = new Mesh(
    new PlaneGeometry(HALLWAY_WIDTH, HALLWAY_SEGMENT_LENGTH),
    floorMaterial,
  )
  floor.rotation.x = -Math.PI / 2

  const ceiling = new Mesh(
    new BoxGeometry(HALLWAY_WIDTH, 0.1, HALLWAY_SEGMENT_LENGTH),
    ceilingMaterial,
  )
  ceiling.position.y = WALL_HEIGHT

  const leftWall = new Mesh(
    new BoxGeometry(WALL_DEPTH, WALL_HEIGHT, HALLWAY_SEGMENT_LENGTH),
    wallMaterial,
  )
  leftWall.position.set(-HALLWAY_WIDTH / 2, WALL_HEIGHT / 2, 0)

  const rightWall = leftWall.clone()
  rightWall.position.x = HALLWAY_WIDTH / 2

  const artworkX = HALLWAY_WIDTH / 2 - WALL_DEPTH / 2 - ARTWORK_WALL_OFFSET

  const leftArtworkRow = createArtworkRow({
    artworks: artworks.slice(0, 2),
    artworkMaterials: artworkMaterials.slice(0, 2),
    frameMaterial,
    gap: 0.65,
    maxArtworkSize: { width: 1.45, height: 1.3 },
  })
  leftArtworkRow.position.set(-artworkX, 2.05, 0)
  leftArtworkRow.rotation.y = Math.PI / 2

  const rightArtworkRow = createArtworkRow({
    artworks: artworks.slice(2, 4),
    artworkMaterials: artworkMaterials.slice(2, 4),
    frameMaterial,
    gap: 0.65,
    maxArtworkSize: { width: 1.45, height: 1.3 },
  })
  rightArtworkRow.position.set(artworkX, 2.05, 0)
  rightArtworkRow.rotation.y = -Math.PI / 2

  const lightFixture = new Mesh(
    new BoxGeometry(0.8, 0.05, 0.42),
    lightFixtureMaterial,
  )
  lightFixture.position.set(0, WALL_HEIGHT - 0.08, 0)

  const light = new PointLight(0xfff0d6, 9, 7, 2)
  light.position.set(0, WALL_HEIGHT - 0.25, 0)

  segment.add(
    floor,
    ceiling,
    leftWall,
    rightWall,
    leftArtworkRow,
    rightArtworkRow,
    lightFixture,
    light,
  )

  return segment
}
