import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useScanStore } from '../stores/scanStore'
import { useDedupStore } from '../stores/dedupStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { DedupProgress } from '../types'
import type { ThemeClasses } from '../types/theme'

interface ExecuteStepProps {
  theme: ThemeClasses
}

export default function ExecuteStep({ theme }: ExecuteStepProps) {
  const { t } = useTranslation()
  const { phase, setPhase, files, folderPath, duplicateGroups, dedupResult, setDedupResult } = useScanStore()
  const { getDecisionsArray } = useDedupStore()
  const settings = useSettingsStore((s) => s.settings)
  const [progress, setProgress] = useState<DedupProgress | null>(null)
  const [outputName, setOutputName] = useState('')
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!outputName && folderPath) {
      const folderName = folderPath.split(/[\\/]/).pop() || 'output'
      setOutputName(folderName + '_' + settings.outputFolderSuffix)
    }
  }, [folderPath, settings.outputFolderSuffix, outputName])

  useEffect(() => {
    if (phase === 'executing' && !executing && !dedupResult) {
      runDedup()
    }
  }, [phase])

  const getOutputName = () => {
    if (outputName) return outputName
    const folderName = folderPath?.split(/[\\/]/).pop() || 'output'
    return folderName + '_' + settings.outputFolderSuffix
  }

  const runDedup = async () => {
    setExecuting(true)
    setError(null)

    const actualOutputName = getOutputName()
    if (!outputName) setOutputName(actualOutputName)

    const cleanup = window.api.onDedupProgress((p) => setProgress(p))

    try {
      const decisions = getDecisionsArray()
      const result = await window.api.executeDedup({
        decisions,
        settings: {
          outputMode: settings.dedup.outputMode,
          outputFolderName: actualOutputName
        },
        sourceFolder: folderPath!,
        files
      })
      setDedupResult(result)
      setPhase('done')
    } catch (err) {
      setError(t('execute.failedError') + ': ' + String(err))
      setPhase('comparing')
    } finally {
      cleanup()
      setExecuting(false)
    }
  }

  if (phase === 'executing') {
    return (
      <div className="h-full flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-md w-full text-center">
          <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>{t('execute.title')}</h2>

            {progress && (
              <>
                <p className={`text-sm mb-2 ${theme.textDim}`}>{progress.currentFile}</p>
                <p className={`text-sm mb-4 ${theme.textDim}`}>
                  {progress.current} / {progress.total}
                </p>
                <div className={`w-full rounded-full h-3 overflow-hidden ${theme.border.replace('border-', 'bg-')}`}>
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className={`text-sm mt-2 ${theme.textDim}`}>{progress.percentage}%</p>
              </>
            )}

            {!progress && (
              <div className={`flex items-center justify-center gap-2 ${theme.textDim}`}>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t('execute.preparing')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Done state
  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-lg w-full text-center">
        <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
          {error ? (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">{t('execute.errorTitle')}</h2>
              <p className="text-sm text-red-300 mb-6">{error}</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">{t('execute.successTitle')}</h2>

              {dedupResult && (
                <div className={`space-y-2 text-sm mb-6 ${theme.textDim}`}>
                  <p>
                    {t('execute.successCount', { count: dedupResult.success })}
                  </p>
                  {dedupResult.errors.length > 0 && (
                    <p>
                      {t('execute.skippedCount', { count: dedupResult.errors.length })}
                    </p>
                  )}
                  {settings.dedup.outputMode === 'copy' && (
                    <p className={`mt-2 ${theme.textDim}`}>
                      {t('execute.outputFolder', { path: `${folderPath?.split(/[\\/]/).slice(0, -1).join('\\')}\\${outputName}` })}
                    </p>
                  )}
                  {settings.dedup.outputMode === 'delete' && (
                    <p className="text-red-400/70 mt-2">
                      {t('execute.deletedPermanently')}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Output folder name setting (only in copy mode and before execution) */}
          {settings.dedup.outputMode === 'copy' && !dedupResult && !error && (
            <div className="mb-4">
              <label className={`block text-sm mb-1 text-left ${theme.textDim}`}>{t('execute.outputFolderName')}</label>
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
              />
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                useScanStore.getState().reset()
                useDedupStore.getState().clearAll()
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {t('execute.processNew')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
