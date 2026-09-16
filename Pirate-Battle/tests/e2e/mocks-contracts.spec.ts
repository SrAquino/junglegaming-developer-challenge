import { expect, test } from '@playwright/test'

test('serves paginated history, ranks matching configurations and registers idempotently through MSW', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const response = await page.evaluate(async () => {
    const history = await fetch('/api/players/fixture-anne/matches?page=1&pageSize=2').then(async (result) => result.json())
    const record = { matchId: crypto.randomUUID(), playerId: 'browser-player', playedAt: '2026-09-17T12:00:00.000Z', score: 11, activeDurationMs: 60_000, endReason: 'time-expired', configuration: {} }
    const first = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) })
    const second = await fetch('/api/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) })
    const ranking = await fetch(`/api/ranking?page=1&pageSize=10&configurationKey=${encodeURIComponent('{}')}`).then(async (result) => result.json())
    return { history, firstStatus: first.status, secondStatus: second.status, ranking }
  })
  expect(response.history.total).toBeGreaterThan(0)
  expect(response.history.items).toHaveLength(1)
  expect(response.firstStatus).toBe(201)
  expect(response.secondStatus).toBe(200)
  expect(response.ranking.items[0]).toMatchObject({ playerId: 'browser-player', score: 11, rank: 1 })
})
