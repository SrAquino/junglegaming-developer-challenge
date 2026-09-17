import { expect, test, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('pirate-battle.player-id', 'recovery-player')
    localStorage.setItem('pirate-battle.game-options', JSON.stringify({ sessionDurationSeconds: 60, enemySpawnIntervalSeconds: 20 }))
  })
})

test('keeps two failed real matches across reload and recovers both', async ({ page }) => {
  test.setTimeout(120_000)
  await page.evaluate(() => localStorage.setItem('pirate-battle.network-scenario', 'unavailable-at-match-end'))
  await page.goto('/?performance-profile=1&simulation-rate=15&simulation-seed=31')

  await completeTimedMatch(page, 'Play')
  await exhaustSubmissionRetries(page)
  await expect(page.getByText('Submission status: failed')).toBeVisible()
  await completeTimedMatch(page, 'Play again')
  await exhaustSubmissionRetries(page)
  await expect(page.getByText('Submission status: failed')).toBeVisible()
  await expect.poll(() => pendingCount(page)).toBe(2)

  await page.reload()
  await page.clock.runFor(7_000)
  await expect.poll(() => pendingCount(page)).toBe(2)

  await page.evaluate(() => localStorage.setItem('pirate-battle.network-scenario', 'success'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  await expect.poll(() => pendingCount(page)).toBe(0)
  const confirmed = await page.evaluate(() => JSON.parse(localStorage.getItem('pirate-battle.confirmed-match-records') ?? '[]') as { matchId: string }[])
  expect(new Set(confirmed.map((record) => record.matchId)).size).toBe(2)
  await page.getByRole('button', { name: 'Main menu' }).click()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByRole('region', { name: 'Match History' }).getByRole('row')).toHaveCount(3)
})

test('recovers one server-accepted timeout after reload without a duplicate', async ({ page }) => {
  test.setTimeout(90_000)
  await page.evaluate(() => localStorage.setItem('pirate-battle.network-scenario', 'timeout-after-register'))
  await page.goto('/?performance-profile=1&simulation-rate=15&simulation-seed=41')
  await completeTimedMatch(page, 'Play')
  await exhaustSubmissionRetries(page)
  await expect(page.getByText('Submission status: failed')).toBeVisible()
  await expect.poll(() => pendingCount(page)).toBe(1)

  await page.evaluate(() => localStorage.setItem('pirate-battle.network-scenario', 'success'))
  const recoveredResponse = page.waitForResponse((response) => response.url().endsWith('/api/matches') && response.request().method() === 'POST')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  expect((await recoveredResponse).status()).toBe(200)
  await expect.poll(() => pendingCount(page)).toBe(0)
  const confirmed = await page.evaluate(() => JSON.parse(localStorage.getItem('pirate-battle.confirmed-match-records') ?? '[]') as { matchId: string }[])
  expect(confirmed).toHaveLength(1)
  await page.getByRole('button', { name: 'Main menu' }).click()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByRole('region', { name: 'Match History' }).getByRole('row')).toHaveCount(2)
})

async function completeTimedMatch(page: Page, buttonName: 'Play' | 'Play again'): Promise<void> {
  await page.getByRole('button', { name: buttonName, exact: true }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await page.clock.runFor(4_100)
  await expect(page.getByText(/Points · 01:00 · Time expired/)).toBeVisible()
}

async function exhaustSubmissionRetries(page: Page): Promise<void> {
  await page.clock.runFor(7_000)
}

async function pendingCount(page: Page): Promise<number> {
  return page.evaluate(() => (JSON.parse(localStorage.getItem('pirate-battle.pending-matches') ?? '[]') as unknown[]).length)
}
