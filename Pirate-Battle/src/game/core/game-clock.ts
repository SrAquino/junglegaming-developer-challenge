export interface GameClock {
  now(): number
}

export class BrowserGameClock implements GameClock {
  public now(): number {
    return performance.now()
  }
}

export class ManualGameClock implements GameClock {
  private currentTimeMs = 0

  public now(): number {
    return this.currentTimeMs
  }

  public advance(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) {
      throw new RangeError('Clock advance must be a finite, non-negative number.')
    }

    this.currentTimeMs += deltaMs
  }

  public reset(timeMs = 0): void {
    if (!Number.isFinite(timeMs) || timeMs < 0) {
      throw new RangeError('Clock time must be a finite, non-negative number.')
    }

    this.currentTimeMs = timeMs
  }
}
