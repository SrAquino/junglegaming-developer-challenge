import { centralIsland } from '../config/arena-layout.ts'
import type { EnemyEntity } from '../entities/entity.ts'
import type { Vector2 } from '../types/vector.ts'

export function pathIsClear(from: Vector2, to: Vector2, radius: number): boolean {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
    ((centralIsland.center.x - from.x) * dx + (centralIsland.center.y - from.y) * dy) / lengthSquared))
  return Math.hypot(from.x + dx * t - centralIsland.center.x, from.y + dy * t - centralIsland.center.y) > radius
}

export function navigationTarget(enemy: EnemyEntity, target: Vector2): Vector2 {
  const blockingRadius = centralIsland.radius + enemy.collisionRadius
  if (pathIsClear(enemy.position, target, blockingRadius)) {
    enemy.waypoints = []
    return target
  }
  while (enemy.waypoints?.length && distance(enemy.position, enemy.waypoints[0]) < 25) enemy.waypoints.shift()
  if (!enemy.waypoints?.length) enemy.waypoints = routeAroundIsland(enemy.position, target, blockingRadius)
  return enemy.waypoints[0] ?? target
}

function routeAroundIsland(from: Vector2, to: Vector2, radius: number): Vector2[] {
  const nodes = Array.from({ length: 16 }, (_, index) => ({
    x: centralIsland.center.x + Math.cos(index * Math.PI / 8) * (radius + 55),
    y: centralIsland.center.y + Math.sin(index * Math.PI / 8) * (radius + 55),
  }))
  let shortest = Infinity
  let best: Vector2[] = []
  for (let start = 0; start < nodes.length; start += 1) {
    if (!pathIsClear(from, nodes[start], radius)) continue
    for (let end = 0; end < nodes.length; end += 1) {
      if (!pathIsClear(nodes[end], to, radius)) continue
      for (const direction of [-1, 1]) {
        const route = [nodes[start]]
        let current = start
        while (current !== end) {
          current = (current + direction + nodes.length) % nodes.length
          route.push(nodes[current])
        }
        const cost = distance(from, route[0]) + distance(route[route.length - 1], to)
          + route.slice(1).reduce((sum, node, index) => sum + distance(route[index], node), 0)
        if (cost < shortest) { shortest = cost; best = route }
      }
    }
  }
  return best
}

function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
