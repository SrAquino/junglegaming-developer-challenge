export const queryKeys = {
  ranking: (configurationKey: string, page: number, pageSize: number) => ['ranking', configurationKey, page, pageSize] as const,
  matchHistory: (playerId: string, page: number, pageSize: number) =>
    ['match-history', playerId, page, pageSize] as const,
}
