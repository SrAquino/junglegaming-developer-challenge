import { apiClient } from './client.ts'
import type { PaginatedResponse, RankingEntry } from './contracts.ts'
import { gameplayConfigurationKey } from './gameplay-configuration-key.ts'
import { loadConfirmedRecords } from '../storage/match-record-store.ts'
import { getLocalPlayerIdentity } from '../storage/player-identity.ts'

export async function fetchRanking(page: number, pageSize: number, configurationKey: string): Promise<PaginatedResponse<RankingEntry>> {
  const response = await apiClient.get<PaginatedResponse<RankingEntry>>('/ranking', { params: { page, pageSize, configurationKey } })
  const player = getLocalPlayerIdentity()
  const combined = [...response.data.items, ...loadConfirmedRecords().filter((record) => gameplayConfigurationKey(record.configuration) === configurationKey).map((record): RankingEntry => ({ rank: 0, playerId: record.playerId, playerName: record.playerId === player.id ? player.name : record.playerId, score: record.score, matchId: record.matchId, configurationKey, playedAt: record.playedAt }))]
  const deduplicated = Array.from(new Map(combined.map((entry) => [entry.matchId, entry])).values()).sort((left, right) => right.score - left.score || left.matchId.localeCompare(right.matchId)).map((entry, index) => ({ ...entry, rank: index + 1 }))
  return { items: deduplicated.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: deduplicated.length }
}
