import { Timer } from 'three'

export type FrameCallback = (deltaSeconds: number) => void

const MAX_DELTA_SECONDS = 0.1

export function createAnimationLoop(onFrame: FrameCallback): () => void {
  const timer = new Timer()
  let animationFrameId = 0

  timer.connect(document)

  const tick = (timestamp: number) => {
    animationFrameId = window.requestAnimationFrame(tick)
    timer.update(timestamp)
    const deltaSeconds = Math.min(timer.getDelta(), MAX_DELTA_SECONDS)

    onFrame(deltaSeconds)
  }

  animationFrameId = window.requestAnimationFrame(tick)

  return () => {
    window.cancelAnimationFrame(animationFrameId)
    timer.dispose()
  }
}
