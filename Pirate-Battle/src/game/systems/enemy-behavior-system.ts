import type { GameSystem } from './game-system.ts'
import { navigationTarget, pathIsClear } from './enemy-navigation.ts'

export const enemyBehaviorSystem: GameSystem = {
  update(deltaMs, { config, world }) {
    for (const enemy of world.enemies) {
      if (!enemy.active || enemy.health <= 0 || world.player.health <= 0) continue
      const balance = config.enemies[enemy.enemyType]
      const collisionPolygons = config.arena.collisionPolygons ?? []
      const target = navigationTarget(enemy, world.player.position, collisionPolygons)
      const desiredAngle = Math.atan2(target.y - enemy.position.y, target.x - enemy.position.x)
      const angleDifference = Math.atan2(Math.sin(desiredAngle - enemy.rotation), Math.cos(desiredAngle - enemy.rotation))
      const maxTurn = balance.rotationSpeed * deltaMs / 1_000
      enemy.rotation += Math.max(-maxTurn, Math.min(maxTurn, angleDifference))
      const playerDistance = Math.hypot(world.player.position.x - enemy.position.x, world.player.position.y - enemy.position.y)
      const shouldMove = enemy.enemyType === 'chaser' || playerDistance > config.enemies.shooter.preferredDistance
        || !pathIsClear(enemy.position, world.player.position, collisionPolygons, enemy.collisionRadius)
      enemy.velocity = shouldMove ? { x: Math.cos(enemy.rotation) * balance.moveSpeed, y: Math.sin(enemy.rotation) * balance.moveSpeed } : { x: 0, y: 0 }
      const next = {
        x: Math.max(enemy.collisionRadius, Math.min(config.arena.width - enemy.collisionRadius, enemy.position.x + enemy.velocity.x * deltaMs / 1_000)),
        y: Math.max(enemy.collisionRadius, Math.min(config.arena.height - enemy.collisionRadius, enemy.position.y + enemy.velocity.y * deltaMs / 1_000)),
      }
      if (pathIsClear(enemy.position, next, collisionPolygons, enemy.collisionRadius)) enemy.position = next
      const distance = Math.hypot(world.player.position.x - enemy.position.x, world.player.position.y - enemy.position.y)
      if (enemy.enemyType === 'chaser' && distance <= enemy.collisionRadius + world.player.collisionRadius) {
        enemy.active = false
        world.player.health = Math.max(0, world.player.health - config.enemies.chaser.collisionDamage)
        world.effects.push({ id: `explosion-${enemy.id}`, kind: 'effect', effectType: 'explosion', active: true,
          position: { ...enemy.position }, rotation: enemy.rotation, durationMs: 420, remainingLifetimeMs: 420 })
        world.effects.push({ id: `sinking-${enemy.id}`, kind: 'effect', effectType: 'sinking', shipIdentity: 'chaser', active: true,
          position: { ...enemy.position }, rotation: enemy.rotation + Math.PI / 2, durationMs: 900, remainingLifetimeMs: 900 })
        if (world.player.health === 0) {
          world.effects.push({ id: `sinking-${world.player.id}`, kind: 'effect', effectType: 'sinking', shipIdentity: 'player', active: true,
            position: { ...world.player.position }, rotation: world.player.rotation + Math.PI / 2, durationMs: 900, remainingLifetimeMs: 900 })
        }
      } else if (enemy.enemyType === 'shooter') {
        const shooter = config.enemies.shooter
        const aim = Math.atan2(world.player.position.y - enemy.position.y, world.player.position.x - enemy.position.x)
        const aimDifference = Math.atan2(Math.sin(aim - enemy.rotation), Math.cos(aim - enemy.rotation))
        if (distance > shooter.attackRange || Math.abs(aimDifference) > 0.15
          || !pathIsClear(enemy.position, world.player.position, collisionPolygons)
          || world.elapsedMs - enemy.lastAttackAtMs < shooter.weapon.cooldownMs) continue
        enemy.lastAttackAtMs = world.elapsedMs
        const projectile = shooter.weapon.projectile
        const position = { x: enemy.position.x + Math.cos(aim) * (enemy.collisionRadius + 10), y: enemy.position.y + Math.sin(aim) * (enemy.collisionRadius + 10) }
        world.projectiles.push({ id: `${enemy.id}-shot-${world.elapsedMs}`, kind: 'projectile', active: true, owner: 'enemy',
          position, rotation: aim, velocity: { x: Math.cos(aim) * projectile.speed, y: Math.sin(aim) * projectile.speed },
          damage: projectile.damage, distanceTravelled: 0, maximumRange: projectile.range, remainingLifetimeMs: projectile.lifetimeMs })
        world.effects.push({ id: `${enemy.id}-muzzle-${world.elapsedMs}`, kind: 'effect', effectType: 'muzzle-flash', active: true,
          position: { ...position }, rotation: aim, durationMs: 120, remainingLifetimeMs: 120 })
      }
    }
    world.enemies = world.enemies.filter((enemy) => enemy.active)
  },
}
