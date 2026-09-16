export interface NumericLimits {
  min: number
  max: number
}

export interface GameOptions {
  sessionDurationSeconds: number
  enemySpawnIntervalSeconds: number
}

export interface ProjectileConfig {
  damage: number
  speed: number
  range: number
  lifetimeMs: number
}

export interface WeaponConfig {
  cooldownMs: number
  projectileCount: number
  projectileSpacing: number
  projectile: ProjectileConfig
}

export interface ShipConfig {
  maxHealth: number
  moveSpeed: number
  rotationSpeed: number
  collisionRadius: number
}

export interface GameConfig {
  sessionDurationSeconds: number
  enemySpawnIntervalSeconds: number
  enemySpawnWeights: {
    chaser: number
    shooter: number
  }
  arena: {
    width: number
    height: number
  }
  simulation: {
    fixedStepMs: number
    maxFrameDeltaMs: number
    maxStepsPerFrame: number
    hudPublishIntervalMs: number
  }
  spawn: {
    minimumDistanceFromPlayer: number
    placementAttempts: number
  }
  presentation: {
    playerShipScale: number
    chaserShipScale: number
    shooterShipScale: number
    projectileScale: number
  }
  player: ShipConfig
  enemies: {
    chaser: ShipConfig & {
      collisionDamage: number
    }
    shooter: ShipConfig & {
      attackRange: number
      preferredDistance: number
      weapon: WeaponConfig
    }
  }
  weapons: {
    front: WeaponConfig
    broadside: WeaponConfig
  }
}

type Primitive = string | number | boolean | bigint | symbol | null | undefined
export type DeepReadonly<T> = T extends Primitive | ((...args: never[]) => unknown)
  ? T
  : T extends readonly (infer TItem)[]
    ? readonly DeepReadonly<TItem>[]
    : { readonly [TKey in keyof T]: DeepReadonly<T[TKey]> }

export type GameConfigSnapshot = DeepReadonly<GameConfig>

export const sessionDurationLimits: Readonly<NumericLimits> = Object.freeze({ min: 60, max: 180 })
export const enemySpawnIntervalLimits: Readonly<NumericLimits> = Object.freeze({ min: 1, max: 20 })

export const defaultGameOptions: Readonly<GameOptions> = Object.freeze({
  sessionDurationSeconds: 120,
  enemySpawnIntervalSeconds: 4,
})

export const defaultGameConfig: GameConfigSnapshot = deepFreeze({
  ...defaultGameOptions,
  enemySpawnWeights: {
    chaser: 0.55,
    shooter: 0.45,
  },
  arena: {
    width: 1_600,
    height: 900,
  },
  simulation: {
    fixedStepMs: 1_000 / 60,
    maxFrameDeltaMs: 250,
    maxStepsPerFrame: 15,
    hudPublishIntervalMs: 100,
  },
  spawn: {
    minimumDistanceFromPlayer: 420,
    placementAttempts: 24,
  },
  presentation: {
    playerShipScale: 1.1,
    chaserShipScale: 0.95,
    shooterShipScale: 0.95,
    projectileScale: 2.2,
  },
  player: {
    maxHealth: 100,
    moveSpeed: 210,
    rotationSpeed: Math.PI * 0.9,
    collisionRadius: 34,
  },
  enemies: {
    chaser: {
      maxHealth: 30,
      moveSpeed: 150,
      rotationSpeed: Math.PI * 0.72,
      collisionRadius: 28,
      collisionDamage: 25,
    },
    shooter: {
      maxHealth: 45,
      moveSpeed: 105,
      rotationSpeed: Math.PI * 0.55,
      collisionRadius: 32,
      attackRange: 460,
      preferredDistance: 360,
      weapon: {
        cooldownMs: 1_600,
        projectileCount: 1,
        projectileSpacing: 0,
        projectile: {
          damage: 12,
          speed: 360,
          range: 540,
          lifetimeMs: 1_500,
        },
      },
    },
  },
  weapons: {
    front: {
      cooldownMs: 450,
      projectileCount: 1,
      projectileSpacing: 0,
      projectile: {
        damage: 20,
        speed: 620,
        range: 720,
        lifetimeMs: 1_200,
      },
    },
    broadside: {
      cooldownMs: 1_100,
      projectileCount: 3,
      projectileSpacing: 28,
      projectile: {
        damage: 16,
        speed: 520,
        range: 620,
        lifetimeMs: 1_250,
      },
    },
  },
})

export function createGameConfigSnapshot(
  options: GameOptions = defaultGameOptions,
  balance: GameConfigSnapshot = defaultGameConfig,
): GameConfigSnapshot {
  assertWithinLimits('Game session time', options.sessionDurationSeconds, sessionDurationLimits)
  assertWithinLimits('Enemy spawn time', options.enemySpawnIntervalSeconds, enemySpawnIntervalLimits)

  return deepFreeze({
    ...cloneConfig(balance),
    sessionDurationSeconds: options.sessionDurationSeconds,
    enemySpawnIntervalSeconds: options.enemySpawnIntervalSeconds,
  })
}

function cloneConfig(config: GameConfigSnapshot): GameConfig {
  return structuredClone(config) as GameConfig
}

function assertWithinLimits(label: string, value: number, limits: Readonly<NumericLimits>): void {
  if (!Number.isFinite(value) || value < limits.min || value > limits.max) {
    throw new RangeError(`${label} must be between ${limits.min} and ${limits.max}.`)
  }
}

function deepFreeze<TValue>(value: TValue): DeepReadonly<TValue> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }

  return value as DeepReadonly<TValue>
}
