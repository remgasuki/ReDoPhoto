import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useScanStore } from '../stores/scanStore'
import { useDedupStore } from '../stores/dedupStore'
import type { DuplicateGroup, FileInfo } from '../types'
import type { ThemeClasses } from '../types/theme'
import SyncImageViewer from './SyncImageViewer'

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function ImageCard({ file, isKept, isRemoved, theme }: { file: FileInfo; isKept: boolean; isRemoved: boolean; theme: ThemeClasses }) {
  const { t } = useTranslation()
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.api
      .getThumbnail(file.path, 500)
      .then((t) => { if (!cancelled) { setThumbnail(t); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [file.path])

  return (
    <div className={`flex-1 rounded-lg overflow-hidden border-2 transition-all
      ${isKept ? 'border-green-500 shadow-lg shadow-green-500/20' :
        isRemoved ? 'border-red-500/50 opacity-50' : theme.border}`}>
      {/* Image */}
      <div className={`relative aspect-video flex items-center justify-center ${theme.bg}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className={`w-8 h-8 animate-spin ${theme.textDim}`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {thumbnail ? (
          <img src={thumbnail} alt={file.name} className="max-w-full max-h-full object-contain" />
        ) : !loading ? (
          <div className={`text-sm ${theme.textDim}`}>{t('compare.loadError')}</div>
        ) : null}

        {/* Status badge */}
        {isKept && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {t('compare.keep')}
          </div>
        )}
        {isRemoved && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {t('compare.remove')}
          </div>
        )}
      </div>

      {/* File info */}
      <div className={`p-3 ${theme.card}`}>
        <p className={`text-sm truncate ${theme.text}`} title={file.name}>{file.name}</p>
        <div className={`flex gap-3 mt-1 text-xs ${theme.textDim}`}>
          <span>{formatSize(file.size)}</span>
          <span>{file.ext.toUpperCase()}</span>
          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

function GroupCard({ group, index, total, theme }: { group: DuplicateGroup; index: number; total: number; theme: ThemeClasses }) {
  const { t } = useTranslation()
  const { decisions, setDecision, keepLeft, keepRight, hasDecision } = useDedupStore()
  const decision = decisions.get(group.groupId)
  const [syncMode, setSyncMode] = useState(false)
  const [localFiles, setLocalFiles] = useState(group.files)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Sync localFiles when group changes
  useEffect(() => {
    setLocalFiles(group.files)
  }, [group.groupId])

  const isFileKept = (fileId: string) => decision?.keepFileIds.includes(fileId) || false
  const isFileRemoved = (fileId: string) => decision?.deleteFileIds.includes(fileId) || false

  const handleDragStart = (idx: number) => {
    setDragIndex(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIndex(idx)
  }

  const handleDrop = (dropIdx: number) => {
    if (dragIndex === null || dragIndex === dropIdx) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const newFiles = [...localFiles]
    const [moved] = newFiles.splice(dragIndex, 1)
    newFiles.splice(dropIdx, 0, moved)
    setLocalFiles(newFiles)
    setDragIndex(null)
    setDragOverIndex(null)

    // Auto-update decision if exists: first file is kept, rest deleted
    if (decision) {
      const keepId = newFiles[0]?.id
      const deleteIds = newFiles.slice(1).map(f => f.id)
      if (keepId) {
        setDecision(group.groupId, [keepId], deleteIds)
      }
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className={`rounded-xl p-4 animate-fade-in ${theme.card}`}>
      {/* Group header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${theme.textMuted}`}>
            {t('compare.groupLabel', { current: index + 1, total })}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full
            ${group.matchType === 'exact' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {group.matchType === 'exact' ? t('compare.matchExact') : t('compare.matchSimilar')}
          </span>
          {localFiles.length > 2 && (
            <span className={`text-[10px] ${theme.textDim}`} title={t('compare.priorityHint')}>
              {t('compare.dragToReorder')}
            </span>
          )}
        </div>
        {hasDecision(group.groupId) && (
          <span className="text-xs text-green-400">✓ {t('compare.decidedBadge')}</span>
        )}
      </div>

      {/* Sync mode toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setSyncMode(!syncMode)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            syncMode
              ? 'bg-blue-500/20 text-blue-400'
              : `${theme.border.replace('border-', 'bg-')} ${theme.textDim} ${theme.hoverBg}`
          }`}
        >
          {syncMode ? t('compare.syncMode') : t('compare.normalView')}
        </button>
      </div>

      {/* Images side by side */}
      {syncMode ? (
        <div className="mb-3">
          <SyncImageViewer files={group.files} theme={theme} />
        </div>
      ) : (
        <div className="flex gap-3 mb-3">
          {localFiles.map((file, idx) => (
            <div
              key={file.id}
              className={`flex-1 relative transition-all duration-150
                ${dragIndex === idx ? 'opacity-50 scale-95' : ''}
                ${dragOverIndex === idx && dragIndex !== idx ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
            >
              <ImageCard
                file={file}
                isKept={isFileKept(file.id)}
                isRemoved={isFileRemoved(file.id)}
                theme={theme}
              />
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => keepLeft({ ...group, files: localFiles })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isFileKept(localFiles[0]?.id)
              ? 'bg-green-600 text-white'
              : `${theme.border.replace('border-', 'bg-')} ${theme.textMuted} ${theme.hoverBg}`
            }`}
        >
          {t('compare.keepLeft')}
        </button>
        <button
          onClick={() => keepRight({ ...group, files: localFiles })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isFileKept(localFiles[localFiles.length - 1]?.id)
              ? 'bg-green-600 text-white'
              : `${theme.border.replace('border-', 'bg-')} ${theme.textMuted} ${theme.hoverBg}`
            }`}
        >
          {t('compare.keepRight')}
        </button>
      </div>
    </div>
  )
}

interface CompareStepProps {
  theme: ThemeClasses
}

export default function CompareStep({ theme }: CompareStepProps) {
  const { t } = useTranslation()
  const { duplicateGroups, setPhase, folderPath } = useScanStore()
  const { keepAllLeft, keepAllRight, clearAll, getStats } = useDedupStore()
  const [currentPage, setCurrentPage] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)

  const stats = getStats(duplicateGroups)
  const pageSize = 5
  const totalPages = Math.ceil(duplicateGroups.length / pageSize)
  const pageGroups = duplicateGroups.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const handleExecute = () => {
    if (stats.pending > 0) return
    setShowConfirm(true)
  }

  const confirmExecute = () => {
    setShowConfirm(false)
    setPhase('executing')
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className={`shrink-0 border-b px-4 py-3 transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`text-lg font-semibold ${theme.text}`}>
              {t('compare.title', { count: duplicateGroups.length })}
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">{t('compare.decided', { count: stats.decided })}</span>
              <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded">{t('compare.pending', { count: stats.pending })}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => keepAllLeft(duplicateGroups)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
            >
              {t('compare.keepAllLeft')}
            </button>
            <button
              onClick={() => keepAllRight(duplicateGroups)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
            >
              {t('compare.keepAllRight')}
            </button>
            <button
              onClick={clearAll}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textDim}`}
            >
              {t('compare.clearSelection')}
            </button>
          </div>
        </div>
      </div>

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pageGroups.map((group, i) => (
          <GroupCard
            key={group.groupId}
            group={group}
            index={currentPage * pageSize + i}
            total={duplicateGroups.length}
            theme={theme}
          />
        ))}
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t px-4 py-3 flex items-center justify-between transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className={`px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg}`}
          >
            {t('compare.prevPage')}
          </button>
          <span className={`text-sm ${theme.textDim}`}>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className={`px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg}`}
          >
            {t('compare.nextPage')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { useScanStore.getState().reset(); useDedupStore.getState().clearAll() }}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
          >
            {t('compare.restart')}
          </button>
          <button
            onClick={handleExecute}
            disabled={stats.pending > 0}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all
              ${stats.pending === 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : `bg-gray-500 opacity-50 cursor-not-allowed ${theme.textDim}`
              }`}
          >
            {stats.pending > 0 ? t('compare.pendingCount', { count: stats.pending }) : t('compare.execute')}
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className={`rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border transition-colors ${theme.card} ${theme.border}`}>
            <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>{t('compare.confirmTitle')}</h3>
            <div className={`space-y-2 text-sm mb-4 ${theme.textDim}`}>
              <p>{t('compare.confirmDesc', { count: stats.decided })}</p>
              <p>{t('compare.confirmDesc2')}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
              >
                {t('compare.cancel')}
              </button>
              <button
                onClick={confirmExecute}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-semibold"
              >
                {t('compare.confirmExecute')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
