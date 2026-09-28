import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

const TEXTURE_SIZE = 512
const ROW_HEIGHT = 32
const BOARD_LENGTH = 256
const SEAM_WIDTH = 0.65

const OAK_COLORS = [
  '#8f7158',
  '#91735a',
  '#8d6f56',
  '#907259',
]

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function drawBoard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  context.fillStyle = color
  context.fillRect(
    x + SEAM_WIDTH / 2,
    y + SEAM_WIDTH / 2,
    BOARD_LENGTH - SEAM_WIDTH,
    ROW_HEIGHT - SEAM_WIDTH,
  )

  context.save()
  context.globalAlpha = 0.04
  context.strokeStyle = '#6f5846'
  context.lineWidth = 1

  for (const grainOffset of [10, 17, 24]) {
    context.beginPath()
    context.moveTo(x + 12, y + grainOffset)
    context.bezierCurveTo(
      x + BOARD_LENGTH * 0.32,
      y + grainOffset - 2,
      x + BOARD_LENGTH * 0.68,
      y + grainOffset + 2,
      x + BOARD_LENGTH - 12,
      y + grainOffset,
    )
    context.stroke()
  }

  context.restore()
}

export function createPlankFloorTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE_SIZE
  canvas.height = TEXTURE_SIZE

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to create the floor texture canvas.')
  }

  context.fillStyle = '#836851'
  context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)

  const rowCount = TEXTURE_SIZE / ROW_HEIGHT
  const boardCount = TEXTURE_SIZE / BOARD_LENGTH

  for (let row = 0; row < rowCount; row += 1) {
    const offset = row % 2 === 0 ? 0 : -BOARD_LENGTH / 2

    for (let column = -1; column <= boardCount; column += 1) {
      const repeatingColumn = positiveModulo(column, boardCount)
      const colorIndex = positiveModulo(repeatingColumn + row, OAK_COLORS.length)
      drawBoard(
        context,
        column * BOARD_LENGTH + offset,
        row * ROW_HEIGHT,
        OAK_COLORS[colorIndex],
      )
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.name = 'procedural-light-oak-plank-floor'
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(4, 4)
  texture.anisotropy = 8
  return texture
}
