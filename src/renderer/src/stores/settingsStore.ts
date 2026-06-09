import { create } from 'zustand'
import type { AppSettings } from '../types'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  loadSettings: () => Promise<void>
  updateSettings: (partial: Record<string, any>) => Promise<void>
}

const defaultSettings: AppSettings = {
  dedup: {
    hashMode: 'sha256',
    phashThreshold: 5,
    outputMode: 'copy'
  },
  rename: {
    outputMode: 'copy',
    nameFormat: '{date}_{location}_{seq}',
    dateFormat: 'YYYY-MM-DD',
    separator: '_'
  },
  orientation: {
    outputMode: 'copy'
  },
  idphoto: {
    outputFormat: 'jpg' as const,
    quality: 95
  },
  outputFolderSuffix: 'New',
  themeColor: 'black',
  language: 'zh-CN' as const
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
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
      // Fallback: update locally with shallow merge at top level
      set((state) => ({
        settings: { ...state.settings, ...partial }
      }))
    }
  }
}))
