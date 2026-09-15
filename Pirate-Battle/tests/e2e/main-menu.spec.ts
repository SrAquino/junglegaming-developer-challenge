import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
})

test('shows the main menu', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play' })).toBeEnabled()
})

test('mounts one Pixi canvas and returns to the main menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()

  await expect(page.getByRole('img', { name: 'Pirate Battle arena' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)

  await page.getByRole('button', { name: 'Back to menu' }).click()
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()

  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('shows a retry action when the ship asset fails to load', async ({ page }) => {
  await page.route('**/assets/png/default/ships/ship_1.png', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()

  await expect(page.getByRole('alert')).toContainText('Unable to load game assets.')

  await page.unroute('**/assets/png/default/ships/ship_1.png')
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.locator('canvas')).toHaveCount(1)
})
