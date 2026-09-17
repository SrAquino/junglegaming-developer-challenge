import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { resetMockData } from '../../api/mock-controls.ts'
import { getNetworkScenario, networkScenarios, setNetworkScenario } from '../../mocks/scenarios/network-scenario.ts'

export function NetworkScenarioPanel() {
  const queryClient = useQueryClient()
  const [scenario, setScenario] = useState(getNetworkScenario)
  const [message, setMessage] = useState('')
  const [resetting, setResetting] = useState(false)
  const reset = async () => {
    setResetting(true)
    setMessage('')
    try {
      await resetMockData()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ranking'] }),
        queryClient.invalidateQueries({ queryKey: ['match-history'] }),
      ])
      setMessage('Mock data reset and refreshed.')
    } catch {
      setMessage('Mock reset is unavailable.')
    } finally {
      setResetting(false)
    }
  }
  return <details className="scenario-panel"><summary>Network demo controls</summary><div aria-label="Network controls" className="scenario-controls"><label>Network scenario<select aria-label="Network scenario" onChange={(event) => { const next = event.target.value as typeof scenario; setNetworkScenario(next); setScenario(next); setMessage('Scenario changed. Active data is refreshing.') }} value={scenario}>{networkScenarios.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button aria-busy={resetting} disabled={resetting} onClick={() => void reset()} type="button">Reset mock data</button>{message && <p aria-live="polite">{message}</p>}</div></details>
}
