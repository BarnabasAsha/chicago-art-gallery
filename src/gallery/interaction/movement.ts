export interface Point2D {
  x: number
  z: number
}

export interface MovementInput {
  backward: boolean
  forward: boolean
  left: boolean
  right: boolean
}

export interface MovementBounds {
  maxX: number
  maxZ: number
  minX: number
  minZ: number
}

export interface RectangleCollider extends MovementBounds {}

export interface CollisionWorld {
  bounds: MovementBounds
  obstacles: RectangleCollider[]
  playerRadius: number
}

export function getMovementDelta(
  input: MovementInput,
  yaw: number,
  speed: number,
  deltaSeconds: number,
): Point2D {
  const forwardInput = Number(input.forward) - Number(input.backward)
  const rightInput = Number(input.right) - Number(input.left)
  const inputLength = Math.hypot(forwardInput, rightInput)

  if (inputLength === 0) return { x: 0, z: 0 }

  const normalizedForward = forwardInput / inputLength
  const normalizedRight = rightInput / inputLength
  const distance = speed * deltaSeconds

  return {
    x:
      (-Math.sin(yaw) * normalizedForward +
        Math.cos(yaw) * normalizedRight) *
      distance,
    z:
      (-Math.cos(yaw) * normalizedForward -
        Math.sin(yaw) * normalizedRight) *
      distance,
  }
}

export function moveWithCollisions(
  position: Point2D,
  movement: Point2D,
  world: CollisionWorld,
): Point2D {
  const next = { ...position }
  const nextX = clamp(
    position.x + movement.x,
    world.bounds.minX + world.playerRadius,
    world.bounds.maxX - world.playerRadius,
  )

  if (!intersectsAnyObstacle({ x: nextX, z: position.z }, world)) {
    next.x = nextX
  }

  const nextZ = clamp(
    position.z + movement.z,
    world.bounds.minZ + world.playerRadius,
    world.bounds.maxZ - world.playerRadius,
  )

  if (!intersectsAnyObstacle({ x: next.x, z: nextZ }, world)) {
    next.z = nextZ
  }

  return next
}

function intersectsAnyObstacle(
  position: Point2D,
  world: CollisionWorld,
): boolean {
  return world.obstacles.some((obstacle) => {
    const closestX = clamp(position.x, obstacle.minX, obstacle.maxX)
    const closestZ = clamp(position.z, obstacle.minZ, obstacle.maxZ)
    const distanceX = position.x - closestX
    const distanceZ = position.z - closestZ

    return (
      distanceX * distanceX + distanceZ * distanceZ <
      world.playerRadius * world.playerRadius
    )
  })
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}
