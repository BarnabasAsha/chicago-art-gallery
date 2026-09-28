import type { Artwork } from '../domain/artwork'

const API_BASE_URL = 'https://api.artic.edu/api/v1'
const IIIF_IMAGE_WIDTH = 843
const ARTWORK_FIELDS = [
  'id',
  'title',
  'artist_display',
  'image_id',
  'thumbnail',
  'is_public_domain',
].join(',')

interface FetchArtworkPageOptions {
  limit: number
  page: number
  signal?: AbortSignal
}

export interface ArtworkPage {
  artworks: Artwork[]
  currentPage: number
  totalPages: number
}

export async function fetchArtworkPage({
  limit,
  page,
  signal,
}: FetchArtworkPageOptions): Promise<ArtworkPage> {
  const parameters = new URLSearchParams({
    fields: ARTWORK_FIELDS,
    limit: String(Math.min(Math.max(limit, 1), 100)),
    page: String(Math.max(page, 1)),
    'query[term][is_public_domain]': 'true',
  })
  const response = await fetch(
    `${API_BASE_URL}/artworks/search?${parameters.toString()}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`Art Institute request failed with status ${response.status}.`)
  }

  const payload: unknown = await response.json()

  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error('The Art Institute returned an unexpected response.')
  }

  const config = isRecord(payload.config) ? payload.config : undefined
  const pagination = isRecord(payload.pagination) ? payload.pagination : undefined
  const iiifUrl = config?.iiif_url
  const currentPage = pagination?.current_page
  const totalPages = pagination?.total_pages

  if (
    typeof iiifUrl !== 'string' ||
    typeof currentPage !== 'number' ||
    typeof totalPages !== 'number'
  ) {
    throw new Error('The Art Institute response did not include pagination data.')
  }

  return {
    artworks: payload.data.flatMap((item) => {
      const artwork = normalizeArtwork(item, iiifUrl)
      return artwork ? [artwork] : []
    }),
    currentPage,
    totalPages,
  }
}

function normalizeArtwork(value: unknown, iiifUrl: string): Artwork | null {
  if (!isRecord(value) || value.is_public_domain !== true) return null

  const thumbnail = isRecord(value.thumbnail) ? value.thumbnail : undefined
  const id = value.id
  const title = value.title
  const imageId = value.image_id
  const width = thumbnail?.width
  const height = thumbnail?.height
  const placeholderUrl = thumbnail?.lqip

  if (
    (typeof id !== 'number' && typeof id !== 'string') ||
    typeof title !== 'string' ||
    typeof imageId !== 'string' ||
    typeof placeholderUrl !== 'string' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  const artist =
    typeof value.artist_display === 'string' && value.artist_display.trim()
      ? value.artist_display
      : 'Unknown artist'
  const suppliedAltText = thumbnail?.alt_text

  return {
    id: String(id),
    title,
    artist,
    image: {
      altText:
        typeof suppliedAltText === 'string' && suppliedAltText.trim()
          ? suppliedAltText
          : `${title} by ${artist}`,
      height,
      placeholderUrl,
      url: createIiifImageUrl(iiifUrl, imageId),
      width,
    },
  }
}

export function createIiifImageUrl(
  iiifUrl: string,
  imageId: string,
): string {
  const baseUrl = iiifUrl.replace(/\/$/, '')
  return `${baseUrl}/${encodeURIComponent(imageId)}/full/${IIIF_IMAGE_WIDTH},/0/default.jpg`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
