import type { GameConfigSnapshot } from '../config/game-config.ts'
import type { GameWorldState } from '../entities/entity.ts'

export function createInitialWorld(matchId: string, config: GameConfigSnapshot): GameWorldState {
  return {
    matchId,
    elapsedMs: 0,
    spawnElapsedMs: 0,
    player: {
      id: 'player',
      kind: 'player',
      active: true,
      position: {
        x: config.arena.width * 0.25,
        y: config.arena.height / 2,
      },
      velocity: { x: 0, y: 0 },
      rotation: -Math.PI / 2,
      health: config.player.maxHealth,
      maxHealth: config.player.maxHealth,
      collisionRadius: config.player.collisionRadius,
      score: 0,
      weaponReadyAtMs: { front: 0, leftBroadside: 0, rightBroadside: 0 },
    },
    enemies: [],
    projectiles: [],
    effects: [],
  }
}
