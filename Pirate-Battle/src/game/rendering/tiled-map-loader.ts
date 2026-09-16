import type { Vector2 } from '../types/vector.ts'

export const tiledArenaMapUrl = '/maps/arena.tmj'
export const tiledArenaTilesetUrl = '/maps/tiles_sheet.tsj'
export const tiledLayerOrder = ['AguaRasa', 'Land', 'Decorations'] as const

export interface TiledTileLayer {
  data: readonly number[]
  height: number
  name: string
  opacity: number
  type: 'tilelayer'
  visible: boolean
  width: number
  x: number
  y: number
}

interface TiledObject {
  height?: number
  polygon?: readonly Readonly<Vector2>[]
  rotation?: number
  visible?: boolean
  width?: number
  x: number
  y: number
}

interface TiledObjectLayer {
  name: string
  objects: readonly TiledObject[]
  type: 'objectgroup'
  visible: boolean
}

interface TiledTilesetReference { firstgid: number; source: string }

export interface TiledMapJson {
  height: number
  layers: readonly (TiledTileLayer | TiledObjectLayer)[]
  tileheight: number
  tilesets: readonly TiledTilesetReference[]
  tilewidth: number
  width: number
}

export interface TiledTilesetJson {
  columns: number
  image: string
  imageheight: number
  imagewidth: number
  margin: number
  spacing: number
  tilecount: number
  tileheight: number
  tilewidth: number
}

export interface LoadedTiledArena {
  collisionPolygons: readonly (readonly Readonly<Vector2>[])[]
  height: number
  layers: readonly TiledTileLayer[]
  map: TiledMapJson
  tileset: TiledTilesetJson
  tilesetFirstGid: number
  tilesetImageUrl: string
  width: number
}

export async function loadTiledArenaMap(
  mapUrl = tiledArenaMapUrl,
  tilesetUrl = tiledArenaTilesetUrl,
): Promise<LoadedTiledArena> {
  const [map, tileset] = await Promise.all([
    fetchJson<TiledMapJson>(mapUrl),
    fetchJson<TiledTilesetJson>(tilesetUrl),
  ])
  const reference = map.tilesets[0]
  if (!reference) throw new Error('The Tiled arena has no tileset reference.')
  const layers = tiledLayerOrder.map((name) => {
    const layer = map.layers.find((candidate): candidate is TiledTileLayer => candidate.type === 'tilelayer' && candidate.name === name)
    if (!layer) throw new Error(`The Tiled arena is missing the ${name} tile layer.`)
    if (layer.data.length !== map.width * map.height) throw new Error(`The ${name} tile layer has invalid dimensions.`)
    return layer
  })
  const collisionLayer = map.layers.find((layer): layer is TiledObjectLayer => layer.type === 'objectgroup' && (layer.name === 'Collision' || layer.name === 'Colision'))
  if (!collisionLayer) throw new Error('The Tiled arena is missing the Collision object layer.')
  const collisionPolygons = collisionLayer.objects.filter((object) => object.visible !== false).map(objectToPolygon)
  if (!collisionPolygons.length) throw new Error('The Tiled arena Collision layer has no blocking objects.')

  return Object.freeze({
    collisionPolygons: Object.freeze(collisionPolygons),
    height: map.height * map.tileheight,
    layers: Object.freeze(layers),
    map,
    tileset,
    tilesetFirstGid: reference.firstgid,
    tilesetImageUrl: new URL(tileset.image, new URL(tilesetUrl, window.location.origin)).pathname,
    width: map.width * map.tilewidth,
  })
}

function objectToPolygon(object: TiledObject): readonly Readonly<Vector2>[] {
  const localPoints = object.polygon ?? rectanglePoints(object.width ?? 0, object.height ?? 0)
  if (localPoints.length < 3) throw new Error('A Collision object must define a polygon or a non-empty rectangle.')
  const angle = (object.rotation ?? 0) * Math.PI / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return Object.freeze(localPoints.map((point) => Object.freeze({
    x: object.x + point.x * cosine - point.y * sine,
    y: object.y + point.x * sine + point.y * cosine,
  })))
}

function rectanglePoints(width: number, height: number): readonly Readonly<Vector2>[] {
  if (width <= 0 || height <= 0) return []
  return [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Unable to load ${url}: ${response.status} ${response.statusText}`)
  return response.json() as Promise<T>
}
