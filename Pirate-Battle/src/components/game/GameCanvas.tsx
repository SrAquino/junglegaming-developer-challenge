import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import type { GameConfigSnapshot } from '../../game/config/game-config.ts'
import { BrowserGameInput } from '../../game/input/browser-game-input.ts'
import type { InputAction } from '../../game/input/browser-game-input.ts'
import { FirstPlayableScene } from '../../game/rendering/first-playable-scene.ts'
import type { HudSnapshot, MatchResult } from '../../game/types/game.ts'
import type { AudioSettings } from '../../storage/audio-settings.ts'
import type { GameOptions } from '../../game/config/game-config.ts'
import { enemySpawnIntervalLimits, sessionDurationLimits } from '../../game/config/game-config.ts'

type LoadState = 'loading' | 'ready' | 'error'

interface GameCanvasProps {
  configuration: GameConfigSnapshot
  audioSettings: AudioSettings
  gameOptions: GameOptions
  onExit: () => void
  onFinished: (result: MatchResult) => void
  onSaveOptions: (options: GameOptions, audioSettings: AudioSettings) => void
}

const initialHud: HudSnapshot = { status: 'playing', score: 0, remainingSeconds: 0, playerHealth: 0, playerMaxHealth: 0 }

export function GameCanvas({ audioSettings, configuration, gameOptions, onExit, onFinished, onSaveOptions }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<BrowserGameInput | null>(null)
  const sceneRef = useRef<FirstPlayableScene | null>(null)
  const pauseButtonRef = useRef<HTMLButtonElement>(null)
  const resumeButtonRef = useRef<HTMLButtonElement>(null)
  const pauseDialogRef = useRef<HTMLDivElement>(null)
  const configurationRef = useRef(configuration)
  const audioSettingsRef = useRef(audioSettings)
  const onFinishedRef = useRef(onFinished)
  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [hud, setHud] = useState<HudSnapshot>(initialHud)
  const [pauseOptionsOpen, setPauseOptionsOpen] = useState(false)
  const paused = hud.status === 'paused'

  useEffect(() => { onFinishedRef.current = onFinished }, [onFinished])

  useEffect(() => {
    if (paused && !pauseOptionsOpen) resumeButtonRef.current?.focus()
  }, [paused, pauseOptionsOpen])

  useEffect(() => {
    if (!paused) return
    const dialog = pauseDialogRef.current
    if (!dialog) return
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (!last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    dialog.addEventListener('keydown', trapFocus)
    return () => dialog.removeEventListener('keydown', trapFocus)
  }, [paused, pauseOptionsOpen])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const input = new BrowserGameInput()
    inputRef.current = input
    let cancelled = false
    const scene = new FirstPlayableScene(input, {
      audioSettings: audioSettingsRef.current,
      configuration: configurationRef.current,
      onHud: (snapshot) => { if (!cancelled) setHud(snapshot) },
      onFinished: (result) => { if (!cancelled) onFinishedRef.current(result) },
    })
    sceneRef.current = scene
    const pauseOnHidden = () => { if (document.hidden) { input.reset(); scene.pause() } }
    const pauseOnBlur = () => { input.reset(); scene.pause() }
    const resetInput = () => input.reset()
    document.addEventListener('visibilitychange', pauseOnHidden)
    window.addEventListener('blur', pauseOnBlur)
    window.addEventListener('resize', resetInput)
    setLoadState('loading')
    void scene.mount(host).then(
      () => { if (!cancelled) setLoadState('ready') },
      () => { if (!cancelled) setLoadState('error') },
    )
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', pauseOnHidden)
      window.removeEventListener('blur', pauseOnBlur)
      window.removeEventListener('resize', resetInput)
      scene.destroy()
      input.destroy()
      sceneRef.current = null
      inputRef.current = null
    }
  }, [attempt])

  const resume = () => {
    sceneRef.current?.resume()
    setPauseOptionsOpen(false)
    window.requestAnimationFrame(() => pauseButtonRef.current?.focus())
  }
  const pause = () => { inputRef.current?.reset(); sceneRef.current?.pause() }
  const exit = () => { inputRef.current?.reset(); onExit() }
  const controlsActive = loadState === 'ready' && !paused
  return (
    <main className="game-screen">
      <div className="game-canvas-shell">
        <div aria-busy={loadState === 'loading'} aria-label="Pirate Battle arena" className="game-canvas" ref={hostRef} role="img" />
        <header aria-label="Match status" className="arena-hud">
          <HudHealth health={hud.playerHealth} maxHealth={hud.playerMaxHealth} />
          <div className="arena-hud-counters">
            <HudCounter icon="icon_score.png" label={`Score: ${hud.score}`} />
            <HudCounter icon="icon_time.png" label={`Time: ${formatDuration(hud.remainingSeconds)}`} />
            {!paused && <button aria-label="Pause match" className="arena-pause-control" disabled={loadState !== 'ready'} onClick={pause} onContextMenu={(event) => event.preventDefault()} ref={pauseButtonRef} type="button"><img alt="" draggable="false" src="/assets/png/default/ui/controls/icon_pause.png" /></button>}
          </div>
        </header>
        {controlsActive && <>
          <div aria-label="Touch navigation controls" className="arena-control-cluster arena-navigation-controls" role="group"><TouchControl action="forward" inputRef={inputRef} label="Sail forward" /><TouchControl action="turnLeft" inputRef={inputRef} label="Turn left" /><TouchControl action="turnRight" inputRef={inputRef} label="Turn right" /></div>
          <div aria-label="Touch firing controls" className="arena-control-cluster arena-firing-controls" role="group"><TouchControl action="fireFront" inputRef={inputRef} label="Fire front" /><TouchControl action="fireLeft" inputRef={inputRef} label="Fire left broadside" /><TouchControl action="fireRight" inputRef={inputRef} label="Fire right broadside" /></div>
        </>}
        {loadState === 'loading' && <p className="game-status">Loading game assets…</p>}
        {loadState === 'error' && <div className="game-status" role="alert"><p>Unable to load game assets.</p><button onClick={() => setAttempt((value) => value + 1)} type="button">Retry</button></div>}
        {paused && <div className="game-status pause-dialog" ref={pauseDialogRef} role="dialog" aria-label={pauseOptionsOpen ? 'Match options' : 'Match paused'} aria-modal="true">{pauseOptionsOpen ? <PausedOptions audioSettings={audioSettings} gameOptions={gameOptions} onBack={() => setPauseOptionsOpen(false)} onSave={onSaveOptions} /> : <><p className="eyebrow">The sea awaits</p><h2>Match paused</h2><button onClick={resume} ref={resumeButtonRef} type="button">Resume match</button><button onClick={() => setPauseOptionsOpen(true)} type="button">Options</button><button onClick={exit} type="button">Main menu</button></>}</div>}
      </div>
      <p className="sr-only">Keyboard: W or Up sails, A and D turn, F fires ahead, Q and E fire broadsides.</p>
    </main>
  )
}

