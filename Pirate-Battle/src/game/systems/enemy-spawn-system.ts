import { circleIntersectsLand } from '../config/arena-geometry.ts'
import type { EnemyType } from '../entities/entity.ts'
import type { GameSystem } from './game-system.ts'

export const enemySpawnSystem: GameSystem = {
  update(_deltaMs, { config, world, random }) {
    const interval = config.enemySpawnIntervalSeconds * 1_000
    if (world.spawnElapsedMs < interval || world.player.health <= 0) return
    world.spawnElapsedMs %= interval
    const weights = config.enemySpawnWeights
    const enemyType: EnemyType = world.spawnedEnemyCount === 0 ? 'chaser'
      : world.spawnedEnemyCount === 1 ? 'shooter'
      : random.next() * (weights.chaser + weights.shooter) < weights.chaser ? 'chaser' : 'shooter'
    const shipConfig = config.enemies[enemyType]
    const radius = shipConfig.collisionRadius
    for (let attempt = 0; attempt < config.spawn.placementAttempts; attempt += 1) {
      const position = {
        x: radius + random.next() * (config.arena.width - radius * 2),
        y: radius + random.next() * (config.arena.height - radius * 2),
      }
      if (Math.hypot(position.x - world.player.position.x, position.y - world.player.position.y) < config.spawn.minimumDistanceFromPlayer) continue
      if (circleIntersectsLand(position, radius, config.arena.collisionPolygons ?? [])) continue
      if (world.enemies.some((enemy) => Math.hypot(position.x - enemy.position.x, position.y - enemy.position.y) < radius + enemy.collisionRadius)) continue
      world.spawnedEnemyCount += 1
      world.enemies.push({
        id: `${world.matchId}-enemy-${world.spawnedEnemyCount}`, kind: 'enemy', enemyType, active: true,
        position, rotation: Math.atan2(world.player.position.y - position.y, world.player.position.x - position.x),
        velocity: { x: 0, y: 0 }, health: shipConfig.maxHealth, maxHealth: shipConfig.maxHealth,
        collisionRadius: radius, lastAttackAtMs: world.elapsedMs,
      })
      return
    }
  },
}
