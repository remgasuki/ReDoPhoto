import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrientationStore } from '../../stores/orientationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ThemeClasses } from '../../types/theme'

interface OrientationExecuteProps {
  theme: ThemeClasses
}

export default function OrientationExecute({ theme }: OrientationExecuteProps) {
  const { t } = useTranslation()
  const { phase, orientationInfos, selectedIds, folderPath, setPhase, setResult, result } = useOrientationStore()
  const settings = useSettingsStore((s) => s.settings)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (phase === 'executing' && !executing && !result) {
      runFix()
    }
  }, [phase])

  const runFix = async () => {
    setExecuting(true)
    setError(null)

    try {
      const filesToFix = orientationInfos.filter((i) => selectedIds.has(i.id))
      const fixResult = await window.api.fixOrientations({
        files: filesToFix,
        settings: settings.orientation,
        sourceFolder: folderPath!
      })
      setResult(fixResult)
      setPhase('done')
    } catch (err) {
      setError(t('orientation.failedError') + ': ' + String(err))
      setPhase('preview')
    } finally {
      setExecuting(false)
    }
  }

  if (phase === 'executing') {
    return (
      <div className="h-full flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-md w-full text-center">
          <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>{t('orientation.fixing')}</h2>
            <div className={`flex items-center justify-center gap-2 ${theme.textDim}`}>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('orientation.processing')}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-lg w-full text-center">
        <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
          {error ? (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">{t('orientation.errorTitle')}</h2>
              <p className="text-sm text-red-300 mb-6">{error}</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">{t('orientation.successTitle')}</h2>
              {result && (
                <div className={`space-y-2 text-sm mb-6 ${theme.textDim}`}>
                  <p>
                    {t('orientation.successCount', { count: result.success })}
                  </p>
                  {result.errors.length > 0 && (
                    <p>
                      {t('orientation.skippedCount', { count: result.errors.length })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          <button
            onClick={() => useOrientationStore.getState().reset()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {t('orientation.processNew')}
          </button>
        </div>
      </div>
    </div>
  )
}
