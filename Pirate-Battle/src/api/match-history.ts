import { apiClient } from './client.ts'
import type { MatchRecord, MatchRegistrationRequest, PaginatedResponse } from './contracts.ts'
import { saveConfirmedRecord } from '../storage/match-record-store.ts'
import { loadConfirmedRecords } from '../storage/match-record-store.ts'
import { fetchCompleteCollection, paginate } from './paginated-collection.ts'

export async function registerMatch(record: MatchRegistrationRequest): Promise<MatchRecord> {
  const response = await apiClient.post<MatchRecord>('/matches', record)
  saveConfirmedRecord(response.data)
  return response.data
}

export async function fetchMatchHistory(playerId: string, page: number, pageSize: number, signal?: AbortSignal): Promise<PaginatedResponse<MatchRecord>> {
  const remote = await fetchCompleteCollection({
    signal,
    fetchPage: async (remotePage, remotePageSize, config) => {
      const response = await apiClient.get<PaginatedResponse<MatchRecord>>(`/players/${encodeURIComponent(playerId)}/matches`, { ...config, params: { page: remotePage, pageSize: remotePageSize } })
      return response.data
    },
  })
  const combined = [...loadConfirmedRecords().filter((record) => record.playerId === playerId), ...remote.items]
  const deduplicated = Array.from(new Map(combined.map((record) => [record.matchId, record])).values()).sort((left, right) => right.playedAt.localeCompare(left.playedAt) || left.matchId.localeCompare(right.matchId))
  return paginate(deduplicated, page, pageSize, remote.serverTotal)
}
