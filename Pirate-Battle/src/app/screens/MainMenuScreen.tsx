import { PrimaryButton } from '../../components/ui/PrimaryButton.tsx'

export function MainMenuScreen() {
  return (
    <main className="application-shell">
      <section aria-labelledby="game-title" className="main-menu">
        <p className="eyebrow">Jungle Gaming Challenge</p>
        <h1 id="game-title">Pirate Battle</h1>
        <p>Set sail, defeat enemy ships and claim the highest score.</p>
        <PrimaryButton disabled>Play</PrimaryButton>
      </section>
    </main>
  )
}
