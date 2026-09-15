import type { GameConfigSnapshot } from '../config/game-config.ts'

export type MatchStatus = 'idle' | 'playing' | 'paused' | 'ended'
export type CompletedMatchEndReason = 'time-expired' | 'player-destroyed'
export type MatchEndReason = CompletedMatchEndReason | 'abandoned'

export interface PlayerInput {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
  fireFront: boolean
  fireLeft: boolean
  fireRight: boolean
}

export const emptyPlayerInput: Readonly<PlayerInput> = Object.freeze({
  forward: false,
  turnLeft: false,
  turnRight: false,
  fireFront: false,
  fireLeft: false,
  fireRight: false,
})

export interface HudSnapshot {
  status: MatchStatus
  score: number
  remainingSeconds: number
  playerHealth: number
  playerMaxHealth: number
}

export interface MatchResult {
  matchId: string
  score: number
  activeDurationMs: number
  endReason: CompletedMatchEndReason
  configuration: GameConfigSnapshot
}

export type MatchLifecycleEvent =
  | { type: 'started'; matchId: string }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'ended'; reason: MatchEndReason; result: MatchResult | null }
