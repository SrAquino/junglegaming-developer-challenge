import { createGameConfigSnapshot } from '../config/game-config.ts'
import type { GameConfigSnapshot } from '../config/game-config.ts'
import type { GameWorldState } from '../entities/entity.ts'
import type { GameSystem } from '../systems/game-system.ts'
import type { Vector2 } from '../types/vector.ts'
import { emptyPlayerInput } from '../types/game.ts'
import type {
  CompletedMatchEndReason,
  HudSnapshot,
  MatchEndReason,
  MatchLifecycleEvent,
  MatchResult,
  MatchStatus,
  PlayerInput,
} from '../types/game.ts'
import { createInitialWorld } from './create-world.ts'
import { FixedTimestepLoop } from './fixed-timestep-loop.ts'
import type { FrameAdvanceResult } from './fixed-timestep-loop.ts'
import { BrowserGameClock } from './game-clock.ts'
import type { GameClock } from './game-clock.ts'
import { BrowserRandom } from './random-source.ts'
import type { RandomSource } from './random-source.ts'

export interface SimulationObservation {
  matchId: string | null
  status: MatchStatus
  elapsedMs: number
  score: number
  playerHealth: number
  playerPosition: Readonly<Vector2>
  playerRotation: number
  enemyCount: number
  projectileCount: number
  effectCount: number
  accumulatorMs: number
  input: Readonly<PlayerInput>
  configuration: GameConfigSnapshot | null
}

interface GameSessionDependencies {
  clock?: GameClock
  random?: RandomSource
  systems?: readonly GameSystem[]
}

type HudListener = (snapshot: Readonly<HudSnapshot>) => void
type LifecycleListener = (event: Readonly<MatchLifecycleEvent>) => void

const emptyFrameAdvance: Readonly<FrameAdvanceResult> = Object.freeze({
  steps: 0,
  simulatedMs: 0,
  droppedMs: 0,
})

export class GameSession {
  private readonly clock: GameClock
  private readonly random: RandomSource
  private readonly systems: readonly GameSystem[]
  private readonly hudListeners = new Set<HudListener>()
  private readonly lifecycleListeners = new Set<LifecycleListener>()
  private statusValue: MatchStatus = 'idle'
  private configuration: GameConfigSnapshot | null = null
  private world: GameWorldState | null = null
  private loop: FixedTimestepLoop | null = null
  private lastClockTimeMs = 0
  private lastHudPublishAtMs = 0
  private latestInput: Readonly<PlayerInput> = emptyPlayerInput
  private result: MatchResult | null = null

  public constructor(dependencies: GameSessionDependencies = {}) {
    this.clock = dependencies.clock ?? new BrowserGameClock()
    this.random = dependencies.random ?? new BrowserRandom()
    this.systems = dependencies.systems ?? []
  }

  public get status(): MatchStatus {
    return this.statusValue
  }

  public start(configuration: GameConfigSnapshot): void {
    if (this.statusValue === 'playing' || this.statusValue === 'paused') {
      throw new Error('Cannot start a match while another match is active.')
    }

    this.configuration = createGameConfigSnapshot(
      {
        sessionDurationSeconds: configuration.sessionDurationSeconds,
        enemySpawnIntervalSeconds: configuration.enemySpawnIntervalSeconds,
      },
      configuration,
    )
    this.loop = new FixedTimestepLoop(
      this.configuration.simulation.fixedStepMs,
      this.configuration.simulation.maxFrameDeltaMs,
      this.configuration.simulation.maxStepsPerFrame,
    )
    this.world = createInitialWorld(createMatchId(this.random), this.configuration)
    this.statusValue = 'playing'
    this.latestInput = emptyPlayerInput
    this.result = null
    this.lastClockTimeMs = this.clock.now()
    this.lastHudPublishAtMs = 0
    this.emitLifecycle({ type: 'started', matchId: this.world.matchId })
    this.publishHud(true)
  }

  public tick(input: Readonly<PlayerInput>): Readonly<FrameAdvanceResult> {
    const currentTimeMs = this.clock.now()
    const frameDeltaMs = Math.max(0, currentTimeMs - this.lastClockTimeMs)
    this.lastClockTimeMs = currentTimeMs

    if (this.statusValue !== 'playing' || !this.loop) {
      return emptyFrameAdvance
    }

    this.latestInput = Object.freeze({ ...input })
    const result = this.loop.advance(frameDeltaMs, (fixedStepMs) => this.simulate(fixedStepMs))
    this.publishHud(false)
    return result
  }

  public pause(): boolean {
    if (this.statusValue !== 'playing') {
      return false
    }

    this.statusValue = 'paused'
    this.latestInput = emptyPlayerInput
    this.loop?.reset()
    this.lastClockTimeMs = this.clock.now()
    this.emitLifecycle({ type: 'paused' })
    this.publishHud(true)
    return true
  }

  public resume(): boolean {
    if (this.statusValue !== 'paused') {
      return false
    }

    this.statusValue = 'playing'
    this.latestInput = emptyPlayerInput
    this.lastClockTimeMs = this.clock.now()
    this.emitLifecycle({ type: 'resumed' })
    this.publishHud(true)
    return true
  }

