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
