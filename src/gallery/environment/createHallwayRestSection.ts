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
import { createArtworkRow } from '../artwork/createArtworkRow'
import { createMuseumBench } from './createMuseumBench'
import {
  HALLWAY_WIDTH,
  REST_BENCH_LENGTH,
  REST_BENCH_OFFSET_X,
  REST_BENCH_WIDTH,
  REST_SECTION_LENGTH,
  REST_SECTION_WIDTH,
  WALL_DEPTH,
  WALL_HEIGHT,
} from './galleryLayout'

interface HallwayRestSectionOptions {
  artworkMaterials: Material[]
  artworks: Artwork[]
  benchMaterial: Material
  ceilingMaterial: Material
  floorMaterial: Material
  frameMaterial: Material
  lightFixtureMaterial: Material
  wallMaterial: Material
}

export function createHallwayRestSection({
  artworkMaterials,
  artworks,
  benchMaterial,
  ceilingMaterial,
  floorMaterial,
  frameMaterial,
  lightFixtureMaterial,
  wallMaterial,
}: HallwayRestSectionOptions): Group {
  if (artworks.length !== 8 || artworkMaterials.length !== 8) {
    throw new Error('The hallway rest section requires eight artworks and materials.')
  }

  const section = new Group()
  section.name = 'hallway-rest-section'

  const floor = new Mesh(
    new PlaneGeometry(REST_SECTION_WIDTH, REST_SECTION_LENGTH),
    floorMaterial,
  )
  floor.rotation.x = -Math.PI / 2

  const ceiling = new Mesh(
    new BoxGeometry(REST_SECTION_WIDTH, 0.1, REST_SECTION_LENGTH),
    ceilingMaterial,
  )
  ceiling.position.y = WALL_HEIGHT

  const leftWall = new Mesh(
    new BoxGeometry(WALL_DEPTH, WALL_HEIGHT, REST_SECTION_LENGTH),
    wallMaterial,
  )
  leftWall.position.set(-REST_SECTION_WIDTH / 2, WALL_HEIGHT / 2, 0)

  const rightWall = leftWall.clone()
  rightWall.position.x = REST_SECTION_WIDTH / 2

  const returnWallWidth = (REST_SECTION_WIDTH - HALLWAY_WIDTH) / 2
  const returnWallOffset = HALLWAY_WIDTH / 2 + returnWallWidth / 2
  const createReturnWall = (x: number, z: number) => {
    const wall = new Mesh(
      new BoxGeometry(returnWallWidth, WALL_HEIGHT, WALL_DEPTH),
      wallMaterial,
    )
    wall.position.set(x, WALL_HEIGHT / 2, z)
    return wall
  }
  const frontZ = REST_SECTION_LENGTH / 2
  const backZ = -REST_SECTION_LENGTH / 2
  const frontLeftWall = createReturnWall(-returnWallOffset, frontZ)
  const frontRightWall = createReturnWall(returnWallOffset, frontZ)
  const backLeftWall = createReturnWall(-returnWallOffset, backZ)
  const backRightWall = createReturnWall(returnWallOffset, backZ)

  const artworkX = REST_SECTION_WIDTH / 2 - WALL_DEPTH / 2 - 0.07
  const leftArtworkRow = createArtworkRow({
    artworks: artworks.slice(0, 2),
    artworkMaterials: artworkMaterials.slice(0, 2),
    frameMaterial,
    gap: 0.55,
    maxArtworkSize: { width: 1.55, height: 1.35 },
  })
  leftArtworkRow.position.set(-artworkX, 2.05, 0)
  leftArtworkRow.rotation.y = Math.PI / 2

  const rightArtworkRow = createArtworkRow({
    artworks: artworks.slice(2, 4),
    artworkMaterials: artworkMaterials.slice(2, 4),
    frameMaterial,
    gap: 0.55,
    maxArtworkSize: { width: 1.55, height: 1.35 },
  })
  rightArtworkRow.position.set(artworkX, 2.05, 0)
  rightArtworkRow.rotation.y = -Math.PI / 2

  const createCornerArtwork = (
    artworkIndex: number,
    x: number,
    z: number,
    rotationY: number,
  ) => {
    const artwork = createArtworkDisplay({
      artwork: artworks[artworkIndex],
      artworkMaterial: artworkMaterials[artworkIndex],
      frameMaterial,
      maxArtworkSize: { width: 1.25, height: 1.15 },
    }).object
    artwork.position.set(x, 2.05, z)
    artwork.rotation.y = rotationY
    return artwork
  }
  const cornerArtworkX = returnWallOffset
  const innerWallOffset = WALL_DEPTH / 2 + 0.01
  const frontLeftArtwork = createCornerArtwork(
    4,
    -cornerArtworkX,
    frontZ - innerWallOffset,
    Math.PI,
  )
  const frontRightArtwork = createCornerArtwork(
    5,
    cornerArtworkX,
    frontZ - innerWallOffset,
    Math.PI,
  )
  const backLeftArtwork = createCornerArtwork(
    6,
    -cornerArtworkX,
    backZ + innerWallOffset,
    0,
  )
  const backRightArtwork = createCornerArtwork(
    7,
    cornerArtworkX,
    backZ + innerWallOffset,
    0,
  )

  const leftBench = createMuseumBench({
    depth: REST_BENCH_WIDTH,
    length: REST_BENCH_LENGTH,
    material: benchMaterial,
  })
  leftBench.position.set(-REST_BENCH_OFFSET_X, 0, 0)
  leftBench.rotation.y = Math.PI / 2

  const rightBench = createMuseumBench({
    depth: REST_BENCH_WIDTH,
    length: REST_BENCH_LENGTH,
    material: benchMaterial,
  })
  rightBench.position.x = REST_BENCH_OFFSET_X
  rightBench.rotation.y = Math.PI / 2

  const fixtureGeometry = new BoxGeometry(0.8, 0.05, 0.42)
  const leftFixture = new Mesh(fixtureGeometry, lightFixtureMaterial)
  leftFixture.position.set(-2.1, WALL_HEIGHT - 0.08, 0)
  const rightFixture = leftFixture.clone()
  rightFixture.position.x = 2.1

  const leftLight = new PointLight(0xfff0d6, 10, 7, 2)
  leftLight.position.set(-2.1, WALL_HEIGHT - 0.25, 0)
  const rightLight = leftLight.clone()
  rightLight.position.x = 2.1

  section.add(
    floor,
    ceiling,
    leftWall,
    rightWall,
    frontLeftWall,
    frontRightWall,
    backLeftWall,
    backRightWall,
    leftArtworkRow,
    rightArtworkRow,
    frontLeftArtwork,
    frontRightArtwork,
    backLeftArtwork,
    backRightArtwork,
    leftBench,
    rightBench,
    leftFixture,
    rightFixture,
    leftLight,
    rightLight,
  )

  return section
}
