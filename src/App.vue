<script setup lang="ts">
import { nextTick, shallowRef, watch } from 'vue'
import styles from './App.module.css'
import { useGalleryExperience } from './composables/useGalleryExperience'

const galleryExperience = useGalleryExperience()
const {
  displayedArtworks,
  enterWithKeyboard,
  enterWithPointer,
  isExploring,
  loadError,
  loadStatus,
  retryLoad,
} = galleryExperience
const entryButton = shallowRef<HTMLButtonElement | null>(null)

function handleEntry(event: MouseEvent) {
  if (event.detail === 0) {
    enterWithKeyboard()
    return
  }

  enterWithPointer()
}

watch(isExploring, async (isActive) => {
  if (isActive) return

  await nextTick()
  entryButton.value?.focus()
})

watch(loadStatus, async (status) => {
  if (status !== 'ready') return

  await nextTick()
  entryButton.value?.focus()
})

</script>

<template>
  <main :ref="galleryExperience.container" :class="styles.app">
    <canvas
      :ref="galleryExperience.canvas"
      :class="styles.canvas"
      aria-label="Interactive three-dimensional art gallery"
      tabindex="-1"
    />

    <Transition
      :enter-active-class="styles.overlayEnterActive"
      :enter-from-class="styles.overlayEnterFrom"
      :leave-active-class="styles.overlayLeaveActive"
      :leave-to-class="styles.overlayLeaveTo"
    >
      <div
        v-if="!isExploring"
        :class="[
          styles.entryOverlay,
          loadStatus === 'ready'
            ? styles.entryOverlayReady
            : styles.entryOverlayLoading,
      ]"
    >
      <div
        v-if="loadStatus === 'loading'"
        :class="styles.loadingOnly"
        role="status"
      >
        <span :class="styles.loadingTrack" aria-hidden="true">
          <span :class="styles.loadingProgress" />
        </span>
        <span :class="styles.visuallyHidden">Preparing the gallery</span>
      </div>

      <section
        v-else
        :key="loadStatus"
        :class="styles.entryContent"
        aria-labelledby="gallery-title"
        >
          <p :class="styles.entryEyebrow">Art Institute of Chicago</p>
          <h1 id="gallery-title" :class="styles.entryTitle">Virtual Gallery</h1>

          <div :class="styles.entryAction">
            <div v-if="loadStatus === 'error'" :class="styles.loadError">
              <p role="alert">{{ loadError }}</p>
              <button type="button" :class="styles.entryButton" @click="retryLoad">
                Try again
              </button>
            </div>

            <template v-else>
              <button
                ref="entryButton"
                type="button"
                :class="styles.entryButton"
                aria-describedby="gallery-instructions"
                @click="handleEntry"
              >
                <span>Enter the gallery</span>
                <span aria-hidden="true">→</span>
              </button>
              <p id="gallery-instructions" :class="styles.instructions">
                Use W, A, S, D to move · Mouse or arrow keys to look · Escape to pause
              </p>
            </template>
          </div>
        </section>
      </div>
    </Transition>

    <template v-if="isExploring">
      <span :class="styles.reticle" aria-hidden="true" />
      <aside :class="styles.controls" aria-label="Gallery controls">
        <div :class="styles.controlsHeader">
          <p :class="styles.controlsTitle">Navigate</p>
          <span :class="styles.controlsHint">Keyboard</span>
        </div>
        <dl :class="styles.controlsList">
          <div>
            <dt><kbd>W</kbd><kbd>S</kbd></dt>
            <dd>Forward / back</dd>
          </div>
          <div>
            <dt><kbd>A</kbd><kbd>D</kbd></dt>
            <dd>Move sideways</dd>
          </div>
          <div>
            <dt><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd></dt>
            <dd>Look around</dd>
          </div>
          <div>
            <dt><kbd>Esc</kbd></dt>
            <dd>Pause</dd>
          </div>
        </dl>
      </aside>
    </template>

    <section
      :class="styles.visuallyHidden"
      aria-label="Artworks currently displayed"
    >
      <h2>Artworks currently displayed</h2>
      <ul>
        <li v-for="artwork in displayedArtworks" :key="artwork.id">
          <h3>{{ artwork.title }}</h3>
          <p>{{ artwork.artist }}</p>
          <p>{{ artwork.image.altText }}</p>
        </li>
      </ul>
    </section>

    <p v-if="isExploring" :class="styles.status">
      <span :class="styles.statusMark" aria-hidden="true" />
      Art Institute of Chicago · Open Access Collection
    </p>
  </main>
</template>
