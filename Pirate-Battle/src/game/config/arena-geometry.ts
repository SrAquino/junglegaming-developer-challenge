import type { Vector2 } from '../types/vector.ts'

export type CollisionPolygons = readonly (readonly Readonly<Vector2>[])[]

export function circleIntersectsLand(position: Vector2, radius: number, polygons: CollisionPolygons): boolean {
  return polygons.some((polygon) => circleIntersectsPolygon(position, radius, polygon))
}

export function segmentIntersectsLand(from: Vector2, to: Vector2, polygons: CollisionPolygons, clearance = 0): boolean {
  return polygons.some((polygon) => segmentIntersectsPolygon(from, to, clearance, polygon))
}

export function circleIntersectsPolygon(position: Vector2, radius: number, polygon: readonly Readonly<Vector2>[]): boolean {
  if (pointInPolygon(position, polygon)) return true
  return polygon.some((point, index) => distanceToSegment(position, point, polygon[(index + 1) % polygon.length]) <= radius)
}

export function pointInPolygon(point: Vector2, polygon: readonly Readonly<Vector2>[]): boolean {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const a = polygon[index]
    const b = polygon[previous]
    if ((a.y > point.y) !== (b.y > point.y)
      && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function segmentIntersectsPolygon(from: Vector2, to: Vector2, clearance: number, polygon: readonly Readonly<Vector2>[]): boolean {
  if (pointInPolygon(from, polygon) || pointInPolygon(to, polygon)) return true
  return polygon.some((point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    return segmentsIntersect(from, to, point, next)
      || distanceBetweenSegments(from, to, point, next) <= clearance
  })
}

function distanceToSegment(point: Vector2, from: Vector2, to: Vector2): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const lengthSquared = dx * dx + dy * dy
  const amount = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared))
  return Math.hypot(point.x - (from.x + dx * amount), point.y - (from.y + dy * amount))
}

function distanceBetweenSegments(a: Vector2, b: Vector2, c: Vector2, d: Vector2): number {
  if (segmentsIntersect(a, b, c, d)) return 0
  return Math.min(distanceToSegment(a, c, d), distanceToSegment(b, c, d), distanceToSegment(c, a, b), distanceToSegment(d, a, b))
}

function segmentsIntersect(a: Vector2, b: Vector2, c: Vector2, d: Vector2): boolean {
  const cross = (p: Vector2, q: Vector2, r: Vector2) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  const abC = cross(a, b, c)
  const abD = cross(a, b, d)
  const cdA = cross(c, d, a)
  const cdB = cross(c, d, b)
  return ((abC <= 0 && abD >= 0) || (abC >= 0 && abD <= 0))
    && ((cdA <= 0 && cdB >= 0) || (cdA >= 0 && cdB <= 0))
}
