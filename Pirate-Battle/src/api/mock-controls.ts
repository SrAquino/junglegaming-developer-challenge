import { apiClient } from './client.ts'

export async function resetMockData(): Promise<void> {
  await apiClient.post('/mock/reset')
  localStorage.removeItem('pirate-battle.confirmed-match-records')
  localStorage.removeItem('pirate-battle.pending-matches')
}
