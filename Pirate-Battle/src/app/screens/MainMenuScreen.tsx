import { PrimaryButton } from '../../components/ui/PrimaryButton.tsx'
import { useState } from 'react'
import { RankingPanel } from '../../features/ranking/RankingPanel.tsx'
import { MatchHistoryPanel } from '../../features/match-history/MatchHistoryPanel.tsx'
import { NetworkScenarioPanel } from '../../features/network-scenarios/NetworkScenarioPanel.tsx'

interface MainMenuScreenProps { onPlay: () => void; onOptions: () => void; onLastResult: () => void; hasLastResult: boolean; configurationKey: string; playerId: string }

export function MainMenuScreen({ onPlay, onOptions, onLastResult, hasLastResult, configurationKey, playerId }: MainMenuScreenProps) {
  const [tab, setTab] = useState<'ranking' | 'history'>('ranking')
  return (
    <main className="application-shell">
      <section aria-labelledby="game-title" className="main-menu">
        <p className="eyebrow">Jungle Gaming Challenge</p>
        <h1 id="game-title">Pirate Battle</h1>
        <p>Set sail, defeat enemy ships and claim the highest score.</p>
        <div className="menu-actions"><PrimaryButton onClick={onPlay}>Play</PrimaryButton><button onClick={onOptions} type="button">Options</button>{hasLastResult && <button onClick={onLastResult} type="button">Last match result</button>}</div>
        <div className="menu-tabs" role="tablist"><button aria-selected={tab === 'ranking'} onClick={() => setTab('ranking')} role="tab" type="button">Ranking</button><button aria-selected={tab === 'history'} onClick={() => setTab('history')} role="tab" type="button">Match History</button></div>
        {tab === 'ranking' ? <RankingPanel configurationKey={configurationKey} /> : <MatchHistoryPanel playerId={playerId} />}
        <NetworkScenarioPanel />
      </section>
    </main>
  )
}
