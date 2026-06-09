import { useTranslation } from 'react-i18next'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import { FORMAL_WEAR_TEMPLATES } from '../../types/idphoto'
import type { FormalWearTemplate } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'

interface FormalWearSelectorProps {
  theme: ThemeClasses
}

export default function FormalWearSelector({ theme }: FormalWearSelectorProps) {
  const { t } = useTranslation()
  const { selectedFormalWear, setSelectedFormalWear } = useIdPhotoStore()

  return (
    <div>
      <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>{t('idphoto.formalWear.title')}</h3>
      <div className="flex gap-3">
        {/* None option */}
        <button
          onClick={() => setSelectedFormalWear(null)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
            ${!selectedFormalWear
              ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
              : `${theme.card} ${theme.border} ${theme.hoverBg}`
            }`}
        >
          <div className={`w-14 h-14 rounded-lg ${theme.inputBg} flex items-center justify-center`}>
            <svg className={`w-6 h-6 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className={`text-[10px] ${!selectedFormalWear ? 'text-blue-400' : theme.textDim}`}>{t('idphoto.formalWear.none')}</span>
        </button>

        {FORMAL_WEAR_TEMPLATES.map((tpl) => (
          <TemplateCard
            key={tpl.key}
            template={tpl}
            isSelected={selectedFormalWear?.key === tpl.key}
            onClick={() => setSelectedFormalWear(tpl)}
            theme={theme}
          />
        ))}
      </div>
      <p className={`text-xs mt-2 ${theme.textDim}`}>
        {t('idphoto.formalWear.hint')}
      </p>
    </div>
  )
}

function TemplateCard({
  template, isSelected, onClick, theme
}: {
  template: FormalWearTemplate
  isSelected: boolean
  onClick: () => void
  theme: ThemeClasses
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all
        ${isSelected
          ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
          : `${theme.card} ${theme.border} ${theme.hoverBg}`
        }`}
    >
      <div className={`w-14 h-14 rounded-lg ${theme.inputBg} flex items-center justify-center`}>
        <svg className={`w-8 h-8 ${isSelected ? 'text-blue-400' : theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <span className={`text-[10px] ${isSelected ? 'text-blue-400' : theme.textDim}`}>{template.label}</span>
    </button>
  )
}
