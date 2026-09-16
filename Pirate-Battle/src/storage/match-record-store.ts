import type { MatchRecord } from '../api/contracts.ts'

const confirmedRecordsKey = 'pirate-battle.confirmed-match-records'

export function loadConfirmedRecords(): MatchRecord[] {
  try { return JSON.parse(localStorage.getItem(confirmedRecordsKey) ?? '[]') as MatchRecord[] } catch { return [] }
}

export function saveConfirmedRecord(record: MatchRecord): void {
  const records = loadConfirmedRecords()
  const index = records.findIndex((item) => item.matchId === record.matchId)
  if (index >= 0) records[index] = record
  else records.push(record)
  localStorage.setItem(confirmedRecordsKey, JSON.stringify(records))
}
