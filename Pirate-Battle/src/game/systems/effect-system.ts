import type { GameSystem } from './game-system.ts'

export const effectSystem: GameSystem = {
  update(deltaMs, { world }) {
    for (const effect of world.effects) {
      effect.remainingLifetimeMs -= deltaMs
      if (effect.remainingLifetimeMs <= 0) effect.active = false
    }
    world.effects = world.effects.filter((effect) => effect.active)
  },
}
