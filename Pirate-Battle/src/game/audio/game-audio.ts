import type { GameEvent } from '../types/game-event.ts'

export type GameSound =
  | 'gameStart' | 'gamePause' | 'gameResume' | 'gameComplete' | 'gameOver'
  | 'cannonFire' | 'broadside' | 'waterHit' | 'woodHit' | 'explosion' | 'sinking'
  | 'score' | 'healthLow' | 'timeWarning' | 'shipCollision'
  | 'uiHover' | 'uiClick' | 'uiOpen' | 'uiClose' | 'uiBack'
  | 'oceanLoop' | 'sailingLoop'

interface SoundDefinition {
  files: readonly string[]
  gain: number
  cooldownMs?: number
  loop?: boolean
}

export const soundDefinitions: Readonly<Record<GameSound, SoundDefinition>> = Object.freeze({
  gameStart: { files: ['game_start.wav'], gain: 0.5 },
  gamePause: { files: ['game_pause.wav'], gain: 0.45 },
  gameResume: { files: ['game_resume.wav'], gain: 0.45 },
  gameComplete: { files: ['game_complete.wav'], gain: 0.55 },
  gameOver: { files: ['game_over.wav'], gain: 0.55 },
  cannonFire: { files: ['cannon_fire_1.wav', 'cannon_fire_2.wav', 'cannon_fire_3.wav'], gain: 0.35, cooldownMs: 90 },
  broadside: { files: ['cannon_broadside.wav'], gain: 0.38, cooldownMs: 120 },
  waterHit: { files: ['cannonball_water_hit_1.wav', 'cannonball_water_hit_2.wav'], gain: 0.3, cooldownMs: 60 },
  woodHit: { files: ['ship_wood_hit_1.wav', 'ship_wood_hit_2.wav'], gain: 0.38, cooldownMs: 60 },
  explosion: { files: ['ship_explosion_1.wav', 'ship_explosion_2.wav'], gain: 0.48, cooldownMs: 90 },
  sinking: { files: ['ship_sinking.wav'], gain: 0.48, cooldownMs: 180 },
  score: { files: ['score_point.wav'], gain: 0.42 },
  healthLow: { files: ['health_low.wav'], gain: 0.42, cooldownMs: 5_000 },
  timeWarning: { files: ['time_warning.wav'], gain: 0.42, cooldownMs: 5_000 },
  shipCollision: { files: ['ship_collision.wav'], gain: 0.4, cooldownMs: 450 },
  uiHover: { files: ['ui_hover.wav'], gain: 0.22, cooldownMs: 80 },
  uiClick: { files: ['ui_click.wav'], gain: 0.32, cooldownMs: 50 },
  uiOpen: { files: ['ui_open.wav'], gain: 0.32, cooldownMs: 80 },
  uiClose: { files: ['ui_close.wav'], gain: 0.32, cooldownMs: 80 },
  uiBack: { files: ['ui_back.wav'], gain: 0.32, cooldownMs: 80 },
  oceanLoop: { files: ['ocean_ambience_loop.wav'], gain: 0.12, loop: true },
  sailingLoop: { files: ['ship_sailing_loop.wav'], gain: 0.1, loop: true },
})

interface GameAudioOptions { muted: boolean; volume: number }
export interface AudioDiagnostics { unlocked: boolean; activeVoices: number; activeLoops: number; failedPlays: number }

const MAX_ONE_SHOT_VOICES = 12

export function soundsForGameEvent(event: Readonly<GameEvent>): readonly GameSound[] {
  if (event.type === 'weapon-fired') return [event.weapon === 'broadside' ? 'broadside' : 'cannonFire']
  if (event.type === 'projectile-impact') return [event.material === 'wood' ? 'woodHit' : 'waterHit']
  if (event.type === 'score-changed') return ['score']
  if (event.type === 'ship-collision') return ['shipCollision']
  if (event.type === 'ship-destroyed') return ['explosion', 'sinking']
  if (event.type === 'ship-damaged' && event.target === 'player'
    && event.previousHealth / event.maxHealth > 0.3 && event.health / event.maxHealth <= 0.3) return ['healthLow']
  return []
}

export class GameAudio {
  private readonly prototypes = new Map<string, HTMLAudioElement>()
  private readonly loops = new Map<GameSound, HTMLAudioElement>()
  private readonly voices = new Set<HTMLAudioElement>()
  private readonly lastPlayedAt = new Map<GameSound, number>()
  private readonly variantIndexes = new Map<GameSound, number>()
  private options: Readonly<GameAudioOptions>
  private unlocked = false
  private sessionActive = false
  private suspended = false
  private sailing = false
  private failedPlays = 0

  public constructor(options: Readonly<GameAudioOptions> = { muted: false, volume: 0.65 }) {
    this.options = options
    const files = new Set(Object.values(soundDefinitions).flatMap((definition) => definition.files))
    for (const fileName of files) {
      const audio = new Audio(`/assets/sounds/${fileName}`)
      audio.preload = 'auto'
      this.prototypes.set(fileName, audio)
    }
  }

  public setOptions(options: Readonly<GameAudioOptions>): void {
    this.options = options
    if (options.muted) this.stopAll()
    else this.applyLoopVolumes()
  }

