import { expect, test } from '@playwright/test'
import {
  createGameConfigSnapshot,
  defaultGameConfig,
  defaultGameOptions,
} from '../../src/game/config/game-config.ts'
import { GameSession } from '../../src/game/core/game-session.ts'
import { ManualGameClock } from '../../src/game/core/game-clock.ts'
import { SeededRandom } from '../../src/game/core/random-source.ts'
import type { GameSystem } from '../../src/game/systems/game-system.ts'
import { emptyPlayerInput } from '../../src/game/types/game.ts'

const movementSystem: GameSystem = {
  update(deltaMs, { config, input, world }) {
    if (input.forward) {
      world.player.position.x += config.player.moveSpeed * (deltaMs / 1_000)
    }
  },
}

const deterministicConfig = createGameConfigSnapshot(defaultGameOptions, {
  ...defaultGameConfig,
  simulation: {
    ...defaultGameConfig.simulation,
    fixedStepMs: 10,
    maxFrameDeltaMs: 250,
    maxStepsPerFrame: 25,
  },
})

test('produces equivalent simulation at different render rates', () => {
  const fastFrames = runSimulation(Array.from({ length: 100 }, () => 20))
  const slowFrames = runSimulation(Array.from({ length: 20 }, () => 100))

  expect(fastFrames.elapsedMs).toBe(2_000)
  expect(slowFrames.elapsedMs).toBe(2_000)
  expect(fastFrames.playerPosition).toEqual(slowFrames.playerPosition)
})

test('suspends time during pause and guards match completion', () => {
  const clock = new ManualGameClock()
  const session = new GameSession({ clock, random: new SeededRandom(7) })
  session.start(deterministicConfig)

  clock.advance(100)
  session.tick(emptyPlayerInput)
  const elapsedBeforePause = session.observe().elapsedMs

  expect(session.pause()).toBe(true)
  clock.advance(5_000)
  session.tick({ ...emptyPlayerInput, forward: true })
  expect(session.observe().elapsedMs).toBe(elapsedBeforePause)
  expect(session.observe().input).toEqual(emptyPlayerInput)

  expect(session.resume()).toBe(true)
  clock.advance(100)
  session.tick(emptyPlayerInput)
  expect(session.observe().elapsedMs).toBe(elapsedBeforePause + 100)

  expect(session.finish('player-destroyed')).toBe(true)
  expect(session.finish('time-expired')).toBe(false)
  expect(session.getResult()?.endReason).toBe('player-destroyed')
})

test('creates immutable snapshots and deterministic random sequences', () => {
  const snapshot = createGameConfigSnapshot({
    sessionDurationSeconds: 90,
    enemySpawnIntervalSeconds: 3,
  })
  const firstRandom = new SeededRandom(42)
  const secondRandom = new SeededRandom(42)

  expect(snapshot.sessionDurationSeconds).toBe(90)
  expect(snapshot.enemySpawnIntervalSeconds).toBe(3)
  expect(Object.isFrozen(snapshot)).toBe(true)
  expect(Object.isFrozen(snapshot.weapons.front.projectile)).toBe(true)
  expect(Array.from({ length: 5 }, () => firstRandom.next())).toEqual(
    Array.from({ length: 5 }, () => secondRandom.next()),
  )
  expect(() =>
    createGameConfigSnapshot({ sessionDurationSeconds: 59, enemySpawnIntervalSeconds: 3 }),
  ).toThrow('Game session time must be between 60 and 180.')
})

test('bounds catch-up work and publishes HUD snapshots at a controlled rate', () => {
  const clock = new ManualGameClock()
  const session = new GameSession({ clock, random: new SeededRandom(99) })
  const hudSnapshots: number[] = []
  session.subscribeHud((snapshot) => hudSnapshots.push(snapshot.remainingSeconds))
  session.start(deterministicConfig)

  clock.advance(5_000)
  const catchUp = session.tick(emptyPlayerInput)
  expect(catchUp.steps).toBe(25)
  expect(session.observe().elapsedMs).toBe(250)

  const publicationCount = hudSnapshots.length
  for (let frame = 0; frame < 9; frame += 1) {
    clock.advance(10)
    session.tick(emptyPlayerInput)
  }
  expect(hudSnapshots).toHaveLength(publicationCount)

  clock.advance(10)
  session.tick(emptyPlayerInput)
  expect(hudSnapshots).toHaveLength(publicationCount + 1)
})

function runSimulation(frameDeltas: readonly number[]) {
  const clock = new ManualGameClock()
  const session = new GameSession({
    clock,
    random: new SeededRandom(123),
    systems: [movementSystem],
  })
  session.start(deterministicConfig)

  for (const frameDelta of frameDeltas) {
    clock.advance(frameDelta)
    session.tick({ ...emptyPlayerInput, forward: true })
  }

  return session.observe()
}
