import { expect, test } from '@playwright/test'
import type { Browser, CDPSession, Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { arch, cpus, platform, release, totalmem } from 'node:os'

interface FrameMetrics {
  durationMs: number
  frameRate: number
  frameIntervalP95Ms: number
  maximumEnemies: number
  maximumProjectiles: number
  maximumEffects: number
  endedEarly: boolean
}

interface EnvironmentEvidence {
  operatingSystem: string
  cpu: string
  logicalProcessors: number
  totalMemoryBytes: number
  browser: string
  node: string
  viewport: { width: number; height: number }
  devicePixelRatio: number
  webglVendor: string
  webglRenderer: string
  headless: true
}

interface ResourceSample {
  cycle: number
  jsHeapUsedBytes: number
  documents: number
  nodes: number
  jsEventListeners: number
  resourceEntries: number
  resourceEntriesByInitiator: Record<string, number>
  resourcePaths: string[]
  canvasElements: number
  audioVoicesBeforeExit: number
  audioLoopsBeforeExit: number
  enemiesBeforeExit: number
  projectilesBeforeExit: number
  effectsBeforeExit: number
}

test('measures a three-minute match in the optimized build', async ({ page, browser }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('pirate-battle.game-options', JSON.stringify({ sessionDurationSeconds: 180, enemySpawnIntervalSeconds: 20 })))
  await page.goto('/?performance-profile=1')
  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.locator('.game-canvas')).toHaveAttribute('aria-busy', 'false')
  await page.getByRole('button', { name: 'Pause match' }).click()
  await page.getByRole('dialog', { name: 'Match paused' }).getByRole('button', { name: 'Main menu' }).click()
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
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
  const evidence = {
    measuredAt: new Date().toISOString(),
    environment: await environmentEvidence(page, browser),
    matchConfiguration: {
      durationSeconds: 180,
      enemySpawnIntervalSeconds: 20,
      input: 'continuous forward and right turn',
      performanceProfile: 'player hull raised to 100,000; gameplay clock remains 1x',
    },
    method: 'warm-cache start/exit, then requestAnimationFrame intervals for 180 seconds; entity diagnostics sampled from the live Pixi arena once per second',
    targetFrameRate: 60,
    metrics,
  }
  await testInfo.attach('optimized-build-performance.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
  await writeMeasurement('optimized-build-measurement.json', evidence)
  expect(metrics.endedEarly).toBe(false)
  expect(metrics.durationMs).toBeGreaterThanOrEqual(180_000)
  await expect(page.getByRole('heading', { name: 'Battle complete' })).toBeVisible()
  await expect(page.locator('.result-details')).toContainText('03:00')
  await closeProfilePage(page)
})

