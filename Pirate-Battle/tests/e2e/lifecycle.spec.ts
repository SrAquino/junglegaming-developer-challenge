import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear() })
})

test('saves validated options and restores them after refresh', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Options' }).click()
  await page.getByLabel('Game session time').fill('59')
  await page.getByRole('button', { name: 'Save options' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByLabel('Game session time').fill('90')
  await page.getByLabel('Enemy spawn time').fill('6')
  await page.getByRole('button', { name: 'Save options' }).click()
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  const restored = await page.context().newPage()
  await restored.goto('/')
  await restored.getByRole('button', { name: 'Options' }).click()
  await expect(restored.getByLabel('Game session time')).toHaveValue('90')
  await expect(restored.getByLabel('Enemy spawn time')).toHaveValue('6')
})

test('persists muted audio and volume choices for the next match', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Options' }).click()
  const volume = page.getByLabel('Sound volume')
  await volume.press('Home')
  for (let step = 0; step < 5; step += 1) await volume.press('ArrowRight')
  await page.getByLabel('Mute sound').check()
  await page.getByRole('button', { name: 'Save options' }).click()
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByLabel('Mute sound')).toBeChecked()
  await expect(page.getByLabel('Sound volume')).toHaveValue('0.25')
})

test('pauses without advancing and resumes only from an explicit action', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.locator('.game-canvas')
  await expect(arena).toHaveAttribute('data-player-y', /.+/)
  await page.getByRole('button', { name: 'Pause match' }).click()
  await expect(page.getByRole('dialog', { name: 'Match paused' })).toBeVisible()
  const beforePause = await arena.getAttribute('data-elapsed-ms')
  await page.getByRole('dialog', { name: 'Match paused' }).getByRole('button', { name: 'Options' }).click()
  await expect(page.getByRole('dialog', { name: 'Match options' })).toBeVisible()
  await page.getByLabel('Paused game session time').fill('90')
  await page.getByRole('button', { name: 'Save options' }).click()
  await expect(page.getByRole('dialog', { name: 'Match paused' })).toBeVisible()
  expect(await arena.getAttribute('data-elapsed-ms')).toBe(beforePause)
  await page.waitForTimeout(250)
  expect(await arena.getAttribute('data-elapsed-ms')).toBe(beforePause)
  await page.getByRole('dialog', { name: 'Match paused' }).getByRole('button', { name: 'Resume match' }).click()
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(150)
  await page.keyboard.up('ArrowUp')
  expect(Number(await arena.getAttribute('data-player-y'))).toBeLessThan(450)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(page.getByRole('dialog', { name: 'Match paused' })).toBeVisible()
})

test('ignores gameplay keys held during pause after resuming', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await expect(arena).toHaveAttribute('data-player-y', /.+/)
  await page.getByRole('button', { name: 'Pause match' }).click()
  await expect(page.getByRole('dialog', { name: 'Match paused' })).toBeVisible()
  const pausedPosition = {
    x: await arena.getAttribute('data-player-x'),
    y: await arena.getAttribute('data-player-y'),
  }

  await page.keyboard.down('KeyW')
  await page.getByRole('button', { name: 'Resume match' }).click()
  await page.waitForTimeout(250)
  await page.keyboard.up('KeyW')

  expect(await arena.getAttribute('data-player-x')).toBe(pausedPosition.x)
  expect(await arena.getAttribute('data-player-y')).toBe(pausedPosition.y)
})

test('restores a completed result after refresh and starts a clean new match', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pirate-battle.last-match-result', JSON.stringify({
      matchId: 'stored-match', score: 7, activeDurationMs: 12_500, endReason: 'time-expired',
      configuration: { sessionDurationSeconds: 120, enemySpawnIntervalSeconds: 4, enemySpawnWeights: { chaser: 0.55, shooter: 0.45 }, arena: { width: 1600, height: 900 }, simulation: { fixedStepMs: 16.6666666667, maxFrameDeltaMs: 250, maxStepsPerFrame: 15, hudPublishIntervalMs: 100 }, spawn: { minimumDistanceFromPlayer: 420, placementAttempts: 24 }, player: { maxHealth: 100, moveSpeed: 210, rotationSpeed: 2.827, collisionRadius: 34 }, enemies: { chaser: { maxHealth: 30, moveSpeed: 150, rotationSpeed: 2.26, collisionRadius: 28, collisionDamage: 25 }, shooter: { maxHealth: 45, moveSpeed: 105, rotationSpeed: 1.72, collisionRadius: 32, attackRange: 460, preferredDistance: 360, weapon: { cooldownMs: 1600, projectileCount: 1, projectileSpacing: 0, projectile: { damage: 12, speed: 360, range: 540, lifetimeMs: 1500 } } } }, weapons: { front: { cooldownMs: 450, projectileCount: 1, projectileSpacing: 0, projectile: { damage: 20, speed: 620, range: 720, lifetimeMs: 1200 } }, broadside: { cooldownMs: 1100, projectileCount: 3, projectileSpacing: 28, projectile: { damage: 16, speed: 520, range: 620, lifetimeMs: 1250 } } } }
    }))
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  await expect(page.locator('.result-score')).toHaveText('7')
  await page.reload()
  await expect(page.getByText('Points · 00:13 · Time expired')).toBeVisible()
  await page.getByRole('button', { name: 'Play again' }).click()
  await expect(page.getByRole('img', { name: 'Pirate Battle arena' })).toBeVisible()
  await expect(page.getByText('Score: 0')).toBeVisible()
})

