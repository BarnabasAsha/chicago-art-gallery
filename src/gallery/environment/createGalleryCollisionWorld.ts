import type {
  CollisionWorld,
  RectangleCollider,
} from '../interaction/movement'
import {
  HALLWAY_SEGMENT_LENGTH,
  HALLWAY_WIDTH,
  MAIN_HALL_BACK_Z,
  MAIN_HALL_BENCH_DEPTH,
  MAIN_HALL_BENCH_LENGTH,
  MAIN_HALL_CENTER_Z,
  MAIN_HALL_FRONT_Z,
  MAIN_HALL_WIDTH,
  PASSAGE_WIDTH,
  REST_BENCH_LENGTH,
  REST_BENCH_OFFSET_X,
  REST_BENCH_WIDTH,
  REST_SECTION_LENGTH,
  REST_SECTION_WIDTH,
  WALL_DEPTH,
} from './galleryLayout'
import type { HallwayRouteSection } from './hallwaySectionLayout'

const PLAYER_RADIUS = 0.3

export function createGalleryCollisionWorld(
  activeSections: HallwayRouteSection[],
): CollisionWorld {
  const world: CollisionWorld = {
    bounds: {
      minX: -MAIN_HALL_WIDTH / 2,
      maxX: MAIN_HALL_WIDTH / 2,
      minZ: MAIN_HALL_BACK_Z,
      maxZ: MAIN_HALL_FRONT_Z,
    },
    obstacles: [],
    playerRadius: PLAYER_RADIUS,
  }

  syncGalleryCollisionWorld(world, activeSections)
  return world
}

export function syncGalleryCollisionWorld(
  world: CollisionWorld,
  activeSections: HallwayRouteSection[],
): void {
  const obstacles = createMainHallColliders()

  activeSections.forEach((section) => {
    if (section.type === 'rest') {
      addRestSectionColliders(obstacles, section)
    } else if (section.type === 'straight') {
      addStraightSectionColliders(obstacles, section)
    } else {
      addCornerSectionColliders(obstacles, section)
    }
  })

  world.bounds = {
    minX: Math.min(-MAIN_HALL_WIDTH / 2, ...obstacles.map(({ minX }) => minX)),
    maxX: Math.max(MAIN_HALL_WIDTH / 2, ...obstacles.map(({ maxX }) => maxX)),
    minZ: Math.min(MAIN_HALL_BACK_Z, ...obstacles.map(({ minZ }) => minZ)),
    maxZ: Math.max(MAIN_HALL_FRONT_Z, ...obstacles.map(({ maxZ }) => maxZ)),
  }
  world.obstacles = obstacles
}

function createMainHallColliders(): RectangleCollider[] {
  const halfRoomWidth = MAIN_HALL_WIDTH / 2
  const halfPassageWidth = PASSAGE_WIDTH / 2
  const halfWallDepth = WALL_DEPTH / 2

  return [
    rectangle(
      -MAIN_HALL_BENCH_DEPTH / 2,
      MAIN_HALL_BENCH_DEPTH / 2,
      MAIN_HALL_CENTER_Z - MAIN_HALL_BENCH_LENGTH / 2,
      MAIN_HALL_CENTER_Z + MAIN_HALL_BENCH_LENGTH / 2,
    ),
    rectangle(-halfRoomWidth, -halfPassageWidth, MAIN_HALL_BACK_Z - halfWallDepth, MAIN_HALL_BACK_Z + halfWallDepth),
    rectangle(halfPassageWidth, halfRoomWidth, MAIN_HALL_BACK_Z - halfWallDepth, MAIN_HALL_BACK_Z + halfWallDepth),
    rectangle(-halfRoomWidth - halfWallDepth, -halfRoomWidth + halfWallDepth, MAIN_HALL_BACK_Z, MAIN_HALL_FRONT_Z),
    rectangle(halfRoomWidth - halfWallDepth, halfRoomWidth + halfWallDepth, MAIN_HALL_BACK_Z, MAIN_HALL_FRONT_Z),
    rectangle(-halfRoomWidth, halfRoomWidth, MAIN_HALL_FRONT_Z - halfWallDepth, MAIN_HALL_FRONT_Z + halfWallDepth),
  ]
}

