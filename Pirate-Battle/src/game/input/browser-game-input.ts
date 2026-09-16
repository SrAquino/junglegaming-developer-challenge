import type { GameInput } from './game-input.ts'
import type { PlayerInput } from '../types/game.ts'

export type InputAction = keyof PlayerInput

const keyboardActions: Readonly<Record<string, InputAction>> = Object.freeze({
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowLeft: 'turnLeft',
  KeyA: 'turnLeft',
  ArrowRight: 'turnRight',
  KeyD: 'turnRight',
  KeyF: 'fireFront',
  KeyQ: 'fireLeft',
  KeyE: 'fireRight',
})

export class BrowserGameInput implements GameInput {
  private readonly keyboardHeld = new Set<InputAction>()
  private readonly touchPointers = new Map<number, InputAction>()
  private readonly keyDownListener = (event: KeyboardEvent) => this.updateKeyboard(event, true)
  private readonly keyUpListener = (event: KeyboardEvent) => this.updateKeyboard(event, false)
  private readonly clearListener = () => this.reset()

  public constructor() {
    window.addEventListener('keydown', this.keyDownListener)
    window.addEventListener('keyup', this.keyUpListener)
    window.addEventListener('blur', this.clearListener)
    document.addEventListener('visibilitychange', this.clearListener)
  }

  public getSnapshot(): Readonly<PlayerInput> {
    return Object.freeze({
      forward: this.isHeld('forward'),
      turnLeft: this.isHeld('turnLeft'),
      turnRight: this.isHeld('turnRight'),
      fireFront: this.isHeld('fireFront'),
      fireLeft: this.isHeld('fireLeft'),
      fireRight: this.isHeld('fireRight'),
    })
  }

  public setTouchAction(action: InputAction, held: boolean, pointerId = 0): void {
    if (held) {
      this.touchPointers.set(pointerId, action)
    } else {
      this.touchPointers.delete(pointerId)
    }
  }

  public reset(): void {
    this.keyboardHeld.clear()
    this.touchPointers.clear()
  }

  public destroy(): void {
    this.reset()
    window.removeEventListener('keydown', this.keyDownListener)
    window.removeEventListener('keyup', this.keyUpListener)
    window.removeEventListener('blur', this.clearListener)
    document.removeEventListener('visibilitychange', this.clearListener)
  }

  private updateKeyboard(event: KeyboardEvent, held: boolean): void {
    if (isEditableTarget(event.target)) {
      return
    }
    const action = keyboardActions[event.code]
    if (!action) {
      return
    }

    event.preventDefault()
    if (held) {
      this.keyboardHeld.add(action)
    } else {
      this.keyboardHeld.delete(action)
    }
  }

  private isHeld(action: InputAction): boolean {
    return this.keyboardHeld.has(action) || Array.from(this.touchPointers.values()).includes(action)
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select, [contenteditable="true"]'))
}
