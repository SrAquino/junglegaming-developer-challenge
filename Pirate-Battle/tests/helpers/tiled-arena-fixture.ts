import type { GameConfigSnapshot } from '../../src/game/config/game-config.ts'
import { defaultGameConfig } from '../../src/game/config/game-config.ts'

const rectangles = [
  [128, 0, 580, 64], [322, 66, 250, 250], [570, 64, 134, 62],
  [1026, 186, 252, 258], [894, 766, 254, 132], [1216, 706, 254, 188], [1150, 834, 66, 62],
] as const

export const tiledArenaTestConfig: GameConfigSnapshot = Object.freeze({
  ...defaultGameConfig,
  arena: Object.freeze({
    width: 1_600,
    height: 896,
    collisionPolygons: Object.freeze(rectangles.map(([x, y, width, height]) => Object.freeze([
      Object.freeze({ x, y }), Object.freeze({ x: x + width, y }),
      Object.freeze({ x: x + width, y: y + height }), Object.freeze({ x, y: y + height }),
    ]))),
  }),
})
