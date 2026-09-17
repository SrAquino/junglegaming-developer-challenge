import { expect, test } from '@playwright/test'
import { circleIntersectsLand } from '../../src/game/config/arena-geometry.ts'
import { defaultGameConfig } from '../../src/game/config/game-config.ts'
import { createInitialWorld } from '../../src/game/core/create-world.ts'
import { SeededRandom } from '../../src/game/core/random-source.ts'
import type { EnemyEntity } from '../../src/game/entities/entity.ts'
import { combatSystem } from '../../src/game/systems/combat-system.ts'
import { enemyBehaviorSystem } from '../../src/game/systems/enemy-behavior-system.ts'
import { enemySpawnSystem } from '../../src/game/systems/enemy-spawn-system.ts'
import { weaponSystem } from '../../src/game/systems/weapon-system.ts'
import { emptyPlayerInput } from '../../src/game/types/game.ts'
import { tiledArenaTestConfig } from '../helpers/tiled-arena-fixture.ts'

function context() {
  return { config: tiledArenaTestConfig, world: createInitialWorld('test', tiledArenaTestConfig), input: emptyPlayerInput, random: new SeededRandom(42) }
}

function enemy(enemyType: 'chaser' | 'shooter', x: number, y: number): EnemyEntity {
  const config = defaultGameConfig.enemies[enemyType]
  return { id: 'target', kind: 'enemy', enemyType, active: true, position: { x, y }, rotation: Math.PI,
    velocity: { x: 0, y: 0 }, health: config.maxHealth, maxHealth: config.maxHealth,
    collisionRadius: config.collisionRadius, lastAttackAtMs: 0 }
}

test('spawns at the configured interval with both types and safe positions', () => {
  const simulation = context()
  simulation.world.spawnElapsedMs = 3_999
  enemySpawnSystem.update(0, simulation)
  expect(simulation.world.enemies).toHaveLength(0)
  for (let index = 0; index < 20; index += 1) {
    simulation.world.spawnElapsedMs = 4_000
    simulation.world.elapsedMs += 4_000
    enemySpawnSystem.update(0, simulation)
  }
  expect(simulation.world.enemies.slice(0, 2).map((ship) => ship.enemyType)).toEqual(['chaser', 'shooter'])
  for (const ship of simulation.world.enemies) {
    expect(Math.hypot(ship.position.x - simulation.world.player.position.x, ship.position.y - simulation.world.player.position.y)).toBeGreaterThanOrEqual(defaultGameConfig.spawn.minimumDistanceFromPlayer)
    expect(circleIntersectsLand(ship.position, ship.collisionRadius, tiledArenaTestConfig.arena.collisionPolygons ?? [])).toBe(false)
  }
})

for (const enemyType of ['chaser', 'shooter'] as const) {
  test(`${enemyType} routes around the north-west coast without entering land`, () => {
    const simulation = context()
    const ship = enemy(enemyType, 1_350, 300)
    simulation.world.enemies.push(ship)
    for (let step = 0; step < 1_000; step += 1) {
      simulation.world.elapsedMs += 20
      enemyBehaviorSystem.update(20, simulation)
      expect(circleIntersectsLand(ship.position, ship.collisionRadius, tiledArenaTestConfig.arena.collisionPolygons ?? [])).toBe(false)
      if (!ship.active) break
    }
    expect(ship.position.x).toBeLessThan(800)
    expect(ship.rotation).not.toBe(Math.PI)
    if (enemyType === 'chaser') {
      expect(ship.active).toBe(false)
      expect(simulation.world.player.health).toBe(75)
      expect(simulation.world.player.score).toBe(0)
      expect(simulation.world.effects.some((effect) => effect.effectType === 'explosion')).toBe(true)
      enemyBehaviorSystem.update(20, simulation)
      expect(simulation.world.player.health).toBe(75)
    } else {
      expect(simulation.world.projectiles.length).toBeGreaterThan(0)
      expect(simulation.world.projectiles.every((shot) => shot.owner === 'enemy')).toBe(true)
    }
  })
}

test('Shooter respects range and cooldown and cannot attack through land', () => {
  const simulation = context()
  const ship = enemy('shooter', 1_350, 300)
  simulation.world.enemies.push(ship)
  simulation.world.elapsedMs = 5_000
  enemyBehaviorSystem.update(0, simulation)
  expect(simulation.world.projectiles).toHaveLength(0)
  ship.position = { x: 700, y: 450 }
  ship.rotation = Math.atan2(simulation.world.player.position.y - ship.position.y, simulation.world.player.position.x - ship.position.x)
  enemyBehaviorSystem.update(0, simulation)
  expect(simulation.world.projectiles).toHaveLength(1)
  enemyBehaviorSystem.update(0, simulation)
  expect(simulation.world.projectiles).toHaveLength(1)
  simulation.world.elapsedMs += defaultGameConfig.enemies.shooter.weapon.cooldownMs
  enemyBehaviorSystem.update(0, simulation)
  expect(simulation.world.projectiles).toHaveLength(2)
})

