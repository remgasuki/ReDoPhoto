import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRenameStore } from '../../stores/renameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ThemeClasses } from '../../types/theme'

interface RenameExecuteProps {
  theme: ThemeClasses
}

export default function RenameExecute({ theme }: RenameExecuteProps) {
  const { t } = useTranslation()
  const { phase, previews, folderPath, setPhase, setRenameResult, renameResult } = useRenameStore()
  const settings = useSettingsStore((s) => s.settings)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (phase === 'executing' && !executing && !renameResult) {
      runRename()
    }
  }, [phase])

  const runRename = async () => {
    setExecuting(true)
    setError(null)

    try {
      const selectedPreviews = previews.filter((p) => p.selected)
      const result = await window.api.executeRename({
        previews: selectedPreviews,
        settings: settings.rename,
        sourceFolder: folderPath!
      })
      setRenameResult(result)
      setPhase('done')
    } catch (err) {
      setError(t('rename.failedError') + ': ' + String(err))
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
            <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>{t('rename.executing')}</h2>
            <div className={`flex items-center justify-center gap-2 ${theme.textDim}`}>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('rename.processing')}</span>
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
              <h2 className="text-xl font-semibold text-red-400 mb-2">{t('rename.errorTitle')}</h2>
              <p className="text-sm text-red-300 mb-6">{error}</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">{t('rename.successTitle')}</h2>
              {renameResult && (
                <div className={`space-y-2 text-sm mb-6 ${theme.textDim}`}>
                  <p>
                    {t('rename.successCount', { count: renameResult.success })}
                  </p>
                  {renameResult.errors.length > 0 && (
                    <p>
                      {t('rename.skippedCount', { count: renameResult.errors.length })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          <button
            onClick={() => useRenameStore.getState().reset()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {t('rename.processNew')}
          </button>
        </div>
      </div>
    </div>
  )
}
