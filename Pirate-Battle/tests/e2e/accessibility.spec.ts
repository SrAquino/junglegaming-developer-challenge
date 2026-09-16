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
  await expectArenaToFit(page)
  await expect(page.getByRole('button', { name: 'Fire right broadside' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pause match' })).toBeVisible()
})

test('anchors navigation and firing controls to separate lower corners of the arena', async ({ page }) => {
  for (const viewport of [{ width: 412, height: 839 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByRole('img', { name: 'Pirate Battle arena' })).toHaveAttribute('aria-busy', 'false')
    const bounds = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector)
        if (!element) throw new Error(`Missing ${selector}`)
        const value = element.getBoundingClientRect()
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom }
      }
      return { shell: rect('.game-canvas-shell'), navigation: rect('.arena-navigation-controls'), firing: rect('.arena-firing-controls') }
    })
    expect(bounds.navigation.left).toBeGreaterThanOrEqual(bounds.shell.left)
    expect(bounds.firing.right).toBeLessThanOrEqual(bounds.shell.right)
    expect(bounds.navigation.right).toBeLessThan(bounds.firing.left)
    expect(bounds.navigation.bottom).toBeLessThanOrEqual(bounds.shell.bottom)
    expect(bounds.firing.bottom).toBeLessThanOrEqual(bounds.shell.bottom)
  }
})

test('keeps large centered touch controls stable while pressed and suppresses the image menu', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const control = page.getByRole('button', { name: 'Sail forward' })
  await expect(control).toBeVisible()
  const before = await control.boundingBox()
  expect(before).not.toBeNull()
  expect(before?.width).toBeGreaterThanOrEqual(64)
  expect(before?.height).toBeGreaterThanOrEqual(64)

  const centers = await control.evaluate((button) => {
    const buttonBox = button.getBoundingClientRect()
    const iconBox = button.querySelector('img')?.getBoundingClientRect()
    if (!iconBox) throw new Error('Control icon is missing.')
    return {
      button: { x: buttonBox.left + buttonBox.width / 2, y: buttonBox.top + buttonBox.height / 2 },
      icon: { x: iconBox.left + iconBox.width / 2, y: iconBox.top + iconBox.height / 2 },
    }
  })
  expect(centers.icon.x).toBeCloseTo(centers.button.x, 0)
  expect(centers.icon.y).toBeCloseTo(centers.button.y, 0)

  await control.hover()
  await expect(control).toHaveCSS('background-image', /button_round_hover/)
  if (!before) throw new Error('Control bounds are unavailable.')
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await expect(control).toHaveCSS('background-image', /button_round_pressed/)
  expect(await control.boundingBox()).toEqual(before)
  await page.mouse.up()

  const contextMenuSuppressed = await control.evaluate((button) => !button.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))
  expect(contextMenuSuppressed).toBe(true)
  await expect(control.locator('img')).toHaveCSS('pointer-events', 'none')
})

test('keeps sailing while a second touch fires and is released', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  const playerY = async () => Number(await arena.getAttribute('data-player-y'))
  const start = await playerY()
  const forward = page.getByRole('button', { name: 'Sail forward' })
  const fire = page.getByRole('button', { name: 'Fire front' })
  await forward.dispatchEvent('pointerdown', { pointerId: 11, pointerType: 'touch' })
  await fire.dispatchEvent('pointerdown', { pointerId: 12, pointerType: 'touch' })
  await page.clock.runFor(150)
  expect(Number(await arena.getAttribute('data-projectile-count'))).toBeGreaterThan(0)
  const moving = await playerY()
  expect(moving).toBeLessThan(start)
  await fire.dispatchEvent('pointerup', { pointerId: 12, pointerType: 'touch' })
  await page.clock.runFor(150)
  expect(await playerY()).toBeLessThan(moving)
  await forward.dispatchEvent('pointerup', { pointerId: 11, pointerType: 'touch' })
})

test('resizes one complete arena across the supported desktop and mobile viewports', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  const matchId = await arena.getAttribute('data-match-id')
  expect(matchId).not.toBe('')
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 412, height: 839 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(viewport)
    await expectArenaToFit(page)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(arena).toHaveAttribute('data-match-id', matchId ?? '')
  }
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

async function expectArenaToFit(page: import('@playwright/test').Page): Promise<void> {
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await expect(arena).toHaveAttribute('data-world-scale', /.+/)
  const bounds = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.game-canvas-shell')?.getBoundingClientRect()
    const canvas = document.querySelector('canvas')?.getBoundingClientRect()
    const host = document.querySelector<HTMLElement>('.game-canvas')
    if (!shell || !canvas || !host) throw new Error('Arena bounds are unavailable.')
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      shell: { left: shell.left, top: shell.top, right: shell.right, bottom: shell.bottom },
      canvas: { left: canvas.left, top: canvas.top, right: canvas.right, bottom: canvas.bottom, width: canvas.width, height: canvas.height },
      world: { width: Number(host.dataset.worldWidth), height: Number(host.dataset.worldHeight) },
      scrollHeight: document.documentElement.scrollHeight,
    }
  })
  expect(bounds.canvas.width).toBeGreaterThan(0)
  expect(bounds.canvas.height).toBeGreaterThan(0)
  expect(bounds.canvas.left).toBeGreaterThanOrEqual(bounds.shell.left)
  expect(bounds.canvas.top).toBeGreaterThanOrEqual(bounds.shell.top)
  expect(bounds.canvas.right).toBeLessThanOrEqual(bounds.shell.right)
  expect(bounds.canvas.bottom).toBeLessThanOrEqual(bounds.shell.bottom)
  expect(bounds.world.width).toBeLessThanOrEqual(bounds.canvas.width + 0.01)
  expect(bounds.world.height).toBeLessThanOrEqual(bounds.canvas.height + 0.01)
  expect(bounds.world.width / bounds.world.height).toBeCloseTo(16 / 9, 2)
  expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.viewport.height)
}