function addStraightSectionColliders(
  obstacles: RectangleCollider[],
  section: HallwayRouteSection,
): void {
  const halfWidth = HALLWAY_WIDTH / 2
  const halfLength = HALLWAY_SEGMENT_LENGTH / 2
  addLocalCollider(obstacles, section, rectangle(-halfWidth - WALL_DEPTH / 2, -halfWidth + WALL_DEPTH / 2, -halfLength, halfLength))
  addLocalCollider(obstacles, section, rectangle(halfWidth - WALL_DEPTH / 2, halfWidth + WALL_DEPTH / 2, -halfLength, halfLength))
}

function addRestSectionColliders(
  obstacles: RectangleCollider[],
  section: HallwayRouteSection,
): void {
  const halfWidth = REST_SECTION_WIDTH / 2
  const halfLength = REST_SECTION_LENGTH / 2
  const halfHallwayWidth = HALLWAY_WIDTH / 2

  addLocalCollider(obstacles, section, rectangle(-halfWidth - WALL_DEPTH / 2, -halfWidth + WALL_DEPTH / 2, -halfLength, halfLength))
  addLocalCollider(obstacles, section, rectangle(halfWidth - WALL_DEPTH / 2, halfWidth + WALL_DEPTH / 2, -halfLength, halfLength))

  for (const z of [-halfLength, halfLength]) {
    addLocalCollider(obstacles, section, rectangle(-halfWidth, -halfHallwayWidth, z - WALL_DEPTH / 2, z + WALL_DEPTH / 2))
    addLocalCollider(obstacles, section, rectangle(halfHallwayWidth, halfWidth, z - WALL_DEPTH / 2, z + WALL_DEPTH / 2))
  }

  for (const x of [-REST_BENCH_OFFSET_X, REST_BENCH_OFFSET_X]) {
    addLocalCollider(obstacles, section, rectangle(x - REST_BENCH_WIDTH / 2, x + REST_BENCH_WIDTH / 2, -REST_BENCH_LENGTH / 2, REST_BENCH_LENGTH / 2))
  }
}

function addCornerSectionColliders(
  obstacles: RectangleCollider[],
  section: HallwayRouteSection,
): void {
  const halfLength = HALLWAY_SEGMENT_LENGTH / 2
  addLocalCollider(obstacles, section, rectangle(-halfLength, halfLength, -halfLength - WALL_DEPTH / 2, -halfLength + WALL_DEPTH / 2))

  const sideX = section.type === 'corner-right' ? -halfLength : halfLength
  addLocalCollider(obstacles, section, rectangle(sideX - WALL_DEPTH / 2, sideX + WALL_DEPTH / 2, -halfLength, halfLength))
}

function addLocalCollider(
  obstacles: RectangleCollider[],
  section: HallwayRouteSection,
  local: RectangleCollider,
): void {
  const cosine = Math.cos(section.rotationY)
  const sine = Math.sin(section.rotationY)
  const corners = [
    { x: local.minX, z: local.minZ },
    { x: local.minX, z: local.maxZ },
    { x: local.maxX, z: local.minZ },
    { x: local.maxX, z: local.maxZ },
  ].map(({ x, z }) => ({
    x: section.position.x + x * cosine + z * sine,
    z: section.position.z - x * sine + z * cosine,
  }))

  obstacles.push({
    minX: Math.min(...corners.map(({ x }) => x)),
    maxX: Math.max(...corners.map(({ x }) => x)),
    minZ: Math.min(...corners.map(({ z }) => z)),
    maxZ: Math.max(...corners.map(({ z }) => z)),
  })
}

function rectangle(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): RectangleCollider {
  return { minX, maxX, minZ, maxZ }
}