function HudHealth({ health, maxHealth }: { health: number; maxHealth: number }) {
  const ratio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0
  return <span aria-label={`Hull: ${health}/${maxHealth}`} className="arena-hud-health" style={{ '--health-ratio': ratio } as CSSProperties}><span className="arena-hud-health-fill" /><img alt="" src="/assets/png/default/ui/hud/icon_heart.png" /><span>Hull: {health}/{maxHealth}</span></span>
}

function HudCounter({ icon, label }: { icon: string; label: string }) {
  return <span className="arena-hud-counter"><img alt="" src={`/assets/png/default/ui/hud/${icon}`} /><span>{label}</span></span>
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

interface PausedOptionsProps { gameOptions: GameOptions; audioSettings: AudioSettings; onSave: (options: GameOptions, audioSettings: AudioSettings) => void; onBack: () => void }

function PausedOptions({ gameOptions, audioSettings, onSave, onBack }: PausedOptionsProps) {
  const [duration, setDuration] = useState(String(gameOptions.sessionDurationSeconds))
  const [spawn, setSpawn] = useState(String(gameOptions.enemySpawnIntervalSeconds))
  const [muted, setMuted] = useState(audioSettings.muted)
  const [volume, setVolume] = useState(audioSettings.volume)
  const [error, setError] = useState('')
  const save = () => {
    const next = { sessionDurationSeconds: Number(duration), enemySpawnIntervalSeconds: Number(spawn) }
    if (!Number.isInteger(next.sessionDurationSeconds) || next.sessionDurationSeconds < sessionDurationLimits.min || next.sessionDurationSeconds > sessionDurationLimits.max || !Number.isInteger(next.enemySpawnIntervalSeconds) || next.enemySpawnIntervalSeconds < enemySpawnIntervalLimits.min || next.enemySpawnIntervalSeconds > enemySpawnIntervalLimits.max) { setError('Enter a valid session and spawn time.'); return }
    onSave(next, { muted, volume })
    onBack()
  }
  return <div className="paused-options"><p className="eyebrow">Applies to the next match</p><h2>Options</h2><label>Game session time<input aria-label="Paused game session time" inputMode="numeric" onChange={(event) => setDuration(event.target.value)} value={duration} /></label><label>Enemy spawn time<input aria-label="Paused enemy spawn time" inputMode="numeric" onChange={(event) => setSpawn(event.target.value)} value={spawn} /></label><label><input checked={muted} onChange={(event) => setMuted(event.target.checked)} type="checkbox" /> Mute sound</label><label>Volume<input aria-label="Paused sound volume" disabled={muted} max="1" min="0" onChange={(event) => setVolume(Number(event.target.value))} step="0.05" type="range" value={volume} /></label>{error && <p role="alert">{error}</p>}<div className="menu-actions"><button autoFocus onClick={save} type="button">Save options</button><button onClick={onBack} type="button">Back to pause</button></div></div>
}

interface TouchControlProps { action: InputAction; inputRef: RefObject<BrowserGameInput | null>; label: string }

const controlIcons: Readonly<Record<InputAction, string>> = Object.freeze({ turnLeft: 'icon_turn_left.png', forward: 'icon_forward.png', turnRight: 'icon_turn_right.png', fireLeft: 'icon_fire_left.png', fireFront: 'icon_fire_front.png', fireRight: 'icon_fire_right.png' })

function TouchControl({ action, inputRef, label }: TouchControlProps) {
  const pointerIdRef = useRef<number | null>(null)
  const release = (pointerId: number) => {
    if (pointerIdRef.current !== pointerId) return
    inputRef.current?.setTouchAction(action, false, pointerId)
    pointerIdRef.current = null
  }
  return <button aria-label={label} className="touch-control" onContextMenu={(event) => event.preventDefault()} onLostPointerCapture={(event) => release(event.pointerId)} onPointerCancel={(event) => release(event.pointerId)} onPointerDown={(event) => {
    if (pointerIdRef.current !== null) return
    pointerIdRef.current = event.pointerId
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* synthetic pointer events do not have native capture */ }
    inputRef.current?.setTouchAction(action, true, event.pointerId)
  }} onPointerUp={(event) => release(event.pointerId)} type="button"><img alt="" draggable="false" src={`/assets/png/default/ui/controls/${controlIcons[action]}`} /></button>
}
