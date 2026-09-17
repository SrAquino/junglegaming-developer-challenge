import type { WeaponConfig } from '../config/game-config.ts'
import type { GameWorldState } from '../entities/entity.ts'
import type { GameSystem } from './game-system.ts'

export const weaponSystem: GameSystem = {
  update(_deltaMs, { config, input, world }) {
    const player = world.player
    const now = world.elapsedMs
    if (input.fireFront && now >= player.weaponReadyAtMs.front) {
      fireWeapon(world, player, config.weapons.front, player.rotation, now, 'front')
    }
    if (input.fireLeft && now >= player.weaponReadyAtMs.leftBroadside) {
      fireWeapon(world, player, config.weapons.broadside, player.rotation - Math.PI / 2, now, 'leftBroadside')
    }
    if (input.fireRight && now >= player.weaponReadyAtMs.rightBroadside) {
      fireWeapon(world, player, config.weapons.broadside, player.rotation + Math.PI / 2, now, 'rightBroadside')
    }
  },
}

function fireWeapon(
  world: GameWorldState,
  player: { id: string; position: { x: number; y: number }; collisionRadius: number; weaponReadyAtMs: Record<'front' | 'leftBroadside' | 'rightBroadside', number> },
  weapon: WeaponConfig,
  angle: number,
  now: number,
  weaponKey: 'front' | 'leftBroadside' | 'rightBroadside',
): void {
  player.weaponReadyAtMs[weaponKey] = now + weapon.cooldownMs
  const forwardX = Math.cos(angle)
  const forwardY = Math.sin(angle)
  const sideX = -forwardY
  const sideY = forwardX
  world.events.push({ type: 'weapon-fired', weapon: weaponKey === 'front' ? 'front' : 'broadside', owner: 'player' })
  world.effects.push({
    id: `${player.id}-${weaponKey}-muzzle-${now}`,
    kind: 'effect',
    effectType: 'muzzle-flash',
    active: true,
    position: {
      x: player.position.x + forwardX * (player.collisionRadius + 12),
      y: player.position.y + forwardY * (player.collisionRadius + 12),
    },
    rotation: angle,
    durationMs: 120,
    remainingLifetimeMs: 120,
  })
  for (let index = 0; index < weapon.projectileCount; index += 1) {
    const offset = (index - (weapon.projectileCount - 1) / 2) * weapon.projectileSpacing
    world.projectiles.push({
      id: `${player.id}-${weaponKey}-${now}-${index}`,
      kind: 'projectile',
      active: true,
      owner: 'player',
      position: {
        x: player.position.x + forwardX * player.collisionRadius + sideX * offset,
        y: player.position.y + forwardY * player.collisionRadius + sideY * offset,
      },
      rotation: angle,
      velocity: { x: forwardX * weapon.projectile.speed, y: forwardY * weapon.projectile.speed },
      damage: weapon.projectile.damage,
      distanceTravelled: 0,
      maximumRange: weapon.projectile.range,
      remainingLifetimeMs: weapon.projectile.lifetimeMs,
    })
  }
}
