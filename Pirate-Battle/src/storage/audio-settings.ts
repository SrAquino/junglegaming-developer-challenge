import { storageKeys } from './storage-keys.ts'

export interface AudioSettings { muted: boolean; volume: number }

export const defaultAudioSettings: Readonly<AudioSettings> = Object.freeze({ muted: false, volume: 0.65 })

export function loadAudioSettings(): AudioSettings {
  try {
    const stored = localStorage.getItem(storageKeys.audioSettings)
    if (!stored) return { ...defaultAudioSettings }
    const value = JSON.parse(stored) as Partial<AudioSettings>
    return { muted: value.muted === true, volume: typeof value.volume === 'number' && value.volume >= 0 && value.volume <= 1 ? value.volume : defaultAudioSettings.volume }
  } catch { return { ...defaultAudioSettings } }
}

export function saveAudioSettings(settings: AudioSettings): void { localStorage.setItem(storageKeys.audioSettings, JSON.stringify(settings)) }
