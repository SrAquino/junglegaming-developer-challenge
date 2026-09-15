export interface GameConfig {
  sessionDurationSeconds: number
  enemySpawnIntervalSeconds: number
  playerHealth: number
}

export const defaultGameConfig: Readonly<GameConfig> = {
  sessionDurationSeconds: 120,
  enemySpawnIntervalSeconds: 4,
  playerHealth: 100,
}
