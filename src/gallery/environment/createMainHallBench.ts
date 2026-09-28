import { BoxGeometry, Group, Mesh, type Material } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  MAIN_HALL_BENCH_DEPTH,
  MAIN_HALL_BENCH_LENGTH,
} from './galleryLayout'

interface MainHallBenchOptions {
  cushionMaterial: Material
  frameMaterial: Material
}

const CUSHION_COUNT = 3
const CUSHION_GAP = 0.035
const CUSHION_HEIGHT = 0.2
const SEAT_HEIGHT = 0.48

export function createMainHallBench({
  cushionMaterial,
  frameMaterial,
}: MainHallBenchOptions): Group {
  const bench = new Group()
  bench.name = 'main-hall-upholstered-bench'

  const cushionWidth =
    (MAIN_HALL_BENCH_LENGTH - CUSHION_GAP * (CUSHION_COUNT - 1)) /
    CUSHION_COUNT
  const firstCushionX =
    -MAIN_HALL_BENCH_LENGTH / 2 + cushionWidth / 2

  for (let index = 0; index < CUSHION_COUNT; index += 1) {
    const cushion = new Mesh(
      new RoundedBoxGeometry(
        cushionWidth,
        CUSHION_HEIGHT,
        MAIN_HALL_BENCH_DEPTH,
        3,
        0.055,
      ),
      cushionMaterial,
    )
    cushion.name = 'main-hall-bench-cushion'
    cushion.position.set(
      firstCushionX + index * (cushionWidth + CUSHION_GAP),
      SEAT_HEIGHT,
      0,
    )
    bench.add(cushion)
  }

  const base = new Mesh(
    new BoxGeometry(
      MAIN_HALL_BENCH_LENGTH - 0.08,
      0.1,
      MAIN_HALL_BENCH_DEPTH - 0.1,
    ),
    frameMaterial,
  )
  base.name = 'main-hall-bench-base'
  base.position.y = SEAT_HEIGHT - CUSHION_HEIGHT / 2 - 0.05

  const supportGeometry = new BoxGeometry(
    0.13,
    0.3,
    MAIN_HALL_BENCH_DEPTH - 0.18,
  )
  for (const x of [-1.45, 0, 1.45]) {
    const support = new Mesh(supportGeometry, frameMaterial)
    support.name = 'main-hall-bench-support'
    support.position.set(x, 0.15, 0)
    bench.add(support)
  }

  bench.add(base)
  return bench
}
