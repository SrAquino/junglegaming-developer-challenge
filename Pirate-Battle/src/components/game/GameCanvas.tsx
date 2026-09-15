import { useEffect, useRef, useState } from 'react'
import { FirstPlayableScene } from '../../game/rendering/first-playable-scene.ts'

type LoadState = 'loading' | 'ready' | 'error'

interface GameCanvasProps {
  onExit: () => void
}

export function GameCanvas({ onExit }: GameCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    const scene = new FirstPlayableScene()
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
      <button className="exit-button" onClick={onExit} type="button">
        Back to menu
      </button>
    </main>
  )
}
