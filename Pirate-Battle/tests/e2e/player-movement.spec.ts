import { expect, test } from '@playwright/test'
import { centralIsland } from '../../src/game/config/arena-layout.ts'
import { defaultGameConfig } from '../../src/game/config/game-config.ts'
import { createInitialWorld } from '../../src/game/core/create-world.ts'
import { BrowserRandom } from '../../src/game/core/random-source.ts'
import { playerMovementSystem } from '../../src/game/systems/player-movement-system.ts'
import { emptyPlayerInput } from '../../src/game/types/game.ts'

test('moves, turns, stays inside the arena and cannot enter the central island', () => {
  const world = createInitialWorld('test-match', defaultGameConfig)
  const startingPosition = { ...world.player.position }
  const startingRotation = world.player.rotation
  const context = {
    config: defaultGameConfig,
    world,
    input: { ...emptyPlayerInput, forward: true, turnRight: true },
    random: new BrowserRandom(),
  }

  playerMovementSystem.update(100, context)
  expect(world.player.position).not.toEqual(startingPosition)
  expect(world.player.rotation).toBeGreaterThan(startingRotation)

  world.player.position.x = world.player.collisionRadius
  world.player.rotation = Math.PI
  playerMovementSystem.update(1_000, { ...context, input: { ...emptyPlayerInput, forward: true } })
  expect(world.player.position.x).toBe(world.player.collisionRadius)

  const safeDistance = centralIsland.radius + world.player.collisionRadius + 1
  world.player.position.x = centralIsland.center.x - safeDistance
  world.player.position.y = centralIsland.center.y
  world.player.rotation = 0
  const beforeIslandCollision = { ...world.player.position }
  playerMovementSystem.update(1_000, { ...context, input: { ...emptyPlayerInput, forward: true } })
  expect(world.player.position).toEqual(beforeIslandCollision)
})
