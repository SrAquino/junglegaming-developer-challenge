import type { GameConfigSnapshot } from '../config/game-config.ts'
import type { GameWorldState } from '../entities/entity.ts'
import type { RandomSource } from '../core/random-source.ts'
import type { PlayerInput } from '../types/game.ts'

export interface SimulationContext {
  config: GameConfigSnapshot
  world: GameWorldState
  input: Readonly<PlayerInput>
  random: RandomSource
}

export interface GameSystem {
  update(deltaMs: number, context: SimulationContext): void
}
