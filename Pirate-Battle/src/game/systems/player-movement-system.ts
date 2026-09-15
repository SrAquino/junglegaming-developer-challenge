import { centralIsland } from '../config/arena-layout.ts'
import type { CircularObstacle } from '../config/arena-layout.ts'
import type { GameSystem } from './game-system.ts'

export const playerMovementSystem: GameSystem = {
  update(deltaMs, { config, input, world }) {
    const player = world.player
    const deltaSeconds = deltaMs / 1_000
    const turnDirection = Number(input.turnRight) - Number(input.turnLeft)
    player.rotation += turnDirection * config.player.rotationSpeed * deltaSeconds

    if (!input.forward) {
      player.velocity.x = 0
      player.velocity.y = 0
      return
    }

    player.velocity.x = Math.cos(player.rotation) * config.player.moveSpeed
    player.velocity.y = Math.sin(player.rotation) * config.player.moveSpeed
    const previousPosition = { ...player.position }
    player.position.x += player.velocity.x * deltaSeconds
    player.position.y += player.velocity.y * deltaSeconds
    constrainToArena(player.position, player.collisionRadius, config.arena.width, config.arena.height)

    if (intersectsCircle(player.position, player.collisionRadius, centralIsland)) {
      player.position.x = previousPosition.x
      player.position.y = previousPosition.y
    }
  },
}

function constrainToArena(
  position: { x: number; y: number },
  radius: number,
  arenaWidth: number,
  arenaHeight: number,
): void {
  position.x = Math.max(radius, Math.min(arenaWidth - radius, position.x))
  position.y = Math.max(radius, Math.min(arenaHeight - radius, position.y))
}

function intersectsCircle(
  position: { x: number; y: number },
  radius: number,
  obstacle: Readonly<CircularObstacle>,
): boolean {
  const dx = position.x - obstacle.center.x
  const dy = position.y - obstacle.center.y
  const minimumDistance = radius + obstacle.radius
  return dx * dx + dy * dy < minimumDistance * minimumDistance
}
