import { Application, Container, Sprite } from 'pixi.js'
import { loadPlayerShipTexture } from './game-assets.ts'
import type { GameRenderer } from './game-renderer.ts'

const MAX_DEVICE_PIXEL_RATIO = 2
const SHIP_ORBIT_SPEED = 0.55

export class FirstPlayableScene implements GameRenderer {
  private application: Application | null = null
  private readonly assetUrl: string | undefined
  private initialization: Promise<void> | null = null
  private elapsedSeconds = 0
  private destroyed = false
  private didDestroy = false

  public constructor(assetUrl?: string) {
    this.assetUrl = assetUrl
  }

  public async mount(host: HTMLElement): Promise<void> {
    const application = new Application()
    this.application = application

    this.initialization = application.init({
      autoDensity: true,
      background: '#07324a',
      antialias: true,
      resizeTo: host,
      resolution: Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO),
    })
    await this.initialization

    if (this.destroyed) {
      this.destroyApplication()
      return
    }

    host.replaceChildren(application.canvas)

    const world = new Container()
    application.stage.addChild(world)

    const ship = new Sprite(await loadPlayerShipTexture(this.assetUrl))
    ship.anchor.set(0.5)
    ship.scale.set(0.72)
    world.addChild(ship)

    application.ticker.add(() => {
      const deltaSeconds = application.ticker.deltaMS / 1_000
      this.elapsedSeconds += deltaSeconds

      const horizontalRadius = Math.max(0, application.screen.width * 0.27)
      const verticalRadius = Math.max(0, application.screen.height * 0.16)
      ship.x = application.screen.width / 2 + Math.cos(this.elapsedSeconds * SHIP_ORBIT_SPEED) * horizontalRadius
      ship.y = application.screen.height / 2 + Math.sin(this.elapsedSeconds * SHIP_ORBIT_SPEED) * verticalRadius
      ship.rotation = this.elapsedSeconds * SHIP_ORBIT_SPEED + Math.PI / 2
    })
  }

  public destroy(): void {
    this.destroyed = true
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
