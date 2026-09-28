import { onBeforeUnmount, onMounted, readonly, ref, shallowRef } from 'vue'
import type { Artwork } from '../domain/artwork'
import {
  createArtworkTextureCache,
  type ArtworkTextureCache,
} from '../gallery/artwork/createArtworkTextureCache'
import { createAnimationLoop } from '../gallery/core/createAnimationLoop'
import { createCamera } from '../gallery/core/createCamera'
import { createRenderer } from '../gallery/core/createRenderer'
import { createScene } from '../gallery/core/createScene'
import { syncRendererSize } from '../gallery/core/syncRendererSize'
import {
  createGalleryPrototype,
  type GalleryPrototype,
} from '../gallery/environment/createGalleryPrototype'
import {
  createGalleryArtworkPlan,
  getMainHallArtworkCount,
} from '../gallery/environment/createGalleryArtworkPlan'
import {
  createFirstPersonController,
  type FirstPersonController,
} from '../gallery/interaction/createFirstPersonController'
import { createArtworkCatalog } from '../services/createArtworkCatalog'

export type GalleryLoadStatus = 'error' | 'loading' | 'ready'

const INITIAL_LAYOUT_CANDIDATE_COUNT = 20

export function useGalleryExperience() {
  const container = shallowRef<HTMLElement | null>(null)
  const canvas = shallowRef<HTMLCanvasElement | null>(null)
  const isExploring = ref(false)
  const loadStatus = ref<GalleryLoadStatus>('loading')
  const loadError = ref('')
  const displayedArtworks = shallowRef<Artwork[]>([])
  let controller: FirstPersonController | undefined
  let prototype: GalleryPrototype | undefined
  let textureCache: ArtworkTextureCache | undefined
  let loadGallery: (() => Promise<void>) | undefined
  let disposeExperience: (() => void) | undefined

  const enterWithPointer = () => {
    if (loadStatus.value === 'ready') controller?.lock()
  }

  const enterWithKeyboard = () => {
    if (loadStatus.value === 'ready') controller?.activateKeyboard()
  }

  const retryLoad = () => {
    void loadGallery?.()
  }

  onMounted(() => {
    if (!container.value || !canvas.value) return

    const scene = createScene()
    const camera = createCamera(1)
    const renderer = createRenderer(canvas.value)
    const canvasElement = canvas.value
    let abortController: AbortController | undefined
    let isDisposed = false

    const stopAnimationLoop = createAnimationLoop((deltaSeconds) => {
      if (!container.value) return

      syncRendererSize(renderer, camera, container.value)
      controller?.update(deltaSeconds)
      prototype?.update({ x: camera.position.x, z: camera.position.z })
      renderer.render(scene, camera)
    })

    loadGallery = async () => {
      abortController?.abort()
      abortController = new AbortController()
      const { signal } = abortController

      controller?.dispose()
      controller = undefined
      prototype?.dispose()
      prototype = undefined
      textureCache?.dispose()
      textureCache = undefined
      isExploring.value = false
      displayedArtworks.value = []
      loadStatus.value = 'loading'
      loadError.value = ''

      try {
        const artworkCatalog = createArtworkCatalog({ signal })
        const candidates = await artworkCatalog.getRange(
          0,
          INITIAL_LAYOUT_CANDIDATE_COUNT,
        )
        const artworkPlan = createGalleryArtworkPlan(candidates)
        const mainHallArtworkCount = getMainHallArtworkCount(artworkPlan.mainHall)
        const artworks = await artworkCatalog.getRange(0, mainHallArtworkCount)
        textureCache = createArtworkTextureCache(renderer)
        const leases = await Promise.all(
          artworks.map((artwork) => textureCache!.acquire(artwork)),
        )
        const textures = leases.map(({ texture }) => texture)

        if (signal.aborted || isDisposed) {
          textureCache.dispose()
          textureCache = undefined
          return
        }

        prototype = await createGalleryPrototype(
          scene,
          artworks,
          textures,
          artworkPlan.mainHall,
          artworkCatalog,
          textureCache,
        )

        if (signal.aborted || isDisposed) {
          prototype.dispose()
          prototype = undefined
          textureCache.dispose()
          textureCache = undefined
          return
        }

        controller = createFirstPersonController({
          camera,
          collisionWorld: prototype.collisionWorld,
          domElement: canvasElement,
          onActiveChange: (isActive) => {
            isExploring.value = isActive
          },
        })
        displayedArtworks.value = artworkCatalog.getLoadedArtworks()
        loadStatus.value = 'ready'
      } catch (error) {
        if (isAbortError(error) || signal.aborted || isDisposed) return

        prototype?.dispose()
        prototype = undefined
        textureCache?.dispose()
        textureCache = undefined
        loadStatus.value = 'error'
        loadError.value =
          'The collection could not be loaded. Check your connection and try again.'
        console.error('Unable to prepare the gallery.', error)
      }
    }

    void loadGallery()

    disposeExperience = () => {
      isDisposed = true
      abortController?.abort()
      stopAnimationLoop()
      controller?.dispose()
      controller = undefined
      prototype?.dispose()
      prototype = undefined
      textureCache?.dispose()
      textureCache = undefined
      displayedArtworks.value = []
      renderer.dispose()
      loadGallery = undefined
    }
  })

  onBeforeUnmount(() => {
    disposeExperience?.()
  })

  return {
    canvas,
    container,
    displayedArtworks: readonly(displayedArtworks),
    enterWithKeyboard,
    enterWithPointer,
    isExploring: readonly(isExploring),
    loadError: readonly(loadError),
    loadStatus: readonly(loadStatus),
    retryLoad,
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