  public unlock(initialSound?: GameSound): void {
    this.unlocked = true
    if (initialSound) this.play(initialSound)
    if (this.sessionActive && !this.suspended) this.ensureDesiredLoops()
  }

  public play(sound: GameSound): void {
    const definition = soundDefinitions[sound]
    if (definition.loop || this.options.muted || !this.unlocked || (this.suspended && !isLifecycleCue(sound)) || !this.canPlay(sound)) return
    this.playOneShot(sound, definition)
  }

  public startSession(): void {
    this.sessionActive = true
    this.suspended = false
    this.sailing = false
    this.play('gameStart')
    this.ensureDesiredLoops()
  }

  public pauseSession(audible = true): void {
    if (!this.sessionActive || this.suspended) return
    this.stopVoices()
    this.pauseLoops()
    this.suspended = true
    if (audible) this.play('gamePause')
  }

  public resumeSession(): void {
    if (!this.sessionActive || !this.suspended) return
    this.suspended = false
    this.play('gameResume')
    this.ensureDesiredLoops()
  }

  public setSailing(active: boolean): void {
    if (this.sailing === active) return
    this.sailing = active
    if (!this.sessionActive || this.suspended) return
    if (active) this.ensureLoop('sailingLoop')
    else this.stopLoop('sailingLoop')
  }

  public endSession(): void {
    this.sessionActive = false
    this.suspended = false
    this.sailing = false
    this.stopAll()
  }

  public getDiagnostics(): Readonly<AudioDiagnostics> {
    return Object.freeze({
      unlocked: this.unlocked,
      activeVoices: this.voices.size,
      activeLoops: this.loops.size,
      failedPlays: this.failedPlays,
    })
  }

  public destroy(): void {
    this.endSession()
    for (const prototype of this.prototypes.values()) releaseAudio(prototype)
    this.prototypes.clear()
    this.unlocked = false
  }

  private playOneShot(sound: GameSound, definition: SoundDefinition): void {
    while (this.voices.size >= MAX_ONE_SHOT_VOICES) {
      const oldest = this.voices.values().next().value
      if (!oldest) break
      this.releaseVoice(oldest)
    }
    const source = this.nextSource(sound, definition)
    if (!source) return
    const voice = source.cloneNode(true) as HTMLAudioElement
    voice.volume = clampVolume(this.options.volume * definition.gain)
    const cleanup = () => this.releaseVoice(voice)
    voice.addEventListener('ended', cleanup, { once: true })
    voice.addEventListener('error', cleanup, { once: true })
    this.voices.add(voice)
    void voice.play().catch(() => { this.failedPlays += 1; cleanup() })
  }

  private ensureDesiredLoops(): void {
    if (!this.sessionActive || this.suspended || this.options.muted || !this.unlocked) return
    this.ensureLoop('oceanLoop')
    if (this.sailing) this.ensureLoop('sailingLoop')
  }

  private ensureLoop(sound: 'oceanLoop' | 'sailingLoop'): void {
    const existing = this.loops.get(sound)
    if (existing) {
      existing.volume = clampVolume(this.options.volume * soundDefinitions[sound].gain)
      void existing.play().catch(() => { this.failedPlays += 1; this.stopLoop(sound) })
      return
    }
    const source = this.prototypes.get(soundDefinitions[sound].files[0])
    if (!source) return
    const loop = source.cloneNode(true) as HTMLAudioElement
    loop.loop = true
    loop.volume = clampVolume(this.options.volume * soundDefinitions[sound].gain)
    loop.addEventListener('error', () => this.stopLoop(sound), { once: true })
    this.loops.set(sound, loop)
    void loop.play().catch(() => { this.failedPlays += 1; this.stopLoop(sound) })
  }

  private stopLoop(sound: GameSound): void {
    const loop = this.loops.get(sound)
    if (!loop) return
    releaseAudio(loop)
    this.loops.delete(sound)
  }

  private pauseLoops(): void {
    for (const loop of this.loops.values()) loop.pause()
  }

  private applyLoopVolumes(): void {
    for (const [sound, loop] of this.loops) loop.volume = clampVolume(this.options.volume * soundDefinitions[sound].gain)
  }

  private stopVoices(): void {
    for (const voice of [...this.voices]) this.releaseVoice(voice)
  }

  private stopAll(): void {
    this.stopVoices()
    for (const sound of [...this.loops.keys()]) this.stopLoop(sound)
  }

  private releaseVoice(voice: HTMLAudioElement): void {
    if (!this.voices.delete(voice)) return
    releaseAudio(voice)
  }

  private nextSource(sound: GameSound, definition: SoundDefinition): HTMLAudioElement | undefined {
    const index = this.variantIndexes.get(sound) ?? 0
    this.variantIndexes.set(sound, (index + 1) % definition.files.length)
    return this.prototypes.get(definition.files[index % definition.files.length])
  }

  private canPlay(sound: GameSound): boolean {
    const now = performance.now()
    const last = this.lastPlayedAt.get(sound) ?? -Infinity
    if (now - last < (soundDefinitions[sound].cooldownMs ?? 0)) return false
    this.lastPlayedAt.set(sound, now)
    return true
  }
}

function isLifecycleCue(sound: GameSound): boolean {
  return sound === 'gamePause' || sound === 'gameResume' || sound === 'gameComplete' || sound === 'gameOver'
}

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function releaseAudio(audio: HTMLAudioElement): void {
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
}
