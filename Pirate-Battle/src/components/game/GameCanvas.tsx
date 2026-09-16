import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
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
  const configurationRef = useRef(configuration)
  const audioSettingsRef = useRef(audioSettings)
  const onFinishedRef = useRef(onFinished)
  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [hud, setHud] = useState<HudSnapshot>(initialHud)
  const [pauseOptionsOpen, setPauseOptionsOpen] = useState(false)

  useEffect(() => { onFinishedRef.current = onFinished }, [onFinished])

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
    const pauseOnHidden = () => { if (document.hidden) scene.pause() }
    const pauseOnBlur = () => scene.pause()
    document.addEventListener('visibilitychange', pauseOnHidden)
    window.addEventListener('blur', pauseOnBlur)
    setLoadState('loading')
    void scene.mount(host).then(
      () => { if (!cancelled) setLoadState('ready') },
      () => { if (!cancelled) setLoadState('error') },
    )
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', pauseOnHidden)
      window.removeEventListener('blur', pauseOnBlur)
      scene.destroy()
      input.destroy()
      sceneRef.current = null
      inputRef.current = null
    }
  }, [attempt])

  const paused = hud.status === 'paused'
  const resume = () => {
    sceneRef.current?.resume()
    setPauseOptionsOpen(false)
    window.requestAnimationFrame(() => pauseButtonRef.current?.focus())
  }
  return (
    <main className="game-screen">
      <header aria-label="Match status" className="game-hud">
        <span><img alt="" src="/assets/png/default/ui/hud/icon_score.png" />Score: {hud.score}</span><span><img alt="" src="/assets/png/default/ui/hud/icon_time.png" />Time: {hud.remainingSeconds}s</span><span><img alt="" src="/assets/png/default/ui/hud/icon_heart.png" />Hull: {hud.playerHealth}/{hud.playerMaxHealth}</span>
      </header>
      <div className="game-canvas-shell">
        <div aria-busy={loadState === 'loading'} aria-label="Pirate Battle arena" className="game-canvas" ref={hostRef} role="img" />
        {loadState === 'loading' && <p className="game-status">Loading game assets…</p>}
        {loadState === 'error' && <div className="game-status" role="alert"><p>Unable to load game assets.</p><button onClick={() => setAttempt((value) => value + 1)} type="button">Retry</button></div>}
        {paused && <div className="game-status pause-dialog" role="dialog" aria-label={pauseOptionsOpen ? 'Match options' : 'Match paused'} aria-modal="true">{pauseOptionsOpen ? <PausedOptions audioSettings={audioSettings} gameOptions={gameOptions} onBack={() => setPauseOptionsOpen(false)} onSave={onSaveOptions} /> : <><p className="eyebrow">The sea awaits</p><h2>Match paused</h2><button autoFocus onClick={resume} type="button">Resume match</button><button onClick={() => setPauseOptionsOpen(true)} type="button">Options</button><button onClick={onExit} type="button">Main menu</button></>}</div>}
      </div>
      <p className="game-instructions">Keyboard: W/↑ sails, A/D or ←/→ turns, F fires ahead, Q/E fire broadsides.</p>
      <div aria-label="Touch movement and combat controls" className="touch-controls" role="group">
        <TouchControl action="turnLeft" inputRef={inputRef} label="Turn left" /><TouchControl action="forward" inputRef={inputRef} label="Sail forward" /><TouchControl action="turnRight" inputRef={inputRef} label="Turn right" />
        <TouchControl action="fireLeft" inputRef={inputRef} label="Fire left broadside" /><TouchControl action="fireFront" inputRef={inputRef} label="Fire front" /><TouchControl action="fireRight" inputRef={inputRef} label="Fire right broadside" />
      </div>
      <div className="game-actions">
        {!paused && <button onClick={() => sceneRef.current?.pause()} ref={pauseButtonRef} type="button">Pause match</button>}
        <button onClick={onExit} type="button">Back to menu</button>
      </div>
    </main>
  )
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
  const release = () => inputRef.current?.setTouchAction(action, false)
  return <button aria-label={label} className="touch-control" onPointerCancel={release} onPointerDown={(event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    inputRef.current?.setTouchAction(action, true)
  }} onPointerLeave={release} onPointerUp={release} type="button"><img alt="" src={`/assets/png/default/ui/controls/${controlIcons[action]}`} /></button>
}
