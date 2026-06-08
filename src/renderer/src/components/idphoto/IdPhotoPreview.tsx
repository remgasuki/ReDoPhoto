import { useRef, useEffect, useState, useCallback } from 'react'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { CropRect } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'

interface IdPhotoPreviewProps {
  theme: ThemeClasses
}

export default function IdPhotoPreview({ theme }: IdPhotoPreviewProps) {
  const {
    sourceImageBase64, sourceWidth, sourceHeight,
    selectedPreset, selectedBgColor, cropRect,
    setCropRect, setPhase, setOutputPath, setResult, setError
  } = useIdPhotoStore()
  const settings = useSettingsStore((s) => s.settings)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Display state
  const [displayScale, setDisplayScale] = useState(1)
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 450 })
  const [dragging, setDragging] = useState<'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cropStart, setCropStart] = useState<CropRect | null>(null)

  // Load image
  useEffect(() => {
    if (!sourceImageBase64) return
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
    }
    img.src = sourceImageBase64
  }, [sourceImageBase64])

  // Calculate canvas size and display scale
  useEffect(() => {
    if (!imageRef.current || !containerRef.current || !sourceWidth || !sourceHeight) return

    const container = containerRef.current
    const maxW = Math.min(container.clientWidth - 16, 700)
    const maxH = Math.min(container.clientHeight - 16, 550)
    const imgRatio = sourceWidth / sourceHeight
    let cw: number, ch: number

    if (maxW / maxH > imgRatio) {
      ch = maxH
      cw = ch * imgRatio
    } else {
      cw = maxW
      ch = cw / imgRatio
    }

    setCanvasSize({ w: Math.round(cw), h: Math.round(ch) })
    setDisplayScale(cw / sourceWidth)
  }, [imageLoaded, sourceWidth, sourceHeight])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current
    if (!canvas || !ctx || !img || !cropRect || !sourceWidth || !sourceHeight) return

    const scale = displayScale
    const cw = canvasSize.w
    const ch = canvasSize.h

    canvas.width = cw
    canvas.height = ch

    // Draw image
    ctx.drawImage(img, 0, 0, cw, ch)

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, cw, ch)

    // Clear crop area (show image)
    const cx = cropRect.x * scale
    const cy = cropRect.y * scale
    const cWidth = cropRect.width * scale
    const cHeight = cropRect.height * scale

    ctx.save()
    ctx.beginPath()
    ctx.rect(cx, cy, cWidth, cHeight)
    ctx.clip()
    ctx.drawImage(img, 0, 0, cw, ch)
    ctx.restore()

    // Crop border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(cx, cy, cWidth, cHeight)

    // Rule of thirds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + (cWidth * i) / 3, cy)
      ctx.lineTo(cx + (cWidth * i) / 3, cy + cHeight)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy + (cHeight * i) / 3)
      ctx.lineTo(cx + cWidth, cy + (cHeight * i) / 3)
      ctx.stroke()
    }

    // Corner handles
    const handleSize = 10
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    const corners = [
      { x: cx, y: cy },
      { x: cx + cWidth, y: cy },
      { x: cx, y: cy + cHeight },
      { x: cx + cWidth, y: cy + cHeight }
    ]
    corners.forEach(({ x, y }) => {
      ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
      ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
    })
  }, [cropRect, displayScale, canvasSize, sourceWidth, sourceHeight, imageLoaded])

  useEffect(() => {
    draw()
  }, [draw])

  // Mouse handlers
  const getMousePos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const hitTest = (pos: { x: number; y: number }): 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null => {
    if (!cropRect) return null
    const scale = displayScale
    const cx = cropRect.x * scale
    const cy = cropRect.y * scale
    const cWidth = cropRect.width * scale
    const cHeight = cropRect.height * scale
    const hs = 12

    const corners: Array<{ type: 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br'; x: number; y: number }> = [
      { type: 'resize-tl', x: cx, y: cy },
      { type: 'resize-tr', x: cx + cWidth, y: cy },
      { type: 'resize-bl', x: cx, y: cy + cHeight },
      { type: 'resize-br', x: cx + cWidth, y: cy + cHeight }
    ]

    for (const c of corners) {
      if (Math.abs(pos.x - c.x) < hs && Math.abs(pos.y - c.y) < hs) return c.type
    }

    if (pos.x >= cx && pos.x <= cx + cWidth && pos.y >= cy && pos.y <= cy + cHeight) return 'move'
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const hit = hitTest(pos)
    if (!hit || !cropRect) return
    setDragging(hit)
    setDragStart(pos)
    setCropStart({ ...cropRect })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !cropStart || !sourceWidth || !sourceHeight || !selectedPreset) return
    const pos = getMousePos(e)
    const dx = (pos.x - dragStart.x) / displayScale
    const dy = (pos.y - dragStart.y) / displayScale
    const targetRatio = selectedPreset.widthPx / selectedPreset.heightPx

    let newCrop: CropRect

    if (dragging === 'move') {
      newCrop = {
        x: Math.max(0, Math.min(sourceWidth - cropStart.width, cropStart.x + dx)),
        y: Math.max(0, Math.min(sourceHeight - cropStart.height, cropStart.y + dy)),
        width: cropStart.width,
        height: cropStart.height
      }
    } else {
      // Resize from corner, maintain aspect ratio
      let newW: number, newH: number, newX: number, newY: number

      if (dragging === 'resize-br') {
        newW = Math.max(50, cropStart.width + dx)
        newH = newW / targetRatio
        newX = cropStart.x
        newY = cropStart.y
      } else if (dragging === 'resize-bl') {
        newW = Math.max(50, cropStart.width - dx)
        newH = newW / targetRatio
        newX = cropStart.x + (cropStart.width - newW)
        newY = cropStart.y
      } else if (dragging === 'resize-tr') {
        newW = Math.max(50, cropStart.width + dx)
        newH = newW / targetRatio
        newX = cropStart.x
        newY = cropStart.y + (cropStart.height - newH)
      } else {
        // resize-tl
        newW = Math.max(50, cropStart.width - dx)
        newH = newW / targetRatio
        newX = cropStart.x + (cropStart.width - newW)
        newY = cropStart.y + (cropStart.height - newH)
      }

      // Clamp to image bounds
      if (newX < 0) { newW += newX; newH = newW / targetRatio; newX = 0 }
      if (newY < 0) { newH += newY; newW = newH * targetRatio; newY = 0 }
      if (newX + newW > sourceWidth) { newW = sourceWidth - newX; newH = newW / targetRatio }
      if (newY + newH > sourceHeight) { newH = sourceHeight - newY; newW = newH * targetRatio }

      newCrop = { x: newX, y: newY, width: newW, height: newH }
    }

    setCropRect(newCrop)
  }

  const handleMouseUp = () => {
    setDragging(null)
    setCropStart(null)
  }

  const handleGenerate = async () => {
    if (!cropRect || !selectedPreset || !sourcePath) return

    const preset = selectedPreset
    const defaultName = `证件照_${preset.label}_${preset.widthPx}x${preset.heightPx}.${settings.idphoto.outputFormat}`

    try {
      const outputPath = await window.api.showSaveDialog(defaultName)
      if (!outputPath) return

      setOutputPath(outputPath)
      setPhase('executing')

      const result = await window.api.processIdPhoto({
        sourcePath,
        outputPath,
        cropRect,
        targetWidthPx: preset.widthPx,
        targetHeightPx: preset.heightPx,
        dpi: preset.dpi,
        bgColor: selectedBgColor.colorValue || null,
        outputFormat: settings.idphoto.outputFormat,
        quality: settings.idphoto.quality
      })

      setResult(result)
      if (result.success) {
        setPhase('done')
      } else {
        setError(result.error || '处理失败')
        setPhase('done')
      }
    } catch (err) {
      setError('处理失败: ' + String(err))
      setPhase('import')
    }
  }

  const sourcePath = useIdPhotoStore((s) => s.sourcePath)

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className={`shrink-0 border-b px-4 py-3 transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${theme.text}`}>裁剪预览</h2>
          {selectedPreset && (
            <div className="flex gap-2 text-xs">
              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                {selectedPreset.label} ({selectedPreset.widthPx}×{selectedPreset.heightPx}px)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          {imageLoaded && cropRect && (
            <canvas
              ref={canvasRef}
              width={canvasSize.w}
              height={canvasSize.h}
              className="rounded-lg shadow-lg cursor-crosshair max-w-full max-h-full"
              style={{ width: canvasSize.w, height: canvasSize.h }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          )}
        </div>

        {/* Right info panel */}
        <div className={`w-64 shrink-0 border-l p-4 space-y-4 overflow-y-auto ${theme.card} ${theme.border}`}>
          {selectedPreset && (
            <div>
              <p className={`text-xs font-semibold mb-2 ${theme.textDim}`}>输出规格</p>
              <div className={`rounded-lg p-3 space-y-1.5 ${theme.inputBg}`}>
                <InfoRow label="尺寸" value={`${selectedPreset.label}`} theme={theme} />
                <InfoRow label="打印尺寸" value={`${selectedPreset.widthMm}×${selectedPreset.heightMm}mm`} theme={theme} />
                <InfoRow label="像素" value={`${selectedPreset.widthPx}×${selectedPreset.heightPx}px`} theme={theme} />
                <InfoRow label="分辨率" value={`${selectedPreset.dpi} DPI`} theme={theme} />
                <InfoRow label="格式" value={settings.idphoto.outputFormat.toUpperCase()} theme={theme} />
              </div>
            </div>
          )}

          {cropRect && sourceWidth && sourceHeight && (
            <div>
              <p className={`text-xs font-semibold mb-2 ${theme.textDim}`}>裁剪区域</p>
              <div className={`rounded-lg p-3 space-y-1.5 ${theme.inputBg}`}>
                <InfoRow label="起始 X" value={`${Math.round(cropRect.x)}px`} theme={theme} />
                <InfoRow label="起始 Y" value={`${Math.round(cropRect.y)}px`} theme={theme} />
                <InfoRow label="宽度" value={`${Math.round(cropRect.width)}px`} theme={theme} />
                <InfoRow label="高度" value={`${Math.round(cropRect.height)}px`} theme={theme} />
              </div>
            </div>
          )}

          {selectedBgColor.key !== 'none' && (
            <div>
              <p className={`text-xs font-semibold mb-2 ${theme.textDim}`}>背景颜色</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-white/20"
                  style={{ backgroundColor: selectedBgColor.colorValue }}
                />
                <span className={`text-sm ${theme.text}`}>{selectedBgColor.label}</span>
              </div>
            </div>
          )}

          <div className={`text-xs ${theme.textDim}`}>
            <p>拖动裁剪框调整位置</p>
            <p>拖动四角调整大小</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t px-4 py-3 flex items-center justify-between transition-colors ${theme.card} ${theme.border}`}>
        <button
          onClick={() => setPhase('import')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
        >
          返回
        </button>
        <button
          onClick={handleGenerate}
          className="px-6 py-2 rounded-lg text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
        >
          选择保存位置并生成
        </button>
      </div>
    </div>
  )
}

function InfoRow({ label, value, theme }: { label: string; value: string; theme: ThemeClasses }) {
  return (
    <div className="flex justify-between text-xs">
      <span className={theme.textDim}>{label}</span>
      <span className={theme.text}>{value}</span>
    </div>
  )
}
