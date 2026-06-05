import Store from 'electron-store'

export type ThemeColor = 'black' | 'white' | 'beige' | 'skyblue' | 'darkblue' | 'kleinblue' | 'gray'

export interface DedupConfig {
  hashMode: 'sha256' | 'phash' | 'both'
  phashThreshold: number
  outputMode: 'copy' | 'delete'
}

export interface RenameConfig {
  outputMode: 'copy' | 'rename-in-place'
  nameFormat: string
  dateFormat: string
  separator: string
}

export interface OrientationConfig {
  outputMode: 'copy' | 'fix-in-place'
}

export interface AppSettings {
  dedup: DedupConfig
  rename: RenameConfig
  orientation: OrientationConfig
  outputFolderSuffix: string
  themeColor: ThemeColor
}

const DEFAULT_SETTINGS: AppSettings = {
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
  outputFolderSuffix: 'New',
  themeColor: 'black'
}

// Old settings format for migration
interface OldAppSettings {
  hashMode: 'sha256' | 'phash' | 'both'
  phashThreshold: number
  outputMode: 'copy' | 'delete'
  outputFolderSuffix: string
  themeColor: ThemeColor
}

const store = new Store<{ settings: AppSettings | OldAppSettings }>({
  name: 'redophoto-settings',
  defaults: {
    settings: DEFAULT_SETTINGS
  }
})

function isOldFormat(settings: any): settings is OldAppSettings {
  return settings && 'hashMode' in settings && !('dedup' in settings)
}

function migrateSettings(old: OldAppSettings): AppSettings {
  return {
    dedup: {
      hashMode: old.hashMode || 'sha256',
      phashThreshold: old.phashThreshold ?? 5,
      outputMode: old.outputMode || 'copy'
    },
    rename: { ...DEFAULT_SETTINGS.rename },
    orientation: { ...DEFAULT_SETTINGS.orientation },
    outputFolderSuffix: old.outputFolderSuffix || 'New',
    themeColor: old.themeColor || 'black'
  }
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceVal = source[key]
      const targetVal = target[key]
      if (
        sourceVal !== null &&
        typeof sourceVal === 'object' &&
        !Array.isArray(sourceVal) &&
        targetVal !== null &&
        typeof targetVal === 'object' &&
        !Array.isArray(targetVal)
      ) {
        (result as any)[key] = deepMerge(targetVal as any, sourceVal as any)
      } else if (sourceVal !== undefined) {
        (result as any)[key] = sourceVal
      }
    }
  }
  return result
}

export function getSettings(): AppSettings {
  const stored = store.get('settings', DEFAULT_SETTINGS) as any

  if (isOldFormat(stored)) {
    const migrated = migrateSettings(stored)
    store.set('settings', migrated)
    return migrated
  }

  return deepMerge(DEFAULT_SETTINGS, stored)
}

export function setSettings(partial: DeepPartial<AppSettings>): AppSettings {
  const current = getSettings()
  const updated = deepMerge(current, partial)
  store.set('settings', updated)
  return updated
}
