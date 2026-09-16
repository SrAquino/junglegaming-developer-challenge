import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { centralIslandDecorations, type CircularObstacle } from '../config/arena-layout.ts'

interface ArenaSceneryTextures { water: Texture; rock: Texture }

export function createArenaScenery(width: number, height: number, island: Readonly<CircularObstacle>, textures: ArenaSceneryTextures): Container {
  const scenery = new Container()
  scenery.label = 'arena-scenery'
  addWaterTiles(scenery, width, height, textures.water)

  const islandContainer = new Container()
  islandContainer.label = 'central-island'
  islandContainer.position.set(island.center.x, island.center.y)
  islandContainer.addChild(new Graphics().circle(0, 0, island.radius).fill({ color: 0xe7c36e }).stroke({ color: 0xb6843f, width: 9 }))

  for (const decoration of centralIslandDecorations.filter((item) => item.kind === 'vegetation')) {
    const x = decoration.position.x
    const y = decoration.position.y
    const radius = 24 * decoration.scale
    const grass = new Graphics()
    grass.circle(x, y, radius).fill({ color: 0x5f9c42 })
    grass.circle(x + radius * 0.4, y - radius * 0.25, radius * 0.7).fill({ color: 0x71b950 })
    islandContainer.addChild(grass)
  }
  for (const decoration of centralIslandDecorations.filter((item) => item.kind === 'rock')) {
    const rock = new Sprite(textures.rock)
    rock.anchor.set(0.5)
    rock.scale.set(decoration.scale)
    rock.position.set(decoration.position.x, decoration.position.y)
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
