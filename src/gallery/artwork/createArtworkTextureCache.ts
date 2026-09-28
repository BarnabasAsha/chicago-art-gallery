import {
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type WebGLRenderer,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import { loadArtworkTexture } from './loadArtworkTextures'

export interface ArtworkTextureLease {
  release: () => void
  texture: Texture
}

export interface ArtworkTextureCache {
  acquire: (artwork: Artwork) => Promise<ArtworkTextureLease>
  dispose: () => void
}

interface CacheEntry {
  lastUsed: number
  promise: Promise<Texture>
  references: number
  texture?: Texture
}

export function createArtworkTextureCache(
  renderer: WebGLRenderer,
  maximumEntries = 64,
): ArtworkTextureCache {
  const loader = new TextureLoader()
  const entries = new Map<string, CacheEntry>()
  const maximumAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
  let clock = 0
  let isDisposed = false

  const evictUnusedEntries = () => {
    while (entries.size > maximumEntries) {
      const candidate = [...entries.entries()]
        .filter(([, entry]) => entry.references === 0 && entry.texture)
        .sort(([, first], [, second]) => first.lastUsed - second.lastUsed)[0]

      if (!candidate) return
      const [id, entry] = candidate
      entry.texture?.dispose()
      entries.delete(id)
    }
  }

  return {
    async acquire(artwork) {
      if (isDisposed) throw new Error('The artwork texture cache was disposed.')

      let entry = entries.get(artwork.id)

      if (!entry) {
        const nextEntry: CacheEntry = {
          lastUsed: ++clock,
          references: 0,
          promise: Promise.resolve(undefined as unknown as Texture),
        }
        nextEntry.promise = loadArtworkTexture(loader, artwork).then((texture) => {
          texture.name = `artwork-texture-${artwork.id}`
          texture.colorSpace = SRGBColorSpace
          texture.anisotropy = maximumAnisotropy

          if (isDisposed) {
            texture.dispose()
            throw new Error('The artwork texture cache was disposed.')
          }

          nextEntry.texture = texture
          evictUnusedEntries()
          return texture
        }).catch((error: unknown) => {
          entries.delete(artwork.id)
          throw error
        })
        entry = nextEntry
        entries.set(artwork.id, entry)
      }

      entry.references += 1
      entry.lastUsed = ++clock

      try {
        const texture = await entry.promise
        let isReleased = false

        return {
          texture,
          release() {
            if (isReleased) return
            isReleased = true
            entry.references = Math.max(0, entry.references - 1)
            entry.lastUsed = ++clock
            evictUnusedEntries()
          },
        }
      } catch (error) {
        entry.references = Math.max(0, entry.references - 1)
        throw error
      }
    },
    dispose() {
      isDisposed = true
      entries.forEach((entry) => entry.texture?.dispose())
      entries.clear()
    },
  }
}
