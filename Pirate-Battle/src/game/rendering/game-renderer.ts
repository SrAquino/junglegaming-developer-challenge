export interface GameRenderer {
  render(): void
  resize(width: number, height: number, devicePixelRatio: number): void
  destroy(): void
}
