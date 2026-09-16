import { PrimaryButton } from '../../components/ui/PrimaryButton.tsx'

interface MainMenuScreenProps { onPlay: () => void; onOptions: () => void; onLastResult: () => void; hasLastResult: boolean }

export function MainMenuScreen({ onPlay, onOptions, onLastResult, hasLastResult }: MainMenuScreenProps) {
  return (
    <main className="application-shell">
      <section aria-labelledby="game-title" className="main-menu">
        <p className="eyebrow">Jungle Gaming Challenge</p>
        <h1 id="game-title">Pirate Battle</h1>
        <p>Set sail, defeat enemy ships and claim the highest score.</p>
        <div className="menu-actions"><PrimaryButton onClick={onPlay}>Play</PrimaryButton><button onClick={onOptions} type="button">Options</button>{hasLastResult && <button onClick={onLastResult} type="button">Last match result</button>}</div>
      </section>
    </main>
  )
}
