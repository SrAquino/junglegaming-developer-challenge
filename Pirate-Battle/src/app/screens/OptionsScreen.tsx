import { useState } from 'react'
import type { GameOptions } from '../../game/config/game-config.ts'
import { enemySpawnIntervalLimits, sessionDurationLimits } from '../../game/config/game-config.ts'

interface OptionsScreenProps { options: GameOptions; onSave: (options: GameOptions) => void; onBack: () => void }

export function OptionsScreen({ options, onSave, onBack }: OptionsScreenProps) {
  const [duration, setDuration] = useState(String(options.sessionDurationSeconds))
  const [spawn, setSpawn] = useState(String(options.enemySpawnIntervalSeconds))
  const [error, setError] = useState('')
  const save = () => {
    const next = { sessionDurationSeconds: Number(duration), enemySpawnIntervalSeconds: Number(spawn) }
    if (!Number.isInteger(next.sessionDurationSeconds) || next.sessionDurationSeconds < sessionDurationLimits.min || next.sessionDurationSeconds > sessionDurationLimits.max || !Number.isInteger(next.enemySpawnIntervalSeconds) || next.enemySpawnIntervalSeconds < enemySpawnIntervalLimits.min || next.enemySpawnIntervalSeconds > enemySpawnIntervalLimits.max) {
      setError(`Session time must be ${sessionDurationLimits.min}–${sessionDurationLimits.max} seconds and spawn time ${enemySpawnIntervalLimits.min}–${enemySpawnIntervalLimits.max} seconds.`)
      return
    }
    onSave(next)
  }
  return <main className="application-shell"><section aria-labelledby="options-title" className="panel"><h1 id="options-title">Options</h1><p>Changes apply to your next match.</p><label>Game session time (seconds)<input aria-label="Game session time" inputMode="numeric" onChange={(event) => setDuration(event.target.value)} value={duration} /></label><label>Enemy spawn time (seconds)<input aria-label="Enemy spawn time" inputMode="numeric" onChange={(event) => setSpawn(event.target.value)} value={spawn} /></label>{error && <p role="alert">{error}</p>}<div className="menu-actions"><button onClick={save} type="button">Save options</button><button onClick={onBack} type="button">Back to menu</button></div></section></main>
}
