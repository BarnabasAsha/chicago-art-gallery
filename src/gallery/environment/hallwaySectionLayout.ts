import type { Point2D } from '../interaction/movement'
import {
  HALLWAY_ARTWORKS_PER_SEGMENT,
  HALLWAY_SEGMENT_LENGTH,
  MAIN_HALL_BACK_Z,
  REST_SECTION_ARTWORK_COUNT,
} from './galleryLayout'

export type HallwayDirection = 'east' | 'north' | 'west'
export type HallwaySectionType = 'corner-left' | 'corner-right' | 'rest' | 'straight'

export interface HallwayRouteSection {
  artworkCount: number
  artworkOffset: number
  colorZoneIndex: number
  direction: HallwayDirection
  index: number
  position: Point2D
  rotationY: number
  type: HallwaySectionType
}

export interface HallwayRoute {
  getActiveSections: (
    visitorPosition: Point2D,
    previousSectionIndex: number,
  ) => {
    currentSectionIndex: number
    sections: HallwayRouteSection[]
  }
}

const SECTIONS_BEHIND_VISITOR = 2
const SECTIONS_AHEAD_OF_VISITOR = 8
const CORNER_ARTWORK_COUNT = 2
const REST_SECTION_INTERVAL = 7

export function createHallwayRoute(): HallwayRoute {
  const sections: HallwayRouteSection[] = []
  let nextPosition = { x: 0, z: MAIN_HALL_BACK_Z - HALLWAY_SEGMENT_LENGTH / 2 }
  let direction: HallwayDirection = 'north'
  let remainingStraightSections = 2
  let nextSectionIsCorner = false
  let artworkOffset = 0
  let colorZoneIndex = 0
  let cornerCount = 0

  const generateNextSection = () => {
    const index = sections.length
    let type: HallwaySectionType
    let exitDirection = direction
    let advanceColorZoneAfterSection = false

    if (nextSectionIsCorner) {
      exitDirection = getNextDirection(direction, nextPosition.x, cornerCount)
      type = getTurnType(direction, exitDirection)
      nextSectionIsCorner = false
      remainingStraightSections = getRunLength(cornerCount)
      advanceColorZoneAfterSection = true
      cornerCount += 1
    } else {
      type =
        index > 0 && index % REST_SECTION_INTERVAL === 4
          ? 'rest'
          : 'straight'
      remainingStraightSections -= 1
      nextSectionIsCorner = remainingStraightSections === 0
    }

    const artworkCount = getArtworkCount(type)
    sections.push({
      artworkCount,
      artworkOffset,
      colorZoneIndex,
      direction,
      index,
      position: { ...nextPosition },
      rotationY: getDirectionRotation(direction),
      type,
    })
    if (advanceColorZoneAfterSection) colorZoneIndex += 1
    artworkOffset += artworkCount
    direction = exitDirection
    nextPosition = moveInDirection(nextPosition, direction)
  }

  const ensureSection = (index: number) => {
    while (sections.length <= index) generateNextSection()
  }

  return {
    getActiveSections(visitorPosition, previousSectionIndex) {
      ensureSection(previousSectionIndex + SECTIONS_AHEAD_OF_VISITOR + 2)
      const searchStart = Math.max(0, previousSectionIndex - 3)
      const searchEnd = Math.min(
        sections.length - 1,
        previousSectionIndex + SECTIONS_AHEAD_OF_VISITOR,
      )
      let currentIndex = searchStart
      let nearestDistance = Number.POSITIVE_INFINITY

      for (let index = searchStart; index <= searchEnd; index += 1) {
        const section = sections[index]
        const distance = Math.hypot(
          visitorPosition.x - section.position.x,
          visitorPosition.z - section.position.z,
        )

        if (distance >= nearestDistance) continue
        nearestDistance = distance
        currentIndex = index
      }

      const firstIndex = Math.max(0, currentIndex - SECTIONS_BEHIND_VISITOR)
      const lastIndex = currentIndex + SECTIONS_AHEAD_OF_VISITOR
      ensureSection(lastIndex)
      return {
        currentSectionIndex: currentIndex,
        sections: sections.slice(firstIndex, lastIndex + 1),
      }
    },
  }
}

function getArtworkCount(type: HallwaySectionType): number {
  if (type === 'rest') return REST_SECTION_ARTWORK_COUNT
  if (type.startsWith('corner')) return CORNER_ARTWORK_COUNT
  return HALLWAY_ARTWORKS_PER_SEGMENT
}

function getNextDirection(
  incoming: HallwayDirection,
  x: number,
  cornerCount: number,
): HallwayDirection {
  if (incoming === 'east' || incoming === 'west') return 'north'
  if (x >= HALLWAY_SEGMENT_LENGTH * 2) return 'west'
  if (x <= -HALLWAY_SEGMENT_LENGTH * 2) return 'east'
  return cornerCount % 4 < 2 ? 'east' : 'west'
}

function getTurnType(
  incoming: HallwayDirection,
  outgoing: HallwayDirection,
): 'corner-left' | 'corner-right' {
  const isRightTurn =
    (incoming === 'north' && outgoing === 'east') ||
    (incoming === 'west' && outgoing === 'north')
  return isRightTurn ? 'corner-right' : 'corner-left'
}

function getRunLength(cornerCount: number): number {
  return 2 + ((cornerCount * 7 + 1) % 3)
}

function getDirectionRotation(direction: HallwayDirection): number {
  if (direction === 'east') return -Math.PI / 2
  if (direction === 'west') return Math.PI / 2
  return 0
}

function moveInDirection(
  position: Point2D,
  direction: HallwayDirection,
): Point2D {
  if (direction === 'east') {
    return { x: position.x + HALLWAY_SEGMENT_LENGTH, z: position.z }
  }
  if (direction === 'west') {
    return { x: position.x - HALLWAY_SEGMENT_LENGTH, z: position.z }
  }
  return { x: position.x, z: position.z - HALLWAY_SEGMENT_LENGTH }
}
