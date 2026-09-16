import { storageKeys } from './storage-keys.ts'

export interface LocalPlayerIdentity { id: string; name: string }

export function getLocalPlayerIdentity(): LocalPlayerIdentity {
  const stored = localStorage.getItem(storageKeys.playerId)
  if (stored) return { id: stored, name: 'Captain You' }
  const id = crypto.randomUUID()
  localStorage.setItem(storageKeys.playerId, id)
  return { id, name: 'Captain You' }
}
