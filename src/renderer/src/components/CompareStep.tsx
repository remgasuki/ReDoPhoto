import { useState, useEffect, useCallback } from 'react'
import { useScanStore } from '../stores/scanStore'
import { useDedupStore } from '../stores/dedupStore'
import type { DuplicateGroup, FileInfo } from '../types'

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function ImageCard({ file, isKept, isRemoved }: { file: FileInfo; isKept: boolean; isRemoved: boolean }) {
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
        isRemoved ? 'border-red-500/50 opacity-50' : 'border-slate-700'}`}>
      {/* Image */}
      <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {thumbnail ? (
          <img src={thumbnail} alt={file.name} className="max-w-full max-h-full object-contain" />
        ) : !loading ? (
          <div className="text-slate-600 text-sm">无法加载预览</div>
        ) : null}

        {/* Status badge */}
        {isKept && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            ✓ 保留
          </div>
        )}
        {isRemoved && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            ✕ 移除
          </div>
        )}
      </div>

      {/* File info */}
      <div className="p-3 bg-slate-800">
        <p className="text-sm text-slate-200 truncate" title={file.name}>{file.name}</p>
        <div className="flex gap-3 mt-1 text-xs text-slate-500">
          <span>{formatSize(file.size)}</span>
          <span>{file.ext.toUpperCase()}</span>
          <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

function GroupCard({ group, index, total }: { group: DuplicateGroup; index: number; total: number }) {
  const { decisions, keepLeft, keepRight, hasDecision } = useDedupStore()
  const decision = decisions.get(group.groupId)

  const isFileKept = (fileId: string) => decision?.keepFileIds.includes(fileId) || false
  const isFileRemoved = (fileId: string) => decision?.deleteFileIds.includes(fileId) || false

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 animate-fade-in">
      {/* Group header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-300">
            第 {index + 1} / {total} 组
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full
            ${group.matchType === 'exact' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
            {group.matchType === 'exact' ? '完全相同' : '高度相似'}
          </span>
        </div>
        {hasDecision(group.groupId) && (
          <span className="text-xs text-green-400">✓ 已决策</span>
        )}
      </div>

      {/* Images side by side */}
      <div className="flex gap-3 mb-3">
        {group.files.map((file) => (
          <ImageCard
            key={file.id}
            file={file}
            isKept={isFileKept(file.id)}
            isRemoved={isFileRemoved(file.id)}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => keepLeft(group)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isFileKept(group.files[0]?.id)
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
          ← 保留左侧
        </button>
        <button
          onClick={() => keepRight(group)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isFileKept(group.files[group.files.length - 1]?.id)
              ? 'bg-green-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
          保留右侧 →
        </button>
      </div>
    </div>
  )
}

export default function CompareStep() {
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
      <div className="shrink-0 bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-200">
              发现 {duplicateGroups.length} 组重复照片
            </h2>
            <div className="flex gap-2 text-xs">
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">已处理 {stats.decided}</span>
              <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded">待处理 {stats.pending}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => keepAllLeft(duplicateGroups)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              全部保留左侧
            </button>
            <button
              onClick={() => keepAllRight(duplicateGroups)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
            >
              全部保留右侧
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm rounded-lg transition-colors"
            >
              清除选择
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
          />
        ))}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 bg-slate-800 border-t border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
          >
            ← 上一页
          </button>
          <span className="text-sm text-slate-400">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm rounded-lg transition-colors"
          >
            下一页 →
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { useScanStore.getState().reset(); useDedupStore.getState().clearAll() }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
          >
            重新开始
          </button>
          <button
            onClick={handleExecute}
            disabled={stats.pending > 0}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all
              ${stats.pending === 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
          >
            {stats.pending > 0 ? `还有 ${stats.pending} 组未处理` : '执行去重'}
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
            <h3 className="text-lg font-semibold text-slate-200 mb-3">确认执行去重</h3>
            <div className="space-y-2 text-sm text-slate-400 mb-4">
              <p>共处理了 <span className="text-white font-bold">{stats.decided}</span> 组重复照片</p>
              <p>将保留用户选择的照片，移除重复项</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmExecute}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-semibold"
              >
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
