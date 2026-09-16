import type { MatchResult } from '../../game/types/game.ts'

interface MatchResultScreenProps { result: MatchResult; onPlayAgain: () => void; onMenu: () => void; submissionStatus: string; onRetrySubmission: () => void }

export function MatchResultScreen({ result, onPlayAgain, onMenu, submissionStatus, onRetrySubmission }: MatchResultScreenProps) {
  const reason = result.endReason === 'time-expired' ? 'Time expired' : 'Ship destroyed'
  const durationSeconds = Math.round(result.activeDurationMs / 1_000)
  const duration = `${Math.floor(durationSeconds / 60).toString().padStart(2, '0')}:${(durationSeconds % 60).toString().padStart(2, '0')}`
  return <main className="application-shell"><section aria-labelledby="result-title" className="panel result-panel"><p className="eyebrow">Match complete</p><h1 id="result-title">Battle complete</h1><strong className="result-score">{result.score}</strong><p className="result-summary">Points · {duration} · {reason}</p><dl className="result-details"><div><dt>Active duration</dt><dd>{duration}</dd></div><div><dt>End reason</dt><dd>{reason}</dd></div></dl><p aria-live="polite" className="submission-status">Submission status: {submissionStatus}</p>{submissionStatus === 'failed' && <button onClick={onRetrySubmission} type="button">Retry submission</button>}<div className="menu-actions"><button onClick={onPlayAgain} type="button">Play again</button><button onClick={onMenu} type="button">Main menu</button></div></section></main>
}
