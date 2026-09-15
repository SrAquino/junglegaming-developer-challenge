export interface FrameAdvanceResult {
  steps: number
  simulatedMs: number
  droppedMs: number
}

export class FixedTimestepLoop {
  private accumulatorMs = 0
  private readonly fixedStepMs: number
  private readonly maxFrameDeltaMs: number
  private readonly maxStepsPerFrame: number

  public constructor(fixedStepMs: number, maxFrameDeltaMs: number, maxStepsPerFrame: number) {
    if (fixedStepMs <= 0 || maxFrameDeltaMs <= 0 || maxStepsPerFrame < 1) {
      throw new RangeError('Fixed timestep values must be positive.')
    }

    this.fixedStepMs = fixedStepMs
    this.maxFrameDeltaMs = maxFrameDeltaMs
    this.maxStepsPerFrame = Math.floor(maxStepsPerFrame)
  }

  public advance(frameDeltaMs: number, update: (fixedStepMs: number) => void): FrameAdvanceResult {
    const safeDeltaMs = Number.isFinite(frameDeltaMs) ? Math.max(0, frameDeltaMs) : 0
    this.accumulatorMs += Math.min(safeDeltaMs, this.maxFrameDeltaMs)

    let steps = 0
    while (this.accumulatorMs >= this.fixedStepMs && steps < this.maxStepsPerFrame) {
      update(this.fixedStepMs)
      this.accumulatorMs -= this.fixedStepMs
      steps += 1
    }

    let droppedMs = 0
    if (this.accumulatorMs >= this.fixedStepMs) {
      droppedMs = this.accumulatorMs - (this.accumulatorMs % this.fixedStepMs)
      this.accumulatorMs -= droppedMs
    }

    return {
      steps,
      simulatedMs: steps * this.fixedStepMs,
      droppedMs,
    }
  }

  public reset(): void {
    this.accumulatorMs = 0
  }

  public getAccumulatorMs(): number {
    return this.accumulatorMs
  }
}
