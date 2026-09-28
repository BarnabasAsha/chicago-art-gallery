import { BoxGeometry, Group, Mesh, type Material } from 'three'
import type { Artwork } from '../../domain/artwork'
import { createArtworkDisplay } from '../artwork/createArtworkDisplay'
import {
  MAIN_HALL_WIDTH,
  PASSAGE_WIDTH,
  WALL_DEPTH,
  WALL_HEIGHT,
} from './galleryLayout'

interface GalleryPassageOptions {
  artworkMaterials: Material[]
  artworks: Artwork[]
  frameMaterial: Material
  wallMaterial: Material
}

const PASSAGE_HEIGHT = 3.1
const TRIM_WIDTH = 0.08
const TRIM_DEPTH = 0.12

export function createGalleryPassage({
  artworkMaterials,
  artworks,
  frameMaterial,
  wallMaterial,
}: GalleryPassageOptions): Group {
  if (artworks.length !== 2 || artworkMaterials.length !== 2) {
    throw new Error('The gallery passage requires two artworks and materials.')
  }

  const passage = new Group()
  passage.name = 'main-hall-passage'

  const sideWallWidth = (MAIN_HALL_WIDTH - PASSAGE_WIDTH) / 2
  const sideWallOffset = PASSAGE_WIDTH / 2 + sideWallWidth / 2
  const headerHeight = WALL_HEIGHT - PASSAGE_HEIGHT

  const leftWall = new Mesh(
    new BoxGeometry(sideWallWidth, WALL_HEIGHT, WALL_DEPTH),
    wallMaterial,
  )
  leftWall.position.set(-sideWallOffset, WALL_HEIGHT / 2, 0)

  const rightWall = leftWall.clone()
  rightWall.position.x = sideWallOffset

  const header = new Mesh(
    new BoxGeometry(PASSAGE_WIDTH, headerHeight, WALL_DEPTH),
    wallMaterial,
  )
  header.position.set(0, PASSAGE_HEIGHT + headerHeight / 2, 0)

  const leftPost = new Mesh(
    new BoxGeometry(TRIM_WIDTH, PASSAGE_HEIGHT, TRIM_DEPTH),
    frameMaterial,
  )
  leftPost.position.set(-PASSAGE_WIDTH / 2, PASSAGE_HEIGHT / 2, WALL_DEPTH / 2)

  const rightPost = leftPost.clone()
  rightPost.position.x = PASSAGE_WIDTH / 2

  const topRail = new Mesh(
    new BoxGeometry(PASSAGE_WIDTH + TRIM_WIDTH, TRIM_WIDTH, TRIM_DEPTH),
    frameMaterial,
  )
  topRail.position.set(0, PASSAGE_HEIGHT, WALL_DEPTH / 2)

  const leftArtwork = createArtworkDisplay({
    artwork: artworks[0],
    artworkMaterial: artworkMaterials[0],
    frameMaterial,
    maxArtworkSize: { width: 1.75, height: 1.45 },
  }).object
  leftArtwork.position.set(-3.65, 2.05, WALL_DEPTH / 2 + 0.01)

  const rightArtwork = createArtworkDisplay({
    artwork: artworks[1],
    artworkMaterial: artworkMaterials[1],
    frameMaterial,
    maxArtworkSize: { width: 1.75, height: 1.45 },
  }).object
  rightArtwork.position.set(3.65, 2.05, WALL_DEPTH / 2 + 0.01)

  passage.add(
    leftWall,
    rightWall,
    header,
    leftPost,
    rightPost,
    topRail,
    leftArtwork,
    rightArtwork,
  )

  return passage
}
