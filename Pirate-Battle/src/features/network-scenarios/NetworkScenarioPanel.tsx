import { useState } from 'react'
import { resetMockData } from '../../api/mock-controls.ts'
import { getNetworkScenario, networkScenarios, setNetworkScenario } from '../../mocks/scenarios/network-scenario.ts'

export function NetworkScenarioPanel() {
  const [scenario, setScenario] = useState(getNetworkScenario)
  const [message, setMessage] = useState('')
  return <details className="scenario-panel"><summary>Network demo controls</summary><div aria-label="Network controls" className="scenario-controls"><label>Network scenario<select aria-label="Network scenario" onChange={(event) => { const next = event.target.value as typeof scenario; setNetworkScenario(next); setScenario(next); setMessage('Scenario changed. Refresh data to apply it.') }} value={scenario}>{networkScenarios.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button onClick={() => void resetMockData().then(() => setMessage('Mock data reset.'), () => setMessage('Mock reset is unavailable.'))} type="button">Reset mock data</button>{message && <p aria-live="polite">{message}</p>}</div></details>
}
