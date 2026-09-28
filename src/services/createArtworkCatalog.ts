import type { Artwork } from '../domain/artwork'
import { fetchArtworkPage } from './artInstituteApi'

const PAGE_SIZE = 100

export interface ArtworkCatalog {
  getRange: (start: number, count: number) => Promise<Artwork[]>
  getLoadedArtworks: () => Artwork[]
}

interface CreateArtworkCatalogOptions {
  signal?: AbortSignal
}

export function createArtworkCatalog({
  signal,
}: CreateArtworkCatalogOptions = {}): ArtworkCatalog {
  const artworks: Artwork[] = []
  const knownIds = new Set<string>()
  let nextPage = 1
  let totalPages = Number.POSITIVE_INFINITY
  let loading: Promise<void> = Promise.resolve()

  const loadUntil = async (requiredCount: number) => {
    while (artworks.length < requiredCount && nextPage <= totalPages) {
      const page = await fetchArtworkPage({
        limit: PAGE_SIZE,
        page: nextPage,
        signal,
      })

      totalPages = page.totalPages
      nextPage = page.currentPage + 1

      page.artworks.forEach((artwork) => {
        if (knownIds.has(artwork.id)) return
        knownIds.add(artwork.id)
        artworks.push(artwork)
      })
    }
  }

  const ensureCount = (requiredCount: number) => {
    loading = loading.then(() => loadUntil(requiredCount))
    return loading
  }

  return {
    async getRange(start, count) {
      const safeStart = Math.max(0, start)
      const safeCount = Math.max(0, count)
      await ensureCount(safeStart + safeCount)
      const range = artworks.slice(safeStart, safeStart + safeCount)

      if (range.length !== safeCount) {
        throw new Error('The Art Institute collection ran out of usable images.')
      }

      return range
    },
    getLoadedArtworks() {
      return [...artworks]
    },
  }
}
