export interface ArtworkImage {
  altText: string
  height: number
  placeholderUrl: string
  url: string
  width: number
}

export interface Artwork {
  artist: string
  id: string
  image: ArtworkImage
  title: string
}
