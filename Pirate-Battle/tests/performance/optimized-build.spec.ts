import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

interface FrameMetrics {
  durationMs: number
  frameRate: number
  frameIntervalP95Ms: number
  maximumEnemies: number
  maximumProjectiles: number
  maximumEffects: number
  endedEarly: boolean
}

test('measures a three-minute match in the optimized build', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('pirate-battle.game-options', JSON.stringify({ sessionDurationSeconds: 180, enemySpawnIntervalSeconds: 20 })))
  await page.goto('/?performance-profile=1')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('.game-canvas')).toHaveAttribute('aria-busy', 'false')
  await expect(page.locator('.game-canvas')).toHaveAttribute('data-elapsed-ms', /.+/)
  await page.keyboard.down('ArrowUp')
  await page.keyboard.down('ArrowRight')
  const metrics = await page.evaluate(async (): Promise<FrameMetrics> => new Promise((resolve) => {
    const startedAt = performance.now()
    let previousFrameAt = startedAt
    let nextEntitySampleAt = startedAt
    let firstMissingArenaAtMs: number | null = null
    let maximumEnemies = 0
    let maximumProjectiles = 0
    let maximumEffects = 0
    const intervals: number[] = []
    const sample = (now: number) => {
      intervals.push(now - previousFrameAt)
      previousFrameAt = now
      const arena = document.querySelector<HTMLElement>('.game-canvas')
      if (!arena && firstMissingArenaAtMs === null) firstMissingArenaAtMs = now - startedAt
      if (arena && now >= nextEntitySampleAt) {
        nextEntitySampleAt += 1_000
        maximumEnemies = Math.max(maximumEnemies, JSON.parse(arena.dataset.enemies ?? '[]').length)
        maximumProjectiles = Math.max(maximumProjectiles, Number(arena.dataset.projectileCount ?? 0))
        maximumEffects = Math.max(maximumEffects, Number(arena.dataset.effectCount ?? 0))
      }
      const durationMs = now - startedAt
      if (durationMs >= 180_000) {
        const ordered = intervals.slice(1).sort((left, right) => left - right)
        resolve({
          durationMs,
          frameRate: ordered.length / (durationMs / 1_000),
          frameIntervalP95Ms: ordered[Math.floor((ordered.length - 1) * 0.95)] ?? 0,
          maximumEnemies,
          maximumProjectiles,
          maximumEffects,
          endedEarly: firstMissingArenaAtMs !== null && firstMissingArenaAtMs < 179_000,
        })
        return
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  }))
  await page.keyboard.up('ArrowRight')
  await page.keyboard.up('ArrowUp')
  await testInfo.attach('optimized-build-performance.json', { body: JSON.stringify(metrics, null, 2), contentType: 'application/json' })
  await writeMeasurement('optimized-build-measurement.json', metrics)
  expect(metrics.endedEarly).toBe(false)
  expect(metrics.durationMs).toBeGreaterThanOrEqual(180_000)
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  await expect(page.locator('.result-details')).toContainText('03:00')
})

test('measures heap use over five start-play-exit cycles', async ({ page }, testInfo) => {
  const session = await page.context().newCDPSession(page)
  await session.send('Performance.enable')
  const heapSizes: number[] = []
  await page.goto('/')
  for (let cycle = 0; cycle < 5; cycle += 1) {
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.locator('canvas')).toBeVisible()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Back to menu' }).click()
    await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
    const metrics = await session.send('Performance.getMetrics')
    heapSizes.push(metrics.metrics.find((metric) => metric.name === 'JSHeapUsedSize')?.value ?? 0)
  }
  await testInfo.attach('resource-cycle-memory.json', { body: JSON.stringify({ heapSizes }, null, 2), contentType: 'application/json' })
  await writeMeasurement('resource-cycle-memory.json', { heapSizes })
  expect(heapSizes).toHaveLength(5)
  expect(heapSizes.every((size) => size > 0)).toBe(true)
})

async function writeMeasurement(filename: string, value: unknown): Promise<void> {
  await writeFile(new URL(`../../docs/performance/${filename}`, import.meta.url), `${JSON.stringify(value, null, 2)}\n`)
}
