import { Assets, Rectangle, SCALE_MODES, Texture } from 'pixi.js'

export const playerShipAssetUrl = '/assets/png/default/ships/ship_1.png'
export const chaserShipAssetUrl = '/assets/png/default/ships/ship_2.png'
export const shooterShipAssetUrl = '/assets/png/default/ships/ship_3.png'
export const tilesSheetAssetUrl = '/assets/tilesheet/tiles_sheet.png'
export const shipsMiscellaneousAtlasAssetUrl = '/assets/spritesheet/ships_miscellaneous_sheet.png'

export interface CombatAtlasTextures { cannonBall: Texture; muzzleFlash: Texture; impact: Texture; explosion: Texture }
export interface ArenaTileTextures {
  water: Texture
  sand: Texture
  grass: Texture
  coastline: readonly [Texture, Texture, Texture, Texture, Texture, Texture, Texture, Texture]
  rock: Texture
  vegetation: readonly [Texture, Texture, Texture]
  pier: Texture
}

export async function loadPlayerShipTexture(assetUrl = playerShipAssetUrl): Promise<Texture> {
  return Assets.load<Texture>(assetUrl)
}

export async function loadTexture(assetUrl: string): Promise<Texture> {
  return Assets.load<Texture>(assetUrl)
}

export async function loadCombatAtlasTextures(): Promise<CombatAtlasTextures> {
  const atlas = await Assets.load<Texture>(shipsMiscellaneousAtlasAssetUrl)
  return {
    cannonBall: atlasFrame(atlas, 'cannon_ball.png', 120, 29, 10, 10),
    muzzleFlash: atlasFrame(atlas, 'fire_1.png', 614, 466, 18, 39),
    impact: atlasFrame(atlas, 'explosion_2.png', 544, 145, 60, 59),
    explosion: atlasFrame(atlas, 'explosion_1.png', 0, 0, 74, 75),
  }
}

export async function loadArenaTileTextures(): Promise<ArenaTileTextures> {
  const [sheet, sand, grass, plantA, plantB, plantC, pier, coastline] = await Promise.all([
    Assets.load<Texture>(tilesSheetAssetUrl),
    loadTexture(tileAssetUrl(68)),
    loadTexture(tileAssetUrl(39)),
    loadTexture(tileAssetUrl(70)),
    loadTexture(tileAssetUrl(71)),
    loadTexture(tileAssetUrl(72)),
    loadTexture(tileAssetUrl(60)),
    Promise.all([
      loadTexture(tileAssetUrl(1)),
      loadTexture(tileAssetUrl(2)),
      loadTexture(tileAssetUrl(3)),
      loadTexture(tileAssetUrl(17)),
      loadTexture(tileAssetUrl(19)),
      loadTexture(tileAssetUrl(33)),
      loadTexture(tileAssetUrl(34)),
      loadTexture(tileAssetUrl(35)),
    ] as const),
  ])
  sheet.source.scaleMode = SCALE_MODES.NEAREST
  return {
    water: tileFrame(sheet, 73, 1),
    sand,
    grass,
    coastline,
    rock: tileFrame(sheet, 50),
    vegetation: [plantA, plantB, plantC],
    pier,
  }
}

function tileAssetUrl(tileNumber: number): string {
  return `/assets/png/default/tiles/tile_${tileNumber}.png`
}

function atlasFrame(atlas: Texture, label: string, x: number, y: number, width: number, height: number): Texture {
  return new Texture({ source: atlas.source, label, frame: new Rectangle(x, y, width, height) })
}

function tileFrame(sheet: Texture, tileNumber: number, inset = 0): Texture {
  const index = tileNumber - 1
  const tileSize = 64
  const columns = 16
  return new Texture({ source: sheet.source, label: `tile_${tileNumber}`, frame: new Rectangle((index % columns) * tileSize + inset, Math.floor(index / columns) * tileSize + inset, tileSize - inset * 2, tileSize - inset * 2) })
}
