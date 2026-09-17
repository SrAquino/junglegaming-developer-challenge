import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerMatch } from '../api/match-history.ts'
import type { MatchRegistrationRequest } from '../api/contracts.ts'
import type { MatchResult } from '../game/types/game.ts'
import { getLocalPlayerIdentity } from '../storage/player-identity.ts'
import { loadPendingMatches, removePendingMatch, savePendingMatch } from '../storage/pending-match-store.ts'

export type SubmissionStatus = 'idle' | 'pending' | 'submitted' | 'failed'

export function useMatchSubmission(): { status: SubmissionStatus; submit: (result: MatchResult) => void; retryPending: () => void } {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<SubmissionStatus>(() => loadPendingMatches().length ? 'pending' : 'idle')
  const recovered = useRef(false)
  const mutation = useMutation({
    mutationFn: registerMatch,
    retry: 2,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 4_000),
    onSuccess: (record) => {
      removePendingMatch(record.matchId)
      setStatus(loadPendingMatches().length ? 'pending' : 'submitted')
      void queryClient.invalidateQueries({ queryKey: ['match-history', record.playerId] })
      void queryClient.invalidateQueries({ queryKey: ['ranking'] })
    },
    onError: () => setStatus('failed'),
  })
  const send = (record: MatchRegistrationRequest) => { setStatus('pending'); mutation.mutate(record) }
  const retryPending = () => { for (const record of loadPendingMatches()) send(record) }
  useEffect(() => {
    if (recovered.current || !loadPendingMatches().length) return
    recovered.current = true
    for (const record of loadPendingMatches()) mutation.mutate(record)
  })
  return {
    status,
    submit: (result) => {
      const identity = getLocalPlayerIdentity()
      const record: MatchRegistrationRequest = { ...result, playerId: identity.id, playedAt: new Date().toISOString() }
      savePendingMatch(record)
      send(record)
    },
    retryPending,
  }
}
