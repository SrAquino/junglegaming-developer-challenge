import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear() })
})

test('supports keyboard navigation, visible focus and pause-dialog focus restoration', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).focus()
  await expect(page.getByRole('button', { name: 'Play' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Play' })).toHaveCSS('outline-style', 'solid')

  await page.getByRole('tab', { name: 'Ranking' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Match History' })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Match History' })).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  const pause = page.getByRole('button', { name: 'Pause match' })
  await expect(pause).toBeEnabled()
  await pause.click()
  const dialog = page.getByRole('dialog', { name: 'Match paused' })
  const resume = dialog.getByRole('button', { name: 'Resume match' })
  await expect(dialog).toBeVisible()
  await expect(resume).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Main menu' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(resume).toBeFocused()
  await resume.click()
  await expect(pause).toBeFocused()
})

test('keeps the game controls and arena within a landscape mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const bounds = await page.locator('.game-canvas-shell').evaluate((element) => {
    const box = element.getBoundingClientRect()
    return { top: box.top, bottom: box.bottom, height: box.height, viewportHeight: window.innerHeight }
  })
  expect(bounds.height).toBeGreaterThan(100)
  expect(bounds.top).toBeGreaterThanOrEqual(0)
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.viewportHeight)
  await expect(page.getByRole('button', { name: 'Fire right broadside' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause match' })).toBeVisible()
})

test('exposes labels and accessible validation and network errors', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByLabel('Game session time')).toBeVisible()
  await expect(page.getByLabel('Enemy spawn time')).toBeVisible()
  await page.getByLabel('Game session time').fill('10')
  await page.getByRole('button', { name: 'Save options' }).click()
  await expect(page.getByRole('alert')).toContainText('Session time must be')

  await page.getByRole('button', { name: 'Back to menu' }).click()
  await page.getByText('Network demo controls').click()
  await page.getByLabel('Network scenario').selectOption('ranking-error')
  await expect(page.getByRole('alert')).toContainText('Unable to load ranking.')
})

test('runs the menu and gameplay flow without unhandled browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('canvas')).toBeVisible()
  await page.getByRole('button', { name: 'Pause match' }).click()
  await page.getByRole('button', { name: 'Resume match' }).click()
  await page.getByRole('button', { name: 'Back to menu' }).click()
  expect(errors).toEqual([])
})