  public finish(reason: CompletedMatchEndReason): boolean {
    return this.end(reason)
  }

  public abandon(): boolean {
    return this.end('abandoned')
  }

  public getResult(): Readonly<MatchResult> | null {
    return this.result
  }

  public getHudSnapshot(): Readonly<HudSnapshot> {
    const config = this.configuration
    const world = this.world
    const durationMs = (config?.sessionDurationSeconds ?? 0) * 1_000
    const remainingMs = Math.max(0, durationMs - (world?.elapsedMs ?? 0))

    return Object.freeze({
      status: this.statusValue,
      score: world?.player.score ?? 0,
      remainingSeconds: Math.ceil(remainingMs / 1_000),
      playerHealth: world?.player.health ?? 0,
      playerMaxHealth: config?.player.maxHealth ?? 0,
    })
  }

  public observe(): Readonly<SimulationObservation> {
    return Object.freeze({
      matchId: this.world?.matchId ?? null,
      status: this.statusValue,
      elapsedMs: this.world?.elapsedMs ?? 0,
      score: this.world?.player.score ?? 0,
      playerHealth: this.world?.player.health ?? 0,
      playerPosition: Object.freeze({
        x: this.world?.player.position.x ?? 0,
        y: this.world?.player.position.y ?? 0,
      }),
      playerRotation: this.world?.player.rotation ?? 0,
      enemyCount: this.world?.enemies.length ?? 0,
      projectileCount: this.world?.projectiles.length ?? 0,
      effectCount: this.world?.effects.length ?? 0,
      accumulatorMs: this.loop?.getAccumulatorMs() ?? 0,
      input: Object.freeze({ ...this.latestInput }),
      configuration: this.configuration,
    })
  }

  public getWorldForRendering(): Readonly<Pick<GameWorldState, 'enemies' | 'projectiles' | 'effects'>> {
    return Object.freeze({
      enemies: this.world?.enemies ?? [],
      projectiles: this.world?.projectiles ?? [],
      effects: this.world?.effects ?? [],
    })
  }

  public subscribeHud(listener: HudListener): () => void {
    this.hudListeners.add(listener)
    listener(this.getHudSnapshot())
    return () => this.hudListeners.delete(listener)
  }

  public subscribeLifecycle(listener: LifecycleListener): () => void {
    this.lifecycleListeners.add(listener)
    return () => this.lifecycleListeners.delete(listener)
  }

  public destroy(): void {
    if (this.statusValue === 'playing' || this.statusValue === 'paused') {
      this.end('abandoned')
    }

    this.hudListeners.clear()
    this.lifecycleListeners.clear()
    this.loop?.reset()
    this.latestInput = emptyPlayerInput
  }

  private simulate(deltaMs: number): void {
    if (this.statusValue !== 'playing' || !this.configuration || !this.world) {
      return
    }

    this.world.elapsedMs = Math.min(
      this.world.elapsedMs + deltaMs,
      this.configuration.sessionDurationSeconds * 1_000,
    )
    this.world.spawnElapsedMs += deltaMs

    const context = {
      config: this.configuration,
      world: this.world,
      input: this.latestInput,
      random: this.random,
    }
    for (const system of this.systems) {
      system.update(deltaMs, context)
    }

    if (this.world.player.health <= 0) {
      this.end('player-destroyed')
    } else if (this.world.elapsedMs >= this.configuration.sessionDurationSeconds * 1_000) {
      this.end('time-expired')
    }
  }

  private end(reason: MatchEndReason): boolean {
    if ((this.statusValue !== 'playing' && this.statusValue !== 'paused') || !this.world || !this.configuration) {
      return false
    }

    this.statusValue = 'ended'
    this.latestInput = emptyPlayerInput
    this.loop?.reset()
    this.result =
      reason === 'abandoned'
        ? null
        : Object.freeze({
            matchId: this.world.matchId,
            score: this.world.player.score,
            activeDurationMs: this.world.elapsedMs,
            endReason: reason,
            configuration: this.configuration,
          })
    this.emitLifecycle({ type: 'ended', reason, result: this.result })
    this.publishHud(true)
    return true
  }

  private publishHud(force: boolean): void {
    const elapsedMs = this.world?.elapsedMs ?? 0
    const intervalMs = this.configuration?.simulation.hudPublishIntervalMs ?? 0
    if (!force && elapsedMs - this.lastHudPublishAtMs < intervalMs) {
      return
    }

    this.lastHudPublishAtMs = elapsedMs
    const snapshot = this.getHudSnapshot()
    for (const listener of this.hudListeners) {
      listener(snapshot)
    }
  }

  private emitLifecycle(event: MatchLifecycleEvent): void {
    const frozenEvent = Object.freeze(event)
    for (const listener of this.lifecycleListeners) {
      listener(frozenEvent)
    }
  }
}

function createMatchId(random: RandomSource): string {
  const segments = Array.from({ length: 4 }, () => Math.floor(random.next() * 0x1_0000).toString(16).padStart(4, '0'))
  return `match-${segments.join('')}`
}
