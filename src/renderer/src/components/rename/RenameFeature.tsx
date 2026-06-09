import { useTranslation } from 'react-i18next'
import { useRenameStore } from '../../stores/renameStore'
import RenameImport from './RenameImport'
import RenamePreview from './RenamePreview'
import RenameExecute from './RenameExecute'
import type { ThemeClasses } from '../../types/theme'

interface RenameFeatureProps {
  theme: ThemeClasses
}

export default function RenameFeature({ theme }: RenameFeatureProps) {
  const { t } = useTranslation()
  const phase = useRenameStore((s) => s.phase)

  return (
    <>
      {phase === 'import' && <RenameImport theme={theme} />}
      {phase === 'scanning' && (
        <div className="h-full flex items-center justify-center">
          <div className={`text-center ${theme.textMuted}`}>
            <svg className="w-8 h-8 animate-spin mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p>{t('rename.scanning')}</p>
          </div>
        </div>
      )}
      {phase === 'preview' && <RenamePreview theme={theme} />}
      {(phase === 'executing' || phase === 'done') && <RenameExecute theme={theme} />}
    </>
  )
}
