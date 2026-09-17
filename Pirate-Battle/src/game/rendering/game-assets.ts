import { Assets, Rectangle, Texture } from 'pixi.js'

export const playerShipAssetUrl = '/assets/png/default/ships/ship_1.png'
export const shipsMiscellaneousAtlasAssetUrl = '/assets/spritesheet/ships_miscellaneous_sheet.png'
export const shipsMiscellaneousRetinaAtlasAssetUrl = '/assets/spritesheet/ships_miscellaneous_sheet_retina.png'

export type ShipIdentity = 'player' | 'chaser' | 'shooter'
export type ShipDamageStage = 'intact' | 'damaged' | 'critical'

export interface ShipTextures {
  stages: Readonly<Record<ShipIdentity, Readonly<Record<ShipDamageStage, Texture>>>>
  sunk: Readonly<Record<ShipIdentity, Texture>>
}

export interface CombatAtlasTextures {
  cannonBall: Texture
  fire: readonly [Texture, Texture]
  explosion: readonly [Texture, Texture, Texture]
  debris: readonly [Texture, Texture, Texture, Texture]
}

interface AtlasFrameDefinition { x: number; y: number; width: number; height: number }

// Generated from ships_miscellaneous_sheet.xml. The default and retina sheets
// share these coordinates; gameplay loads only the default representation.
const combatFrameManifest = Object.freeze({
  cannonBall: { x: 120, y: 29, width: 10, height: 10 },
  fire1: { x: 614, y: 466, width: 18, height: 39 },
  fire2: { x: 120, y: 0, width: 11, height: 27 },
  explosion1: { x: 0, y: 0, width: 74, height: 75 },
  explosion2: { x: 544, y: 145, width: 60, height: 59 },
  explosion3: { x: 544, y: 426, width: 42, height: 41 },
  wood1: { x: 88, y: 449, width: 15, height: 7 },
  wood2: { x: 408, y: 472, width: 26, height: 10 },
  wood3: { x: 116, y: 440, width: 15, height: 10 },
  wood4: { x: 88, y: 440, width: 26, height: 7 },
} satisfies Record<string, AtlasFrameDefinition>)

const shipFiles = Object.freeze({
  player: { intact: 1, damaged: 7, critical: 13, sunk: 19 },
  chaser: { intact: 3, damaged: 9, critical: 15, sunk: 21 },
  shooter: { intact: 2, damaged: 8, critical: 14, sunk: 20 },
} as const)

export async function loadShipTextures(): Promise<ShipTextures> {
  const loadIdentity = async (identity: ShipIdentity) => {
    const files = shipFiles[identity]
    const [intact, damaged, critical, sunk] = await Promise.all([
      Assets.load<Texture>(shipUrl(files.intact)), Assets.load<Texture>(shipUrl(files.damaged)),
      Assets.load<Texture>(shipUrl(files.critical)), Assets.load<Texture>(shipUrl(files.sunk)),
    ])
    return { intact, damaged, critical, sunk }
  }
  const [player, chaser, shooter] = await Promise.all([
    loadIdentity('player'), loadIdentity('chaser'), loadIdentity('shooter'),
  ])
  return {
    stages: {
      player: { intact: player.intact, damaged: player.damaged, critical: player.critical },
      chaser: { intact: chaser.intact, damaged: chaser.damaged, critical: chaser.critical },
      shooter: { intact: shooter.intact, damaged: shooter.damaged, critical: shooter.critical },
    },
    sunk: { player: player.sunk, chaser: chaser.sunk, shooter: shooter.sunk },
  }
}

export async function loadCombatAtlasTextures(): Promise<CombatAtlasTextures> {
  const atlas = await Assets.load<Texture>(shipsMiscellaneousAtlasAssetUrl)
  const frame = (label: string, definition: AtlasFrameDefinition) => atlasFrame(atlas, label, definition)
  return {
    cannonBall: frame('cannon_ball.png', combatFrameManifest.cannonBall),
    fire: [frame('fire_1.png', combatFrameManifest.fire1), frame('fire_2.png', combatFrameManifest.fire2)],
    explosion: [
      frame('explosion_3.png', combatFrameManifest.explosion3),
      frame('explosion_2.png', combatFrameManifest.explosion2),
      frame('explosion_1.png', combatFrameManifest.explosion1),
    ],
    debris: [
      frame('wood_1.png', combatFrameManifest.wood1), frame('wood_2.png', combatFrameManifest.wood2),
      frame('wood_3.png', combatFrameManifest.wood3), frame('wood_4.png', combatFrameManifest.wood4),
    ],
  }
}

export function damageStage(health: number, maxHealth: number): ShipDamageStage {
  const ratio = maxHealth > 0 ? health / maxHealth : 0
  if (ratio > 2 / 3) return 'intact'
  if (ratio > 1 / 3) return 'damaged'
  return 'critical'
}

function shipUrl(index: number): string {
  return `/assets/png/default/ships/ship_${index}.png`
}

function atlasFrame(atlas: Texture, label: string, definition: AtlasFrameDefinition): Texture {
  const { x, y, width, height } = definition
  return new Texture({ source: atlas.source, label, frame: new Rectangle(x, y, width, height) })
}
