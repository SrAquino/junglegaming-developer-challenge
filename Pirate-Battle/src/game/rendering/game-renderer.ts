export interface GameRenderer {
  mount(host: HTMLElement): Promise<void>
  destroy(): void
}
