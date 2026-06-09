import { useTranslation } from 'react-i18next'
import { useRenameStore } from '../../stores/renameStore'
import type { ThemeClasses } from '../../types/theme'

interface RenamePreviewProps {
  theme: ThemeClasses
}

export default function RenamePreview({ theme }: RenamePreviewProps) {
  const { t } = useTranslation()
  const { previews, updatePreviewName, togglePreviewSelection, selectAll, setPhase } = useRenameStore()
  const selectedCount = previews.filter((p) => p.selected).length

  const allSelected = selectedCount === previews.length

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className={`shrink-0 border-b px-4 py-3 transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`text-lg font-semibold ${theme.text}`}>
              {t('rename.title')} {t('rename.fileCount', { count: previews.length })}
            </h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">
              {t('rename.selectedCount', { count: selectedCount })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selectAll(!allSelected)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
            >
              {allSelected ? t('rename.deselectAll') : t('rename.selectAll')}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${theme.border}`}>
              <th className={`text-left py-2 px-3 w-10 ${theme.textDim}`}></th>
              <th className={`text-left py-2 px-3 ${theme.textDim}`}>{t('rename.originalName')}</th>
              <th className={`text-left py-2 px-3 w-8 ${theme.textDim}`}></th>
              <th className={`text-left py-2 px-3 ${theme.textDim}`}>{t('rename.newName')}</th>
              <th className={`text-left py-2 px-3 ${theme.textDim}`}>{t('rename.date')}</th>
              <th className={`text-left py-2 px-3 ${theme.textDim}`}>{t('rename.location')}</th>
            </tr>
          </thead>
          <tbody>
            {previews.map((preview) => (
              <tr
                key={preview.id}
                className={`border-b transition-colors ${theme.border} ${preview.selected ? '' : 'opacity-40'}`}
              >
                <td className="py-2 px-3">
                  <input
                    type="checkbox"
                    checked={preview.selected}
                    onChange={() => togglePreviewSelection(preview.id)}
                    className="accent-blue-500"
                  />
                </td>
                <td className={`py-2 px-3 truncate max-w-[200px] ${theme.textMuted}`} title={preview.originalName}>
                  {preview.originalName}
                </td>
                <td className={`py-2 px-3 ${theme.textDim}`}>→</td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={preview.newName}
                    onChange={(e) => updatePreviewName(preview.id, e.target.value)}
                    className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
                  />
                </td>
                <td className={`py-2 px-3 text-xs ${theme.textDim}`}>
                  {preview.exifInfo.dateTimeOriginal
                    ? new Date(preview.exifInfo.dateTimeOriginal).toLocaleDateString()
                    : '—'}
                </td>
                <td className={`py-2 px-3 text-xs truncate max-w-[120px] ${theme.textDim}`}
                  title={preview.exifInfo.locationName || ''}>
                  {preview.exifInfo.locationName || (
                    preview.exifInfo.gpsLatitude ? `${preview.exifInfo.gpsLatitude.toFixed(2)}°, ${preview.exifInfo.gpsLongitude?.toFixed(2)}°` : '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t px-4 py-3 flex items-center justify-between transition-colors ${theme.card} ${theme.border}`}>
        <button
          onClick={() => useRenameStore.getState().reset()}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
        >
          {t('rename.restart')}
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
          {t('rename.executeRename', { count: selectedCount })}
        </button>
      </div>
    </div>
  )
}
