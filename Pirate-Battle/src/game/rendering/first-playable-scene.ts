import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { centralIsland } from '../config/arena-layout.ts'
import { defaultGameConfig } from '../config/game-config.ts'
import type { GameConfigSnapshot } from '../config/game-config.ts'
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
import type { EnemyEntity } from '../entities/entity.ts'
import type { Texture } from 'pixi.js'
import {
  chaserShipAssetUrl,
  shooterShipAssetUrl,
  islandRockAssetUrl,
  loadPlayerShipTexture,
  loadCombatAtlasTextures,
  loadTexture,
  waterTileAssetUrl,
} from './game-assets.ts'
import type { GameRenderer } from './game-renderer.ts'
import { createArenaScenery } from './arena-scenery.ts'

const MAX_DEVICE_PIXEL_RATIO = 2

export interface PlayableSceneOptions {
  configuration: GameConfigSnapshot
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
    this.session = new GameSession({ systems: [playerMovementSystem, enemySpawnSystem, weaponSystem, projectileSystem, combatSystem, enemyBehaviorSystem, effectSystem] })
    this.unsubscribeHud = this.session.subscribeHud((snapshot) => this.options.onHud?.(snapshot))
    this.unsubscribeLifecycle = this.session.subscribeLifecycle((event) => {
      if (event.type === 'ended' && event.result) this.options.onFinished?.(event.result)
    })
  }

  private readonly input: GameInput
  private readonly options: PlayableSceneOptions
  private readonly unsubscribeHud: () => void
  private readonly unsubscribeLifecycle: () => void

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

    const [shipTexture, rockTexture, combatAtlasTextures, chaserTexture, shooterTexture, waterTexture] = await Promise.all([
      loadPlayerShipTexture(),
      loadTexture(islandRockAssetUrl),
      loadCombatAtlasTextures(),
      loadTexture(chaserShipAssetUrl),
      loadTexture(shooterShipAssetUrl),
      loadTexture(waterTileAssetUrl),
    ])
    if (this.destroyed) {
      this.destroyApplication()
      return
    }

    host.replaceChildren(application.canvas)
    const world = new Container()
    application.stage.addChild(world)

    world.addChild(createArenaScenery(this.options.configuration.arena.width, this.options.configuration.arena.height, centralIsland, { water: waterTexture, rock: rockTexture }))

    const ship = new Sprite(shipTexture)
    ship.anchor.set(0.5)
    ship.scale.set(this.options.configuration.presentation.playerShipScale)
    world.addChild(ship)

    const playerHealthBar = createHealthBar()
    world.addChild(playerHealthBar.container)
    const projectileLayer = new Container()
    const effectLayer = new Container()
    world.addChild(projectileLayer, effectLayer)
    const projectileSprites = new Map<string, Sprite>()
    const effectSprites = new Map<string, Sprite>()
    const enemyHealthBars = new Map<string, HealthBar>()
    const enemySprites = new Map<string, Sprite>()
    const enemyLayer = new Container()
    world.addChildAt(enemyLayer, 2)

    this.session.start(this.options.configuration)
    application.ticker.add(() => {
      this.session.tick(this.input.getSnapshot())
      const observation = this.session.observe()
      const scale = Math.min(
        application.screen.width / defaultGameConfig.arena.width,
        application.screen.height / defaultGameConfig.arena.height,
      )
      world.scale.set(scale)
      world.position.set(
        (application.screen.width - defaultGameConfig.arena.width * scale) / 2,
        (application.screen.height - defaultGameConfig.arena.height * scale) / 2,
      )
      ship.position.set(observation.playerPosition.x, observation.playerPosition.y)
      ship.rotation = observation.playerRotation + Math.PI / 2
      ship.tint = observation.playerHealth <= 35 ? 0xd88372 : 0xffffff
      updateHealthBar(playerHealthBar, observation.playerPosition.x, observation.playerPosition.y, observation.playerHealth, defaultGameConfig.player.maxHealth, 72)
      const simulation = this.session.getWorldForRendering()
      syncEnemies(simulation.enemies, enemySprites, enemyLayer, { chaser: chaserTexture, shooter: shooterTexture }, this.options.configuration.presentation)
      syncEnemyHealthBars(simulation.enemies, enemyHealthBars, world, 62)
      syncProjectiles(simulation.projectiles, projectileSprites, projectileLayer, combatAtlasTextures.cannonBall, this.options.configuration.presentation.projectileScale)
      syncEffects(simulation.effects, effectSprites, effectLayer, combatAtlasTextures)
      host.dataset.playerX = observation.playerPosition.x.toFixed(2)
      host.dataset.playerY = observation.playerPosition.y.toFixed(2)
      host.dataset.playerRotation = observation.playerRotation.toFixed(4)
      host.dataset.projectileCount = String(observation.projectileCount)
      host.dataset.effectCount = String(observation.effectCount)
      host.dataset.enemies = JSON.stringify(simulation.enemies.map(({ id, enemyType, position, health }) => ({ id, enemyType, position, health })))
      host.dataset.score = String(observation.score)
      host.dataset.playerHealth = String(observation.playerHealth)
      host.dataset.elapsedMs = observation.elapsedMs.toFixed(2)
    })
  }

  public destroy(): void {
    this.destroyed = true
    this.session.destroy()
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

function syncEnemies(
  enemies: readonly EnemyEntity[],
  sprites: Map<string, Sprite>,
  layer: Container,
  textures: Record<'chaser' | 'shooter', Texture>,
  presentation: GameConfigSnapshot['presentation'],
): void {
  const activeIds = new Set(enemies.map((enemy) => enemy.id))
  for (const [id, sprite] of sprites) {
    if (!activeIds.has(id)) { sprite.destroy(); sprites.delete(id) }
  }
  for (const enemy of enemies) {
    let sprite = sprites.get(enemy.id)
    if (!sprite) {
      sprite = new Sprite(textures[enemy.enemyType])
      sprite.anchor.set(0.5)
      sprite.scale.set(enemy.enemyType === 'chaser' ? presentation.chaserShipScale : presentation.shooterShipScale)
      layer.addChild(sprite)
      sprites.set(enemy.id, sprite)
    }
    sprite.position.set(enemy.position.x, enemy.position.y)
    sprite.rotation = enemy.rotation + Math.PI / 2
    sprite.tint = enemy.health / enemy.maxHealth <= 0.35 ? 0xd88372 : enemy.enemyType === 'chaser' ? 0xffc68a : 0xb4cfff
  }
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

function syncProjectiles(
  projectiles: readonly { id: string; position: { x: number; y: number }; rotation: number }[],
  sprites: Map<string, Sprite>,
  layer: Container,
  texture: import('pixi.js').Texture,
  presentationScale: number,
): void {
  const activeIds = new Set(projectiles.map((projectile) => projectile.id))
  for (const [id, sprite] of sprites) {
    if (!activeIds.has(id)) {
      sprite.destroy()
      sprites.delete(id)
    }
  }
  for (const projectile of projectiles) {
    let sprite = sprites.get(projectile.id)
    if (!sprite) {
      sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.scale.set(presentationScale)
      sprite.zIndex = 1
      layer.addChild(sprite)
      sprites.set(projectile.id, sprite)
    }
    sprite.position.set(projectile.position.x, projectile.position.y)
    sprite.rotation = projectile.rotation
  }
}

function syncEffects(
  effects: readonly { id: string; effectType: 'muzzle-flash' | 'impact' | 'explosion'; position: { x: number; y: number } }[],
  spritesById: Map<string, Sprite>,
  layer: Container,
  textures: import('./game-assets.ts').CombatAtlasTextures,
): void {
  const activeIds = new Set(effects.map((effect) => effect.id))
  for (const [id, sprite] of spritesById) {
    if (!activeIds.has(id)) {
      sprite.destroy()
      spritesById.delete(id)
    }
  }
  for (const effect of effects) {
    let sprite = spritesById.get(effect.id)
    if (!sprite) {
      sprite = new Sprite(effect.effectType === 'muzzle-flash' ? textures.muzzleFlash : effect.effectType === 'impact' ? textures.impact : textures.explosion)
      sprite.anchor.set(0.5)
      sprite.scale.set(effect.effectType === 'muzzle-flash' ? 1.15 : effect.effectType === 'impact' ? 0.48 : 0.82)
      layer.addChild(sprite)
      spritesById.set(effect.id, sprite)
    }
    sprite.position.set(effect.position.x, effect.position.y)
  }
}
