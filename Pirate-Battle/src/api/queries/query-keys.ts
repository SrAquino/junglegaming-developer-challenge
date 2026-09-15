export const queryKeys = {
  ranking: (page: number, pageSize: number) => ['ranking', page, pageSize] as const,
  matchHistory: (playerId: string, page: number, pageSize: number) =>
    ['match-history', playerId, page, pageSize] as const,
}
