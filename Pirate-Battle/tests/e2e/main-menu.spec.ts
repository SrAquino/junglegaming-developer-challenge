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
  await page.goto('/?disable-msw=1')
  await page.getByRole('button', { name: 'Play' }).click()

  await expect(page.getByRole('alert')).toContainText('Unable to load game assets.')

  await page.unroute('**/assets/png/default/ships/ship_1.png')
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('moves and turns the ship with keyboard controls after gameplay starts', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.locator('.game-canvas')
  await expect(arena).toHaveAttribute('data-player-y', /.+/)

  const initialY = Number(await arena.getAttribute('data-player-y'))
  const initialRotation = Number(await arena.getAttribute('data-player-rotation'))
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(250)
  await page.keyboard.up('ArrowUp')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(150)
  await page.keyboard.up('ArrowRight')

  expect(Number(await arena.getAttribute('data-player-y'))).toBeLessThan(initialY)
  expect(Number(await arena.getAttribute('data-player-rotation'))).toBeGreaterThan(initialRotation)
})

test('moves the ship with a held touch control and keeps the canvas on resize', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.locator('.game-canvas')
  await expect(arena).toHaveAttribute('data-player-y', /.+/)
  const initialY = Number(await arena.getAttribute('data-player-y'))

  const forwardControl = page.getByRole('button', { name: 'Sail forward' })
  await forwardControl.hover()
  await page.mouse.down()
  await page.waitForTimeout(250)
  await page.mouse.up()

  expect(Number(await arena.getAttribute('data-player-y'))).toBeLessThan(initialY)
  await page.setViewportSize({ width: 960, height: 540 })
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('fires while sailing with keyboard and touch controls', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.locator('.game-canvas')
  await expect(arena).toHaveAttribute('data-projectile-count', '0')
  const initialY = Number(await arena.getAttribute('data-player-y'))

  await page.keyboard.down('ArrowUp')
  await page.keyboard.press('f')
  await page.waitForTimeout(100)
  await page.keyboard.up('ArrowUp')
  expect(Number(await arena.getAttribute('data-player-y'))).toBeLessThan(initialY)
  expect(Number(await arena.getAttribute('data-projectile-count'))).toBeGreaterThan(0)

  const broadsideControl = page.getByRole('button', { name: 'Fire left broadside' })
  await broadsideControl.hover()
  await page.mouse.down()
  await page.waitForTimeout(100)
  await page.mouse.up()
  await expect.poll(async () => Number(await arena.getAttribute('data-projectile-count'))).toBeGreaterThan(0)
})
