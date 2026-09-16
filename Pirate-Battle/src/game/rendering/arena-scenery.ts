import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import type { CircularObstacle } from '../config/arena-layout.ts'

interface ArenaSceneryTextures { water: Texture; rock: Texture }

export function createArenaScenery(width: number, height: number, island: Readonly<CircularObstacle>, textures: ArenaSceneryTextures): Container {
  const scenery = new Container()
  scenery.label = 'arena-scenery'
  addWaterTiles(scenery, width, height, textures.water)

  const islandContainer = new Container()
  islandContainer.label = 'central-island'
  islandContainer.position.set(island.center.x, island.center.y)
  islandContainer.addChild(new Graphics().circle(0, 0, island.radius).fill({ color: 0xe7c36e }).stroke({ color: 0xb6843f, width: 9 }))

  for (const [x, y, radius] of [[-52, -42, 22], [42, 32, 18], [8, -70, 15]] as const) {
    const grass = new Graphics()
    grass.circle(x, y, radius).fill({ color: 0x5f9c42 })
    grass.circle(x + radius * 0.4, y - radius * 0.25, radius * 0.7).fill({ color: 0x71b950 })
    islandContainer.addChild(grass)
  }
  for (const [x, y, scale] of [[-82, 18, 0.9], [60, -44, 0.7], [20, 68, 0.65]] as const) {
    const rock = new Sprite(textures.rock)
    rock.anchor.set(0.5)
    rock.scale.set(scale)
    rock.position.set(x, y)
    islandContainer.addChild(rock)
  }
  scenery.addChild(islandContainer)
  return scenery
}

function addWaterTiles(container: Container, width: number, height: number, texture: Texture): void {
  const tileSize = 64
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const water = new Sprite(texture)
      water.position.set(x, y)
      container.addChild(water)
    }
  }
}
