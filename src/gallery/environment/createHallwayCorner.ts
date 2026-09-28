import {
  BoxGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  PointLight,
  type Material,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import { createArtworkDisplay } from '../artwork/createArtworkDisplay'
import {
  HALLWAY_SEGMENT_LENGTH,
  WALL_DEPTH,
  WALL_HEIGHT,
} from './galleryLayout'

interface HallwayCornerOptions {
  artworkMaterials: Material[]
  artworks: Artwork[]
  ceilingMaterial: Material
  floorMaterial: Material
  frameMaterial: Material
  lightFixtureMaterial: Material
  turn: 'left' | 'right'
  wallMaterial: Material
}

export function createHallwayCorner({
  artworkMaterials,
  artworks,
  ceilingMaterial,
  floorMaterial,
  frameMaterial,
  lightFixtureMaterial,
  turn,
  wallMaterial,
}: HallwayCornerOptions): Group {
  if (artworks.length !== 2 || artworkMaterials.length !== 2) {
    throw new Error('A hallway corner requires two artworks and materials.')
  }

  const corner = new Group()
  corner.name = `hallway-corner-${turn}`
  const halfLength = HALLWAY_SEGMENT_LENGTH / 2

  const floor = new Mesh(
    new PlaneGeometry(HALLWAY_SEGMENT_LENGTH, HALLWAY_SEGMENT_LENGTH),
    floorMaterial,
  )
  floor.rotation.x = -Math.PI / 2

  const ceiling = new Mesh(
    new BoxGeometry(HALLWAY_SEGMENT_LENGTH, 0.1, HALLWAY_SEGMENT_LENGTH),
    ceilingMaterial,
  )
  ceiling.position.y = WALL_HEIGHT

  const endWall = new Mesh(
    new BoxGeometry(HALLWAY_SEGMENT_LENGTH, WALL_HEIGHT, WALL_DEPTH),
    wallMaterial,
  )
  endWall.position.set(0, WALL_HEIGHT / 2, -halfLength)

  const sideX = turn === 'right' ? -halfLength : halfLength
  const sideWall = new Mesh(
    new BoxGeometry(WALL_DEPTH, WALL_HEIGHT, HALLWAY_SEGMENT_LENGTH),
    wallMaterial,
  )
  sideWall.position.set(sideX, WALL_HEIGHT / 2, 0)

  const featureArtwork = createArtworkDisplay({
    artwork: artworks[0],
    artworkMaterial: artworkMaterials[0],
    frameMaterial,
    maxArtworkSize: { width: 1.8, height: 1.45 },
  }).object
  featureArtwork.position.set(0, 2.05, -halfLength + WALL_DEPTH / 2 + 0.01)

  const sideArtwork = createArtworkDisplay({
    artwork: artworks[1],
    artworkMaterial: artworkMaterials[1],
    frameMaterial,
    maxArtworkSize: { width: 1.45, height: 1.25 },
  }).object
  sideArtwork.position.set(
    sideX + (turn === 'right' ? WALL_DEPTH / 2 + 0.01 : -WALL_DEPTH / 2 - 0.01),
    2.05,
    0,
  )
  sideArtwork.rotation.y = turn === 'right' ? Math.PI / 2 : -Math.PI / 2

  const lightFixture = new Mesh(
    new BoxGeometry(0.8, 0.05, 0.42),
    lightFixtureMaterial,
  )
  lightFixture.position.set(0, WALL_HEIGHT - 0.08, 0)

  const light = new PointLight(0xfff0d6, 9, 7, 2)
  light.position.set(0, WALL_HEIGHT - 0.25, 0)

  corner.add(
    floor,
    ceiling,
    endWall,
    sideWall,
    featureArtwork,
    sideArtwork,
    lightFixture,
    light,
  )

  return corner
}
