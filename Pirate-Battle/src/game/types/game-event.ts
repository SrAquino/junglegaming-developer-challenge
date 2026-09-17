export type GameEvent =
  | { type: 'weapon-fired'; weapon: 'front' | 'broadside'; owner: 'player' | 'enemy' }
  | { type: 'projectile-impact'; material: 'water' | 'wood' }
  | { type: 'ship-damaged'; target: 'player' | 'chaser' | 'shooter'; health: number; previousHealth: number; maxHealth: number }
  | { type: 'ship-destroyed'; target: 'player' | 'chaser' | 'shooter' }
  | { type: 'score-changed' }
  | { type: 'ship-collision' }
