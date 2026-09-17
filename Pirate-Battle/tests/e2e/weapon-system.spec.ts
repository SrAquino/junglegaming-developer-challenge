import { expect, test } from '@playwright/test'
import { defaultGameConfig } from '../../src/game/config/game-config.ts'
import { createInitialWorld } from '../../src/game/core/create-world.ts'
import { BrowserRandom } from '../../src/game/core/random-source.ts'
import { combatSystem } from '../../src/game/systems/combat-system.ts'
import { projectileSystem } from '../../src/game/systems/projectile-system.ts'
import { weaponSystem } from '../../src/game/systems/weapon-system.ts'
import { emptyPlayerInput } from '../../src/game/types/game.ts'
import { damageStage } from '../../src/game/rendering/game-assets.ts'
import { tiledArenaTestConfig } from '../helpers/tiled-arena-fixture.ts'

test('fires front and broadside weapons with their configured cooldowns', () => {
  const world = createInitialWorld('weapon-test', defaultGameConfig)
  const context = {
    config: defaultGameConfig,
    world,
    input: { ...emptyPlayerInput, fireFront: true, fireLeft: true },
    random: new BrowserRandom(),
  }

  weaponSystem.update(0, context)
  expect(world.projectiles).toHaveLength(4)
  expect(world.effects).toHaveLength(2)
  expect(world.events.filter((event) => event.type === 'weapon-fired')).toEqual([
    { type: 'weapon-fired', weapon: 'front', owner: 'player' },
    { type: 'weapon-fired', weapon: 'broadside', owner: 'player' },
  ])

  weaponSystem.update(100, context)
  expect(world.projectiles).toHaveLength(4)

  world.elapsedMs = defaultGameConfig.weapons.front.cooldownMs
  weaponSystem.update(0, { ...context, input: { ...emptyPlayerInput, fireFront: true } })
  expect(world.projectiles).toHaveLength(5)
})

test('projectiles damage enemies once', () => {
  const world = createInitialWorld('combat-test', defaultGameConfig)
  const context = {
    config: defaultGameConfig,
    world,
    input: { ...emptyPlayerInput, fireFront: true },
    random: new BrowserRandom(),
  }
  world.player.position = { x: 900, y: 500 }
  const enemy = {
    id: 'target',
    kind: 'enemy' as const,
    enemyType: 'chaser' as const,
    active: true,
    position: { x: world.player.position.x, y: world.player.position.y - 70 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    health: 20,
    maxHealth: 20,
    collisionRadius: 28,
    lastAttackAtMs: 0,
  }
  world.enemies.push(enemy)

  weaponSystem.update(0, context)
  projectileSystem.update(100, context)
  combatSystem.update(0, context)
  expect(world.enemies).toHaveLength(0)
  expect(world.player.score).toBe(1)
  expect(world.projectiles).toHaveLength(0)
  expect(world.effects.some((effect) => effect.effectType === 'explosion')).toBe(true)
  expect(world.effects.some((effect) => effect.effectType === 'sinking' && effect.shipIdentity === 'chaser')).toBe(true)
  expect(world.events).toEqual(expect.arrayContaining([
    { type: 'projectile-impact', material: 'wood' },
    { type: 'ship-destroyed', target: 'chaser' },
    { type: 'score-changed' },
  ]))
})

test('selects authored damage artwork at the health thresholds', () => {
  expect(damageStage(100, 100)).toBe('intact')
  expect(damageStage(66, 100)).toBe('damaged')
  expect(damageStage(33, 100)).toBe('critical')
})

test('a swept projectile stops at the coastline instead of tunnelling through land', () => {
  const world = createInitialWorld('coast-test', tiledArenaTestConfig)
  world.projectiles.push({
    id: 'coast-shot', kind: 'projectile', active: true, owner: 'player',
    position: { x: 400, y: 380 }, rotation: -Math.PI / 2, velocity: { x: 0, y: -800 },
    damage: 20, distanceTravelled: 0, maximumRange: 900, remainingLifetimeMs: 2_000,
  })
  projectileSystem.update(200, {
    config: tiledArenaTestConfig,
    world,
    input: emptyPlayerInput,
    random: new BrowserRandom(),
  })
  expect(world.projectiles).toHaveLength(0)
  expect(world.effects.at(-1)?.effectType).toBe('impact-water')
  expect(world.events.at(-1)).toEqual({ type: 'projectile-impact', material: 'water' })
})
