import type { EffectEntity, EnemyEntity, ProjectileEntity } from '../entities/entity.ts'
import type { GameSystem } from './game-system.ts'

export const combatSystem: GameSystem = {
  update(_deltaMs, { world }) {
    for (const projectile of world.projectiles) {
      if (world.player.health <= 0) break
      if (!projectile.active) continue
      const target = projectile.owner === 'player'
        ? world.enemies.find((enemy) => enemy.active && collides(projectile, enemy))
        : collides(projectile, world.player) ? world.player : undefined
      if (!target) continue

      target.health = Math.max(0, target.health - projectile.damage)
      projectile.active = false
      createImpactEffect(world.effects, projectile)
      if (target.health === 0) {
        target.active = false
        createExplosionEffect(world.effects, target)
        if (isEnemy(target)) world.player.score += 1
      }
    }
    world.projectiles = world.projectiles.filter((projectile) => projectile.active)
    world.enemies = world.enemies.filter((enemy) => enemy.active)
  },
}

function collides(projectile: ProjectileEntity, target: { position: { x: number; y: number }; collisionRadius: number }): boolean {
  return Math.hypot(projectile.position.x - target.position.x, projectile.position.y - target.position.y) <= target.collisionRadius + 8
}

function isEnemy(target: { kind: string }): target is EnemyEntity {
  return target.kind === 'enemy'
}

function createImpactEffect(effects: EffectEntity[], projectile: ProjectileEntity): void {
  effects.push({
    id: `hit-${projectile.id}`,
    kind: 'effect',
    effectType: 'impact',
    active: true,
    position: { ...projectile.position },
    rotation: projectile.rotation,
    remainingLifetimeMs: 180,
  })
}

function createExplosionEffect(effects: EffectEntity[], target: { id: string; position: { x: number; y: number }; rotation: number }): void {
  effects.push({
    id: `explosion-${target.id}`,
    kind: 'effect',
    effectType: 'explosion',
    active: true,
    position: { ...target.position },
    rotation: target.rotation,
    remainingLifetimeMs: 420,
  })
}
