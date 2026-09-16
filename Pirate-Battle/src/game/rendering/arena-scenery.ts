import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js'
import { centralIslandDecorations, type CircularObstacle } from '../config/arena-layout.ts'

interface ArenaSceneryTextures {
  water: Texture
  sand: Texture
  grass: Texture
  coastline: readonly [Texture, Texture, Texture, Texture, Texture, Texture, Texture, Texture]
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
  islandContainer.addChild(createCoastline(textures, island.radius))

  const grass = new TilingSprite({ texture: textures.grass, width: 108, height: 78 })
  grass.label = 'island-grass'
  grass.position.set(-54, -44)
  const grassMask = new Graphics().ellipse(0, -5, 54, 39).fill({ color: 0xffffff })
  grass.mask = grassMask
  islandContainer.addChild(grass, grassMask)

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

function createCoastline(textures: ArenaSceneryTextures, radius: number): Container {
  const coast = new Container()
  coast.label = 'island-coastline'
  const [northWest, north, northEast, west, east, southWest, south, southEast] = textures.coastline
  const frames = [northWest, north, northEast, west, textures.sand, east, southWest, south, southEast]
  const nativeTileSize = 64
  for (let index = 0; index < frames.length; index += 1) {
    const tile = new Sprite(frames[index])
    tile.position.set((index % 3) * nativeTileSize, Math.floor(index / 3) * nativeTileSize)
    coast.addChild(tile)
  }
  coast.position.set(-radius, -radius)
  coast.scale.set((radius * 2) / (nativeTileSize * 3))
  return coast
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
