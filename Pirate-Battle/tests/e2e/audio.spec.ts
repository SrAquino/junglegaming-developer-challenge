import { expect, test } from '@playwright/test'
import { soundDefinitions, soundsForGameEvent } from '../../src/game/audio/game-audio.ts'

interface AudioAttempt { source: string; loop: boolean; outcome: 'resolved' | 'rejected' }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = { attempts: [] as AudioAttempt[], pauses: [] as string[], allow: true, rejectPattern: '', constructed: 0 }
    Object.defineProperty(window, '__audioTest', { value: state, configurable: true })
    class FakeAudio extends EventTarget {
      public currentSrc: string
      public loop = false
      public preload = ''
      public volume = 1
      public constructor(public src = '') { super(); this.currentSrc = src; state.constructed += 1 }
      public play() {
        const source = this.src
        const rejected = !state.allow || (state.rejectPattern !== '' && source.includes(state.rejectPattern))
        state.attempts.push({ source, loop: this.loop, outcome: rejected ? 'rejected' : 'resolved' })
        if (rejected && state.rejectPattern !== '') queueMicrotask(() => this.dispatchEvent(new Event('error')))
        return rejected ? Promise.reject(new DOMException('Blocked in audio test')) : Promise.resolve()
      }
      public pause() { state.pauses.push(this.src) }
      public load() {}
      public cloneNode() { const clone = new FakeAudio(this.src); clone.preload = this.preload; return clone }
      public removeAttribute(name: string) { if (name === 'src') { this.src = ''; this.currentSrc = '' } }
    }
    ;(window as unknown as { Audio: typeof FakeAudio }).Audio = FakeAudio
    localStorage.clear()
    sessionStorage.clear()
  })
})

test('maps every supplied WAV to an event or deterministic variant', () => {
  const mapped = Object.values(soundDefinitions).flatMap((definition) => definition.files).sort()
  expect(mapped).toEqual([
    'cannon_broadside.wav', 'cannon_fire_1.wav', 'cannon_fire_2.wav', 'cannon_fire_3.wav',
    'cannonball_water_hit_1.wav', 'cannonball_water_hit_2.wav', 'game_complete.wav', 'game_over.wav',
    'game_pause.wav', 'game_resume.wav', 'game_start.wav', 'health_low.wav', 'ocean_ambience_loop.wav',
    'score_point.wav', 'ship_collision.wav', 'ship_explosion_1.wav', 'ship_explosion_2.wav',
    'ship_sailing_loop.wav', 'ship_sinking.wav', 'ship_wood_hit_1.wav', 'ship_wood_hit_2.wav',
    'time_warning.wav', 'ui_back.wav', 'ui_click.wav', 'ui_close.wav', 'ui_hover.wav', 'ui_open.wav',
  ])
  expect(soundsForGameEvent({ type: 'weapon-fired', weapon: 'broadside', owner: 'player' })).toEqual(['broadside'])
  expect(soundsForGameEvent({ type: 'projectile-impact', material: 'wood' })).toEqual(['woodHit'])
  expect(soundsForGameEvent({ type: 'ship-collision' })).toEqual(['shipCollision'])
  expect(soundsForGameEvent({ type: 'score-changed' })).toEqual(['score'])
  expect(soundsForGameEvent({ type: 'ship-destroyed', target: 'shooter' })).toEqual(['explosion', 'sinking'])
  expect(soundsForGameEvent({ type: 'ship-damaged', target: 'player', previousHealth: 31, health: 29, maxHealth: 100 })).toEqual(['healthLow'])
})

test('plays distinct UI cues for opening, saving and leaving screens', async ({ page }) => {
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Options' }).click()
  await page.getByRole('button', { name: 'Save options' }).click()
  await page.getByRole('button', { name: 'Options' }).click()
  await page.getByRole('button', { name: 'Back to menu' }).click()
  await expect.poll(() => successfulSources(page)).toEqual(expect.arrayContaining(['ui_open.wav', 'ui_close.wav', 'ui_back.wav']))
})

test('caps concurrent one-shot voices and releases them on destroy', async ({ page }) => {
  await page.goto('/?disable-msw')
  const diagnostics = await page.evaluate(async () => {
    const moduleUrl = '/src/game/audio/game-audio.ts'
    const { GameAudio: BrowserGameAudio } = await import(moduleUrl)
    const audio = new BrowserGameAudio({ muted: false, volume: 1 })
    audio.unlock()
    const cues = [
      'gameStart', 'gamePause', 'gameResume', 'gameComplete', 'gameOver', 'cannonFire', 'broadside',
      'waterHit', 'woodHit', 'explosion', 'sinking', 'score', 'healthLow', 'timeWarning',
      'shipCollision', 'uiHover', 'uiClick', 'uiOpen', 'uiClose', 'uiBack',
    ] as const
    for (const cue of cues) audio.play(cue)
    const beforeDestroy = audio.getDiagnostics()
    audio.destroy()
    return { beforeDestroy, afterDestroy: audio.getDiagnostics() }
  })
  expect(diagnostics.beforeDestroy.activeVoices).toBe(12)
  expect(diagnostics.afterDestroy.activeVoices).toBe(0)
  expect(diagnostics.afterDestroy.activeLoops).toBe(0)
})

