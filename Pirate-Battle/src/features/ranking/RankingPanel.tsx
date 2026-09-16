import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRanking } from '../../api/ranking.ts'
import { queryKeys } from '../../api/queries/query-keys.ts'

interface RankingPanelProps { configurationKey: string }

export function RankingPanel({ configurationKey }: RankingPanelProps) {
  const [page, setPage] = useState(1)
  const pageSize = 5
  const query = useQuery({ queryKey: queryKeys.ranking(configurationKey, page, pageSize), queryFn: () => fetchRanking(page, pageSize, configurationKey), placeholderData: (previous) => previous })
  if (query.isPending) return <p>Loading ranking…</p>
  if (query.isError) return <section role="alert"><p>Unable to load ranking.</p><button onClick={() => query.refetch()} type="button">Retry ranking</button></section>
  if (!query.data || query.data.total === 0) return <p>No ranking entries for this configuration yet.</p>
  return <section aria-label="Ranking">{query.isFetching && <p aria-live="polite">Refreshing ranking…</p>}<ol className="data-list">{query.data.items.map((entry) => <li key={entry.matchId}><span>#{entry.rank} {entry.playerName}</span><strong>{entry.score}</strong></li>)}</ol><Pagination page={page} pageSize={pageSize} total={query.data.total} onPageChange={setPage} /></section>
}

interface PaginationProps { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  return <div className="pagination"><button disabled={page === 1} onClick={() => onPageChange(page - 1)} type="button">Previous page</button><span>Page {page} of {lastPage}</span><button disabled={page === lastPage} onClick={() => onPageChange(page + 1)} type="button">Next page</button></div>
}
