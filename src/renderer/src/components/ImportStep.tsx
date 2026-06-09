import { useTranslation } from 'react-i18next'
import { useScanStore } from '../stores/scanStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDropZone } from '../hooks/useDropZone'
import type { ThemeClasses } from '../types/theme'

interface ImportStepProps {
  theme: ThemeClasses
}

export default function ImportStep({ theme }: ImportStepProps) {
  const { t } = useTranslation()
  const { setPhase, setFolderPath, setFiles, setProgress, setError, folderPath, files } = useScanStore()
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
      setError(t('import.selectFolderError') + ': ' + String(err))
    }
  }

  const handleStartScan = async () => {
    if (!folderPath) return
    setPhase('scanning')
    setError(null)

    try {
      // Step 1: Scan folder
      const cleanupScan = window.api.onScanProgress((p) => setProgress(p))
      const scannedFiles = await window.api.scanFolder(folderPath)
      cleanupScan()

      if (scannedFiles.length === 0) {
        setError(t('import.noImagesError'))
        setPhase('import')
        return
      }

      setFiles(scannedFiles)
      setProgress({ phase: 'hashing', current: 0, total: scannedFiles.length, percentage: 0 })

      // Step 2: Compute SHA-256 hashes
      const cleanupHash = window.api.onHashProgress((p) => setProgress(p))
      const hashResults = await window.api.computeHashes(scannedFiles)

      let phashResults: Awaited<ReturnType<typeof window.api.computePhashes>> = []
      if (settings.dedup.hashMode === 'phash' || settings.dedup.hashMode === 'both') {
        // Only compute pHash for files not in exact duplicate groups
        const shaCounts = new Map<string, number>()
        hashResults.forEach((r) => shaCounts.set(r.sha256, (shaCounts.get(r.sha256) || 0) + 1))
        const uniqueFileIds = new Set(
          hashResults.filter((r) => shaCounts.get(r.sha256) === 1).map((r) => r.id)
        )
        const uniqueFiles = scannedFiles.filter((f) => uniqueFileIds.has(f.id))
        if (uniqueFiles.length > 1) {
          phashResults = await window.api.computePhashes(uniqueFiles)
        }
      }
      cleanupHash()

      // Step 3: Group duplicates
      const groups = await window.api.groupDuplicates({
        hashResults,
        phashResults: phashResults.length > 0 ? phashResults : undefined,
        phashThreshold: settings.dedup.phashThreshold
      })

      useScanStore.getState().setDuplicateGroups(groups)
      setProgress(null)

      if (groups.length === 0) {
        setError(t('import.noDupesFound'))
        setPhase('import')
        return
      }

      setPhase('comparing')
    } catch (err) {
      setError(t('import.selectFolderError') + ': ' + String(err))
      setPhase('import')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const stepLabels = [t('import.step_import'), t('import.step_scan'), t('import.step_compare'), t('import.step_execute')]

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-lg w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {stepLabels.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${i === 0 ? 'bg-blue-500 text-white' : `${theme.border} ${theme.textDim}`}`}>
                {i + 1}
              </div>
              <span className={`text-sm ${i === 0 ? 'text-blue-400' : theme.textDim}`}>{step}</span>
              {i < 3 && <div className={`w-8 h-px ml-1 ${theme.border.replace('border-', 'bg-')}`} />}
            </div>
          ))}
        </div>

        {/* Folder selection */}
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className={`text-lg mb-2 ${theme.textMuted}`}>{t('import.selectFolder')}</p>
              <p className={`text-sm ${theme.textDim}`}>{t('import.dragFolderHint')}</p>
            </>
          )}
        </div>

        {/* Selected folder info */}
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
                <span>{t('import.imageCount', { count: files.length })}</span>
                <span>{t('import.totalSize', { size: formatSize(files.reduce((sum, f) => sum + f.size, 0)) })}</span>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {useScanStore.getState().error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 animate-fade-in">
            {useScanStore.getState().error}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStartScan}
          disabled={!folderPath}
          className={`w-full mt-6 py-3 rounded-lg text-white font-semibold transition-all
            ${folderPath
              ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 animate-pulse-glow'
              : `bg-gray-500 opacity-50 cursor-not-allowed ${theme.textDim}`
            }`}
        >
          {t('import.startScan')}
        </button>

        {/* Hash mode indicator */}
        <div className={`mt-3 text-center text-xs ${theme.textDim}`}>
          {t('settings.dedup.hashMode')}：
          {settings.dedup.hashMode === 'sha256' && t('import.hashMode_sha256')}
          {settings.dedup.hashMode === 'phash' && t('import.hashMode_phash')}
          {settings.dedup.hashMode === 'both' && t('import.hashMode_both')}
        </div>
      </div>
    </div>
  )
}
