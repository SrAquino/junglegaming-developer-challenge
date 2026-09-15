import type { Vector2 } from '../types/vector.ts'

export interface CircularObstacle {
  center: Vector2
  radius: number
}

export const centralIsland: Readonly<CircularObstacle> = Object.freeze({
  center: Object.freeze({ x: 880, y: 450 }),
  radius: 145,
})
