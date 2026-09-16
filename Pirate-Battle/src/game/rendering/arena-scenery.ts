import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js'
import { arenaDecorations, arenaLandmasses } from '../config/arena-layout.ts'
import type { ArenaTileTextures } from './game-assets.ts'
import type { Vector2 } from '../types/vector.ts'

export function createArenaScenery(width: number, height: number, textures: ArenaTileTextures): Container {
  const scenery = new Container()
  scenery.label = 'arena-scenery'
  addWaterTiles(scenery, width, height, textures.water)

  for (const landmass of arenaLandmasses) {
    const island = new Container()
    island.label = landmass.id
    island.addChild(createCoastGlow(landmass.coast), createTiledPolygon(textures.sand, landmass.coast, width, height, `${landmass.id}-sand`))
    island.addChild(createTiledPolygon(textures.grass, landmass.grass, width, height, `${landmass.id}-grass`))
    scenery.addChild(island)
  }

  const props = new Container()
  props.label = 'arena-props'
  for (const decoration of arenaDecorations) {
    props.addChild(createDecorationSprite(textureForDecoration(textures, decoration.kind, decoration.variant), decoration.position.x, decoration.position.y, decoration.scale, decoration.rotation))
  }
  scenery.addChild(props)
  return scenery
}

function createTiledPolygon(texture: Texture, points: readonly Readonly<Vector2>[], width: number, height: number, label: string): Container {
  const layer = new Container()
  layer.label = label
  const tiles = new TilingSprite({ texture, width, height })
  const mask = new Graphics().poly(flatten(points)).fill({ color: 0xffffff })
  tiles.mask = mask
  layer.addChild(tiles, mask)
  return layer
}

function createCoastGlow(points: readonly Readonly<Vector2>[]): Graphics {
  return new Graphics().poly(flatten(points), true).stroke({ color: 0x8ee5ed, width: 52, alpha: 0.28 })
}

function textureForDecoration(textures: ArenaTileTextures, kind: string, variant = 0): Texture {
  if (kind === 'pier') return textures.pier
  if (kind === 'vegetation') return textures.vegetation[variant]
  if (kind === 'rock') return textures.rock[variant]
  if (kind === 'tower') return textures.fortification[0]
  if (kind === 'wall') return textures.fortification[1]
  return textures.pier
}

function createDecorationSprite(texture: Texture, x: number, y: number, scale: number, rotation = 0): Sprite {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  sprite.position.set(x, y)
  sprite.scale.set(scale)
  sprite.rotation = rotation
  return sprite
}

function flatten(points: readonly Readonly<Vector2>[]): number[] {
  return points.flatMap((point) => [point.x, point.y])
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
