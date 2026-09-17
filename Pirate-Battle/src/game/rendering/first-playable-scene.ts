import { Application, Container, Graphics } from 'pixi.js'
import { withArenaMap, type GameConfigSnapshot } from '../config/game-config.ts'
import { GameSession } from '../core/game-session.ts'
import type { HudSnapshot, MatchResult } from '../types/game.ts'
import type { GameInput } from '../input/game-input.ts'
import { playerMovementSystem } from '../systems/player-movement-system.ts'
import { weaponSystem } from '../systems/weapon-system.ts'
import { projectileSystem } from '../systems/projectile-system.ts'
import { combatSystem } from '../systems/combat-system.ts'
import { effectSystem } from '../systems/effect-system.ts'
import { enemySpawnSystem } from '../systems/enemy-spawn-system.ts'
import { enemyBehaviorSystem } from '../systems/enemy-behavior-system.ts'
import { loadCombatAtlasTextures, loadShipTextures } from './game-assets.ts'
import {
  createShipVisual,
  syncEffectVisuals,
  syncEnemyShipVisuals,
  syncProjectileVisuals,
  updateDamageFire,
  updateShipVisual,
  type EffectVisual,
  type ProjectileVisual,
  type ShipVisual,
} from './combat-art-renderer.ts'
import type { GameRenderer } from './game-renderer.ts'
import { loadTiledArenaMap } from './tiled-map-loader.ts'
import { createTiledMapContainer } from './tiled-map-renderer.ts'
import { GameAudio } from '../audio/game-audio.ts'
import type { AudioSettings } from '../../storage/audio-settings.ts'

const MAX_DEVICE_PIXEL_RATIO = 2

export interface PlayableSceneOptions {
  configuration: GameConfigSnapshot
  audioSettings: AudioSettings
  onHud?: (snapshot: Readonly<HudSnapshot>) => void
  onFinished?: (result: Readonly<MatchResult>) => void
}

export class FirstPlayableScene implements GameRenderer {
  private application: Application | null = null
  private initialization: Promise<void> | null = null
  private readonly session: GameSession
  private destroyed = false
  private didDestroy = false

  public constructor(input: GameInput, options: PlayableSceneOptions) {
    this.input = input
    this.options = options
    this.audio = new GameAudio(options.audioSettings)
    this.session = new GameSession({ systems: [playerMovementSystem, enemySpawnSystem, weaponSystem, projectileSystem, combatSystem, enemyBehaviorSystem, effectSystem] })
    this.unsubscribeHud = this.session.subscribeHud((snapshot) => this.options.onHud?.(snapshot))
    this.unsubscribeLifecycle = this.session.subscribeLifecycle((event) => {
      if (event.type === 'started') { this.audio.play('gameStart'); this.audio.startLoops() }
      if (event.type === 'paused') { this.audio.play('gamePause'); this.audio.pauseLoops() }
      if (event.type === 'resumed') { this.audio.play('gameResume'); this.audio.resumeLoops() }
      if (event.type === 'ended') {
        this.audio.pauseLoops()
        if (event.reason === 'time-expired') this.audio.play('gameComplete')
        if (event.reason === 'player-destroyed') this.audio.play('gameOver')
        if (event.result) this.options.onFinished?.(event.result)
      }
    })
  }

  private readonly input: GameInput
  private readonly options: PlayableSceneOptions
  private readonly unsubscribeHud: () => void
  private readonly unsubscribeLifecycle: () => void
  private readonly audio: GameAudio
  private audioUnlockHost: HTMLElement | null = null

  public async mount(host: HTMLElement): Promise<void> {
    const application = new Application()
    this.application = application
    this.initialization = application.init({
      autoDensity: true,
      background: '#0b6985',
      antialias: true,
      resizeTo: host,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO),
    })
    await this.initialization

    if (this.destroyed) {
      this.destroyApplication()
      return
    }
    this.audioUnlockHost = host
    host.addEventListener('pointerdown', this.unlockAudio, { once: true })

    const [shipTextures, tiledArena, combatAtlasTextures] = await Promise.all([
      loadShipTextures(),
      loadTiledArenaMap(),
      loadCombatAtlasTextures(),
    ])
    const tiledMap = await createTiledMapContainer(tiledArena)
    if (this.destroyed) {
      tiledMap.destroy({ children: true })
      this.destroyApplication()
      return
    }
    const configuration = withArenaMap(this.options.configuration, tiledArena.width, tiledArena.height, tiledArena.collisionPolygons)

    host.replaceChildren(application.canvas)
    const world = new Container()
    application.stage.addChild(world)

    world.addChild(tiledMap)
    host.dataset.mapLoaded = 'true'
    host.dataset.mapLayers = tiledArena.layers.map((layer) => layer.name).join(',')
    host.dataset.mapLayerTileCounts = tiledArena.layers.map((layer) => `${layer.name}:${layer.data.filter((gid) => (gid >>> 0 & 0x1fffffff) !== 0).length}`).join(',')
    host.dataset.collisionPolygonCount = String(tiledArena.collisionPolygons.length)
    host.dataset.arenaWidth = String(tiledArena.width)
    host.dataset.arenaHeight = String(tiledArena.height)

