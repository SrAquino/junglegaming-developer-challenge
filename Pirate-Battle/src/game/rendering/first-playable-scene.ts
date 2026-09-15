import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { centralIsland } from '../config/arena-layout.ts'
import { defaultGameConfig } from '../config/game-config.ts'
import { GameSession } from '../core/game-session.ts'
import type { GameInput } from '../input/game-input.ts'
import { playerMovementSystem } from '../systems/player-movement-system.ts'
import {
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
    this.session = new GameSession({ systems: [playerMovementSystem] })
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

    const [shipTexture, rockTexture] = await Promise.all([
      loadPlayerShipTexture(),
      loadTexture(islandRockAssetUrl),
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
      host.dataset.playerX = observation.playerPosition.x.toFixed(2)
      host.dataset.playerY = observation.playerPosition.y.toFixed(2)
      host.dataset.playerRotation = observation.playerRotation.toFixed(4)
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
