import { expect, test } from '@playwright/test'

test('reproduces empty, paginated, independent failure and registration recovery scenarios', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const result = await page.evaluate(async () => {
    const request = (path: string, scenario: string, init?: RequestInit) => fetch(path, { ...init, headers: { ...init?.headers, 'x-pirate-network-scenario': scenario } })
    const empty = await request('/api/ranking?page=1&pageSize=5&configurationKey=missing', 'empty').then((response) => response.json())
    const failedStatus = await request('/api/ranking', 'ranking-error').then((response) => response.status)
    const historyFailure = await request('/api/players/fixture-anne/matches', 'history-error').then((response) => response.status)
    const connectionFailure = await request('/api/ranking', 'offline').then(() => false, () => true)
    const clientFailure = await request('/api/ranking', 'client-error').then((response) => response.status)
    const id = crypto.randomUUID()
    const record = { matchId: id, playerId: 'scenario-player', playedAt: '2026-09-17T12:00:00.000Z', score: 5, activeDurationMs: 60_000, endReason: 'time-expired', configuration: {} }
    const timedOut = await request('/api/matches', 'timeout-after-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }).then(() => false, () => true)
    const recovered = await request('/api/matches', 'success', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }).then((response) => response.status)
    const unavailableRecord = { ...record, matchId: crypto.randomUUID() }
    const unavailable = await request('/api/matches', 'unavailable-at-match-end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unavailableRecord) }).then((response) => response.status)
    const unavailableRecovery = await request('/api/matches', 'success', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unavailableRecord) }).then((response) => response.status)
    const pages = await request('/api/ranking?page=2&pageSize=5&configurationKey={}', 'multiple-pages').then((response) => response.json())
    return { empty, pages, failedStatus, historyFailure, connectionFailure, clientFailure, timedOut, recovered, unavailable, unavailableRecovery }
  })
  expect(result.empty.total).toBe(0)
  expect(result.pages.total).toBe(24)
  expect(result.pages.items).toHaveLength(5)
  expect(result.failedStatus).toBe(503)
  expect(result.historyFailure).toBe(503)
  expect(result.connectionFailure).toBe(true)
  expect(result.clientFailure).toBe(400)
  expect(result.timedOut).toBe(true)
  expect(result.recovered).toBe(200)
  expect(result.unavailable).toBe(503)
  expect(result.unavailableRecovery).toBe(201)
})

test('changes scenarios from the menu and recovers ranking data after an error', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')
  await page.getByLabel('Network scenario').selectOption('ranking-error')
  await expect(page.getByRole('alert')).toContainText('Unable to load ranking.')
  await page.getByLabel('Network scenario').selectOption('success')
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')
  await page.getByRole('button', { name: 'Reset mock data' }).click()
  await expect(page.getByText('Mock data reset.')).toBeVisible()
})
