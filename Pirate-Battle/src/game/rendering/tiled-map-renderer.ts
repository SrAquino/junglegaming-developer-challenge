import { Assets, Container, Rectangle, Sprite, Texture } from 'pixi.js'
import type { LoadedTiledArena } from './tiled-map-loader.ts'

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000
const FLIPPED_VERTICALLY_FLAG = 0x40000000
const FLIPPED_DIAGONALLY_FLAG = 0x20000000
const FLIP_FLAGS = (FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG) >>> 0

export async function createTiledMapContainer(arena: LoadedTiledArena): Promise<Container> {
  const sheet = await Assets.load<Texture>(arena.tilesetImageUrl)
  const root = new Container()
  root.label = 'tiled-arena'
  for (const layer of arena.layers) {
    const layerContainer = new Container()
    layerContainer.label = `tiled-layer:${layer.name}`
    layerContainer.alpha = layer.opacity
    layerContainer.visible = layer.visible
    layer.data.forEach((encodedGid, index) => {
      const decoded = decodeGid(encodedGid)
      if (decoded.gid === 0) return
      const localId = decoded.gid - arena.tilesetFirstGid
      if (localId < 0 || localId >= arena.tileset.tilecount) throw new Error(`Tile GID ${decoded.gid} is outside the loaded tileset.`)
      const texture = tileTexture(sheet, localId, arena)
      const sprite = new Sprite(texture)
      const column = index % layer.width
      const row = Math.floor(index / layer.width)
      sprite.anchor.set(0.5)
      sprite.position.set((layer.x + column + 0.5) * arena.map.tilewidth, (layer.y + row + 0.5) * arena.map.tileheight)
      applyTiledFlips(sprite, decoded.horizontal, decoded.vertical, decoded.diagonal)
      layerContainer.addChild(sprite)
    })
    root.addChild(layerContainer)
  }
  return root
}

export function decodeGid(encodedGid: number): { gid: number; horizontal: boolean; vertical: boolean; diagonal: boolean } {
  const unsigned = encodedGid >>> 0
  return {
    gid: (unsigned & ~FLIP_FLAGS) >>> 0,
    horizontal: (unsigned & FLIPPED_HORIZONTALLY_FLAG) !== 0,
    vertical: (unsigned & FLIPPED_VERTICALLY_FLAG) !== 0,
    diagonal: (unsigned & FLIPPED_DIAGONALLY_FLAG) !== 0,
  }
}

function tileTexture(sheet: Texture, localId: number, arena: LoadedTiledArena): Texture {
  const { columns, margin, spacing, tilewidth, tileheight } = arena.tileset
  return new Texture({
    source: sheet.source,
    label: `tiled-tile-${localId}`,
    frame: new Rectangle(
      margin + (localId % columns) * (tilewidth + spacing),
      margin + Math.floor(localId / columns) * (tileheight + spacing),
      tilewidth,
      tileheight,
    ),
  })
}

function applyTiledFlips(sprite: Sprite, horizontal: boolean, vertical: boolean, diagonal: boolean): void {
  if (!diagonal) {
    sprite.scale.set(horizontal ? -1 : 1, vertical ? -1 : 1)
    return
  }
  if (horizontal && vertical) { sprite.rotation = -Math.PI / 2; sprite.scale.x = -1; return }
  if (horizontal) { sprite.rotation = Math.PI / 2; return }
  if (vertical) { sprite.rotation = -Math.PI / 2; return }
  sprite.rotation = Math.PI / 2
  sprite.scale.x = -1
}
