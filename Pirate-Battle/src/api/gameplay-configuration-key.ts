import type { GameConfigSnapshot } from '../game/config/game-config.ts'

export function gameplayConfigurationKey(configuration: GameConfigSnapshot): string {
  return JSON.stringify({
    sessionDurationSeconds: configuration.sessionDurationSeconds,
    enemySpawnIntervalSeconds: configuration.enemySpawnIntervalSeconds,
    enemySpawnWeights: configuration.enemySpawnWeights,
    player: configuration.player,
    enemies: configuration.enemies,
    weapons: configuration.weapons,
  })
}
