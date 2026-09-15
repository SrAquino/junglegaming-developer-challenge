import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { centralIsland } from '../config/arena-layout.ts'
import { defaultGameConfig } from '../config/game-config.ts'
import { GameSession } from '../core/game-session.ts'
import type { GameInput } from '../input/game-input.ts'
import { playerMovementSystem } from '../systems/player-movement-system.ts'
import { weaponSystem } from '../systems/weapon-system.ts'
import { projectileSystem } from '../systems/projectile-system.ts'
import { combatSystem } from '../systems/combat-system.ts'
import { effectSystem } from '../systems/effect-system.ts'
import {
  cannonBallAssetUrl,
  islandRockAssetUrl,
  loadPlayerShipTexture,
  loadTexture,
} from './game-assets.ts'
import type { GameRenderer } from './game-renderer.ts'

const MAX_DEVICE_PIXEL_RATIO = 2

export class FirstPlayableScene implements GameRenderer {
  private application: Application | null = null
  private initialization: Promise<void> | null = null
  private readonly session: GameSession
  private destroyed = false
  private didDestroy = false

  public constructor(input: GameInput) {
    this.input = input
    this.session = new GameSession({ systems: [playerMovementSystem, weaponSystem, projectileSystem, combatSystem, effectSystem] })
  }

  private readonly input: GameInput

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

    const [shipTexture, rockTexture, cannonBallTexture] = await Promise.all([
      loadPlayerShipTexture(),
      loadTexture(islandRockAssetUrl),
      loadTexture(cannonBallAssetUrl),
    ])
    if (this.destroyed) {
      this.destroyApplication()
      return
    }

    host.replaceChildren(application.canvas)
    const world = new Container()
    application.stage.addChild(world)

    const water = new Graphics()
    water.rect(0, 0, defaultGameConfig.arena.width, defaultGameConfig.arena.height).fill({ color: 0x0b6985 })
    world.addChild(water)

    const island = new Container()
    island.position.set(centralIsland.center.x, centralIsland.center.y)
    const sand = new Graphics()
    sand.circle(0, 0, centralIsland.radius).fill({ color: 0xe7c36e }).stroke({ color: 0xb6843f, width: 9 })
    island.addChild(sand)
    const rock = new Sprite(rockTexture)
    rock.anchor.set(0.5)
    rock.scale.set(1.6)
    rock.position.set(-45, -20)
    island.addChild(rock)
    world.addChild(island)

    const ship = new Sprite(shipTexture)
    ship.anchor.set(0.5)
    ship.scale.set(0.72)
    world.addChild(ship)

    const playerHealthBar = createHealthBar()
    world.addChild(playerHealthBar.container)
    const projectileLayer = new Container()
    const effectLayer = new Container()
    world.addChild(projectileLayer, effectLayer)
    const projectileSprites = new Map<string, Sprite>()
    const effectGraphics = new Map<string, Graphics>()
    const enemyHealthBars = new Map<string, HealthBar>()

    this.session.start(defaultGameConfig)
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
      updateHealthBar(playerHealthBar, observation.playerPosition.x, observation.playerPosition.y, observation.playerHealth, defaultGameConfig.player.maxHealth)
      const simulation = this.session.getWorldForRendering()
      syncEnemyHealthBars(simulation.enemies, enemyHealthBars, world)
      syncProjectiles(simulation.projectiles, projectileSprites, projectileLayer, cannonBallTexture)
      syncEffects(simulation.effects, effectGraphics, effectLayer)
      host.dataset.playerX = observation.playerPosition.x.toFixed(2)
      host.dataset.playerY = observation.playerPosition.y.toFixed(2)
      host.dataset.playerRotation = observation.playerRotation.toFixed(4)
      host.dataset.projectileCount = String(observation.projectileCount)
    })
  }

  public destroy(): void {
    this.destroyed = true
    this.session.destroy()
    if (this.initialization) {
      void this.initialization.then(
        () => this.destroyApplication(),
        () => undefined,
      )
      return
    }

    this.destroyApplication()
  }

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

function updateHealthBar(bar: HealthBar, x: number, y: number, health: number, maxHealth: number): void {
  const ratio = Math.max(0, Math.min(1, health / maxHealth))
  bar.fill.clear().roundRect(-23, -2, 46 * ratio, 4, 2).fill({ color: ratio > 0.35 ? 0x65d18b : 0xe58b6b })
  bar.container.position.set(x, y - 52)
}

function syncEnemyHealthBars(
  enemies: readonly { id: string; position: { x: number; y: number }; health: number; maxHealth: number }[],
  bars: Map<string, HealthBar>,
  world: Container,
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
    updateHealthBar(bar, enemy.position.x, enemy.position.y, enemy.health, enemy.maxHealth)
  }
}

function syncProjectiles(
  projectiles: readonly { id: string; position: { x: number; y: number }; rotation: number }[],
  sprites: Map<string, Sprite>,
  layer: Container,
  texture: import('pixi.js').Texture,
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
      sprite.scale.set(0.35)
      layer.addChild(sprite)
      sprites.set(projectile.id, sprite)
    }
    sprite.position.set(projectile.position.x, projectile.position.y)
    sprite.rotation = projectile.rotation
  }
}

function syncEffects(
  effects: readonly { id: string; effectType: 'muzzle-flash' | 'impact' | 'explosion'; position: { x: number; y: number } }[],
  graphicsById: Map<string, Graphics>,
  layer: Container,
): void {
  const activeIds = new Set(effects.map((effect) => effect.id))
  for (const [id, graphic] of graphicsById) {
    if (!activeIds.has(id)) {
      graphic.destroy()
      graphicsById.delete(id)
    }
  }
  for (const effect of effects) {
    let graphic = graphicsById.get(effect.id)
    if (!graphic) {
      graphic = new Graphics()
      const radius = effect.effectType === 'explosion' ? 28 : effect.effectType === 'impact' ? 13 : 18
      const color = effect.effectType === 'explosion' ? 0xf06d3d : 0xffdb75
      graphic.circle(0, 0, radius).fill({ color, alpha: 0.78 })
      layer.addChild(graphic)
      graphicsById.set(effect.id, graphic)
    }
    graphic.position.set(effect.position.x, effect.position.y)
  }
}
