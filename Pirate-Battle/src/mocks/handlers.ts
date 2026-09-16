import { http, HttpResponse } from 'msw'
import type { RequestHandler } from 'msw'
import { gameplayConfigurationKey } from '../api/gameplay-configuration-key.ts'
import type { MatchRecord, MatchRegistrationRequest, PaginatedResponse, RankingEntry } from '../api/contracts.ts'
import { fixturePlayers, fixtureRecords } from './fixtures/ranking-fixtures.ts'
import type { NetworkScenario } from './scenarios/network-scenario.ts'

let records: MatchRecord[] = [...fixtureRecords]

export const handlers: RequestHandler[] = [
  http.get('/api/ranking', async ({ request }) => {
    const scenario = requestScenario(request)
    const failure = await scenarioFailure(scenario, 'ranking')
    if (failure) return failure
    const url = new URL(request.url)
    const configurationKey = url.searchParams.get('configurationKey') ?? ''
    const page = positiveInteger(url.searchParams.get('page'), 1)
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 10)
    const ranking = scenario === 'empty' ? [] : recordsForScenario(scenario).filter((record) => gameplayConfigurationKey(record.configuration) === configurationKey).sort(compareRecords).map((record, index): RankingEntry => ({
      rank: index + 1, playerId: record.playerId, playerName: fixturePlayers[record.playerId] ?? (record.playerId.startsWith('fixture-') ? record.playerId : 'Captain You'), score: record.score, matchId: record.matchId, configurationKey, playedAt: record.playedAt,
    }))
    return HttpResponse.json(pageResponse(ranking, page, pageSize))
  }),
  http.get('/api/players/:playerId/matches', async ({ params, request }) => {
    const scenario = requestScenario(request)
    const failure = await scenarioFailure(scenario, 'history')
    if (failure) return failure
    const url = new URL(request.url)
    const page = positiveInteger(url.searchParams.get('page'), 1)
    const pageSize = positiveInteger(url.searchParams.get('pageSize'), 10)
    const history = scenario === 'empty' ? [] : recordsForScenario(scenario).filter((record) => record.playerId === params.playerId).sort((left, right) => right.playedAt.localeCompare(left.playedAt) || left.matchId.localeCompare(right.matchId))
    return HttpResponse.json(pageResponse(history, page, pageSize))
  }),
  http.post('/api/matches', async ({ request }) => {
    const scenario = requestScenario(request)
    const failure = await scenarioFailure(scenario, 'registration')
    if (failure && scenario !== 'timeout-after-register') return failure
    const candidate = await request.json() as Partial<MatchRegistrationRequest>
    if (!isCompletedMatch(candidate)) return HttpResponse.json({ message: 'Invalid completed match.' }, { status: 400 })
    const existing = records.find((record) => record.matchId === candidate.matchId)
    if (existing) return HttpResponse.json(existing)
    const record: MatchRecord = { ...candidate }
    records.push(record)
    if (scenario === 'timeout-after-register') return HttpResponse.error()
    return HttpResponse.json(record, { status: 201 })
  }),
  http.post('/api/mock/reset', () => { resetMockRecords(); return HttpResponse.json({ ok: true }) }),
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

function requestScenario(request: Request): NetworkScenario { return (request.headers.get('x-pirate-network-scenario') ?? 'success') as NetworkScenario }

async function scenarioFailure(scenario: NetworkScenario, resource: 'ranking' | 'history' | 'registration'): Promise<Response | undefined> {
  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'client-error') return HttpResponse.json({ message: 'Configured client failure.' }, { status: 400 })
  if (scenario === 'server-error' || scenario === 'unavailable-at-match-end' && resource === 'registration' || scenario === 'ranking-error' && resource === 'ranking' || scenario === 'history-error' && resource === 'history') return HttpResponse.json({ message: 'Configured network failure.' }, { status: 503 })
  if (scenario === 'slow') await delay(1_200)
  if (scenario === 'variable-latency') await delay(resource === 'ranking' ? 800 : 250)
  if (scenario === 'out-of-order') await delay(resource === 'ranking' ? 900 : 100)
  return undefined
}

function recordsForScenario(scenario: NetworkScenario): MatchRecord[] {
  if (scenario !== 'multiple-pages') return records
  return records.flatMap((record) => Array.from({ length: 12 }, (_, index) => ({ ...record, matchId: `${record.matchId}-multiple-${index}`, score: record.score + 12 - index, playedAt: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00.000Z` })))
}

function delay(milliseconds: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, milliseconds)) }
