export type GameSound = 'gameStart' | 'gamePause' | 'gameResume' | 'gameComplete' | 'gameOver' | 'cannonFire' | 'broadside' | 'waterHit' | 'woodHit' | 'explosion' | 'sinking' | 'oceanLoop' | 'sailingLoop'

const soundSources: Readonly<Record<GameSound, string>> = Object.freeze({
  gameStart: 'game_start.wav', gamePause: 'game_pause.wav', gameResume: 'game_resume.wav', gameComplete: 'game_complete.wav', gameOver: 'game_over.wav',
  cannonFire: 'cannon_fire_1.wav', broadside: 'cannon_broadside.wav', waterHit: 'cannonball_water_hit_1.wav', woodHit: 'ship_wood_hit_1.wav', explosion: 'ship_explosion_1.wav', sinking: 'ship_sinking.wav',
  oceanLoop: 'ocean_ambience_loop.wav', sailingLoop: 'ship_sailing_loop.wav',
})

const loopSounds = new Set<GameSound>(['oceanLoop', 'sailingLoop'])

interface GameAudioOptions { muted: boolean; volume: number }

export class GameAudio {
  private readonly prototypes = new Map<GameSound, HTMLAudioElement>()
  private readonly loops = new Map<GameSound, HTMLAudioElement>()
  private readonly lastPlayedAt = new Map<GameSound, number>()
  private readonly options: Readonly<GameAudioOptions>
  private unlocked = false

  public constructor(options: Readonly<GameAudioOptions> = { muted: false, volume: 0.65 }) {
    this.options = options
    for (const [sound, fileName] of Object.entries(soundSources) as [GameSound, string][]) {
      const audio = new Audio(`/assets/sounds/${fileName}`)
      audio.preload = 'auto'
      this.prototypes.set(sound, audio)
    }
  }

  public unlock(): void { this.unlocked = true }

  public play(sound: GameSound): void {
    if (this.options.muted || !this.unlocked || loopSounds.has(sound) || !this.canPlay(sound)) return
    const source = this.prototypes.get(sound)
    if (!source) return
    const instance = source.cloneNode() as HTMLAudioElement
    instance.volume = this.options.volume * (sound === 'explosion' ? 0.45 : 0.35)
    void instance.play().catch(() => undefined)
  }

  public startLoops(): void {
    if (this.options.muted || !this.unlocked) return
    for (const sound of loopSounds) {
      if (this.loops.has(sound)) continue
      const source = this.prototypes.get(sound)
      if (!source) continue
      const loop = source.cloneNode() as HTMLAudioElement
      loop.loop = true
      loop.volume = this.options.volume * (sound === 'oceanLoop' ? 0.12 : 0.08)
      this.loops.set(sound, loop)
      void loop.play().catch(() => undefined)
    }
  }

  public pauseLoops(): void { for (const loop of this.loops.values()) loop.pause() }

  public resumeLoops(): void { if (this.unlocked) for (const loop of this.loops.values()) void loop.play().catch(() => undefined) }

  public destroy(): void {
    for (const loop of this.loops.values()) { loop.pause(); loop.removeAttribute('src'); loop.load() }
    this.loops.clear()
    this.prototypes.clear()
  }

  private canPlay(sound: GameSound): boolean {
    const now = performance.now()
    const last = this.lastPlayedAt.get(sound) ?? -Infinity
    const minimumInterval = sound === 'cannonFire' || sound === 'broadside' ? 100 : 70
    if (now - last < minimumInterval) return false
    this.lastPlayedAt.set(sound, now)
    return true
  }
}
