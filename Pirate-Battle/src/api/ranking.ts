import { apiClient } from './client.ts'
import type { PaginatedResponse, RankingEntry } from './contracts.ts'
import { gameplayConfigurationKey } from './gameplay-configuration-key.ts'
import { loadConfirmedRecords } from '../storage/match-record-store.ts'
import { getLocalPlayerIdentity } from '../storage/player-identity.ts'
import { fetchCompleteCollection, paginate } from './paginated-collection.ts'

export async function fetchRanking(page: number, pageSize: number, configurationKey: string, signal?: AbortSignal): Promise<PaginatedResponse<RankingEntry>> {
  const remote = await fetchCompleteCollection({
    signal,
    fetchPage: async (remotePage, remotePageSize, config) => {
      const response = await apiClient.get<PaginatedResponse<RankingEntry>>('/ranking', { ...config, params: { page: remotePage, pageSize: remotePageSize, configurationKey } })
      return response.data
    },
  })
  const player = getLocalPlayerIdentity()
  const localEntries = loadConfirmedRecords().filter((record) => gameplayConfigurationKey(record.configuration) === configurationKey).map((record): RankingEntry => ({ rank: 0, playerId: record.playerId, playerName: record.playerId === player.id ? player.name : record.playerId, score: record.score, matchId: record.matchId, configurationKey, playedAt: record.playedAt }))
  const deduplicated = Array.from(new Map([...localEntries, ...remote.items].map((entry) => [entry.matchId, entry])).values())
    .sort((left, right) => right.score - left.score || left.playedAt.localeCompare(right.playedAt) || left.matchId.localeCompare(right.matchId))
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
  return paginate(deduplicated, page, pageSize, remote.serverTotal)
}
