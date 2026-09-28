import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Material,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import { createArtworkDisplay } from '../artwork/createArtworkDisplay'

interface GalleryEntranceOptions {
  artworkMaterials: Material[]
  artworks: Artwork[]
  frameMaterial: Material
  wallMaterial: Material
}

const ROOM_WIDTH = 12
const WALL_HEIGHT = 4
const WALL_DEPTH = 0.2
const DOORWAY_WIDTH = 3.2
const DOORWAY_HEIGHT = 2.8
const DOOR_FRAME_WIDTH = 0.08
const DOOR_FRAME_DEPTH = 0.12
const DOOR_GLASS_DEPTH = 0.025

export function createGalleryEntrance({
  artworkMaterials,
  artworks,
  frameMaterial,
  wallMaterial,
}: GalleryEntranceOptions): Group {
  if (artworks.length !== 2 || artworkMaterials.length !== 2) {
    throw new Error('The gallery entrance requires two artworks and materials.')
  }

  const entrance = new Group()
  entrance.name = 'gallery-entrance'

  const sideWallWidth = (ROOM_WIDTH - DOORWAY_WIDTH) / 2
  const sideWallOffset = DOORWAY_WIDTH / 2 + sideWallWidth / 2
  const headerHeight = WALL_HEIGHT - DOORWAY_HEIGHT

  const leftWall = new Mesh(
    new BoxGeometry(sideWallWidth, WALL_HEIGHT, WALL_DEPTH),
    wallMaterial,
  )
  leftWall.position.set(-sideWallOffset, WALL_HEIGHT / 2, 0)

  const rightWall = leftWall.clone()
  rightWall.position.x = sideWallOffset

  const header = new Mesh(
    new BoxGeometry(DOORWAY_WIDTH, headerHeight, WALL_DEPTH),
    wallMaterial,
  )
  header.position.set(0, DOORWAY_HEIGHT + headerHeight / 2, 0)

  const doorFrameMaterial = new MeshStandardMaterial({
    color: 0x272a29,
    metalness: 0.7,
    roughness: 0.32,
  })
  const glassMaterial = new MeshStandardMaterial({
    color: 0xaec3c5,
    metalness: 0.05,
    opacity: 0.28,
    roughness: 0.16,
    transparent: true,
  })

  const panelWidth = (DOORWAY_WIDTH - DOOR_FRAME_WIDTH * 3) / 2
  const panelHeight = DOORWAY_HEIGHT - DOOR_FRAME_WIDTH * 2
  const panelOffset = panelWidth / 2 + DOOR_FRAME_WIDTH / 2

  const leftGlass = new Mesh(
    new BoxGeometry(panelWidth, panelHeight, DOOR_GLASS_DEPTH),
    glassMaterial,
  )
  leftGlass.position.set(-panelOffset, DOORWAY_HEIGHT / 2, -WALL_DEPTH / 2)

  const rightGlass = leftGlass.clone()
  rightGlass.position.x = panelOffset

  const leftPost = new Mesh(
    new BoxGeometry(DOOR_FRAME_WIDTH, DOORWAY_HEIGHT, DOOR_FRAME_DEPTH),
    doorFrameMaterial,
  )
  leftPost.position.set(-DOORWAY_WIDTH / 2, DOORWAY_HEIGHT / 2, -WALL_DEPTH / 2)

  const centerPost = leftPost.clone()
  centerPost.position.x = 0

  const rightPost = leftPost.clone()
  rightPost.position.x = DOORWAY_WIDTH / 2

  const topRail = new Mesh(
    new BoxGeometry(
      DOORWAY_WIDTH + DOOR_FRAME_WIDTH,
      DOOR_FRAME_WIDTH,
      DOOR_FRAME_DEPTH,
    ),
    doorFrameMaterial,
  )
  topRail.position.set(0, DOORWAY_HEIGHT, -WALL_DEPTH / 2)

  const bottomTrack = topRail.clone()
  bottomTrack.position.y = DOOR_FRAME_WIDTH / 2

  const leftArtwork = createArtworkDisplay({
    artwork: artworks[0],
    artworkMaterial: artworkMaterials[0],
    frameMaterial,
    maxArtworkSize: { width: 1.8, height: 1.5 },
  }).object
  leftArtwork.position.set(-3.75, 2.05, -WALL_DEPTH / 2 - 0.01)
  leftArtwork.rotation.y = Math.PI

  const rightArtwork = createArtworkDisplay({
    artwork: artworks[1],
    artworkMaterial: artworkMaterials[1],
    frameMaterial,
    maxArtworkSize: { width: 1.8, height: 1.5 },
  }).object
  rightArtwork.position.set(3.75, 2.05, -WALL_DEPTH / 2 - 0.01)
  rightArtwork.rotation.y = Math.PI

  entrance.add(
    leftWall,
    rightWall,
    header,
    leftGlass,
    rightGlass,
    leftPost,
    centerPost,
    rightPost,
    topRail,
    bottomTrack,
    leftArtwork,
    rightArtwork,
  )

  return entrance
}
