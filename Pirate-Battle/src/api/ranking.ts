import { apiClient } from './client.ts'
import type { PaginatedResponse, RankingEntry } from './contracts.ts'

export async function fetchRanking(page: number, pageSize: number, configurationKey: string): Promise<PaginatedResponse<RankingEntry>> {
  const response = await apiClient.get<PaginatedResponse<RankingEntry>>('/ranking', { params: { page, pageSize, configurationKey } })
  return response.data
}
