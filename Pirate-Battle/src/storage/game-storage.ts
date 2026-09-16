import type { GameOptions } from '../game/config/game-config.ts'
import { defaultGameOptions } from '../game/config/game-config.ts'
import type { MatchResult } from '../game/types/game.ts'
import { storageKeys } from './storage-keys.ts'

export function loadGameOptions(): GameOptions {
  return read(storageKeys.gameOptions, defaultGameOptions)
}

export function saveGameOptions(options: GameOptions): void {
  localStorage.setItem(storageKeys.gameOptions, JSON.stringify(options))
}

export function loadLastMatchResult(): MatchResult | null {
  return read(storageKeys.lastMatchResult, null)
}

export function saveLastMatchResult(result: MatchResult): void {
  localStorage.setItem(storageKeys.lastMatchResult, JSON.stringify(result))
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}
