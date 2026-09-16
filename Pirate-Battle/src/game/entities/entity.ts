import type { Vector2 } from '../types/vector.ts'

export type EnemyType = 'chaser' | 'shooter'
export type ProjectileOwner = 'player' | 'enemy'

export interface BaseEntity {
  id: string
  position: Vector2
  rotation: number
  active: boolean
}

export interface ShipEntity extends BaseEntity {
  kind: 'player' | 'enemy'
  health: number
  maxHealth: number
  velocity: Vector2
  collisionRadius: number
}

export interface PlayerEntity extends ShipEntity {
  kind: 'player'
  score: number
  weaponReadyAtMs: Record<'front' | 'leftBroadside' | 'rightBroadside', number>
}

export interface EnemyEntity extends ShipEntity {
  kind: 'enemy'
  enemyType: EnemyType
  lastAttackAtMs: number
  waypoints?: Vector2[]
}

export interface ProjectileEntity extends BaseEntity {
  kind: 'projectile'
  owner: ProjectileOwner
  velocity: Vector2
  damage: number
  distanceTravelled: number
  maximumRange: number
  remainingLifetimeMs: number
}

export interface EffectEntity extends BaseEntity {
  kind: 'effect'
  effectType: 'muzzle-flash' | 'impact-water' | 'impact-wood' | 'explosion'
  remainingLifetimeMs: number
}

export interface GameWorldState {
  matchId: string
  elapsedMs: number
  spawnElapsedMs: number
  spawnedEnemyCount: number
  player: PlayerEntity
  enemies: EnemyEntity[]
  projectiles: ProjectileEntity[]
  effects: EffectEntity[]
}

export type GameEntity = PlayerEntity | EnemyEntity | ProjectileEntity | EffectEntity
