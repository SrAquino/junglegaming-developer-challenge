import type { GameConfigSnapshot } from '../game/config/game-config.ts'

export function gameplayConfigurationKey(configuration: GameConfigSnapshot): string {
  return JSON.stringify({
    sessionDurationSeconds: configuration.sessionDurationSeconds,
    enemySpawnIntervalSeconds: configuration.enemySpawnIntervalSeconds,
    enemySpawnWeights: configuration.enemySpawnWeights,
    arena: configuration.arena ? {
      layoutId: configuration.arena.layoutId,
      width: configuration.arena.width,
      height: configuration.arena.height,
    } : undefined,
    simulation: configuration.simulation,
    spawn: configuration.spawn,
    player: configuration.player,
    enemies: configuration.enemies,
    weapons: configuration.weapons,
  })
}
