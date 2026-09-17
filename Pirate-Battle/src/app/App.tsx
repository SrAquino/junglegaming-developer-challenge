import { useEffect, useMemo, useRef, useState } from 'react'
import { createGameConfigSnapshot, defaultGameConfig } from '../game/config/game-config.ts'
import type { MatchResult } from '../game/types/game.ts'
import { GameCanvas } from '../components/game/GameCanvas.tsx'
import { loadGameOptions, loadLastMatchResult, saveGameOptions, saveLastMatchResult } from '../storage/game-storage.ts'
import { MainMenuScreen } from './screens/MainMenuScreen.tsx'
import { MatchResultScreen } from './screens/MatchResultScreen.tsx'
import { OptionsScreen } from './screens/OptionsScreen.tsx'
import { gameplayConfigurationKey } from '../api/gameplay-configuration-key.ts'
import { getLocalPlayerIdentity } from '../storage/player-identity.ts'
import { useMatchSubmission } from '../hooks/use-match-submission.ts'
import { loadAudioSettings, saveAudioSettings } from '../storage/audio-settings.ts'
import { GameAudio, type GameSound } from '../game/audio/game-audio.ts'
import { SeededRandom } from '../game/core/random-source.ts'

export default function App() {
  const [options, setOptions] = useState(loadGameOptions)
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings)
  const [audio] = useState(() => new GameAudio(audioSettings))
  const [simulationRandom] = useState(() => {
    const seed = Number(new URLSearchParams(window.location.search).get('simulation-seed'))
    return Number.isInteger(seed) ? new SeededRandom(seed) : undefined
  })
  const audioDestroyTimer = useRef<number | null>(null)
  const [lastResult, setLastResult] = useState<MatchResult | null>(loadLastMatchResult)
  const [screen, setScreen] = useState<'menu' | 'options' | 'game' | 'result'>(() => loadLastMatchResult() ? 'result' : 'menu')
  const performanceProfile = new URLSearchParams(window.location.search).get('performance-profile') === '1'
  const configuration = useMemo(() => createGameConfigSnapshot(options, performanceProfile ? { ...defaultGameConfig, player: { ...defaultGameConfig.player, maxHealth: 100_000 } } : defaultGameConfig), [options, performanceProfile])
  const player = getLocalPlayerIdentity()
  const submission = useMatchSubmission()
  useEffect(() => {
    if (audioDestroyTimer.current !== null) window.clearTimeout(audioDestroyTimer.current)
    const click = (event: MouseEvent) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (!(button instanceof HTMLButtonElement) || button.disabled || button.classList.contains('touch-control')) return
      const cue = uiCueForButton(button)
      if (cue) audio.unlock(cue)
      else audio.unlock()
    }
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const button = event.target instanceof Element ? event.target.closest('button') : null
      if (!(button instanceof HTMLButtonElement) || button.disabled || button.contains(event.relatedTarget as Node | null)) return
      audio.play('uiHover')
    }
    document.addEventListener('click', click)
    document.addEventListener('pointerover', hover)
    return () => {
      document.removeEventListener('click', click)
      document.removeEventListener('pointerover', hover)
      audioDestroyTimer.current = window.setTimeout(() => audio.destroy(), 0)
    }
  }, [audio])
  useEffect(() => {
    if (screen === 'result' && lastResult) audio.play(lastResult.endReason === 'time-expired' ? 'gameComplete' : 'gameOver')
  }, [audio, lastResult, screen])
  const applyOptions = (next: typeof options, nextAudioSettings: typeof audioSettings) => { saveGameOptions(next); saveAudioSettings(nextAudioSettings); setOptions(next); setAudioSettings(nextAudioSettings); audio.setOptions(nextAudioSettings) }
  const saveOptions = (next: typeof options, nextAudioSettings: typeof audioSettings) => { applyOptions(next, nextAudioSettings); setScreen('menu') }
  const finish = (result: MatchResult) => { saveLastMatchResult(result); setLastResult(result); submission.submit(result); setScreen('result') }
  if (screen === 'game') return <GameCanvas audio={audio} audioSettings={audioSettings} configuration={configuration} gameOptions={options} onExit={() => setScreen('menu')} onFinished={finish} onSaveOptions={applyOptions} random={simulationRandom} />
  if (screen === 'options') return <OptionsScreen audioSettings={audioSettings} onBack={() => setScreen('menu')} onSave={saveOptions} options={options} />
  if (screen === 'result' && lastResult) return <MatchResultScreen onMenu={() => setScreen('menu')} onPlayAgain={() => setScreen('game')} onRetrySubmission={submission.retryPending} result={lastResult} submissionStatus={submission.status} />
  return <MainMenuScreen configurationKey={gameplayConfigurationKey(configuration)} hasLastResult={lastResult !== null} onLastResult={() => setScreen('result')} onOptions={() => setScreen('options')} onPlay={() => setScreen('game')} options={options} playerId={player.id} />
}

function uiCueForButton(button: HTMLButtonElement): GameSound | null {
  const label = `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`.toLowerCase()
  if (label.includes('pause match') || label.includes('resume match')) return null
  if (label.includes('back') || label.includes('main menu')) return 'uiBack'
  if (label.includes('save')) return 'uiClose'
  if (label.includes('options')) return 'uiOpen'
  return 'uiClick'
}