test('destroyed ships cannot fire or damage, and repeated hits score once', () => {
  const simulation = context()
  const ship = enemy('shooter', simulation.world.player.position.x, simulation.world.player.position.y - 44)
  ship.health = 20
  simulation.world.enemies.push(ship)
  weaponSystem.update(0, { ...simulation, input: { ...emptyPlayerInput, fireFront: true } })
  const shot = simulation.world.projectiles[0]
  simulation.world.projectiles.push({ ...shot, id: 'duplicate', position: { ...shot.position } })
  combatSystem.update(0, simulation)
  expect(simulation.world.player.score).toBe(1)
  expect(simulation.world.enemies).toHaveLength(0)
  simulation.world.elapsedMs = 10_000
  enemyBehaviorSystem.update(20, simulation)
  combatSystem.update(0, simulation)
  expect(simulation.world.player.score).toBe(1)
  expect(simulation.world.player.health).toBe(100)
  expect(simulation.world.projectiles.every((projectile) => projectile.owner === 'player')).toBe(true)
})

test('renders both seeded enemy types and accepts real keyboard attacks', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-16T12:00:00.000Z') })
  await page.clock.pauseAt(new Date('2026-09-16T12:00:01.000Z'))
  await page.addInitScript(() => {
    let state = 42
    Math.random = () => { state = (state * 1_664_525 + 1_013_904_223) >>> 0; return state / 4_294_967_296 }
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.locator('.game-canvas')
  await expect(arena).toHaveAttribute('data-enemies', '[]')
  await page.clock.runFor(4_100)
  await expect(arena).toHaveAttribute('data-enemies', /chaser/)
  await page.keyboard.down('f')
  await page.clock.runFor(32)
  await page.keyboard.up('f')
  expect(Number(await arena.getAttribute('data-projectile-count'))).toBeGreaterThan(0)
  await page.clock.runFor(Math.max(0, 8_100 - Number(await arena.getAttribute('data-elapsed-ms'))))
  await expect(arena).toHaveAttribute('data-enemies', /shooter/)
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('damages and scores one seeded enemy once through real keyboard fire', async ({ page }) => {
  test.setTimeout(60_000)
  await page.clock.install({ time: new Date('2026-09-16T12:00:00.000Z') })
  await page.clock.pauseAt(new Date('2026-09-16T12:00:01.000Z'))
  await page.addInitScript(() => localStorage.setItem('pirate-battle.game-options', JSON.stringify({ sessionDurationSeconds: 60, enemySpawnIntervalSeconds: 20 })))
  await page.goto('/?simulation-rate=5&simulation-seed=8')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('aria-busy', 'false')
  await page.clock.runFor(4_020)
  await expect.poll(() => enemies(page)).toHaveLength(1)
  expect((await enemies(page))[0]?.health).toBe(30)

  await aimAtFirstEnemy(page, arena)
  await fireOneFrontShot(page)
  expect((await enemies(page))[0]?.health).toBe(10)
  await aimAtFirstEnemy(page, arena)
  await fireOneFrontShot(page)
  expect(Number(await arena.getAttribute('data-score'))).toBe(1)
  expect(await enemies(page)).toHaveLength(0)
  await page.clock.runFor(500)
  await expect(arena).toHaveAttribute('data-score', '1')
})

async function enemies(page: import('@playwright/test').Page): Promise<{ position: { x: number; y: number }; health: number }[]> {
  const value = await page.getByRole('img', { name: 'Pirate Battle arena' }).getAttribute('data-enemies')
  return JSON.parse(value ?? '[]') as { position: { x: number; y: number }; health: number }[]
}

async function aimAtFirstEnemy(page: import('@playwright/test').Page, arena: import('@playwright/test').Locator): Promise<void> {
  for (let correction = 0; correction < 2; correction += 1) {
    const player = { x: Number(await arena.getAttribute('data-player-x')), y: Number(await arena.getAttribute('data-player-y')) }
    const target = (await enemies(page))[0]
    if (!target) throw new Error('Seeded enemy did not spawn.')
    const rotation = Number(await arena.getAttribute('data-player-rotation'))
    const desired = Math.atan2(target.position.y - player.y, target.position.x - player.x)
    const difference = Math.atan2(Math.sin(desired - rotation), Math.cos(desired - rotation))
    const key = difference >= 0 ? 'ArrowRight' : 'ArrowLeft'
    await page.keyboard.down(key)
    await page.clock.runFor(Math.abs(difference) / (Math.PI * 0.9) * 1_000 / 5)
    await page.keyboard.up(key)
  }
}

async function fireOneFrontShot(page: import('@playwright/test').Page): Promise<void> {
  await page.keyboard.down('f')
  await page.clock.runFor(20)
  await page.keyboard.up('f')
  await page.clock.runFor(240)
}
