import type { GameConfig } from '../config/game-config.ts'
import type { MatchStatus, PlayerInput } from '../types/game.ts'

export interface GameSession {
  readonly status: MatchStatus
  start(configuration: Readonly<GameConfig>): void
  update(deltaMs: number, input: Readonly<PlayerInput>): void
  pause(): void
  resume(): void
  destroy(): void
}
