import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { BrowserGameInput } from '../../game/input/browser-game-input.ts'
import type { InputAction } from '../../game/input/browser-game-input.ts'
import { FirstPlayableScene } from '../../game/rendering/first-playable-scene.ts'

type LoadState = 'loading' | 'ready' | 'error'

interface GameCanvasProps {
  onExit: () => void
}

export function GameCanvas({ onExit }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<BrowserGameInput | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    const input = new BrowserGameInput()
    inputRef.current = input
    const scene = new FirstPlayableScene(input)
    let cancelled = false
    setLoadState('loading')

    void scene.mount(host).then(
      () => {
        if (!cancelled) {
          setLoadState('ready')
        }
      },
      () => {
        if (!cancelled) {
          setLoadState('error')
        }
      },
    )

    return () => {
      cancelled = true
      scene.destroy()
      input.destroy()
      inputRef.current = null
    }
  }, [attempt])

  return (
    <main className="game-screen">
      <div className="game-canvas-shell">
        <div
          aria-busy={loadState === 'loading'}
          aria-label="Pirate Battle arena"
          className="game-canvas"
          ref={hostRef}
          role="img"
        />
        {loadState === 'loading' && <p className="game-status">Loading game assets…</p>}
        {loadState === 'error' && (
          <div className="game-status" role="alert">
            <p>Unable to load game assets.</p>
            <button onClick={() => setAttempt((currentAttempt) => currentAttempt + 1)} type="button">
              Retry
            </button>
          </div>
        )}
      </div>
      <p className="game-instructions">
        Keyboard: W or ↑ to sail, A/D or ←/→ to turn. Mobile: landscape is supported and recommended.
      </p>
      <div aria-label="Touch movement controls" className="touch-controls" role="group">
        <TouchControl action="turnLeft" inputRef={inputRef} label="Turn left" />
        <TouchControl action="forward" inputRef={inputRef} label="Sail forward" />
        <TouchControl action="turnRight" inputRef={inputRef} label="Turn right" />
      </div>
      <button className="exit-button" onClick={onExit} type="button">
        Back to menu
      </button>
    </main>
  )
}

interface TouchControlProps {
  action: InputAction
  inputRef: RefObject<BrowserGameInput | null>
  label: string
}

function TouchControl({ action, inputRef, label }: TouchControlProps) {
  const release = () => inputRef.current?.setTouchAction(action, false)

  return (
    <button
      className="touch-control"
      onPointerCancel={release}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        inputRef.current?.setTouchAction(action, true)
      }}
      onPointerLeave={release}
      onPointerUp={release}
      type="button"
    >
      {label}
    </button>
  )
}
