import { apiClient } from './client.ts'
import type { MatchRecord, MatchRegistrationRequest, PaginatedResponse } from './contracts.ts'
import { saveConfirmedRecord } from '../storage/match-record-store.ts'
import { loadConfirmedRecords } from '../storage/match-record-store.ts'

export async function registerMatch(record: MatchRegistrationRequest): Promise<MatchRecord> {
  const response = await apiClient.post<MatchRecord>('/matches', record)
  saveConfirmedRecord(response.data)
  return response.data
}

export async function fetchMatchHistory(playerId: string, page: number, pageSize: number): Promise<PaginatedResponse<MatchRecord>> {
  const response = await apiClient.get<PaginatedResponse<MatchRecord>>(`/players/${encodeURIComponent(playerId)}/matches`, { params: { page, pageSize } })
  const combined = [...response.data.items, ...loadConfirmedRecords().filter((record) => record.playerId === playerId)]
  const deduplicated = Array.from(new Map(combined.map((record) => [record.matchId, record])).values()).sort((left, right) => right.playedAt.localeCompare(left.playedAt) || left.matchId.localeCompare(right.matchId))
  return { items: deduplicated.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: deduplicated.length }
}
