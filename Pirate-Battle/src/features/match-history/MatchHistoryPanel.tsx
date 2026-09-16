import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMatchHistory } from '../../api/match-history.ts'
import { queryKeys } from '../../api/queries/query-keys.ts'
import { Pagination } from '../ranking/RankingPanel.tsx'

interface MatchHistoryPanelProps { playerId: string }

export function MatchHistoryPanel({ playerId }: MatchHistoryPanelProps) {
  const [page, setPage] = useState(1)
  const pageSize = 5
  const query = useQuery({ queryKey: queryKeys.matchHistory(playerId, page, pageSize), queryFn: () => fetchMatchHistory(playerId, page, pageSize), placeholderData: (previous) => previous })
  if (query.isPending) return <p>Loading match history…</p>
  if (query.isError) return <section role="alert"><p>Unable to load match history.</p><button onClick={() => query.refetch()} type="button">Retry history</button></section>
  if (!query.data || query.data.total === 0) return <p>No completed matches yet.</p>
  return <section aria-label="Match History">{query.isFetching && <p aria-live="polite">Refreshing match history…</p>}<ol className="data-list">{query.data.items.map((record) => <li key={record.matchId}><span>{new Date(record.playedAt).toLocaleDateString()} · {record.endReason === 'time-expired' ? 'Time expired' : 'Ship destroyed'} · {(record.activeDurationMs / 1_000).toFixed(1)}s</span><strong>{record.score}</strong></li>)}</ol><Pagination page={page} pageSize={pageSize} total={query.data.total} onPageChange={setPage} /></section>
}
