import { expect, test } from '@playwright/test'
import { tiledArenaTestConfig } from '../helpers/tiled-arena-fixture.ts'
import { createInitialWorld } from '../../src/game/core/create-world.ts'
import { BrowserRandom } from '../../src/game/core/random-source.ts'
import { playerMovementSystem } from '../../src/game/systems/player-movement-system.ts'
import { emptyPlayerInput } from '../../src/game/types/game.ts'

test('moves, turns, stays inside the arena and cannot cross a visible coastline', () => {
  const world = createInitialWorld('test-match', tiledArenaTestConfig)
  const startingPosition = { ...world.player.position }
  const startingRotation = world.player.rotation
  const context = {
    config: tiledArenaTestConfig,
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

  world.player.position = { x: 400, y: 360 }
  world.player.rotation = -Math.PI / 2
  const beforeIslandCollision = { ...world.player.position }
  playerMovementSystem.update(1_000, { ...context, input: { ...emptyPlayerInput, forward: true } })
  expect(world.player.position).toEqual(beforeIslandCollision)
})
