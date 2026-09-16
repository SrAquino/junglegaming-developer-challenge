import type { GameConfigSnapshot } from '../game/config/game-config.ts'
import type { MatchEndReason } from '../game/types/game.ts'

export interface PageRequest {
  page: number
  pageSize: number
}

export interface PaginatedResponse<TItem> {
  items: TItem[]
  page: number
  pageSize: number
  total: number
}

export interface MatchRecord {
  matchId: string
  playerId: string
  playedAt: string
  score: number
  activeDurationMs: number
  endReason: Exclude<MatchEndReason, 'abandoned'>
  configuration: GameConfigSnapshot
}

export interface MatchRegistrationRequest {
  matchId: string
  playerId: string
  playedAt: string
  score: number
  activeDurationMs: number
  endReason: Exclude<MatchEndReason, 'abandoned'>
  configuration: GameConfigSnapshot
}

export interface RankingEntry {
  rank: number
  playerId: string
  playerName: string
  score: number
  matchId: string
  configurationKey: string
  playedAt: string
}
