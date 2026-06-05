import { create } from 'zustand'
import type { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    hashMode: 'sha256',
    phashThreshold: 5,
    outputMode: 'copy',
    outputFolderSuffix: 'New',
    themeColor: 'black'
  },
  loaded: false,

  loadSettings: async () => {
    try {
      const settings = await window.api.getSettings()
      set({ settings, loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  updateSettings: async (partial) => {
    try {
      const updated = await window.api.setSettings(partial)
      set({ settings: updated })
    } catch {
      // Fallback: update locally
      set((state) => ({
        settings: { ...state.settings, ...partial }
      }))
    }
  }
}))
