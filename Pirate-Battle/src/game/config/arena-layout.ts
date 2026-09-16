import type { Vector2 } from '../types/vector.ts'

export interface ArenaLandmass {
  id: 'north-west-fort' | 'south-bank' | 'south-east-cove'
  coast: readonly Readonly<Vector2>[]
  grass: readonly Readonly<Vector2>[]
}

export interface ArenaDecoration {
  kind: 'pier' | 'rock' | 'vegetation' | 'tower' | 'wall' | 'gate' | 'dinghy' | 'cannon' | 'wood'
  position: Readonly<Vector2>
  scale: number
  rotation?: number
  variant?: 0 | 1 | 2
  blocksMovement: false
}

/** Fixed 1600×900 arena inspired by sample.png. These coast polygons are the canonical blocking geometry. */
export const arenaLandmasses: readonly Readonly<ArenaLandmass>[] = Object.freeze([
  Object.freeze({
    id: 'north-west-fort',
    coast: polygon([[0, 0], [760, 0], [805, 85], [790, 205], [735, 270], [650, 280], [650, 350], [535, 408], [235, 398], [165, 345], [150, 230], [0, 205]]),
    grass: polygon([[0, 38], [675, 38], [722, 92], [710, 190], [630, 218], [585, 345], [255, 340], [220, 300], [215, 165], [0, 150]]),
  }),
  Object.freeze({
    id: 'south-bank',
    coast: polygon([[500, 900], [500, 805], [555, 735], [650, 700], [930, 700], [1005, 735], [1025, 785], [1170, 785], [1225, 830], [1235, 900]]),
    grass: polygon([[590, 900], [590, 815], [650, 770], [900, 770], [950, 815], [1100, 825], [1135, 900]]),
  }),
  Object.freeze({
    id: 'south-east-cove',
    coast: polygon([[1250, 900], [1250, 760], [1290, 675], [1370, 620], [1535, 620], [1600, 660], [1600, 900]]),
    grass: polygon([[1330, 900], [1330, 760], [1385, 700], [1515, 690], [1600, 725], [1600, 900]]),
  }),
])

/** Visibility-graph nodes kept in the same map source as the coastlines. */
export const arenaNavigationPoints: readonly Readonly<Vector2>[] = polygon([
  [120, 455], [560, 470], [715, 410], [850, 300],
  [440, 655], [610, 645], [960, 640], [1100, 710], [1190, 735],
  [1205, 590], [1320, 555], [1540, 555],
])

export const arenaDecorations: readonly Readonly<ArenaDecoration>[] = Object.freeze([
  Object.freeze({ kind: 'tower', position: Object.freeze({ x: 310, y: 105 }), scale: 1, blocksMovement: false }),
  Object.freeze({ kind: 'wall', position: Object.freeze({ x: 375, y: 105 }), scale: 1, rotation: Math.PI / 2, blocksMovement: false }),
  Object.freeze({ kind: 'wall', position: Object.freeze({ x: 440, y: 105 }), scale: 1, rotation: Math.PI / 2, blocksMovement: false }),
  Object.freeze({ kind: 'tower', position: Object.freeze({ x: 505, y: 105 }), scale: 1, blocksMovement: false }),
  Object.freeze({ kind: 'wall', position: Object.freeze({ x: 310, y: 170 }), scale: 1, blocksMovement: false }),
  Object.freeze({ kind: 'wall', position: Object.freeze({ x: 505, y: 170 }), scale: 1, blocksMovement: false }),
  Object.freeze({ kind: 'tower', position: Object.freeze({ x: 310, y: 235 }), scale: 1, blocksMovement: false }),
  Object.freeze({ kind: 'gate', position: Object.freeze({ x: 408, y: 235 }), scale: 1, rotation: Math.PI / 2, blocksMovement: false }),
  Object.freeze({ kind: 'tower', position: Object.freeze({ x: 505, y: 235 }), scale: 1, blocksMovement: false }),
  Object.freeze({ kind: 'pier', position: Object.freeze({ x: 640, y: 315 }), scale: 1, rotation: Math.PI / 2, blocksMovement: false }),
  Object.freeze({ kind: 'vegetation', position: Object.freeze({ x: 115, y: 305 }), scale: 1.15, variant: 1, blocksMovement: false }),
  Object.freeze({ kind: 'vegetation', position: Object.freeze({ x: 575, y: 185 }), scale: 0.9, variant: 0, blocksMovement: false }),
  Object.freeze({ kind: 'rock', position: Object.freeze({ x: 555, y: 345 }), scale: 1.1, variant: 1, blocksMovement: false }),
  Object.freeze({ kind: 'rock', position: Object.freeze({ x: 1080, y: 842 }), scale: 1, variant: 0, blocksMovement: false }),
  Object.freeze({ kind: 'dinghy', position: Object.freeze({ x: 1160, y: 735 }), scale: 0.75, rotation: -0.35, variant: 0, blocksMovement: false }),
  Object.freeze({ kind: 'cannon', position: Object.freeze({ x: 1450, y: 690 }), scale: 0.8, rotation: -0.4, blocksMovement: false }),
  Object.freeze({ kind: 'wood', position: Object.freeze({ x: 1540, y: 745 }), scale: 0.9, rotation: 0.6, variant: 1, blocksMovement: false }),
  Object.freeze({ kind: 'vegetation', position: Object.freeze({ x: 1430, y: 805 }), scale: 1.1, variant: 2, blocksMovement: false }),
  Object.freeze({ kind: 'rock', position: Object.freeze({ x: 1510, y: 710 }), scale: 0.8, variant: 2, blocksMovement: false }),
])

function polygon(points: readonly (readonly [number, number])[]): readonly Readonly<Vector2>[] {
  return Object.freeze(points.map(([x, y]) => Object.freeze({ x, y })))
}
