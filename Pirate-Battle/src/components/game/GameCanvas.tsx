import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { GameConfigSnapshot } from '../../game/config/game-config.ts'
import { BrowserGameInput } from '../../game/input/browser-game-input.ts'
import type { InputAction } from '../../game/input/browser-game-input.ts'
import { FirstPlayableScene } from '../../game/rendering/first-playable-scene.ts'
import type { HudSnapshot, MatchResult } from '../../game/types/game.ts'

type LoadState = 'loading' | 'ready' | 'error'

interface GameCanvasProps {
  configuration: GameConfigSnapshot
  onExit: () => void
  onFinished: (result: MatchResult) => void
}

const initialHud: HudSnapshot = { status: 'playing', score: 0, remainingSeconds: 0, playerHealth: 0, playerMaxHealth: 0 }

export function GameCanvas({ configuration, onExit, onFinished }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<BrowserGameInput | null>(null)
  const sceneRef = useRef<FirstPlayableScene | null>(null)
  const pauseButtonRef = useRef<HTMLButtonElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [hud, setHud] = useState<HudSnapshot>(initialHud)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const input = new BrowserGameInput()
    inputRef.current = input
    let cancelled = false
    const scene = new FirstPlayableScene(input, {
      configuration,
      onHud: (snapshot) => { if (!cancelled) setHud(snapshot) },
      onFinished: (result) => { if (!cancelled) onFinished(result) },
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
  }, [attempt, configuration, onFinished])

  const paused = hud.status === 'paused'
  const resume = () => {
    sceneRef.current?.resume()
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
        {paused && <div className="game-status pause-dialog" role="dialog" aria-label="Match paused" aria-modal="true"><p className="eyebrow">The sea awaits</p><h2>Match paused</h2><button autoFocus onClick={resume} type="button">Resume match</button><button onClick={onExit} type="button">Main menu</button></div>}
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

interface TouchControlProps { action: InputAction; inputRef: RefObject<BrowserGameInput | null>; label: string }

const controlIcons: Readonly<Record<InputAction, string>> = Object.freeze({ turnLeft: 'icon_turn_left.png', forward: 'icon_forward.png', turnRight: 'icon_turn_right.png', fireLeft: 'icon_fire_left.png', fireFront: 'icon_fire_front.png', fireRight: 'icon_fire_right.png' })

function TouchControl({ action, inputRef, label }: TouchControlProps) {
  const release = () => inputRef.current?.setTouchAction(action, false)
  return <button aria-label={label} className="touch-control" onPointerCancel={release} onPointerDown={(event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    inputRef.current?.setTouchAction(action, true)
  }} onPointerLeave={release} onPointerUp={release} type="button"><img alt="" src={`/assets/png/default/ui/controls/${controlIcons[action]}`} /></button>
}