test('ends from the real timer, registers once, updates both logbook tabs and restarts cleanly', async ({ page }) => {
  test.setTimeout(60_000)
  await page.clock.install()
  await page.addInitScript(() => {
    localStorage.setItem('pirate-battle.player-id', 'real-timeout-player')
    localStorage.setItem('pirate-battle.game-options', JSON.stringify({ sessionDurationSeconds: 60, enemySpawnIntervalSeconds: 20 }))
  })
  await page.goto('/?performance-profile=1&simulation-rate=15&simulation-seed=17')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  const firstMatchId = await arena.getAttribute('data-match-id')

  await page.clock.runFor(4_100)
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  await expect(page.getByText('Points · 01:00 · Time expired')).toBeVisible()
  await expect(page.getByText('Submission status: submitted')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  const completedResult = await page.evaluate(() => localStorage.getItem('pirate-battle.last-match-result'))
  await page.clock.runFor(1_000)
  expect(await page.evaluate(() => localStorage.getItem('pirate-battle.last-match-result'))).toBe(completedResult)

  await page.getByRole('button', { name: 'Main menu' }).click()
  const localRankingRow = page.getByRole('region', { name: 'Ranking' }).getByRole('row').filter({ hasText: 'Captain You' })
  await expect(localRankingRow).toHaveCount(1)
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByRole('region', { name: 'Match History' }).getByRole('row')).toHaveCount(2)

  await page.getByRole('button', { name: 'Play' }).click()
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await expect(arena).not.toHaveAttribute('data-match-id', firstMatchId ?? '')
  await expect(arena).toHaveAttribute('data-score', '0')
  expect(Number(await arena.getAttribute('data-elapsed-ms'))).toBeLessThan(3_000)
  await expect(arena).toHaveAttribute('data-enemies', '[]')
})

test('ends from real enemy damage with a seeded simulation', async ({ page }) => {
  test.setTimeout(60_000)
  await page.clock.install()
  await page.addInitScript(() => {
    localStorage.setItem('pirate-battle.player-id', 'real-defeat-player')
    localStorage.setItem('pirate-battle.game-options', JSON.stringify({ sessionDurationSeconds: 60, enemySpawnIntervalSeconds: 20 }))
  })
  await page.goto('/?simulation-rate=15&simulation-seed=17')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('img', { name: 'Pirate Battle arena' })).toHaveAttribute('aria-busy', 'false')
  await page.clock.runFor(4_000)
  await expect(page.getByText(/Points · 00:5\d · Ship destroyed/)).toBeVisible()
  await expect(page.getByText('Submission status: submitted')).toBeVisible()
})

test('abandons through the pause menu without registering a match', async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(() => localStorage.setItem('pirate-battle.player-id', 'abandon-player'))
  await page.goto('/?simulation-seed=23')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('img', { name: 'Pirate Battle arena' })).toHaveAttribute('aria-busy', 'false')
  await page.clock.runFor(2_000)
  await page.getByRole('button', { name: 'Pause match' }).click()
  await page.getByRole('dialog', { name: 'Match paused' }).getByRole('button', { name: 'Main menu' }).click()
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()

  const stored = await page.evaluate(() => ({
    pending: JSON.parse(localStorage.getItem('pirate-battle.pending-matches') ?? '[]') as unknown[],
    confirmed: JSON.parse(localStorage.getItem('pirate-battle.confirmed-match-records') ?? '[]') as unknown[],
  }))
  expect(stored.pending).toEqual([])
  expect(stored.confirmed).toEqual([])
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByText('No completed matches yet.')).toBeVisible()
})
