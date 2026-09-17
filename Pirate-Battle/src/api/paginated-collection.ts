import type { AxiosRequestConfig } from 'axios'
import type { PaginatedResponse } from './contracts.ts'

const remotePageSize = 100

interface FetchCompleteCollectionOptions<TItem> {
  fetchPage: (page: number, pageSize: number, config: AxiosRequestConfig) => Promise<PaginatedResponse<TItem>>
  signal?: AbortSignal
}

/**
 * Fetches the authoritative remote collection before local reconciliation.
 * This avoids paginating an already paginated response and keeps server totals
 * useful even when a locally confirmed match is not visible in the mock yet.
 */
export async function fetchCompleteCollection<TItem>({ fetchPage, signal }: FetchCompleteCollectionOptions<TItem>): Promise<{ items: TItem[]; serverTotal: number }> {
  const first = await fetchPage(1, remotePageSize, { signal })
  const pageCount = Math.ceil(first.total / remotePageSize)
  const remaining = await Promise.all(Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => fetchPage(index + 2, remotePageSize, { signal })))
  return { items: [first, ...remaining].flatMap((response) => response.items), serverTotal: first.total }
}

export function paginate<TItem>(items: readonly TItem[], page: number, pageSize: number, serverTotal: number): PaginatedResponse<TItem> {
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total: Math.max(serverTotal, items.length),
  }
}
