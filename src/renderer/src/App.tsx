import { useEffect, useState } from 'react'
import { useSettingsStore } from './stores/settingsStore'
import { useNavStore } from './stores/navStore'
import { getThemeClasses } from './types/theme'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import SettingsPanel from './components/SettingsPanel'
import DedupFeature from './components/dedup/DedupFeature'
import RenameFeature from './components/rename/RenameFeature'
import OrientationFeature from './components/orientation/OrientationFeature'
import IdPhotoFeature from './components/idphoto/IdPhotoFeature'

export default function App() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const themeColor = useSettingsStore((s) => s.settings.themeColor)
  const activeFeature = useNavStore((s) => s.activeFeature)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const theme = getThemeClasses(themeColor)

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      <TitleBar theme={theme} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar theme={theme} onSettingsClick={() => setShowSettings(true)} />

        <main className="flex-1 overflow-hidden">
          {activeFeature === 'dedup' && <DedupFeature theme={theme} />}
          {activeFeature === 'rename' && <RenameFeature theme={theme} />}
          {activeFeature === 'orientation' && <OrientationFeature theme={theme} />}
          {activeFeature === 'idphoto' && <IdPhotoFeature theme={theme} />}
        </main>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
