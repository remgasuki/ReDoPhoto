import { useRef, useState, useCallback, useEffect } from 'react'
import type { FileInfo } from '../types'
import type { ThemeClasses } from '../types/theme'

interface SyncImageViewerProps {
  files: FileInfo[]
  theme: ThemeClasses
}

export default function SyncImageViewer({ files, theme }: SyncImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const [thumbnails, setThumbnails] = useState<(string | null)[]>([])
  const [loading, setLoading] = useState(true)

  // Load thumbnails
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setThumbnails(new Array(files.length).fill(null))

    Promise.all(
      files.map((file) =>
        window.api.getThumbnail(file.path, 1200).catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) {
        setThumbnails(results)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [files])

  // Zoom handler (wheel)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.max(1, Math.min(10, scale * delta))

      if (newScale === 1) {
        setTranslate({ x: 0, y: 0 })
      }

      setScale(newScale)
    },
    [scale]
  )

  // Drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return
      e.preventDefault()
      setDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y }
    },
    [scale, translate]
  )

  // Drag move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setTranslate({
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy
      })
    },
    [dragging]
  )

  // Drag end
  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  // Double click to reset
  const handleDoubleClick = useCallback(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])

  const transformStyle = {
    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
    transformOrigin: 'center center',
    transition: dragging ? 'none' : 'transform 0.15s ease-out'
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex gap-1 rounded-lg overflow-hidden border ${theme.border}`}
      style={{ height: '400px' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <svg className={`w-8 h-8 animate-spin ${theme.textDim}`} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {files.map((file, i) => (
        <div key={file.id} className="flex-1 overflow-hidden relative bg-black/20">
          {thumbnails[i] ? (
            <img
              src={thumbnails[i]!}
              alt={file.name}
              className="w-full h-full object-contain pointer-events-none select-none"
              style={transformStyle}
              draggable={false}
            />
          ) : !loading ? (
            <div className={`w-full h-full flex items-center justify-center text-sm ${theme.textDim}`}>
              无法加载
            </div>
          ) : null}
        </div>
      ))}

      {/* Zoom indicator */}
      <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-mono
        ${scale > 1 ? 'bg-blue-500/80 text-white' : 'bg-black/50 text-white/70'}`}>
        {scale.toFixed(1)}x
      </div>

      {/* Instructions */}
      {scale <= 1 && !loading && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white/60 text-xs">
          滚轮缩放 · 拖动平移 · 双击重置
        </div>
      )}

      {/* Cursor */}
      <style>{`
        .cursor-grab { cursor: grab; }
        .cursor-grabbing { cursor: grabbing; }
      `}</style>
      {scale > 1 && (
        <div
          className="absolute inset-0 z-20"
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        />
      )}
    </div>
  )
}
