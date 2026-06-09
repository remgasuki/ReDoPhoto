import { useTranslation } from 'react-i18next'
import { useOrientationStore } from '../../stores/orientationStore'
import OrientationImport from './OrientationImport'
import OrientationPreview from './OrientationPreview'
import OrientationExecute from './OrientationExecute'
import type { ThemeClasses } from '../../types/theme'

interface OrientationFeatureProps {
  theme: ThemeClasses
}

export default function OrientationFeature({ theme }: OrientationFeatureProps) {
  const { t } = useTranslation()
  const phase = useOrientationStore((s) => s.phase)

  return (
    <>
      {phase === 'import' && <OrientationImport theme={theme} />}
      {phase === 'scanning' && (
        <div className="h-full flex items-center justify-center">
          <div className={`text-center ${theme.textMuted}`}>
            <svg className="w-8 h-8 animate-spin mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p>{t('orientation.scanning')}</p>
          </div>
        </div>
      )}
      {phase === 'preview' && <OrientationPreview theme={theme} />}
      {(phase === 'executing' || phase === 'done') && <OrientationExecute theme={theme} />}
    </>
  )
}
