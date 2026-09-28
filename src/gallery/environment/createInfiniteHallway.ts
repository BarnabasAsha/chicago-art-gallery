import {
  type BufferGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Texture,
} from 'three'
import type { Artwork } from '../../domain/artwork'
import type { ArtworkCatalog } from '../../services/createArtworkCatalog'
import type {
  ArtworkTextureCache,
  ArtworkTextureLease,
} from '../artwork/createArtworkTextureCache'
import type { CollisionWorld, Point2D } from '../interaction/movement'
import {
  createGalleryCollisionWorld,
  syncGalleryCollisionWorld,
} from './createGalleryCollisionWorld'
import { createHallwayRestSection } from './createHallwayRestSection'
import { createHallwayCorner } from './createHallwayCorner'
import { createHallwaySegment } from './createHallwaySegment'
import {
  createHallwayRoute,
  type HallwayRouteSection,
} from './hallwaySectionLayout'

interface InfiniteHallwayOptions {
  artworkCatalog: ArtworkCatalog
  artworkStartIndex: number
  benchMaterial: Material
  ceilingMaterial: Material
  floorMaterial: Material
  frameMaterial: Material
  lightFixtureMaterial: Material
  textureCache: ArtworkTextureCache
  wallMaterials: readonly Material[]
}

interface ActiveSection {
  artworkMaterials: Material[]
  leases: ArtworkTextureLease[]
  object: Group
}

export interface InfiniteHallway {
  collisionWorld: CollisionWorld
  dispose: () => void
  object: Group
  update: (visitorPosition: Point2D) => void
}

export async function createInfiniteHallway({
  artworkCatalog,
  artworkStartIndex,
  benchMaterial,
  ceilingMaterial,
  floorMaterial,
  frameMaterial,
  lightFixtureMaterial,
  textureCache,
  wallMaterials,
}: InfiniteHallwayOptions): Promise<InfiniteHallway> {
  if (wallMaterials.length === 0) {
    throw new Error('The infinite hallway requires at least one wall material.')
  }

  const object = new Group()
  object.name = 'infinite-gallery-hallway'
  const activeSections = new Map<number, ActiveSection>()
  const pendingSections = new Set<number>()
  const route = createHallwayRoute()
  const collisionWorld = createGalleryCollisionWorld([])
  let desiredIndices = new Set<number>()
  let activeRangeKey = ''
  let isDisposed = false
  let currentSectionIndex = 0

  const createSection = async (
    routeSection: HallwayRouteSection,
  ): Promise<ActiveSection> => {
    const { artworkCount, artworkOffset, colorZoneIndex, index } = routeSection
    const artworks = await artworkCatalog.getRange(
      artworkStartIndex + artworkOffset,
      artworkCount,
    )
    const leases = await acquireTextureLeases(textureCache, artworks)
    const artworkMaterials = leases.map(
      ({ texture }) => new MeshStandardMaterial({ map: texture, roughness: 0.72 }),
    )
    const wallMaterial = wallMaterials[
      colorZoneIndex % wallMaterials.length
    ]

    const section = routeSection.type === 'rest'
      ? createHallwayRestSection({
          artworks,
          artworkMaterials,
          benchMaterial,
          ceilingMaterial,
          floorMaterial,
          frameMaterial,
          lightFixtureMaterial,
          wallMaterial,
        })
      : routeSection.type === 'straight'
        ? createHallwaySegment({
          artworks,
          artworkMaterials,
          ceilingMaterial,
          floorMaterial,
          frameMaterial,
          lightFixtureMaterial,
          segmentIndex: index,
          wallMaterial,
        })
        : createHallwayCorner({
            artworks,
            artworkMaterials,
            ceilingMaterial,
            floorMaterial,
            frameMaterial,
            lightFixtureMaterial,
            turn: routeSection.type === 'corner-left' ? 'left' : 'right',
            wallMaterial,
          })

    section.position.set(routeSection.position.x, 0, routeSection.position.z)
    section.rotation.y = routeSection.rotationY
    return { artworkMaterials, leases, object: section }
  }

  const loadSection = async (routeSection: HallwayRouteSection) => {
    const { index } = routeSection
    if (pendingSections.has(index) || activeSections.has(index)) return
    pendingSections.add(index)

    try {
      const section = await createSection(routeSection)

      if (isDisposed || !desiredIndices.has(index)) {
        disposeActiveSection(section)
        return
      }

      activeSections.set(index, section)
      object.add(section.object)
    } catch (error) {
      if (!isDisposed) console.error(`Unable to load hallway section ${index}.`, error)
    } finally {
      pendingSections.delete(index)
    }
  }

  const update = (visitorPosition: Point2D) => {
    const routeWindow = route.getActiveSections(
      visitorPosition,
      currentSectionIndex,
    )
    currentSectionIndex = routeWindow.currentSectionIndex
    const activeSectionsForRoute = routeWindow.sections
    const activeIndices = activeSectionsForRoute.map(({ index }) => index)
    const nextRangeKey = activeIndices.join(',')
    if (nextRangeKey === activeRangeKey) return

    desiredIndices = new Set(activeIndices)
    activeSections.forEach((section, index) => {
      if (desiredIndices.has(index)) return
      object.remove(section.object)
      disposeActiveSection(section)
      activeSections.delete(index)
    })

    activeSectionsForRoute.forEach((section) => void loadSection(section))
    syncGalleryCollisionWorld(collisionWorld, activeSectionsForRoute)
    activeRangeKey = nextRangeKey
  }

  const initialWindow = route.getActiveSections({ x: 0, z: 0 }, 0)
  const initialSections = initialWindow.sections
  const initialIndices = initialSections.map(({ index }) => index)
  desiredIndices = new Set(initialIndices)
  syncGalleryCollisionWorld(collisionWorld, initialSections)
  await Promise.all(initialSections.map(loadSection))
  activeRangeKey = initialIndices.join(',')

  return {
    collisionWorld,
    object,
    update,
    dispose() {
      isDisposed = true
      desiredIndices.clear()
      activeSections.forEach(disposeActiveSection)
      activeSections.clear()
      object.clear()
    },
  }
}

async function acquireTextureLeases(
  cache: ArtworkTextureCache,
  artworks: Artwork[],
): Promise<ArtworkTextureLease[]> {
  const results = await Promise.allSettled(
    artworks.map((artwork) => cache.acquire(artwork)),
  )
  const failed = results.find((result) => result.status === 'rejected')

  if (failed) {
    results.forEach((result) => {
      if (result.status === 'fulfilled') result.value.release()
    })
    throw failed.reason
  }

  return results.map((result) =>
    (result as PromiseFulfilledResult<ArtworkTextureLease>).value,
  )
}

function disposeActiveSection(section: ActiveSection): void {
  disposeSectionGeometry(section.object)
  section.artworkMaterials.forEach((material) => material.dispose())
  section.leases.forEach((lease) => lease.release())
}

function disposeSectionGeometry(section: Group): void {
  const geometries = new Set<BufferGeometry>()

  section.traverse((object) => {
    if (!(object instanceof Mesh)) return
    geometries.add(object.geometry)
    if (object.name !== 'artwork-label') return

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material]
    materials.forEach((material) => {
      const texture = (material as Material & { map?: Texture | null }).map
      texture?.dispose()
      material.dispose()
    })
  })

  geometries.forEach((geometry) => geometry.dispose())
}
