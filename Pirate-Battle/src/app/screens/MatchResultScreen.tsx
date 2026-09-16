import type { MatchResult } from '../../game/types/game.ts'

interface MatchResultScreenProps { result: MatchResult; onPlayAgain: () => void; onMenu: () => void }

export function MatchResultScreen({ result, onPlayAgain, onMenu }: MatchResultScreenProps) {
  const reason = result.endReason === 'time-expired' ? 'Time expired' : 'Ship destroyed'
  return <main className="application-shell"><section aria-labelledby="result-title" className="panel"><p className="eyebrow">Match complete</p><h1 id="result-title">Battle report</h1><p>Score: {result.score}</p><p>Active duration: {(result.activeDurationMs / 1_000).toFixed(1)} seconds</p><p>End reason: {reason}</p><p>Submission status: Ready to submit when online services are enabled.</p><div className="menu-actions"><button onClick={onPlayAgain} type="button">Play again</button><button onClick={onMenu} type="button">Main menu</button></div></section></main>
}
