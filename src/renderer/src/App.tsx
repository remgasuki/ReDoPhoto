import { useEffect, useState } from 'react'
import { useScanStore } from './stores/scanStore'
import { useSettingsStore } from './stores/settingsStore'
import { getThemeClasses, defaultTheme } from './types/theme'
import TitleBar from './components/TitleBar'
import ImportStep from './components/ImportStep'
import ScanningStep from './components/ScanningStep'
import CompareStep from './components/CompareStep'
import ExecuteStep from './components/ExecuteStep'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  const phase = useScanStore((s) => s.phase)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const themeColor = useSettingsStore((s) => s.settings.themeColor)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const theme = getThemeClasses(themeColor)

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      <TitleBar onSettingsClick={() => setShowSettings(true)} theme={theme} />

      <main className="flex-1 overflow-hidden">
        {phase === 'import' && <ImportStep theme={theme} />}
        {phase === 'scanning' && <ScanningStep theme={theme} />}
        {phase === 'comparing' && <CompareStep theme={theme} />}
        {(phase === 'executing' || phase === 'done') && <ExecuteStep theme={theme} />}
      </main>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
