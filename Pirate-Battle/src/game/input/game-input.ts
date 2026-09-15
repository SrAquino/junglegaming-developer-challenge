import type { PlayerInput } from '../types/game.ts'

export interface GameInput {
  getSnapshot(): Readonly<PlayerInput>
  reset(): void
  destroy(): void
}
