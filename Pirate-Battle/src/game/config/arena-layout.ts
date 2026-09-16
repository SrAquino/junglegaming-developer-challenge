import type { Vector2 } from '../types/vector.ts'

export interface CircularObstacle {
  center: Vector2
  radius: number
}

export const centralIsland: Readonly<CircularObstacle> = Object.freeze({
  center: Object.freeze({ x: 880, y: 450 }),
  radius: 145,
})

export interface ArenaDecoration {
  kind: 'rock' | 'vegetation'
  position: Readonly<Vector2>
  scale: number
  blocksMovement: false
}

/** The central island is the only blocking feature. These items are visual markers inside it. */
export const centralIslandDecorations: readonly Readonly<ArenaDecoration>[] = Object.freeze([
  Object.freeze({ kind: 'vegetation', position: Object.freeze({ x: -52, y: -42 }), scale: 0.9, blocksMovement: false }),
  Object.freeze({ kind: 'vegetation', position: Object.freeze({ x: 42, y: 32 }), scale: 0.7, blocksMovement: false }),
  Object.freeze({ kind: 'vegetation', position: Object.freeze({ x: 8, y: -70 }), scale: 0.65, blocksMovement: false }),
  Object.freeze({ kind: 'rock', position: Object.freeze({ x: -82, y: 18 }), scale: 0.9, blocksMovement: false }),
  Object.freeze({ kind: 'rock', position: Object.freeze({ x: 60, y: -44 }), scale: 0.7, blocksMovement: false }),
  Object.freeze({ kind: 'rock', position: Object.freeze({ x: 20, y: 68 }), scale: 0.65, blocksMovement: false }),
])
