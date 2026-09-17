import { expect, test } from '@playwright/test'
import { apiRequestTimeoutMs, simulatedTimeoutDelayMs } from '../../src/api/network-timing.ts'
import { defaultGameConfig } from '../../src/game/config/game-config.ts'
import { gameplayConfigurationKey } from '../../src/api/gameplay-configuration-key.ts'

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
    const acceptedResponseLost = await request('/api/matches', 'timeout-after-register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }).then(() => false, () => true)
    const recovered = await request('/api/matches', 'success', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }).then((response) => response.status)
    const unavailableRecord = { ...record, matchId: crypto.randomUUID() }
    const unavailable = await request('/api/matches', 'unavailable-at-match-end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unavailableRecord) }).then((response) => response.status)
    const unavailableRecovery = await request('/api/matches', 'success', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(unavailableRecord) }).then((response) => response.status)
    const pages = await request('/api/ranking?page=2&pageSize=5&configurationKey={}', 'multiple-pages').then((response) => response.json())
    return { empty, pages, failedStatus, historyFailure, connectionFailure, clientFailure, acceptedResponseLost, recovered, unavailable, unavailableRecovery }
  })
  expect(result.empty.total).toBe(0)
  expect(result.pages.total).toBe(24)
  expect(result.pages.items).toHaveLength(5)
  expect(result.failedStatus).toBe(503)
  expect(result.historyFailure).toBe(503)
  expect(result.connectionFailure).toBe(true)
  expect(result.clientFailure).toBe(400)
  expect(result.acceptedResponseLost).toBe(true)
  expect(result.recovered).toBe(200)
  expect(result.unavailable).toBe(503)
  expect(result.unavailableRecovery).toBe(201)
})

test('changes scenarios from the menu and recovers ranking data after an error', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')
  await page.getByText('Network demo controls').click()
  await page.getByLabel('Network scenario').selectOption('ranking-error')
  await expect(page.getByRole('alert')).toContainText('Unable to load ranking.')
  await page.getByLabel('Network scenario').selectOption('success')
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')

  await page.evaluate(async (configuration) => {
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-pirate-network-scenario': 'success' },
      body: JSON.stringify({ matchId: 'reset-visible-record', playerId: 'reset-player', playedAt: '2026-09-17T12:00:00.000Z', score: 99, activeDurationMs: 60_000, endReason: 'time-expired', configuration }),
    })
    window.dispatchEvent(new Event('pirate-network-scenario-change'))
  }, defaultGameConfig)
  await expect(page.getByRole('region', { name: 'Ranking' }).getByRole('row').filter({ hasText: '99' })).toHaveCount(1)
  await page.getByRole('button', { name: 'Reset mock data' }).click()
  await expect(page.getByText('Mock data reset and refreshed.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ranking' }).getByRole('row').filter({ hasText: '99' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Ranking' }).getByRole('row').filter({ hasText: 'Anne Bonny' })).toContainText('14')
})

test('provides a real timeout scenario beyond the Axios deadline', async ({ page, isMobile }) => {
  test.skip(isMobile, 'One browser project is sufficient for the real-time timeout contract.')
  test.setTimeout(20_000)
  expect(simulatedTimeoutDelayMs).toBeGreaterThan(apiRequestTimeoutMs)
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const outcome = await page.evaluate(async () => {
    localStorage.setItem('pirate-battle.network-scenario', 'timeout')
    const { apiClient } = await import('/src/api/client.ts')
    const startedAt = performance.now()
    try {
      await apiClient.get('/ranking')
      return { code: 'response', elapsedMs: performance.now() - startedAt }
    } catch (error) {
      return { code: typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown-error', elapsedMs: performance.now() - startedAt }
    }
  })
  expect(outcome.code).toBe('ECONNABORTED')
  expect(outcome.elapsedMs).toBeGreaterThanOrEqual(apiRequestTimeoutMs - 250)
  expect(outcome.elapsedMs).toBeLessThan(simulatedTimeoutDelayMs)
})

test('groups rankings by arena, spawn rules and clock scale', async ({ page }) => {
  const baseline = gameplayConfigurationKey(defaultGameConfig)
  expect(gameplayConfigurationKey({ ...defaultGameConfig, arena: { ...defaultGameConfig.arena, layoutId: 'arena.tmj:v2' } })).not.toBe(baseline)
  expect(gameplayConfigurationKey({ ...defaultGameConfig, spawn: { ...defaultGameConfig.spawn, minimumDistanceFromPlayer: 500 } })).not.toBe(baseline)
  expect(gameplayConfigurationKey({ ...defaultGameConfig, simulation: { ...defaultGameConfig.simulation, timeScale: 5 } })).not.toBe(baseline)

  await page.goto('/?simulation-rate=5')
  await expect(page.getByText('5× clock')).toBeVisible()
  await expect(page.getByText('No ranking entries for this configuration yet.')).toBeVisible()
})
