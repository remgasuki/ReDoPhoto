import { useTranslation } from 'react-i18next'
import { useScanStore } from '../stores/scanStore'
import type { ThemeClasses } from '../types/theme'

interface ScanningStepProps {
  theme: ThemeClasses
}

export default function ScanningStep({ theme }: ScanningStepProps) {
  const { t } = useTranslation()
  const progress = useScanStore((s) => s.progress)

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'scanning': return t('scanning.phase_scanning')
      case 'hashing': return t('scanning.phase_hashing')
      case 'phashing': return t('scanning.phase_phashing')
      case 'grouping': return t('scanning.phase_grouping')
      case 'done': return t('scanning.phase_done')
      default: return t('scanning.phase_default')
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'scanning': return '📂'
      case 'hashing': return '🔍'
      case 'phashing': return '🖼️'
      case 'grouping': return '📊'
      default: return '⏳'
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-md w-full text-center">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[t('import.step_import'), t('import.step_scan'), t('import.step_compare'), t('import.step_execute')].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${i <= 1 ? 'bg-blue-500 text-white' : `${theme.border} ${theme.textDim}`}`}>
                {i < 1 ? '✓' : i + 2}
              </div>
              <span className={`text-sm ${i <= 1 ? 'text-blue-400' : theme.textDim}`}>{step}</span>
              {i < 3 && <div className={`w-8 h-px ml-1 ${theme.border.replace('border-', 'bg-')}`} />}
            </div>
          ))}
        </div>

        {/* Progress display */}
        <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
          <div className="text-5xl mb-4">{getPhaseIcon(progress?.phase || 'scanning')}</div>
          <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>
            {getPhaseLabel(progress?.phase || 'scanning')}
          </h2>

          {progress && (
            <>
              <p className={`text-sm mb-6 ${theme.textDim}`}>
                {t('scanning.fileCount', { current: progress.current, total: progress.total })}
              </p>

              {/* Progress bar */}
              <div className={`w-full rounded-full h-3 mb-2 overflow-hidden ${theme.border.replace('border-', 'bg-')}`}>
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className={`text-sm ${theme.textDim}`}>{progress.percentage}%</p>
            </>
          )}

          {!progress && (
            <div className={`flex items-center justify-center gap-2 ${theme.textDim}`}>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('scanning.preparing')}</span>
            </div>
          )}
        </div>

        <p className={`mt-4 text-xs ${theme.textDim}`}>{t('scanning.pleaseWait')}</p>
      </div>
    </div>
  )
}
