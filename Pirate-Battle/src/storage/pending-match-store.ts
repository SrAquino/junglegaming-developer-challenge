import type { MatchRegistrationRequest } from '../api/contracts.ts'
import { storageKeys } from './storage-keys.ts'

export function loadPendingMatches(): MatchRegistrationRequest[] {
  try { return JSON.parse(localStorage.getItem(storageKeys.pendingMatches) ?? '[]') as MatchRegistrationRequest[] } catch { return [] }
}

export function savePendingMatch(record: MatchRegistrationRequest): void {
  const pending = loadPendingMatches()
  if (!pending.some((item) => item.matchId === record.matchId)) pending.push(record)
  localStorage.setItem(storageKeys.pendingMatches, JSON.stringify(pending))
}

export function removePendingMatch(matchId: string): void {
  localStorage.setItem(storageKeys.pendingMatches, JSON.stringify(loadPendingMatches().filter((item) => item.matchId !== matchId)))
}
