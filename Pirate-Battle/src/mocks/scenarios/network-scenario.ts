export type NetworkScenario =
  | 'success'
  | 'empty'
  | 'multiple-pages'
  | 'slow'
  | 'variable-latency'
  | 'out-of-order'
  | 'offline'
  | 'server-error'
  | 'client-error'
  | 'ranking-error'
  | 'history-error'
  | 'timeout'
  | 'timeout-after-register'
  | 'unavailable-at-match-end'

const scenarioStorageKey = 'pirate-battle.network-scenario'

export const networkScenarios: readonly NetworkScenario[] = ['success', 'empty', 'multiple-pages', 'slow', 'variable-latency', 'out-of-order', 'offline', 'server-error', 'client-error', 'ranking-error', 'history-error', 'timeout', 'timeout-after-register', 'unavailable-at-match-end']

export function getNetworkScenario(): NetworkScenario {
  const value = localStorage.getItem(scenarioStorageKey)
  return networkScenarios.includes(value as NetworkScenario) ? value as NetworkScenario : 'success'
}

export function setNetworkScenario(scenario: NetworkScenario): void { localStorage.setItem(scenarioStorageKey, scenario); window.dispatchEvent(new Event('pirate-network-scenario-change')) }
