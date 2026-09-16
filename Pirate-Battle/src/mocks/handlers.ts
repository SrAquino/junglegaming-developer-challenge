import { http, HttpResponse } from 'msw'
import type { RequestHandler } from 'msw'
import { gameplayConfigurationKey } from '../api/gameplay-configuration-key.ts'
import type { MatchRecord, MatchRegistrationRequest, PaginatedResponse, RankingEntry } from '../api/contracts.ts'
import { fixturePlayers, fixtureRecords } from './fixtures/ranking-fixtures.ts'

let records: MatchRecord[] = [...fixtureRecords]

export const handlers: RequestHandler[] = [
  http.get('/api/ranking', ({ request }) => {
    const url = new URL(request.url)
    const configurationKey = url.searchParams.get('configurationKey') ?? ''
    const page = positiveInteger(url.searchParams.get('page'), 1)
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 10)
    const ranking = records.filter((record) => gameplayConfigurationKey(record.configuration) === configurationKey).sort(compareRecords).map((record, index): RankingEntry => ({
      rank: index + 1, playerId: record.playerId, playerName: fixturePlayers[record.playerId] ?? (record.playerId.startsWith('fixture-') ? record.playerId : 'Captain You'), score: record.score, matchId: record.matchId, configurationKey,
    }))
    return HttpResponse.json(pageResponse(ranking, page, pageSize))
  }),
  http.get('/api/players/:playerId/matches', ({ params, request }) => {
    const url = new URL(request.url)
    const page = positiveInteger(url.searchParams.get('page'), 1)
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 10)
    const history = records.filter((record) => record.playerId === params.playerId).sort((left, right) => right.playedAt.localeCompare(left.playedAt) || left.matchId.localeCompare(right.matchId))
    return HttpResponse.json(pageResponse(history, page, pageSize))
  }),
  http.post('/api/matches', async ({ request }) => {
    const candidate = await request.json() as Partial<MatchRegistrationRequest>
    if (!isCompletedMatch(candidate)) return HttpResponse.json({ message: 'Invalid completed match.' }, { status: 400 })
    const existing = records.find((record) => record.matchId === candidate.matchId)
    if (existing) return HttpResponse.json(existing)
    const record: MatchRecord = { ...candidate }
    records.push(record)
    return HttpResponse.json(record, { status: 201 })
  }),
]

export function resetMockRecords(): void { records = [...fixtureRecords] }

function isCompletedMatch(value: Partial<MatchRegistrationRequest>): value is MatchRegistrationRequest {
  return typeof value.matchId === 'string' && typeof value.playerId === 'string' && typeof value.playedAt === 'string' && typeof value.score === 'number' && typeof value.activeDurationMs === 'number' && (value.endReason === 'time-expired' || value.endReason === 'player-destroyed') && value.configuration !== undefined
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function pageResponse<TItem>(items: readonly TItem[], page: number, pageSize: number): PaginatedResponse<TItem> {
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length }
}

function compareRecords(left: MatchRecord, right: MatchRecord): number {
  return right.score - left.score || left.playedAt.localeCompare(right.playedAt) || left.matchId.localeCompare(right.matchId)
}
