import { useState } from 'react'
import { useScanStore } from '../stores/scanStore'
import { useSettingsStore } from '../stores/settingsStore'

export default function ImportStep() {
  const { setPhase, setFolderPath, setFiles, setProgress, setError, folderPath, files } = useScanStore()
  const settings = useSettingsStore((s) => s.settings)
  const [dragActive, setDragActive] = useState(false)

  const handleSelectFolder = async () => {
    try {
      const path = await window.api.selectFolder()
      if (path) {
        setFolderPath(path)
        setError(null)
      }
    } catch (err) {
      setError('选择文件夹失败: ' + String(err))
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
        setError('未找到任何图片文件，请选择包含照片的文件夹')
        setPhase('import')
        return
      }

      setFiles(scannedFiles)
      setProgress({ phase: 'hashing', current: 0, total: scannedFiles.length, percentage: 0 })

      // Step 2: Compute SHA-256 hashes
      const cleanupHash = window.api.onHashProgress((p) => setProgress(p))
      const hashResults = await window.api.computeHashes(scannedFiles)

      let phashResults: Awaited<ReturnType<typeof window.api.computePhashes>> = []
      if (settings.hashMode === 'phash' || settings.hashMode === 'both') {
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
        phashThreshold: settings.phashThreshold
      })

      useScanStore.getState().setDuplicateGroups(groups)
      setProgress(null)

      if (groups.length === 0) {
        setError('未发现重复照片！所有照片都是唯一的。')
        setPhase('import')
        return
      }

      setPhase('comparing')
    } catch (err) {
      setError('扫描失败: ' + String(err))
      setPhase('import')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-lg w-full">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['导入', '扫描', '对比', '执行'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${i === 0 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {i + 1}
              </div>
              <span className={`text-sm ${i === 0 ? 'text-blue-400' : 'text-slate-500'}`}>{step}</span>
              {i < 3 && <div className="w-8 h-px bg-slate-700 ml-1" />}
            </div>
          ))}
        </div>

        {/* Folder selection */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
            ${dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'}`}
          onClick={handleSelectFolder}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false) }}
        >
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-lg text-slate-300 mb-2">点击选择照片文件夹</p>
          <p className="text-sm text-slate-500">支持 JPG、PNG、GIF、BMP、WebP、TIFF 格式</p>
        </div>

        {/* Selected folder info */}
        {folderPath && (
          <div className="mt-6 bg-slate-800 rounded-lg p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm text-slate-300 truncate">{folderPath}</span>
            </div>
            {files.length > 0 && (
              <div className="flex gap-4 text-xs text-slate-400 mt-2">
                <span>{files.length} 张图片</span>
                <span>总大小: {formatSize(files.reduce((sum, f) => sum + f.size, 0))}</span>
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
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
        >
          开始扫描重复照片
        </button>

        {/* Hash mode indicator */}
        <div className="mt-3 text-center text-xs text-slate-500">
          检测模式：
          {settings.hashMode === 'sha256' && '精确匹配 (SHA-256)'}
          {settings.hashMode === 'phash' && '相似检测 (pHash)'}
          {settings.hashMode === 'both' && '组合模式 (SHA-256 + pHash)'}
        </div>
      </div>
    </div>
  )
}
