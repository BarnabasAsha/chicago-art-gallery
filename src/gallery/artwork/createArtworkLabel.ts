import {
  CanvasTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three'
import type { Artwork } from '../../domain/artwork'

interface ArtworkLabelOptions {
  artwork: Artwork
  width: number
}

export interface ArtworkLabel {
  height: number
  object: Mesh
}

const LABEL_HEIGHT = 0.38
const CANVAS_WIDTH = 1024
const TITLE_SIZE = 0.058
const ARTIST_SIZE = 0.038
const LINE_GAP = 0.018

export function createArtworkLabel({
  artwork,
  width,
}: ArtworkLabelOptions): ArtworkLabel {
  const canvas = document.createElement('canvas')
  const scale = CANVAS_WIDTH / width
  canvas.width = CANVAS_WIDTH
  canvas.height = Math.ceil(LABEL_HEIGHT * scale)

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('A 2D canvas context is required for artwork labels.')
  }

  const titleFontSize = TITLE_SIZE * scale
  const artistFontSize = ARTIST_SIZE * scale
  const lineGap = LINE_GAP * scale

  context.fillStyle = '#25211c'
  context.textAlign = 'left'
  context.textBaseline = 'top'
  context.font = `600 ${titleFontSize}px Inter, Arial, sans-serif`

  const titleLines = wrapText(context, artwork.title, canvas.width, 2)
  let cursorY = 0

  titleLines.forEach((line) => {
    context.fillText(line, 0, cursorY)
    cursorY += titleFontSize * 1.18
  })

  context.fillStyle = '#5f584f'
  context.font = `400 ${artistFontSize}px Inter, Arial, sans-serif`
  cursorY += lineGap
  context.fillText(normalizeWhitespace(artwork.artist), 0, cursorY, canvas.width)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = LinearFilter
  texture.name = `artwork-label-${artwork.id}`

  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
  })
  const object = new Mesh(new PlaneGeometry(width, LABEL_HEIGHT), material)
  object.name = 'artwork-label'

  return { height: LABEL_HEIGHT, object }
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maximumWidth: number,
  maximumLines: number,
): string[] {
  const words = normalizeWhitespace(text).split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word

    if (context.measureText(candidate).width <= maximumWidth) {
      currentLine = candidate
      return
    }

    if (currentLine) lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)

  if (lines.length <= maximumLines) return lines

  const visibleLines = lines.slice(0, maximumLines)
  let finalLine = visibleLines[maximumLines - 1]

  while (
    finalLine.length > 0 &&
    context.measureText(`${finalLine}…`).width > maximumWidth
  ) {
    finalLine = finalLine.slice(0, -1)
  }

  visibleLines[maximumLines - 1] = `${finalLine.trimEnd()}…`
  return visibleLines
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}
