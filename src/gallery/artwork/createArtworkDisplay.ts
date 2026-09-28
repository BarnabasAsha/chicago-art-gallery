import {
  BoxGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  type Material,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import {
  fitArtworkWithinBounds,
  type DisplayBounds,
} from './fitArtworkWithinBounds'
import { createArtworkLabel } from './createArtworkLabel'
import { ARTWORK_FRAME_BORDER } from './artworkDisplayConfig'

interface ArtworkDisplayOptions {
  artwork: Artwork
  artworkMaterial: Material
  frameMaterial: Material
  maxArtworkSize: DisplayBounds
}

export interface ArtworkDisplay {
  height: number
  object: Group
  width: number
}

const FRAME_DEPTH = 0.065
const ARTWORK_SURFACE_OFFSET = FRAME_DEPTH / 2 + 0.006
const LABEL_GAP = 0.12
const MINIMUM_LABEL_WIDTH = 1.1

export function createArtworkDisplay({
  artwork,
  artworkMaterial,
  frameMaterial,
  maxArtworkSize,
}: ArtworkDisplayOptions): ArtworkDisplay {
  const artworkSize = fitArtworkWithinBounds(artwork.image, maxArtworkSize)
  const outerWidth = artworkSize.width + ARTWORK_FRAME_BORDER * 2
  const outerHeight = artworkSize.height + ARTWORK_FRAME_BORDER * 2
  const object = new Group()
  object.name = `artwork-${artwork.id}`
  object.userData.artworkId = artwork.id

  const frame = new Mesh(
    new BoxGeometry(outerWidth, outerHeight, FRAME_DEPTH),
    frameMaterial,
  )
  frame.name = 'frame'

  const imageSurface = new Mesh(
    new PlaneGeometry(artworkSize.width, artworkSize.height),
    artworkMaterial,
  )
  imageSurface.name = 'image-surface'
  imageSurface.position.z = ARTWORK_SURFACE_OFFSET

  const labelWidth = Math.max(outerWidth, MINIMUM_LABEL_WIDTH)
  const label = createArtworkLabel({ artwork, width: labelWidth })
  label.object.position.set(
    -outerWidth / 2 + labelWidth / 2,
    -outerHeight / 2 - LABEL_GAP - label.height / 2,
    ARTWORK_SURFACE_OFFSET,
  )

  object.add(frame, imageSurface, label.object)

  return {
    height: outerHeight,
    object,
    width: outerWidth,
  }
}
