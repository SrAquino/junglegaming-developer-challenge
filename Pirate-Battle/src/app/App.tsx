import { useMemo, useState } from 'react'
import { createGameConfigSnapshot } from '../game/config/game-config.ts'
import type { MatchResult } from '../game/types/game.ts'
import { GameCanvas } from '../components/game/GameCanvas.tsx'
import { loadGameOptions, loadLastMatchResult, saveGameOptions, saveLastMatchResult } from '../storage/game-storage.ts'
import { MainMenuScreen } from './screens/MainMenuScreen.tsx'
import { MatchResultScreen } from './screens/MatchResultScreen.tsx'
import { OptionsScreen } from './screens/OptionsScreen.tsx'

export default function App() {
  const [options, setOptions] = useState(loadGameOptions)
  const [lastResult, setLastResult] = useState<MatchResult | null>(loadLastMatchResult)
  const [screen, setScreen] = useState<'menu' | 'options' | 'game' | 'result'>(() => loadLastMatchResult() ? 'result' : 'menu')
  const configuration = useMemo(() => createGameConfigSnapshot(options), [options])
  const saveOptions = (next: typeof options) => { saveGameOptions(next); setOptions(next); setScreen('menu') }
  const finish = (result: MatchResult) => { saveLastMatchResult(result); setLastResult(result); setScreen('result') }
  if (screen === 'game') return <GameCanvas configuration={configuration} onExit={() => setScreen('menu')} onFinished={finish} />
  if (screen === 'options') return <OptionsScreen onBack={() => setScreen('menu')} onSave={saveOptions} options={options} />
  if (screen === 'result' && lastResult) return <MatchResultScreen onMenu={() => setScreen('menu')} onPlayAgain={() => setScreen('game')} result={lastResult} />
  return <MainMenuScreen hasLastResult={lastResult !== null} onLastResult={() => setScreen('result')} onOptions={() => setScreen('options')} onPlay={() => setScreen('game')} />
}