test('measures retained resources over five same-page start-play-exit cycles', async ({ page, browser }, testInfo) => {
  const session = await page.context().newCDPSession(page)
  await session.send('Performance.enable')
  await session.send('HeapProfiler.enable')
  await page.goto('/')
  const baseline = await resourceSample(page, session, 0, { audioVoices: 0, audioLoops: 0, enemies: 0, projectiles: 0, effects: 0 })
  await page.evaluate(() => performance.clearResourceTimings())
  const cycles: ResourceSample[] = []
  for (let cycle = 0; cycle < 5; cycle += 1) {
    await page.getByRole('button', { name: 'Play' }).click()
    const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
    await expect(arena).toHaveAttribute('aria-busy', 'false')
    await page.waitForTimeout(1_000)
    const beforeExit = await arena.evaluate((element) => ({
      audioVoices: Number(element.dataset.audioVoices ?? 0),
      audioLoops: Number(element.dataset.audioLoops ?? 0),
      enemies: JSON.parse(element.dataset.enemies ?? '[]').length as number,
      projectiles: Number(element.dataset.projectileCount ?? 0),
      effects: Number(element.dataset.effectCount ?? 0),
    }))
    await page.getByRole('button', { name: 'Pause match' }).click()
    await page.getByRole('dialog', { name: 'Match paused' }).getByRole('button', { name: 'Main menu' }).click()
    await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
    cycles.push(await resourceSample(page, session, cycle + 1, beforeExit))
    await page.evaluate(() => performance.clearResourceTimings())
  }
  const firstCycle = cycles[0]
  const finalCycle = cycles.at(-1)
  if (!firstCycle || !finalCycle) throw new Error('Resource-cycle samples were not collected.')
  const evidence = {
    measuredAt: new Date().toISOString(),
    environment: await environmentEvidence(page, browser),
    method: 'five Play -> one second active -> Pause -> Main menu cycles in one document; forced GC before each post-exit CDP sample',
    baseline,
    cycles,
    analysis: {
      heapChangeFromBaselineBytes: finalCycle.jsHeapUsedBytes - baseline.jsHeapUsedBytes,
      heapChangeFromFirstCycleBytes: finalCycle.jsHeapUsedBytes - firstCycle.jsHeapUsedBytes,
      heapChangeFromFirstCyclePercent: percentageChange(firstCycle.jsHeapUsedBytes, finalCycle.jsHeapUsedBytes),
      monotonicallyIncreasingHeap: cycles.every((sample, index) => index === 0 || sample.jsHeapUsedBytes > cycles[index - 1]!.jsHeapUsedBytes),
      documentChangeFromBaseline: finalCycle.documents - baseline.documents,
      nodeChangeFromBaseline: finalCycle.nodes - baseline.nodes,
      listenerChangeFromBaseline: finalCycle.jsEventListeners - baseline.jsEventListeners,
      documentChangeFromFirstCycle: finalCycle.documents - firstCycle.documents,
      nodeChangeFromFirstCycle: finalCycle.nodes - firstCycle.nodes,
      listenerChangeFromFirstCycle: finalCycle.jsEventListeners - firstCycle.jsEventListeners,
      structurallyStableAfterFirstCycle: cycles.every((sample) => sample.documents === firstCycle.documents
        && sample.nodes === firstCycle.nodes
        && sample.jsEventListeners === firstCycle.jsEventListeners
        && sample.canvasElements === 0),
      resourceEntriesPerCycle: cycles.map((sample) => sample.resourceEntries),
      retainedCanvasCounts: cycles.map((sample) => sample.canvasElements),
    },
  }
  await testInfo.attach('resource-cycle-memory.json', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' })
  await writeMeasurement('resource-cycle-memory.json', evidence)
  expect(cycles).toHaveLength(5)
  expect(cycles.every((sample) => sample.jsHeapUsedBytes > 0)).toBe(true)
  expect(cycles.every((sample) => sample.canvasElements === 0)).toBe(true)
  await session.detach()
  await closeProfilePage(page)
})

async function resourceSample(
  page: Page,
  session: CDPSession,
  cycle: number,
  beforeExit: { audioVoices: number; audioLoops: number; enemies: number; projectiles: number; effects: number },
): Promise<ResourceSample> {
  await session.send('HeapProfiler.collectGarbage')
  await page.waitForTimeout(100)
  const [performanceMetrics, dom, pageMetrics] = await Promise.all([
    session.send('Performance.getMetrics'),
    session.send('Memory.getDOMCounters'),
    page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const resourceEntriesByInitiator: Record<string, number> = {}
      for (const entry of entries) resourceEntriesByInitiator[entry.initiatorType] = (resourceEntriesByInitiator[entry.initiatorType] ?? 0) + 1
      return {
        resourceEntries: entries.length,
        resourceEntriesByInitiator,
        resourcePaths: [...new Set(entries.map((entry) => new URL(entry.name).pathname))].sort(),
        canvasElements: document.querySelectorAll('canvas').length,
      }
    }),
  ])
  const metric = (name: string) => performanceMetrics.metrics.find((item) => item.name === name)?.value ?? 0
  return {
    cycle,
    jsHeapUsedBytes: metric('JSHeapUsedSize'),
    documents: dom.documents,
    nodes: dom.nodes,
    jsEventListeners: dom.jsEventListeners,
    resourceEntries: pageMetrics.resourceEntries,
    resourceEntriesByInitiator: pageMetrics.resourceEntriesByInitiator,
    resourcePaths: pageMetrics.resourcePaths,
    canvasElements: pageMetrics.canvasElements,
    audioVoicesBeforeExit: beforeExit.audioVoices,
    audioLoopsBeforeExit: beforeExit.audioLoops,
    enemiesBeforeExit: beforeExit.enemies,
    projectilesBeforeExit: beforeExit.projectiles,
    effectsBeforeExit: beforeExit.effects,
  }
}

async function environmentEvidence(page: Page, browser: Browser): Promise<EnvironmentEvidence> {
  const browserEvidence = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    const webgl = canvas.getContext('webgl')
    const debugInfo = webgl?.getExtension('WEBGL_debug_renderer_info')
    return {
      devicePixelRatio: window.devicePixelRatio,
      webglVendor: webgl && debugInfo ? String(webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : 'unavailable',
      webglRenderer: webgl && debugInfo ? String(webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : 'unavailable',
    }
  })
  const processors = cpus()
  return {
    operatingSystem: `${platform()} ${release()} ${arch()}`,
    cpu: processors[0]?.model ?? 'unavailable',
    logicalProcessors: processors.length,
    totalMemoryBytes: totalmem(),
    browser: `Chromium ${browser.version()}`,
    node: process.version,
    viewport: page.viewportSize() ?? { width: 0, height: 0 },
    headless: true,
    ...browserEvidence,
  }
}

function percentageChange(initial: number, final: number): number {
  return initial > 0 ? (final - initial) / initial * 100 : 0
}

async function closeProfilePage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  })
  await page.close()
}

async function writeMeasurement(filename: string, value: unknown): Promise<void> {
  await writeFile(new URL(`../../docs/performance/${filename}`, import.meta.url), `${JSON.stringify(value, null, 2)}\n`)
}
