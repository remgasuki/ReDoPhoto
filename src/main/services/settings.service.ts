import Store from 'electron-store'

export interface AppSettings {
  hashMode: 'sha256' | 'phash' | 'both'
  phashThreshold: number
  outputMode: 'copy' | 'delete'
  outputFolderSuffix: string
}

const DEFAULT_SETTINGS: AppSettings = {
  hashMode: 'sha256',
  phashThreshold: 5,
  outputMode: 'copy',
  outputFolderSuffix: 'New'
}

const store = new Store<{ settings: AppSettings }>({
  name: 'redophoto-settings',
  defaults: {
    settings: DEFAULT_SETTINGS
  }
})

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...store.get('settings', DEFAULT_SETTINGS) }
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = { ...current, ...partial }
  store.set('settings', updated)
  return updated
}
