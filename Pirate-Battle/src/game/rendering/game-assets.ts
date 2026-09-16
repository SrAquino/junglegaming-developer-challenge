import { Assets, Texture } from 'pixi.js'

export const playerShipAssetUrl = '/assets/png/default/ships/ship_1.png'
export const islandRockAssetUrl = '/assets/png/default/tiles/tile_50.png'
export const cannonBallAssetUrl = '/assets/png/default/ship_parts/cannon_ball.png'
export const chaserShipAssetUrl = '/assets/png/default/ships/ship_2.png'
export const shooterShipAssetUrl = '/assets/png/default/ships/ship_3.png'
export const waterTileAssetUrl = '/assets/png/default/tiles/tile_73.png'

export async function loadPlayerShipTexture(assetUrl = playerShipAssetUrl): Promise<Texture> {
  return Assets.load<Texture>(assetUrl)
}

export async function loadTexture(assetUrl: string): Promise<Texture> {
  return Assets.load<Texture>(assetUrl)
}
