import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear() })
})

test('matches the main menu visual baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Ranking' })).toContainText('Anne Bonny')
  await expect(page.locator('.main-menu')).toHaveScreenshot('main-menu.png')
})

test('matches the stable paused arena visual baseline', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Pause match' }).click()
  await expect(page.getByRole('dialog', { name: 'Match paused' })).toBeVisible()
  await page.getByRole('dialog', { name: 'Match paused' }).evaluate((dialog) => { dialog.style.visibility = 'hidden' })
  await expect(page.locator('canvas')).toHaveScreenshot('stable-arena.png')
})

test('matches the visible cannonball visual baseline', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.locator('.game-canvas')
  await expect(arena).toHaveAttribute('data-projectile-count', '0')
  await page.keyboard.down('e')
  await page.clock.runFor(20)
  await page.keyboard.up('e')
  await expect.poll(async () => Number(await arena.getAttribute('data-projectile-count'))).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Pause match' }).click()
  await page.getByRole('dialog', { name: 'Match paused' }).evaluate((dialog) => { dialog.style.visibility = 'hidden' })
  await expect(page.locator('canvas')).toHaveScreenshot('visible-cannonball.png', { maxDiffPixelRatio: 0.001 })
})

test('matches the match-result visual baseline', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('pirate-battle.last-match-result', JSON.stringify({ matchId: 'visual-result', score: 7, activeDurationMs: 12_500, endReason: 'time-expired', configuration: {} }))
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  await expect(page.locator('.panel')).toHaveScreenshot('match-result.png')
})
