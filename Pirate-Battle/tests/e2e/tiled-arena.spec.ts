import { expect, test } from '@playwright/test'
import { decodeGid } from '../../src/game/rendering/tiled-map-renderer.ts'

test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { window.localStorage.clear(); window.sessionStorage.clear() })
})

test('decodes all Tiled GID flip flags without changing the tile id', () => {
  expect(decodeGid(82)).toEqual({ gid: 82, horizontal: false, vertical: false, diagonal: false })
  expect(decodeGid((0x80000000 | 82) >>> 0)).toEqual({ gid: 82, horizontal: true, vertical: false, diagonal: false })
  expect(decodeGid((0x40000000 | 82) >>> 0)).toEqual({ gid: 82, horizontal: false, vertical: true, diagonal: false })
  expect(decodeGid((0x20000000 | 82) >>> 0)).toEqual({ gid: 82, horizontal: false, vertical: false, diagonal: true })
  expect(decodeGid((0xe0000000 | 82) >>> 0)).toEqual({ gid: 82, horizontal: true, vertical: true, diagonal: true })
})

test('loads the authored Tiled map, external tileset and ordered tile layers', async ({ page }) => {
  const responses: string[] = []
  page.on('response', (response) => {
    if (response.url().includes('/maps/') || response.url().includes('/assets/tilesheet/tiles_sheet.png')) responses.push(response.url())
  })
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await expect(arena).toHaveAttribute('data-map-loaded', 'true')
  await expect(arena).toHaveAttribute('data-map-layers', 'AguaRasa,Land,Decorations')
  await expect(arena).toHaveAttribute('data-map-layer-tile-counts', /AguaRasa:\d+,Land:\d+,Decorations:\d+/)
  await expect(arena).toHaveAttribute('data-collision-polygon-count', '7')
  await expect(arena).toHaveAttribute('data-arena-width', '1600')
  await expect(arena).toHaveAttribute('data-arena-height', '896')
  expect(responses.some((url) => url.endsWith('/maps/arena.tmj'))).toBe(true)
  expect(responses.some((url) => url.endsWith('/maps/tiles_sheet.tsj'))).toBe(true)
  expect(responses.some((url) => url.endsWith('/assets/tilesheet/tiles_sheet.png'))).toBe(true)
})

test('blocks the player and removes projectiles at authored Collision objects', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')

  await page.keyboard.down('f')
  await page.clock.runFor(20)
  expect(Number(await arena.getAttribute('data-projectile-count'))).toBeGreaterThan(0)
  await page.keyboard.up('f')
  await page.clock.runFor(600)
  await expect(arena).toHaveAttribute('data-projectile-count', '0')

  await page.keyboard.down('w')
  await page.clock.runFor(2_000)
  await page.keyboard.up('w')
  const blockedY = Number(await arena.getAttribute('data-player-y'))
  expect(blockedY).toBeGreaterThanOrEqual(350)
})

test('shows map-loading failure and retries without a procedural fallback', async ({ page }) => {
  await page.route('**/maps/arena.tmj', (route) => route.fulfill({ status: 500, body: 'map failed' }))
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('alert')).toContainText('Unable to load game assets.')
  await expect(page.locator('canvas')).toHaveCount(0)

  await page.unroute('**/maps/arena.tmj')
  await page.getByRole('button', { name: 'Retry' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await expect(arena).toHaveAttribute('data-map-loaded', 'true')
})
