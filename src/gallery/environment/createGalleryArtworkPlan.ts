import type { Artwork } from '../../domain/artwork'
import { ARTWORK_FRAME_BORDER } from '../artwork/artworkDisplayConfig'
import { fitArtworkWithinBounds } from '../artwork/fitArtworkWithinBounds'
import {
  MAIN_HALL_ENTRANCE_ARTWORK_COUNT,
  MAIN_HALL_PASSAGE_ARTWORK_COUNT,
} from './galleryLayout'

export interface MainHallArtworkLayout {
  leftWallCount: number
  rightWallCount: number
}

export interface GalleryArtworkPlan {
  artworks: Artwork[]
  mainHall: MainHallArtworkLayout
}

const MAIN_WALL_ARTWORK_BOUNDS = { width: 2.3, height: 1.6 }
const MAIN_WALL_ARTWORK_GAP = 0.9
const MAIN_WALL_TARGET_SPAN = 7.2
const MAIN_WALL_AVAILABLE_SPAN = 10
const MAIN_WALL_MINIMUM_COUNT = 2
const MAIN_WALL_MAXIMUM_COUNT = 4

export function createGalleryArtworkPlan(
  candidates: Artwork[],
): GalleryArtworkPlan {
  let cursor = MAIN_HALL_PASSAGE_ARTWORK_COUNT

  const leftWallCount = getWallArtworkCount(candidates.slice(cursor))
  cursor += leftWallCount

  const rightWallCount = getWallArtworkCount(candidates.slice(cursor))
  cursor += rightWallCount

  const fixedArtworkCount = MAIN_HALL_ENTRANCE_ARTWORK_COUNT
  const totalArtworkCount = cursor + fixedArtworkCount

  if (candidates.length < totalArtworkCount) {
    throw new Error(
      `The gallery layout requires ${totalArtworkCount} artwork candidates.`,
    )
  }

  return {
    artworks: candidates,
    mainHall: { leftWallCount, rightWallCount },
  }
}

export function getMainHallArtworkCount(layout: MainHallArtworkLayout): number {
  return (
    MAIN_HALL_PASSAGE_ARTWORK_COUNT +
    layout.leftWallCount +
    layout.rightWallCount +
    MAIN_HALL_ENTRANCE_ARTWORK_COUNT
  )
}

function getWallArtworkCount(candidates: Artwork[]): number {
  let count = 0
  let occupiedSpan = 0

  for (const artwork of candidates.slice(0, MAIN_WALL_MAXIMUM_COUNT)) {
    const fittedSize = fitArtworkWithinBounds(
      artwork.image,
      MAIN_WALL_ARTWORK_BOUNDS,
    )
    const displayWidth = fittedSize.width + ARTWORK_FRAME_BORDER * 2
    const nextSpan =
      occupiedSpan + (count > 0 ? MAIN_WALL_ARTWORK_GAP : 0) + displayWidth

    if (
      count >= MAIN_WALL_MINIMUM_COUNT &&
      nextSpan > MAIN_WALL_AVAILABLE_SPAN
    ) {
      break
    }

    occupiedSpan = nextSpan
    count += 1

    if (
      count >= MAIN_WALL_MINIMUM_COUNT &&
      occupiedSpan >= MAIN_WALL_TARGET_SPAN
    ) {
      break
    }
  }

  if (count < MAIN_WALL_MINIMUM_COUNT) {
    throw new Error('Not enough artwork candidates for a main hall wall.')
  }

  return count
}