test('rotates cannon variants without simulation randomness', async ({ page }) => {
  await page.goto('/?disable-msw')
  await page.evaluate(async () => {
    const moduleUrl = '/src/game/audio/game-audio.ts'
    const { GameAudio: BrowserGameAudio } = await import(moduleUrl)
    const audio = new BrowserGameAudio({ muted: false, volume: 1 })
    audio.unlock()
    for (let index = 0; index < 3; index += 1) {
      audio.play('cannonFire')
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    audio.destroy()
  })
  const cannonAttempts = (await successfulSources(page)).filter((source) => source.startsWith('cannon_fire_'))
  expect(cannonAttempts).toEqual(['cannon_fire_1.wav', 'cannon_fire_2.wav', 'cannon_fire_3.wav'])
})

test('unlocks from Play and emits one broadside cue while movement controls the sailing loop', async ({ page }) => {
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('data-audio-unlocked', 'true')
  expect((await audioState(page)).constructed).toBeGreaterThan(0)
  await expect.poll(() => successfulSources(page)).toEqual(expect.arrayContaining(['ui_click.wav', 'game_start.wav', 'ocean_ambience_loop.wav']))

  await page.keyboard.down('e')
  await page.waitForTimeout(100)
  await page.keyboard.up('e')
  await expect.poll(async () => (await successfulSources(page)).filter((source) => source === 'cannon_broadside.wav')).toHaveLength(1)

  await page.keyboard.down('w')
  await expect.poll(() => successfulSources(page)).toEqual(expect.arrayContaining(['ship_sailing_loop.wav']))
  await page.keyboard.up('w')

  await page.getByRole('button', { name: 'Pause match' }).click()
  await expect.poll(() => successfulSources(page)).toEqual(expect.arrayContaining(['game_pause.wav']))
  await expect.poll(async () => audioState(page).then((state) => state.pauses.some((source) => source.endsWith('ocean_ambience_loop.wav')))).toBe(true)
  await page.getByRole('button', { name: 'Resume match' }).click()
  await expect.poll(() => successfulSources(page)).toEqual(expect.arrayContaining(['game_resume.wav']))
})

test('honors mute without creating voices or loops', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pirate-battle.audio-settings', JSON.stringify({ muted: true, volume: 0.25 })))
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect(arena).toHaveAttribute('data-audio-voices', '0')
  await expect(arena).toHaveAttribute('data-audio-loops', '0')
  expect((await audioState(page)).attempts).toHaveLength(0)
})

test('recovers after blocked playback and contains a failed WAV without stopping play', async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { __audioTest: { allow: boolean } }).__audioTest.allow = false })
  await page.goto('/?disable-msw')
  await page.getByRole('button', { name: 'Play' }).click()
  const arena = page.getByRole('img', { name: 'Pirate Battle arena' })
  await expect.poll(async () => Number(await arena.getAttribute('data-audio-failures'))).toBeGreaterThan(0)

  await page.evaluate(() => { (window as unknown as { __audioTest: { allow: boolean; rejectPattern: string } }).__audioTest.allow = true })
  await page.keyboard.down('w')
  await expect.poll(() => successfulSources(page)).toEqual(expect.arrayContaining(['ocean_ambience_loop.wav', 'ship_sailing_loop.wav']))
  await page.keyboard.up('w')

  const failuresBefore = Number(await arena.getAttribute('data-audio-failures'))
  await page.evaluate(() => { (window as unknown as { __audioTest: { rejectPattern: string } }).__audioTest.rejectPattern = 'cannon_fire_' })
  await page.keyboard.down('f')
  await page.waitForTimeout(100)
  await page.keyboard.up('f')
  await expect.poll(async () => Number(await arena.getAttribute('data-audio-failures'))).toBeGreaterThan(failuresBefore)
  await expect(page.locator('canvas')).toHaveCount(1)
})

async function audioState(page: import('@playwright/test').Page): Promise<{ attempts: AudioAttempt[]; pauses: string[]; constructed: number }> {
  return page.evaluate(() => (window as unknown as { __audioTest: { attempts: AudioAttempt[]; pauses: string[]; constructed: number } }).__audioTest)
}

async function successfulSources(page: import('@playwright/test').Page): Promise<string[]> {
  return (await audioState(page)).attempts
    .filter((attempt) => attempt.outcome === 'resolved')
    .map((attempt) => attempt.source.split('/').at(-1) ?? attempt.source)
}
