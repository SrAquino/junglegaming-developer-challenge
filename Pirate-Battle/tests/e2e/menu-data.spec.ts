import { expect, test } from '@playwright/test'

test('shows ranking data and the local player match history tab through TanStack Query', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await expect(page.getByRole('tab', { name: 'Ranking' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByText('No completed matches yet.')).toBeVisible()
})

test('paginates every ranking and history record once with stable global ordering', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('pirate-battle.player-id', 'pagination-player')
    localStorage.setItem('pirate-battle.network-scenario', 'multiple-pages')
  })
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  const ranking = page.getByRole('region', { name: 'Ranking' })
  await expect(ranking.getByText('Page 1 of 10')).toBeVisible()
  await expect(ranking.getByRole('cell').first()).toHaveText('01')
  await ranking.getByRole('button', { name: 'Next page' }).click()
  await expect(ranking.getByText('Page 2 of 10')).toBeVisible()
  await expect(ranking.getByRole('cell').first()).toHaveText('06')
  await ranking.getByRole('button', { name: 'Previous page' }).click()
  await expect(ranking.getByRole('cell').first()).toHaveText('01')

  await page.getByRole('tab', { name: 'Match History' }).click()
  const history = page.getByRole('region', { name: 'Match History' })
  await expect(history.getByText('Page 1 of 3')).toBeVisible()
  await expect(history.getByRole('row')).toHaveCount(6)
  await history.getByRole('button', { name: 'Next page' }).click()
  await expect(history.getByText('Page 2 of 3')).toBeVisible()
  await expect(history.getByRole('row')).toHaveCount(6)
  await history.getByRole('button', { name: 'Previous page' }).click()
  await expect(history.getByText('Page 1 of 3')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('region', { name: 'Ranking' }).getByText('Page 1 of 10')).toBeVisible()
})

test('resets ranking pagination when the active gameplay configuration changes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pirate-battle.network-scenario', 'multiple-pages'))
  await page.goto('/')
  const ranking = page.getByRole('region', { name: 'Ranking' })
  await expect(ranking.getByText('Page 1 of 10')).toBeVisible()
  await ranking.getByRole('button', { name: 'Next page' }).click()
  await expect(ranking.getByText('Page 2 of 10')).toBeVisible()

  await page.getByRole('button', { name: 'Options' }).click()
  await page.getByLabel('Game session time').fill('90')
  await page.getByRole('button', { name: 'Save options' }).click()
  await expect(page.getByText('No ranking entries for this configuration yet.')).toBeVisible()

  await page.getByRole('button', { name: 'Options' }).click()
  await page.getByLabel('Game session time').fill('120')
  await page.getByRole('button', { name: 'Save options' }).click()
  await expect(page.getByRole('region', { name: 'Ranking' }).getByText('Page 1 of 10')).toBeVisible()
})

test('clamps ranking and history to a valid page when their totals shrink', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('pirate-battle.player-id', 'fixture-anne')
    localStorage.setItem('pirate-battle.network-scenario', 'multiple-pages')
  })
  await page.goto('/')
  const scenario = page.getByLabel('Network scenario')
  const ranking = page.getByRole('region', { name: 'Ranking' })
  await expect(ranking.getByText('Page 1 of 10')).toBeVisible()
  await ranking.getByRole('button', { name: 'Next page' }).click()
  await expect(ranking.getByText('Page 2 of 10')).toBeVisible()

  await page.getByText('Network demo controls').click()
  await scenario.selectOption('success')
  await expect(ranking.getByText('Page 1 of 1')).toBeVisible()
  await expect(ranking.getByRole('button', { name: 'Next page' })).toBeDisabled()
  await expect(ranking.getByRole('row')).toHaveCount(5)

  await scenario.selectOption('multiple-pages')
  await expect(ranking.getByText('Page 1 of 10')).toBeVisible()
  await page.getByRole('tab', { name: 'Match History' }).click()
  const history = page.getByRole('region', { name: 'Match History' })
  await expect(history.getByText('Page 1 of 3')).toBeVisible()
  await history.getByRole('button', { name: 'Next page' }).click()
  await expect(history.getByText('Page 2 of 3')).toBeVisible()

  await scenario.selectOption('success')
  await expect(history.getByText('Page 1 of 1')).toBeVisible()
  await expect(history.getByRole('button', { name: 'Next page' })).toBeDisabled()
  await expect(history.getByRole('row')).toHaveCount(2)
})

test('cancels a stale same-ranking request when a newer response finishes first', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const ranking = page.getByRole('region', { name: 'Ranking' })
  await expect(ranking).toContainText('Anne Bonny')
  await page.getByText('Network demo controls').click()

  const staleRequest = page.waitForRequest((request) => request.url().includes('/api/ranking') && request.headers()['x-pirate-network-scenario'] === 'out-of-order')
  await page.getByLabel('Network scenario').selectOption('out-of-order')
  await staleRequest
  const freshResponse = page.waitForResponse((response) => response.url().includes('/api/ranking') && response.request().headers()['x-pirate-network-scenario'] === 'success')
  await page.getByLabel('Network scenario').selectOption('success')
  await freshResponse
  await page.waitForTimeout(1_050)

  await expect(ranking.getByRole('row').filter({ hasText: 'Anne Bonny' })).toContainText('14')
  await expect(ranking).not.toContainText('114')
})
