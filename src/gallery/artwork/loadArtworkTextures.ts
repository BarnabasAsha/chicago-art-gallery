import {
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type WebGLRenderer,
} from 'three'
import type { Artwork } from '../../domain/artwork'

export interface LoadedArtwork {
  artwork: Artwork
  texture: Texture
}

export async function loadAvailableArtworkTextures(
  artworks: Artwork[],
  renderer: WebGLRenderer,
  requiredCount: number,
): Promise<LoadedArtwork[]> {
  const loader = new TextureLoader()
  const maximumAnisotropy = Math.min(
    renderer.capabilities.getMaxAnisotropy(),
    8,
  )
  const results = await Promise.allSettled(
    artworks.map(async (artwork): Promise<LoadedArtwork> => {
      const texture = await loadArtworkTexture(loader, artwork)
      texture.name = `artwork-texture-${artwork.id}`
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = maximumAnisotropy
      return { artwork, texture }
    }),
  )
  const loaded = results.flatMap((result) =>
    result.status === 'fulfilled' ? [result.value] : [],
  )

  if (loaded.length < requiredCount) {
    loaded.forEach(({ texture }) => texture.dispose())
    throw new Error('Not enough artwork images could be loaded.')
  }

  const selected = loaded.slice(0, requiredCount)
  loaded
    .slice(requiredCount)
    .forEach(({ texture }) => texture.dispose())

  return selected
}

export async function loadArtworkTexture(
  loader: TextureLoader,
  artwork: Artwork,
): Promise<Texture> {
  try {
    return await loader.loadAsync(artwork.image.url)
  } catch {
    return loader.loadAsync(artwork.image.placeholderUrl)
  }
}
