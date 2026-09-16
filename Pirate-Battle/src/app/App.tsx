import { useMemo, useState } from 'react'
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

export default function App() {
  const [options, setOptions] = useState(loadGameOptions)
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings)
  const [lastResult, setLastResult] = useState<MatchResult | null>(loadLastMatchResult)
  const [screen, setScreen] = useState<'menu' | 'options' | 'game' | 'result'>(() => loadLastMatchResult() ? 'result' : 'menu')
  const performanceProfile = new URLSearchParams(window.location.search).get('performance-profile') === '1'
  const configuration = useMemo(() => createGameConfigSnapshot(options, performanceProfile ? { ...defaultGameConfig, player: { ...defaultGameConfig.player, maxHealth: 100_000 } } : defaultGameConfig), [options, performanceProfile])
  const player = getLocalPlayerIdentity()
  const submission = useMatchSubmission()
  const applyOptions = (next: typeof options, nextAudioSettings: typeof audioSettings) => { saveGameOptions(next); saveAudioSettings(nextAudioSettings); setOptions(next); setAudioSettings(nextAudioSettings) }
  const saveOptions = (next: typeof options, nextAudioSettings: typeof audioSettings) => { applyOptions(next, nextAudioSettings); setScreen('menu') }
  const finish = (result: MatchResult) => { saveLastMatchResult(result); setLastResult(result); submission.submit(result); setScreen('result') }
  if (screen === 'game') return <GameCanvas audioSettings={audioSettings} configuration={configuration} gameOptions={options} onExit={() => setScreen('menu')} onFinished={finish} onSaveOptions={applyOptions} />
  if (screen === 'options') return <OptionsScreen audioSettings={audioSettings} onBack={() => setScreen('menu')} onSave={saveOptions} options={options} />
  if (screen === 'result' && lastResult) return <MatchResultScreen onMenu={() => setScreen('menu')} onPlayAgain={() => setScreen('game')} onRetrySubmission={submission.retryPending} result={lastResult} submissionStatus={submission.status} />
  return <MainMenuScreen configurationKey={gameplayConfigurationKey(configuration)} hasLastResult={lastResult !== null} onLastResult={() => setScreen('result')} onOptions={() => setScreen('options')} onPlay={() => setScreen('game')} options={options} playerId={player.id} />
}
