import { apiClient } from './client.ts'
import type { MatchRecord, MatchRegistrationRequest, PaginatedResponse } from './contracts.ts'
import { saveConfirmedRecord } from '../storage/match-record-store.ts'

export async function registerMatch(record: MatchRegistrationRequest): Promise<MatchRecord> {
  const response = await apiClient.post<MatchRecord>('/matches', record)
  saveConfirmedRecord(response.data)
  return response.data
}

export async function fetchMatchHistory(playerId: string, page: number, pageSize: number): Promise<PaginatedResponse<MatchRecord>> {
  const response = await apiClient.get<PaginatedResponse<MatchRecord>>(`/players/${encodeURIComponent(playerId)}/matches`, { params: { page, pageSize } })
  return response.data
}
