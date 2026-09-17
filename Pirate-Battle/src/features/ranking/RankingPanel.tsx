import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchRanking } from '../../api/ranking.ts'
import { queryKeys } from '../../api/queries/query-keys.ts'

interface RankingPanelProps { configurationKey: string; configurationLabel: string; playerId: string }

export function RankingPanel({ configurationKey, configurationLabel, playerId }: RankingPanelProps) {
  const [page, setPage] = useState(1)
  const pageSize = 5
  const query = useQuery({ queryKey: queryKeys.ranking(configurationKey, page, pageSize), queryFn: ({ signal }) => fetchRanking(page, pageSize, configurationKey, signal), placeholderData: (previous) => previous })
  useEffect(() => { const refresh = () => void query.refetch(); window.addEventListener('pirate-network-scenario-change', refresh); return () => window.removeEventListener('pirate-network-scenario-change', refresh) }, [query])
  if (query.data && page > lastPageFor(query.data.total, pageSize)) setPage(lastPageFor(query.data.total, pageSize))
  if (query.isPending) return <p>Loading rankingâ€¦</p>
  if (query.isError) return <section role="alert"><p>Unable to load ranking.</p><button onClick={() => query.refetch()} type="button">Retry ranking</button></section>
  if (!query.data || query.data.total === 0) return <section aria-label="Ranking"><p className="logbook-caption">{configurationLabel}</p><p>No ranking entries for this configuration yet.</p></section>
  return <section aria-label="Ranking">{query.isFetching && <p aria-live="polite">Refreshing rankingâ€¦</p>}<p className="logbook-caption">{configurationLabel}</p><div aria-label="Ranking entries" className="logbook-table ranking-table" role="table"><div className="logbook-row logbook-heading" role="row"><span role="columnheader">Rank</span><span role="columnheader">Captain</span><span role="columnheader">Points</span><span role="columnheader">Played</span></div>{query.data.items.map((entry) => <div className={`logbook-row${entry.playerId === playerId ? ' is-local-player' : ''}`} key={entry.matchId} role="row"><strong role="cell">{String(entry.rank).padStart(2, '0')}</strong><span role="cell">{entry.playerName}{entry.playerId === playerId && <small>You</small>}</span><strong role="cell">{entry.score}</strong><time dateTime={entry.playedAt} role="cell">{formatPlayedAt(entry.playedAt)}</time></div>)}</div><Pagination page={page} pageSize={pageSize} total={query.data.total} onPageChange={setPage} /></section>
}

function formatPlayedAt(value: string): string { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)).toUpperCase() }

interface PaginationProps { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const lastPage = lastPageFor(total, pageSize)
  const activePage = Math.min(Math.max(page, 1), lastPage)
  return <div className="pagination"><button disabled={activePage <= 1} onClick={() => onPageChange(activePage - 1)} type="button">Previous page</button><span>Page {activePage} of {lastPage}</span><button disabled={activePage >= lastPage} onClick={() => onPageChange(activePage + 1)} type="button">Next page</button></div>
}

function lastPageFor(total: number, pageSize: number): number { return Math.max(1, Math.ceil(total / pageSize)) }
