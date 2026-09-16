import { useState } from 'react'
import type { GameOptions } from '../../game/config/game-config.ts'
import { enemySpawnIntervalLimits, sessionDurationLimits } from '../../game/config/game-config.ts'
import type { AudioSettings } from '../../storage/audio-settings.ts'

interface OptionsScreenProps { options: GameOptions; audioSettings: AudioSettings; onSave: (options: GameOptions, audioSettings: AudioSettings) => void; onBack: () => void }

export function OptionsScreen({ options, audioSettings, onSave, onBack }: OptionsScreenProps) {
  const [duration, setDuration] = useState(String(options.sessionDurationSeconds))
  const [spawn, setSpawn] = useState(String(options.enemySpawnIntervalSeconds))
  const [error, setError] = useState('')
  const [muted, setMuted] = useState(audioSettings.muted)
  const [volume, setVolume] = useState(audioSettings.volume)
  const save = () => {
    const next = { sessionDurationSeconds: Number(duration), enemySpawnIntervalSeconds: Number(spawn) }
    if (!Number.isInteger(next.sessionDurationSeconds) || next.sessionDurationSeconds < sessionDurationLimits.min || next.sessionDurationSeconds > sessionDurationLimits.max || !Number.isInteger(next.enemySpawnIntervalSeconds) || next.enemySpawnIntervalSeconds < enemySpawnIntervalLimits.min || next.enemySpawnIntervalSeconds > enemySpawnIntervalLimits.max) {
      setError(`Session time must be ${sessionDurationLimits.min}–${sessionDurationLimits.max} seconds and spawn time ${enemySpawnIntervalLimits.min}–${enemySpawnIntervalLimits.max} seconds.`)
      return
    }
    onSave(next, { muted, volume })
  }
  return <main className="application-shell"><section aria-labelledby="options-title" className="panel options-panel"><p className="eyebrow">Prepare for battle</p><h1 id="options-title">Options</h1><p>Changes apply to your next match.</p><OptionStepper label="Game session time" value={duration} min={sessionDurationLimits.min} max={sessionDurationLimits.max} onChange={setDuration} /><OptionStepper label="Enemy spawn time" value={spawn} min={enemySpawnIntervalLimits.min} max={enemySpawnIntervalLimits.max} onChange={setSpawn} /><fieldset className="audio-options"><legend>Sound</legend><label><input checked={muted} onChange={(event) => setMuted(event.target.checked)} type="checkbox" /> Mute sound</label><label>Volume <input aria-label="Sound volume" disabled={muted} max="1" min="0" onChange={(event) => setVolume(Number(event.target.value))} step="0.05" type="range" value={volume} /></label></fieldset>{error && <p role="alert">{error}</p>}<div className="menu-actions"><button onClick={save} type="button">Save options</button><button onClick={onBack} type="button">Back to menu</button></div></section></main>
}

interface OptionStepperProps { label: string; value: string; min: number; max: number; onChange: (value: string) => void }

function OptionStepper({ label, value, min, max, onChange }: OptionStepperProps) {
  const numericValue = Number(value)
  const adjust = (amount: number) => onChange(String(Math.min(max, Math.max(min, (Number.isFinite(numericValue) ? numericValue : min) + amount))))
  return <div className="option-stepper"><label>{label}<span className="sr-only"> in seconds</span></label><div className="option-stepper-controls"><button aria-label="Decrease setting" disabled={numericValue <= min} onClick={() => adjust(-1)} type="button"><img alt="" src="/assets/png/default/ui/controls/icon_minus.png" /></button><input aria-label={label} inputMode="numeric" min={min} max={max} onChange={(event) => onChange(event.target.value)} value={value} /><span aria-hidden="true">s</span><button aria-label="Increase setting" disabled={numericValue >= max} onClick={() => adjust(1)} type="button"><img alt="" src="/assets/png/default/ui/controls/icon_plus.png" /></button></div></div>
}
