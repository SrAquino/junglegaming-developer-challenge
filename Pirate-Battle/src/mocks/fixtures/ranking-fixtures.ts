import { defaultGameConfig } from '../../game/config/game-config.ts'
import { gameplayConfigurationKey } from '../../api/gameplay-configuration-key.ts'
import type { MatchRecord } from '../../api/contracts.ts'

const configurationKey = gameplayConfigurationKey(defaultGameConfig)

export const fixturePlayers: Readonly<Record<string, string>> = Object.freeze({
  'fixture-anne': 'Anne Bonny',
  'fixture-blackbeard': 'Blackbeard',
  'fixture-mary': 'Mary Read',
  'fixture-barbossa': 'Hector Barbossa',
})

export const fixtureRecords: readonly MatchRecord[] = Object.freeze([
  { matchId: 'fixture-1', playerId: 'fixture-anne', playedAt: '2026-09-10T12:00:00.000Z', score: 14, activeDurationMs: 91_000, endReason: 'time-expired', configuration: defaultGameConfig },
  { matchId: 'fixture-2', playerId: 'fixture-blackbeard', playedAt: '2026-09-11T12:00:00.000Z', score: 12, activeDurationMs: 80_000, endReason: 'player-destroyed', configuration: defaultGameConfig },
  { matchId: 'fixture-3', playerId: 'fixture-mary', playedAt: '2026-09-12T12:00:00.000Z', score: 9, activeDurationMs: 110_000, endReason: 'time-expired', configuration: defaultGameConfig },
  { matchId: 'fixture-4', playerId: 'fixture-barbossa', playedAt: '2026-09-13T12:00:00.000Z', score: 7, activeDurationMs: 72_000, endReason: 'player-destroyed', configuration: defaultGameConfig },
])

export { configurationKey as fixtureConfigurationKey }