    const enemyLayer = new Container()
    const shipLayer = new Container()
    const projectileLayer = new Container()
    const effectLayer = new Container()
    world.addChild(enemyLayer, shipLayer, projectileLayer, effectLayer)
    const playerShip = createShipVisual('player', shipTextures, configuration.presentation.playerShipScale, shipLayer)
    const playerHealthBar = createHealthBar()
    world.addChild(playerHealthBar.container)
    const projectileSprites = new Map<string, ProjectileVisual>()
    const effectSprites = new Map<string, EffectVisual>()
    const enemyHealthBars = new Map<string, HealthBar>()
    const enemySprites = new Map<string, ShipVisual>()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    this.session.start(configuration)
    application.ticker.add(() => {
      this.session.tick(this.input.getSnapshot())
      const observation = this.session.observe()
      const { arena, player } = configuration
      const scale = Math.min(
        application.screen.width / arena.width,
        application.screen.height / arena.height,
      )
      world.scale.set(scale)
      world.position.set(
        (application.screen.width - arena.width * scale) / 2,
        (application.screen.height - arena.height * scale) / 2,
      )
      const simulation = this.session.getWorldForRendering()
      updateShipVisual(playerShip, simulation.player, 'player', shipTextures, observation.elapsedMs, reducedMotion)
      updateDamageFire(playerShip, combatAtlasTextures.fire, observation.elapsedMs, reducedMotion)
      updateHealthBar(playerHealthBar, observation.playerPosition.x, observation.playerPosition.y, observation.playerHealth, player.maxHealth, 72)
      syncEnemyShipVisuals(simulation.enemies, enemySprites, enemyLayer, shipTextures, {
        chaser: configuration.presentation.chaserShipScale,
        shooter: configuration.presentation.shooterShipScale,
      }, observation.elapsedMs, combatAtlasTextures.fire, reducedMotion)
      syncEnemyHealthBars(simulation.enemies, enemyHealthBars, world, 68)
      syncProjectileVisuals(simulation.projectiles, projectileSprites, projectileLayer, combatAtlasTextures.cannonBall, configuration.presentation.projectileScale, reducedMotion, () => this.audio.play('cannonFire'))
      syncEffectVisuals(simulation.effects, effectSprites, effectLayer, combatAtlasTextures, shipTextures, reducedMotion, (effectType) => this.audio.play(effectType === 'muzzle-flash' ? 'broadside' : effectType === 'impact-water' ? 'waterHit' : effectType === 'impact-wood' ? 'woodHit' : effectType === 'sinking' ? 'sinking' : 'explosion'))
      host.dataset.playerX = observation.playerPosition.x.toFixed(2)
      host.dataset.playerY = observation.playerPosition.y.toFixed(2)
      host.dataset.playerRotation = observation.playerRotation.toFixed(4)
      host.dataset.projectileCount = String(observation.projectileCount)
      host.dataset.effectCount = String(observation.effectCount)
      host.dataset.enemies = JSON.stringify(simulation.enemies.map(({ id, enemyType, position, health }) => ({ id, enemyType, position, health })))
      host.dataset.score = String(observation.score)
      host.dataset.playerHealth = String(observation.playerHealth)
      host.dataset.elapsedMs = observation.elapsedMs.toFixed(2)
      host.dataset.matchId = observation.matchId ?? ''
      host.dataset.worldScale = scale.toFixed(5)
      host.dataset.worldWidth = (arena.width * scale).toFixed(2)
      host.dataset.worldHeight = (arena.height * scale).toFixed(2)
    })
  }

  public destroy(): void {
    this.destroyed = true
    this.session.destroy()
    this.audioUnlockHost?.removeEventListener('pointerdown', this.unlockAudio)
    this.audioUnlockHost = null
    this.audio.destroy()
    this.unsubscribeHud()
    this.unsubscribeLifecycle()
    if (this.initialization) {
      void this.initialization.then(
        () => this.destroyApplication(),
        () => undefined,
      )
      return
    }

    this.destroyApplication()
  }

  public pause(): boolean { return this.session.pause() }

  public resume(): boolean { return this.session.resume() }

  private readonly unlockAudio = (): void => { this.audio.unlock(); if (this.session.status === 'playing') this.audio.startLoops() }

  private destroyApplication(): void {
    if (this.didDestroy) {
      return
    }

    this.didDestroy = true
    this.application?.destroy({ removeView: true }, { children: true })
    this.application = null
  }
}

interface HealthBar {
  container: Container
  fill: Graphics
}

function createHealthBar(): HealthBar {
  const healthBar = new Container()
  const background = new Graphics().roundRect(-25, -4, 50, 8, 3).fill({ color: 0x241b1b, alpha: 0.85 })
  const foreground = new Graphics()
  healthBar.addChild(background, foreground)
  return { container: healthBar, fill: foreground }
}

function updateHealthBar(bar: HealthBar, x: number, y: number, health: number, maxHealth: number, verticalOffset: number): void {
  const ratio = Math.max(0, Math.min(1, health / maxHealth))
  bar.fill.clear().roundRect(-23, -2, 46 * ratio, 4, 2).fill({ color: ratio > 0.35 ? 0x65d18b : 0xe58b6b })
  bar.container.position.set(x, y - verticalOffset)
}

function syncEnemyHealthBars(
  enemies: readonly { id: string; position: { x: number; y: number }; health: number; maxHealth: number }[],
  bars: Map<string, HealthBar>,
  world: Container,
  verticalOffset: number,
): void {
  const activeIds = new Set(enemies.map((enemy) => enemy.id))
  for (const [id, bar] of bars) {
    if (!activeIds.has(id)) {
      bar.container.destroy({ children: true })
      bars.delete(id)
    }
  }
  for (const enemy of enemies) {
    let bar = bars.get(enemy.id)
    if (!bar) {
      bar = createHealthBar()
      world.addChild(bar.container)
      bars.set(enemy.id, bar)
    }
    updateHealthBar(bar, enemy.position.x, enemy.position.y, enemy.health, enemy.maxHealth, verticalOffset)
  }
}
