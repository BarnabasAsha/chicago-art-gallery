import type { ArtworkImage } from '../../domain/artwork'

export interface DisplayBounds {
  height: number
  width: number
}

export function fitArtworkWithinBounds(
  image: ArtworkImage,
  bounds: DisplayBounds,
): DisplayBounds {
  assertPositiveDimensions(image, 'Artwork image')
  assertPositiveDimensions(bounds, 'Display bounds')

  const scale = Math.min(
    bounds.width / image.width,
    bounds.height / image.height,
  )

  return {
    width: image.width * scale,
    height: image.height * scale,
  }
}

function assertPositiveDimensions(
  dimensions: DisplayBounds,
  label: string,
): void {
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    throw new RangeError(`${label} dimensions must be greater than zero.`)
  }
}
