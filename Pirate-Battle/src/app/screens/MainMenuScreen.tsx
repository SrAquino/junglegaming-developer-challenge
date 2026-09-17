import { PrimaryButton } from '../../components/ui/PrimaryButton.tsx'
import { useRef, useState } from 'react'
import { RankingPanel } from '../../features/ranking/RankingPanel.tsx'
import { MatchHistoryPanel } from '../../features/match-history/MatchHistoryPanel.tsx'
import { NetworkScenarioPanel } from '../../features/network-scenarios/NetworkScenarioPanel.tsx'
import type { GameOptions } from '../../game/config/game-config.ts'

interface MainMenuScreenProps { onPlay: () => void; onOptions: () => void; onLastResult: () => void; hasLastResult: boolean; configurationKey: string; playerId: string; options: GameOptions; simulationRate: number }

export function MainMenuScreen({ onPlay, onOptions, onLastResult, hasLastResult, configurationKey, playerId, options, simulationRate }: MainMenuScreenProps) {
  const [tab, setTab] = useState<'ranking' | 'history'>('ranking')
  const rankingTabRef = useRef<HTMLButtonElement>(null)
  const historyTabRef = useRef<HTMLButtonElement>(null)
  const moveTab = (direction: 1 | -1) => {
    const next = tab === 'ranking' ? direction === 1 ? 'history' : 'ranking' : direction === 1 ? 'ranking' : 'history'
    setTab(next)
    window.requestAnimationFrame(() => (next === 'ranking' ? rankingTabRef : historyTabRef).current?.focus())
  }
  return (
    <main className="application-shell">
      <section aria-labelledby="game-title" className="panel main-menu">
        <img alt="" className="game-title-art" src="/assets/png/default/ui/menu/title_pirate_battle.png" />
        <h1 className="sr-only" id="game-title">Pirate Battle</h1>
        <p className="eyebrow">Set sail. Take command.</p>
        <p>Set sail, defeat enemy ships and claim the highest score.</p>
        <div className="menu-ship-preview"><img alt="" src="/assets/png/default/ships/ship_1.png" /><p>W / ↑ to sail · A/D or ←/→ to turn<br />F ahead · Q/E broadside</p></div>
        <div className="menu-actions"><PrimaryButton onClick={onPlay}>Play</PrimaryButton><button onClick={onOptions} type="button">Options</button>{hasLastResult && <button onClick={onLastResult} type="button">Last match result</button>}</div>
        <div aria-label="Game data" className="menu-tabs" role="tablist"><button aria-controls="ranking-panel" aria-selected={tab === 'ranking'} onClick={() => setTab('ranking')} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveTab(event.key === 'ArrowRight' ? 1 : -1) } }} ref={rankingTabRef} role="tab" tabIndex={tab === 'ranking' ? 0 : -1} type="button">Ranking</button><button aria-controls="history-panel" aria-selected={tab === 'history'} onClick={() => setTab('history')} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveTab(event.key === 'ArrowRight' ? 1 : -1) } }} ref={historyTabRef} role="tab" tabIndex={tab === 'history' ? 0 : -1} type="button">Match History</button></div>
        <section className="logbook" aria-label="Captain's log"><h2>Captain's Log</h2>{tab === 'ranking' ? <div id="ranking-panel" role="tabpanel"><RankingPanel configurationKey={configurationKey} configurationLabel={`${options.sessionDurationSeconds} second battles · ${options.enemySpawnIntervalSeconds} second spawn interval${simulationRate === 1 ? '' : ` · ${simulationRate}× clock`}`} key={configurationKey} playerId={playerId} /></div> : <div id="history-panel" role="tabpanel"><MatchHistoryPanel playerId={playerId} /></div>}</section>
        <NetworkScenarioPanel />
        <img alt="Jungle Gaming" className="jungle-logo" src="/assets/logo_jungle_gaming.svg" />
      </section>
    </main>
  )
}
