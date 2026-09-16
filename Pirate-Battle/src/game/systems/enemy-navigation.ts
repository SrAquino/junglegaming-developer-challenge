import { circleIntersectsLand, segmentIntersectsLand, type CollisionPolygons } from '../config/arena-geometry.ts'
import type { EnemyEntity } from '../entities/entity.ts'
import type { Vector2 } from '../types/vector.ts'

export function pathIsClear(from: Vector2, to: Vector2, polygons: CollisionPolygons, clearance = 0): boolean {
  return !segmentIntersectsLand(from, to, polygons, clearance)
}

export function navigationTarget(enemy: EnemyEntity, target: Vector2, polygons: CollisionPolygons): Vector2 {
  if (pathIsClear(enemy.position, target, polygons, enemy.collisionRadius)) {
    enemy.waypoints = []
    return target
  }
  while (enemy.waypoints?.length && distance(enemy.position, enemy.waypoints[0]) < 25) enemy.waypoints.shift()
  if (!enemy.waypoints?.length) enemy.waypoints = routeAroundLand(enemy.position, target, polygons, enemy.collisionRadius)
  return enemy.waypoints[0] ?? target
}

function routeAroundLand(from: Vector2, to: Vector2, polygons: CollisionPolygons, clearance: number): Vector2[] {
  const candidates = polygons.flatMap((polygon) => {
    const center = polygon.reduce((sum, point) => ({ x: sum.x + point.x / polygon.length, y: sum.y + point.y / polygon.length }), { x: 0, y: 0 })
    return polygon.map((point) => {
      const dx = point.x - center.x
      const dy = point.y - center.y
      const length = Math.hypot(dx, dy) || 1
      const padding = clearance + 28
      return { x: point.x + dx / length * padding, y: point.y + dy / length * padding }
    })
  }).filter((point) => !circleIntersectsLand(point, clearance, polygons))
  const nodes = [from, to, ...candidates]
  const distances = nodes.map(() => Infinity)
  const previous = nodes.map(() => -1)
  const visited = new Set<number>()
  distances[0] = 0

  while (visited.size < nodes.length) {
    let current = -1
    for (let index = 0; index < nodes.length; index += 1) {
      if (!visited.has(index) && (current < 0 || distances[index] < distances[current])) current = index
    }
    if (current < 0 || !Number.isFinite(distances[current]) || current === 1) break
    visited.add(current)
    for (let next = 0; next < nodes.length; next += 1) {
      if (next === current || visited.has(next) || !pathIsClear(nodes[current], nodes[next], polygons, clearance)) continue
      const cost = distances[current] + distance(nodes[current], nodes[next])
      if (cost < distances[next]) { distances[next] = cost; previous[next] = current }
    }
  }

  if (!Number.isFinite(distances[1])) return []
  const route: Vector2[] = []
  for (let current = 1; current > 0; current = previous[current]) route.unshift(nodes[current])
  return route
}

function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
