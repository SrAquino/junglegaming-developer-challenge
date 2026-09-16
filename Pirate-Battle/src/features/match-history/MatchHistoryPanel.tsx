import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMatchHistory } from '../../api/match-history.ts'
import { queryKeys } from '../../api/queries/query-keys.ts'
import { Pagination } from '../ranking/RankingPanel.tsx'

interface MatchHistoryPanelProps { playerId: string }

export function MatchHistoryPanel({ playerId }: MatchHistoryPanelProps) {
  const [page, setPage] = useState(1)
  const pageSize = 5
  const query = useQuery({ queryKey: queryKeys.matchHistory(playerId, page, pageSize), queryFn: () => fetchMatchHistory(playerId, page, pageSize), placeholderData: (previous) => previous })
  useEffect(() => { const refresh = () => void query.refetch(); window.addEventListener('pirate-network-scenario-change', refresh); return () => window.removeEventListener('pirate-network-scenario-change', refresh) }, [query])
  if (query.isPending) return <p>Loading match historyâ€¦</p>
  if (query.isError) return <section role="alert"><p>Unable to load match history.</p><button onClick={() => query.refetch()} type="button">Retry history</button></section>
  if (!query.data || query.data.total === 0) return <p>No completed matches yet.</p>
  return <section aria-label="Match History">{query.isFetching && <p aria-live="polite">Refreshing match historyâ€¦</p>}<p className="logbook-caption">Your recent battles</p><div aria-label="Completed matches" className="logbook-table history-table" role="table"><div className="logbook-row logbook-heading" role="row"><span role="columnheader">Date</span><span role="columnheader">Points</span><span role="columnheader">Duration</span><span role="columnheader">Result</span></div>{query.data.items.map((record) => <div className="logbook-row" key={record.matchId} role="row"><time dateTime={record.playedAt} role="cell">{formatPlayedAt(record.playedAt)}</time><strong role="cell">{record.score}</strong><time role="cell">{formatDuration(record.activeDurationMs)}</time><span className={record.endReason === 'time-expired' ? 'result-time-up' : 'result-defeated'} role="cell">{record.endReason === 'time-expired' ? 'Time up' : 'Defeated'}</span></div>)}</div><Pagination page={page} pageSize={pageSize} total={query.data.total} onPageChange={setPage} /></section>
}

function formatPlayedAt(value: string): string { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)).toUpperCase() }

function formatDuration(milliseconds: number): string { const totalSeconds = Math.round(milliseconds / 1_000); return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}` }
