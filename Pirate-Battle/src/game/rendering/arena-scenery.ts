import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js'
import { centralIslandDecorations, type CircularObstacle } from '../config/arena-layout.ts'

interface ArenaSceneryTextures {
  water: Texture
  sand: Texture
  rock: Texture
  vegetation: readonly [Texture, Texture, Texture]
  pier: Texture
}

export function createArenaScenery(width: number, height: number, island: Readonly<CircularObstacle>, textures: ArenaSceneryTextures): Container {
  const scenery = new Container()
  scenery.label = 'arena-scenery'
  addWaterTiles(scenery, width, height, textures.water)

  const islandContainer = new Container()
  islandContainer.label = 'central-island'
  islandContainer.position.set(island.center.x, island.center.y)
  const sand = new TilingSprite({
    texture: textures.sand,
    width: island.radius * 2,
    height: island.radius * 2,
  })
  sand.label = 'island-sand'
  sand.position.set(-island.radius, -island.radius)
  const sandMask = new Graphics().circle(0, 0, island.radius).fill({ color: 0xffffff })
  sand.mask = sandMask
  islandContainer.addChild(sand, sandMask)
  islandContainer.addChild(new Graphics().circle(0, 0, island.radius - 4).stroke({ color: 0xb6843f, width: 9, alpha: 0.8 }))

  for (const decoration of centralIslandDecorations.filter((item) => item.kind === 'pier')) {
    islandContainer.addChild(createDecorationSprite(textures.pier, decoration.position.x, decoration.position.y, decoration.scale, decoration.rotation))
  }

  for (const decoration of centralIslandDecorations.filter((item) => item.kind === 'vegetation')) {
    const texture = textures.vegetation[decoration.variant ?? 0]
    islandContainer.addChild(createDecorationSprite(texture, decoration.position.x, decoration.position.y, decoration.scale, decoration.rotation))
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

function createDecorationSprite(texture: Texture, x: number, y: number, scale: number, rotation = 0): Sprite {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  sprite.position.set(x, y)
  sprite.scale.set(scale)
  sprite.rotation = rotation
  return sprite
}

function addWaterTiles(container: Container, width: number, height: number, texture: Texture): void {
  const tileSize = 64
  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const water = new Sprite(texture)
      water.position.set(x, y)
      water.width = tileSize
      water.height = tileSize
      container.addChild(water)
    }
  }
}
