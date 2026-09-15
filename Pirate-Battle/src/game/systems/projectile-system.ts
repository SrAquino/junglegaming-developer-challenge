import { centralIsland } from '../config/arena-layout.ts'
import type { EffectEntity } from '../entities/entity.ts'
import type { GameSystem } from './game-system.ts'

export const projectileSystem: GameSystem = {
  update(deltaMs, { config, world }) {
    const deltaSeconds = deltaMs / 1_000
    for (const projectile of world.projectiles) {
      if (!projectile.active) continue
      const dx = projectile.velocity.x * deltaSeconds
      const dy = projectile.velocity.y * deltaSeconds
      projectile.position.x += dx
      projectile.position.y += dy
      projectile.distanceTravelled += Math.hypot(dx, dy)
      projectile.remainingLifetimeMs -= deltaMs
      const islandDistance = Math.hypot(
        projectile.position.x - centralIsland.center.x,
        projectile.position.y - centralIsland.center.y,
      )
      const outsideArena =
        projectile.position.x < 0 || projectile.position.x > config.arena.width || projectile.position.y < 0 || projectile.position.y > config.arena.height
      if (
        projectile.distanceTravelled >= projectile.maximumRange ||
        projectile.remainingLifetimeMs <= 0 ||
        islandDistance <= centralIsland.radius ||
        outsideArena
      ) {
        deactivateProjectile(projectile, world.effects)
      }
    }
    world.projectiles = world.projectiles.filter((projectile) => projectile.active)
  },
}

function deactivateProjectile(
  projectile: { active: boolean; position: { x: number; y: number } },
  effects: EffectEntity[],
): void {
  projectile.active = false
  effects.push({
    id: `impact-${projectile.position.x.toFixed(1)}-${projectile.position.y.toFixed(1)}-${effects.length}`,
    kind: 'effect',
    effectType: 'impact',
    active: true,
    position: { ...projectile.position },
    rotation: 0,
    remainingLifetimeMs: 170,
  })
}
