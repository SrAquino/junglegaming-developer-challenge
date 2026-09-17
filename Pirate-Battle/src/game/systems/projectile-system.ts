import { segmentIntersectsLand } from '../config/arena-geometry.ts'
import type { EffectEntity, GameWorldState } from '../entities/entity.ts'
import type { GameSystem } from './game-system.ts'

export const projectileSystem: GameSystem = {
  update(deltaMs, { config, world }) {
    const deltaSeconds = deltaMs / 1_000
    for (const projectile of world.projectiles) {
      if (!projectile.active) continue
      const dx = projectile.velocity.x * deltaSeconds
      const dy = projectile.velocity.y * deltaSeconds
      const previousPosition = { ...projectile.position }
      projectile.position.x += dx
      projectile.position.y += dy
      projectile.distanceTravelled += Math.hypot(dx, dy)
      projectile.remainingLifetimeMs -= deltaMs
      const outsideArena =
        projectile.position.x < 0 || projectile.position.x > config.arena.width || projectile.position.y < 0 || projectile.position.y > config.arena.height
      if (
        projectile.distanceTravelled >= projectile.maximumRange ||
        projectile.remainingLifetimeMs <= 0 ||
        segmentIntersectsLand(previousPosition, projectile.position, config.arena.collisionPolygons ?? []) ||
        outsideArena
      ) {
        deactivateProjectile(projectile, world)
      }
    }
    world.projectiles = world.projectiles.filter((projectile) => projectile.active)
  },
}

function deactivateProjectile(
  projectile: { active: boolean; position: { x: number; y: number } },
  world: { effects: EffectEntity[]; events: GameWorldState['events'] },
): void {
  projectile.active = false
  world.events.push({ type: 'projectile-impact', material: 'water' })
  world.effects.push({
    id: `impact-${projectile.position.x.toFixed(1)}-${projectile.position.y.toFixed(1)}-${world.effects.length}`,
    kind: 'effect',
    effectType: 'impact-water',
    active: true,
    position: { ...projectile.position },
    rotation: 0,
    durationMs: 170,
    remainingLifetimeMs: 170,
  })
}
