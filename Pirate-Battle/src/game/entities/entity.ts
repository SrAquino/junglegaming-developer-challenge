import type { Vector2 } from '../types/vector.ts'

export interface GameEntity {
  id: string
  position: Vector2
  rotation: number
  health: number
  maxHealth: number
}
