import { Assets, Rectangle, Texture } from 'pixi.js'

export const playerShipAssetUrl = '/assets/png/default/ships/ship_1.png'
export const islandRockAssetUrl = '/assets/png/default/tiles/tile_50.png'
export const chaserShipAssetUrl = '/assets/png/default/ships/ship_2.png'
export const shooterShipAssetUrl = '/assets/png/default/ships/ship_3.png'
export const waterTileAssetUrl = '/assets/png/default/tiles/tile_73.png'
export const shipsMiscellaneousAtlasAssetUrl = '/assets/spritesheet/ships_miscellaneous_sheet.png'

export interface CombatAtlasTextures { cannonBall: Texture; muzzleFlash: Texture; impact: Texture; explosion: Texture }

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

function atlasFrame(atlas: Texture, label: string, x: number, y: number, width: number, height: number): Texture {
  return new Texture({ source: atlas.source, label, frame: new Rectangle(x, y, width, height) })
}
