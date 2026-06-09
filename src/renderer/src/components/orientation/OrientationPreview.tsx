import { useTranslation } from 'react-i18next'
import { useOrientationStore } from '../../stores/orientationStore'
import type { ThemeClasses } from '../../types/theme'

interface OrientationPreviewProps {
  theme: ThemeClasses
}

export default function OrientationPreview({ theme }: OrientationPreviewProps) {
  const { t } = useTranslation()
  const { orientationInfos, selectedIds, toggleSelection, selectAll, setPhase } = useOrientationStore()

  const needsFixCount = orientationInfos.filter((i) => i.needsFix).length
  const selectedCount = selectedIds.size
  const allSelected = selectedCount === needsFixCount && needsFixCount > 0

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className={`shrink-0 border-b px-4 py-3 transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`text-lg font-semibold ${theme.text}`}>
              {t('orientation.title')} {t('orientation.fileCount', { count: orientationInfos.length })}
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded">{t('orientation.needsFix', { count: needsFixCount })}</span>
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">{t('orientation.normal', { count: orientationInfos.length - needsFixCount })}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selectAll(!allSelected)}
              disabled={needsFixCount === 0}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
            >
              {allSelected ? t('orientation.deselectAll') : t('orientation.selectAll')}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {orientationInfos.map((info) => (
          <div
            key={info.id}
            className={`flex items-center gap-4 p-3 rounded-lg border transition-colors
              ${info.needsFix
                ? selectedIds.has(info.id)
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : `${theme.card} ${theme.border}`
                : `opacity-50 ${theme.card} ${theme.border}`
              }`}
          >
            {info.needsFix && (
              <input
                type="checkbox"
                checked={selectedIds.has(info.id)}
                onChange={() => toggleSelection(info.id)}
                className="accent-blue-500 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${theme.text}`} title={info.name}>{info.name}</p>
              <p className={`text-xs mt-0.5 ${theme.textDim}`}>{info.description}</p>
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full
              ${info.needsFix ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
              {info.needsFix ? t('orientation.needsFixBadge') : t('orientation.normalBadge')}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t px-4 py-3 flex items-center justify-between transition-colors ${theme.card} ${theme.border}`}>
        <button
          onClick={() => useOrientationStore.getState().reset()}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
        >
          {t('orientation.restart')}
        </button>
        <button
          onClick={() => setPhase('executing')}
          disabled={selectedCount === 0}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all
            ${selectedCount > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              : `bg-gray-500 opacity-50 cursor-not-allowed ${theme.textDim}`
            }`}
        >
          {t('orientation.fixSelected', { count: selectedCount })}
        </button>
      </div>
    </div>
  )
}
