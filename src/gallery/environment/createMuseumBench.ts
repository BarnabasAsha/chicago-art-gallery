import { BoxGeometry, Group, Mesh, type Material } from 'three'

interface MuseumBenchOptions {
  depth: number
  length: number
  material: Material
}

const SEAT_HEIGHT = 0.48
const SEAT_THICKNESS = 0.14
const SUPPORT_THICKNESS = 0.14
const SUPPORT_INSET = 0.12

export function createMuseumBench({
  depth,
  length,
  material,
}: MuseumBenchOptions): Group {
  const bench = new Group()
  bench.name = 'museum-bench'

  const seat = new Mesh(
    new BoxGeometry(length, SEAT_THICKNESS, depth),
    material,
  )
  seat.name = 'bench-stone-seat'
  seat.position.y = SEAT_HEIGHT

  const supportHeight = SEAT_HEIGHT - SEAT_THICKNESS / 2
  const supportGeometry = new BoxGeometry(
    SUPPORT_THICKNESS,
    supportHeight,
    depth,
  )
  const supportX = length / 2 - SUPPORT_INSET - SUPPORT_THICKNESS / 2
  for (const x of [-supportX, supportX]) {
    const support = new Mesh(supportGeometry, material)
    support.name = 'bench-end-support'
    support.position.set(x, supportHeight / 2, 0)
    bench.add(support)
  }

  bench.add(seat)
  return bench
}
