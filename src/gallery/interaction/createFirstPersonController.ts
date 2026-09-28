import { Euler, type PerspectiveCamera } from 'three'
import {
  getMovementDelta,
  moveWithCollisions,
  type CollisionWorld,
  type MovementInput,
} from './movement'

interface FirstPersonControllerOptions {
  camera: PerspectiveCamera
  collisionWorld: CollisionWorld
  domElement: HTMLCanvasElement
  onActiveChange?: (isActive: boolean) => void
}

export interface FirstPersonController {
  activateKeyboard: () => void
  dispose: () => void
  lock: () => void
  pause: () => void
  update: (deltaSeconds: number) => void
}

const MOVEMENT_SPEED = 3
const MOUSE_SENSITIVITY = 0.002
const KEYBOARD_LOOK_SPEED = 1.5
const MAX_PITCH = Math.PI / 2 - 0.05
const MOVEMENT_KEYS = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'KeyA',
  'KeyD',
  'KeyS',
  'KeyW',
])

export function createFirstPersonController({
  camera,
  collisionWorld,
  domElement,
  onActiveChange,
}: FirstPersonControllerOptions): FirstPersonController {
  const pressedKeys = new Set<string>()
  const cameraRotation = new Euler().setFromQuaternion(camera.quaternion, 'YXZ')
  let isActive = false
  let wasPointerLocked = false

  const setActive = (nextIsActive: boolean) => {
    if (isActive === nextIsActive) return

    isActive = nextIsActive
    if (!isActive) pressedKeys.clear()
    onActiveChange?.(isActive)
  }

  const lock = () => {
    const wasAlreadyActive = isActive

    void domElement.requestPointerLock().catch(() => {
      pressedKeys.clear()
      if (!wasAlreadyActive) setActive(false)
    })
  }

  const handlePointerLockChange = () => {
    const isLocked = document.pointerLockElement === domElement

    if (isLocked) {
      wasPointerLocked = true
      setActive(true)
      return
    }

    if (wasPointerLocked) {
      wasPointerLocked = false
      setActive(false)
    }
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== domElement) return

    cameraRotation.y -= event.movementX * MOUSE_SENSITIVITY
    cameraRotation.x -= event.movementY * MOUSE_SENSITIVITY
    cameraRotation.x = Math.max(
      -MAX_PITCH,
      Math.min(MAX_PITCH, cameraRotation.x),
    )
    camera.quaternion.setFromEuler(cameraRotation)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive) return

    if (event.code === 'Escape' && document.pointerLockElement !== domElement) {
      event.preventDefault()
      setActive(false)
      return
    }

    if (!MOVEMENT_KEYS.has(event.code)) return

    event.preventDefault()
    pressedKeys.add(event.code)
  }

  const handleKeyUp = (event: KeyboardEvent) => {
    pressedKeys.delete(event.code)
  }

  document.addEventListener('pointerlockchange', handlePointerLockChange)
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)

  return {
    activateKeyboard() {
      setActive(true)
      domElement.focus()
    },
    lock,
    pause() {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock()
        return
      }

      setActive(false)
    },
    update(deltaSeconds) {
      if (!isActive) return

      const horizontalLook =
        Number(pressedKeys.has('ArrowLeft')) -
        Number(pressedKeys.has('ArrowRight'))
      const verticalLook =
        Number(pressedKeys.has('ArrowUp')) -
        Number(pressedKeys.has('ArrowDown'))

      if (horizontalLook !== 0 || verticalLook !== 0) {
        cameraRotation.y +=
          horizontalLook * KEYBOARD_LOOK_SPEED * deltaSeconds
        cameraRotation.x += verticalLook * KEYBOARD_LOOK_SPEED * deltaSeconds
        cameraRotation.x = Math.max(
          -MAX_PITCH,
          Math.min(MAX_PITCH, cameraRotation.x),
        )
        camera.quaternion.setFromEuler(cameraRotation)
      }

      const input: MovementInput = {
        backward: pressedKeys.has('KeyS'),
        forward: pressedKeys.has('KeyW'),
        left: pressedKeys.has('KeyA'),
        right: pressedKeys.has('KeyD'),
      }
      const movement = getMovementDelta(
        input,
        cameraRotation.y,
        MOVEMENT_SPEED,
        deltaSeconds,
      )
      const nextPosition = moveWithCollisions(
        { x: camera.position.x, z: camera.position.z },
        movement,
        collisionWorld,
      )

      camera.position.x = nextPosition.x
      camera.position.z = nextPosition.z
    },
    dispose() {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock()
      }

      setActive(false)
      pressedKeys.clear()
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    },
  }
}
