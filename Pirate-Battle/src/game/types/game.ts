import type { GameConfig } from '../config/game-config.ts'

export type MatchStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended'
export type MatchEndReason = 'time-expired' | 'player-destroyed' | 'abandoned'

export interface PlayerInput {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
  fireFront: boolean
  fireLeft: boolean
  fireRight: boolean
}

export interface MatchResult {
  matchId: string
  score: number
  activeDurationMs: number
  endReason: Exclude<MatchEndReason, 'abandoned'>
  configuration: GameConfig
}
