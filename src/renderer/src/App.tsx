import { useEffect, useState } from 'react'
import { useScanStore } from './stores/scanStore'
import { useSettingsStore } from './stores/settingsStore'
import TitleBar from './components/TitleBar'
import ImportStep from './components/ImportStep'
import ScanningStep from './components/ScanningStep'
import CompareStep from './components/CompareStep'
import ExecuteStep from './components/ExecuteStep'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  const phase = useScanStore((s) => s.phase)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      <TitleBar onSettingsClick={() => setShowSettings(true)} />

      <main className="flex-1 overflow-hidden">
        {phase === 'import' && <ImportStep />}
        {phase === 'scanning' && <ScanningStep />}
        {phase === 'comparing' && <CompareStep />}
        {(phase === 'executing' || phase === 'done') && <ExecuteStep />}
      </main>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
