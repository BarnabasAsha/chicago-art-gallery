import { Group, type Material } from 'three'
import type { Artwork } from '../../domain/artwork'
import { createArtworkDisplay } from './createArtworkDisplay'
import type { DisplayBounds } from './fitArtworkWithinBounds'
import { getCenteredRowOffsets } from './getCenteredRowOffsets'

interface ArtworkRowOptions {
  artworks: Artwork[]
  artworkMaterials: Material[]
  frameMaterial: Material
  gap: number
  maxArtworkSize: DisplayBounds
}

export function createArtworkRow({
  artworks,
  artworkMaterials,
  frameMaterial,
  gap,
  maxArtworkSize,
}: ArtworkRowOptions): Group {
  if (artworks.length !== artworkMaterials.length) {
    throw new Error('Every artwork in a row requires a material.')
  }

  const row = new Group()
  row.name = 'artwork-row'

  const displays = artworks.map((artwork, index) =>
    createArtworkDisplay({
      artwork,
      artworkMaterial: artworkMaterials[index],
      frameMaterial,
      maxArtworkSize,
    }),
  )
  const offsets = getCenteredRowOffsets(
    displays.map((display) => display.width),
    gap,
  )

  displays.forEach((display, index) => {
    display.object.position.x = offsets[index]
    row.add(display.object)
  })

  return row
}
