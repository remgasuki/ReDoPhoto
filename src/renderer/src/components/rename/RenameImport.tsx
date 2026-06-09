import { useTranslation } from 'react-i18next'
import { useRenameStore } from '../../stores/renameStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useDropZone } from '../../hooks/useDropZone'
import type { ThemeClasses } from '../../types/theme'

interface RenameImportProps {
  theme: ThemeClasses
}

export default function RenameImport({ theme }: RenameImportProps) {
  const { t } = useTranslation()
  const { setPhase, setFolderPath, setFiles, setExifInfos, setPreviews, setError, folderPath, files } = useRenameStore()
  const settings = useSettingsStore((s) => s.settings)

  const { isDragActive, dropZoneProps } = useDropZone({
    accept: 'folder',
    onDropFolder: (path) => {
      setFolderPath(path)
      setError(null)
    },
    onError: (msg) => setError(msg)
  })

  const handleSelectFolder = async () => {
    try {
      const path = await window.api.selectFolder()
      if (path) {
        setFolderPath(path)
        setError(null)
      }
    } catch (err) {
      setError(t('rename.selectFolderError') + ': ' + String(err))
    }
  }

  const handleStartScan = async () => {
    if (!folderPath) return
    setPhase('scanning')
    setError(null)

    try {
      const scannedFiles = await window.api.scanFolder(folderPath)
      if (scannedFiles.length === 0) {
        setError(t('rename.noImagesError'))
        setPhase('import')
        return
      }
      setFiles(scannedFiles)

      const exifInfos = await window.api.scanExif(scannedFiles)
      setExifInfos(exifInfos)

      const previews = await window.api.previewRename({
        exifInfos,
        settings: settings.rename,
        sourceFolder: folderPath
      })
      setPreviews(previews.map(p => ({ ...p, selected: true })))
      setPhase('preview')
    } catch (err) {
      setError(t('rename.scanError') + ': ' + String(err))
      setPhase('import')
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-lg w-full">
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
            ${isDragActive ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' : `${theme.border.replace('border-', 'border-')} ${theme.hoverBg} hover:border-blue-400`}`}
          onClick={handleSelectFolder}
          {...dropZoneProps}
        >
          {isDragActive ? (
            <>
              <svg className={`w-16 h-16 mx-auto mb-4 text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className={`text-lg mb-2 text-blue-400`}>{t('import.dropFolderHere')}</p>
            </>
          ) : (
            <>
              <svg className={`w-16 h-16 mx-auto mb-4 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className={`text-lg mb-2 ${theme.textMuted}`}>{t('rename.selectFolder')}</p>
              <p className={`text-sm ${theme.textDim}`}>{t('import.dragFolderHint')}</p>
            </>
          )}
        </div>

        {folderPath && (
          <div className={`mt-6 rounded-lg p-4 animate-fade-in transition-colors ${theme.card}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className={`text-sm truncate ${theme.textMuted}`}>{folderPath}</span>
            </div>
            {files.length > 0 && (
              <div className={`flex gap-4 text-xs mt-2 ${theme.textDim}`}>
                <span>{t('rename.imageCount', { count: files.length })}</span>
              </div>
            )}
          </div>
        )}

        {useRenameStore.getState().error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 animate-fade-in">
            {useRenameStore.getState().error}
          </div>
        )}

        <button
          onClick={handleStartScan}
          disabled={!folderPath}
          className={`w-full mt-6 py-3 rounded-lg text-white font-semibold transition-all
            ${folderPath
              ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25'
              : `bg-gray-500 opacity-50 cursor-not-allowed ${theme.textDim}`
            }`}
        >
          {t('rename.startScan')}
        </button>
      </div>
    </div>
  )
}
