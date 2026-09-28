import { Euler, type PerspectiveCamera } from 'three'
import {
  getMovementDeltaFromAxes,
  moveWithCollisions,
  type CollisionWorld,
} from './movement'

export interface TouchMovementIndicator {
  active: boolean
  offsetX: number
  offsetY: number
  originX: number
  originY: number
}

interface FirstPersonControllerOptions {
  camera: PerspectiveCamera
  collisionWorld: CollisionWorld
  domElement: HTMLCanvasElement
  onActiveChange?: (isActive: boolean) => void
  onTouchMovementChange?: (indicator: TouchMovementIndicator) => void
}

export interface FirstPersonController {
  activateKeyboard: () => void
  activateTouch: () => void
  dispose: () => void
  lock: () => void
  pause: () => void
  update: (deltaSeconds: number) => void
}

const MOVEMENT_SPEED = 3
const MOUSE_SENSITIVITY = 0.002
const MOUSE_DRAG_DISTANCE = 90
const TOUCH_LOOK_SENSITIVITY = 0.004
const TOUCH_JOYSTICK_RADIUS = 56
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
  onTouchMovementChange,
}: FirstPersonControllerOptions): FirstPersonController {
  const pressedKeys = new Set<string>()
  const cameraRotation = new Euler().setFromQuaternion(camera.quaternion, 'YXZ')
  let isActive = false
  let wasPointerLocked = false
  let isMouseDriving = false
  let mouseDragY = 0
  let mouseForwardInput = 0
  let touchMovePointerId: number | undefined
  let touchLookPointerId: number | undefined
  let touchMoveOrigin = { x: 0, y: 0 }
  let touchLookPosition = { x: 0, y: 0 }
  let touchForwardInput = 0
  let touchRightInput = 0

  const clampAxis = (value: number) => Math.max(-1, Math.min(1, value))

  const resetMouseDrive = () => {
    isMouseDriving = false
    mouseDragY = 0
    mouseForwardInput = 0
  }

  const resetTouchMove = () => {
    touchMovePointerId = undefined
    touchForwardInput = 0
    touchRightInput = 0
    onTouchMovementChange?.({
      active: false,
      offsetX: 0,
      offsetY: 0,
      originX: touchMoveOrigin.x,
      originY: touchMoveOrigin.y,
    })
  }

  const setActive = (nextIsActive: boolean) => {
    if (isActive === nextIsActive) return

    isActive = nextIsActive
    if (!isActive) {
      pressedKeys.clear()
      resetMouseDrive()
      resetTouchMove()
      touchLookPointerId = undefined
    }
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
    if (isMouseDriving) {
      mouseDragY += event.movementY
      mouseForwardInput = clampAxis(-mouseDragY / MOUSE_DRAG_DISTANCE)
    } else {
      cameraRotation.x -= event.movementY * MOUSE_SENSITIVITY
    }
    cameraRotation.x = Math.max(
      -MAX_PITCH,
      Math.min(MAX_PITCH, cameraRotation.x),
    )
    camera.quaternion.setFromEuler(cameraRotation)
  }

  const handleMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || document.pointerLockElement !== domElement) return

    isMouseDriving = true
    mouseDragY = 0
    mouseForwardInput = 0
  }

  const handleMouseUp = (event: MouseEvent) => {
    if (event.button === 0) resetMouseDrive()
  }

  const handleTouchPointerDown = (event: PointerEvent) => {
    if (!isActive || event.pointerType !== 'touch') return

    event.preventDefault()
    domElement.setPointerCapture(event.pointerId)

    if (event.clientX < window.innerWidth / 2 && touchMovePointerId === undefined) {
      touchMovePointerId = event.pointerId
      touchMoveOrigin = { x: event.clientX, y: event.clientY }
      onTouchMovementChange?.({
        active: true,
        offsetX: 0,
        offsetY: 0,
        originX: event.clientX,
        originY: event.clientY,
      })
      return
    }

    if (touchLookPointerId === undefined) {
      touchLookPointerId = event.pointerId
      touchLookPosition = { x: event.clientX, y: event.clientY }
    }
  }

  const handleTouchPointerMove = (event: PointerEvent) => {
    if (!isActive || event.pointerType !== 'touch') return

    if (event.pointerId === touchMovePointerId) {
      event.preventDefault()
      const rawX = event.clientX - touchMoveOrigin.x
      const rawY = event.clientY - touchMoveOrigin.y
      const distance = Math.hypot(rawX, rawY)
      const scale = distance > TOUCH_JOYSTICK_RADIUS
        ? TOUCH_JOYSTICK_RADIUS / distance
        : 1
      const offsetX = rawX * scale
      const offsetY = rawY * scale
      touchRightInput = clampAxis(offsetX / TOUCH_JOYSTICK_RADIUS)
      touchForwardInput = clampAxis(-offsetY / TOUCH_JOYSTICK_RADIUS)
      onTouchMovementChange?.({
        active: true,
        offsetX,
        offsetY,
        originX: touchMoveOrigin.x,
        originY: touchMoveOrigin.y,
      })
      return
    }

    if (event.pointerId === touchLookPointerId) {
      event.preventDefault()
      const deltaX = event.clientX - touchLookPosition.x
      const deltaY = event.clientY - touchLookPosition.y
      touchLookPosition = { x: event.clientX, y: event.clientY }
      cameraRotation.y -= deltaX * TOUCH_LOOK_SENSITIVITY
      cameraRotation.x -= deltaY * TOUCH_LOOK_SENSITIVITY
      cameraRotation.x = Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, cameraRotation.x),
      )
      camera.quaternion.setFromEuler(cameraRotation)
    }
  }

  const handleTouchPointerEnd = (event: PointerEvent) => {
    if (event.pointerId === touchMovePointerId) resetTouchMove()
    if (event.pointerId === touchLookPointerId) touchLookPointerId = undefined
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
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  domElement.addEventListener('pointerdown', handleTouchPointerDown)
  domElement.addEventListener('pointermove', handleTouchPointerMove)
  domElement.addEventListener('pointerup', handleTouchPointerEnd)
  domElement.addEventListener('pointercancel', handleTouchPointerEnd)

  return {
    activateKeyboard() {
      setActive(true)
      domElement.focus()
    },
    activateTouch() {
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

      const forwardInput =
        Number(pressedKeys.has('KeyW')) -
        Number(pressedKeys.has('KeyS')) +
        mouseForwardInput +
        touchForwardInput
      const rightInput =
        Number(pressedKeys.has('KeyD')) -
        Number(pressedKeys.has('KeyA')) +
        touchRightInput
      const movement = getMovementDeltaFromAxes(
        forwardInput,
        rightInput,
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
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      domElement.removeEventListener('pointerdown', handleTouchPointerDown)
      domElement.removeEventListener('pointermove', handleTouchPointerMove)
      domElement.removeEventListener('pointerup', handleTouchPointerEnd)
      domElement.removeEventListener('pointercancel', handleTouchPointerEnd)
    },
  }
}
