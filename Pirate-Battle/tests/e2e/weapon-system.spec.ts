import { expect, test } from '@playwright/test'
import { defaultGameConfig } from '../../src/game/config/game-config.ts'
import { createInitialWorld } from '../../src/game/core/create-world.ts'
import { BrowserRandom } from '../../src/game/core/random-source.ts'
import { combatSystem } from '../../src/game/systems/combat-system.ts'
import { projectileSystem } from '../../src/game/systems/projectile-system.ts'
import { weaponSystem } from '../../src/game/systems/weapon-system.ts'
import { emptyPlayerInput } from '../../src/game/types/game.ts'

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

  weaponSystem.update(100, context)
  expect(world.projectiles).toHaveLength(4)

  world.elapsedMs = defaultGameConfig.weapons.front.cooldownMs
  weaponSystem.update(0, { ...context, input: { ...emptyPlayerInput, fireFront: true } })
  expect(world.projectiles).toHaveLength(5)
})

test('projectiles damage enemies once and disappear when hitting the island', () => {
  const world = createInitialWorld('combat-test', defaultGameConfig)
  const context = {
    config: defaultGameConfig,
    world,
    input: { ...emptyPlayerInput, fireFront: true },
    random: new BrowserRandom(),
  }
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
})
