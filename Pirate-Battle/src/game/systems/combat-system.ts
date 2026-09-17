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

      const previousHealth = target.health
      target.health = Math.max(0, target.health - projectile.damage)
      projectile.active = false
      createImpactEffect(world.effects, projectile)
      world.events.push({ type: 'projectile-impact', material: 'wood' })
      world.events.push({
        type: 'ship-damaged',
        target: isEnemy(target) ? target.enemyType : 'player',
        health: target.health,
        previousHealth,
        maxHealth: target.maxHealth,
      })
      if (target.health === 0) {
        target.active = false
        createExplosionEffect(world.effects, target)
        createSinkingEffect(world.effects, target)
        world.events.push({ type: 'ship-destroyed', target: isEnemy(target) ? target.enemyType : 'player' })
        if (isEnemy(target)) { world.player.score += 1; world.events.push({ type: 'score-changed' }) }
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
    effectType: 'impact-wood',
    active: true,
    position: { ...projectile.position },
    rotation: projectile.rotation,
    durationMs: 180,
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
    durationMs: 420,
    remainingLifetimeMs: 420,
  })
}

function createSinkingEffect(effects: EffectEntity[], target: EnemyEntity | { id: string; kind: 'player'; position: { x: number; y: number }; rotation: number }): void {
  effects.push({
    id: `sinking-${target.id}`,
    kind: 'effect',
    effectType: 'sinking',
    shipIdentity: target.kind === 'enemy' ? target.enemyType : 'player',
    active: true,
    position: { ...target.position },
    rotation: target.rotation + Math.PI / 2,
    durationMs: 900,
    remainingLifetimeMs: 900,
  })
}
