import { useState } from 'react'
import { GameCanvas } from '../../components/game/GameCanvas.tsx'
import { PrimaryButton } from '../../components/ui/PrimaryButton.tsx'

export function MainMenuScreen() {
  const [showGame, setShowGame] = useState(false)

  if (showGame) {
    return <GameCanvas onExit={() => setShowGame(false)} />
  }

  return (
    <main className="application-shell">
      <section aria-labelledby="game-title" className="main-menu">
        <p className="eyebrow">Jungle Gaming Challenge</p>
        <h1 id="game-title">Pirate Battle</h1>
        <p>Set sail, defeat enemy ships and claim the highest score.</p>
        <PrimaryButton onClick={() => setShowGame(true)}>Play</PrimaryButton>
      </section>
    </main>
  )
}
