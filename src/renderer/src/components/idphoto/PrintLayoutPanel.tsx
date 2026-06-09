import { useState, useEffect } from 'react'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import { PRINT_LAYOUT_PRESETS } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'

interface PrintLayoutPanelProps {
  theme: ThemeClasses
}

export default function PrintLayoutPanel({ theme }: PrintLayoutPanelProps) {
  const {
    outputPath, printLayoutPreview, printLayoutResult,
    setPrintLayoutPreview, setPrintLayoutResult, setPhase, setError
  } = useIdPhotoStore()

  const [rows, setRows] = useState(2)
  const [cols, setCols] = useState(4)
  const [spacingMm, setSpacingMm] = useState(2)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('2inch_x8')

  // Load preview when params change
  useEffect(() => {
    if (!outputPath || rows <= 0 || cols <= 0) return
    let cancelled = false

    const loadPreview = async () => {
      setPreviewLoading(true)
      try {
        const preview = await window.api.getPrintLayoutPreview(outputPath, rows, cols, spacingMm)
        if (!cancelled) setPrintLayoutPreview(preview)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }

    const timer = setTimeout(loadPreview, 300) // debounce
    return () => { cancelled = true; clearTimeout(timer) }
  }, [outputPath, rows, cols, spacingMm, setPrintLayoutPreview])

  const handlePresetSelect = (key: string) => {
    setSelectedPreset(key)
    const preset = PRINT_LAYOUT_PRESETS.find((p) => p.key === key)
    if (preset && preset.rows > 0 && preset.cols > 0) {
      setRows(preset.rows)
      setCols(preset.cols)
    }
  }

  const handleGenerate = async () => {
    if (!outputPath) return
    setLoading(true)
    setError(null)

    try {
      const ext = outputPath.endsWith('.png') ? '.png' : '.jpg'
      const layoutPath = outputPath.replace(ext, `_print_layout${ext}`)

      const result = await window.api.generatePrintLayout({
        photoPath: outputPath,
        paperWidthInch: 6,
        paperHeightInch: 4,
        dpi: 300,
        rows,
        cols,
        spacingMm,
        outputPath: layoutPath,
        outputFormat: 'jpg',
        quality: 95
      })

      setPrintLayoutResult(result)
    } catch (err) {
      setError('排版生成失败: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className={`shrink-0 border-b px-4 py-3 transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${theme.text}`}>打印排版 (6寸相纸)</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          {previewLoading ? (
            <div className="text-center">
              <svg className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-2" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className={`text-xs ${theme.textDim}`}>生成预览中...</p>
            </div>
          ) : printLayoutPreview ? (
            <img
              src={printLayoutPreview}
              alt="排版预览"
              className="max-w-full max-h-full rounded-lg shadow-lg border border-white/10"
            />
          ) : (
            <p className={`text-sm ${theme.textDim}`}>请先选择一张证件照</p>
          )}
        </div>

        {/* Right panel */}
        <div className={`w-72 shrink-0 border-l p-4 space-y-4 overflow-y-auto ${theme.card} ${theme.border}`}>
          {/* Preset selection */}
          <div>
            <p className={`text-xs font-semibold mb-2 ${theme.textDim}`}>排版预设</p>
            <div className="flex flex-wrap gap-1.5">
              {PRINT_LAYOUT_PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handlePresetSelect(p.key)}
                  className={`px-2.5 py-1.5 rounded text-xs transition-colors
                    ${selectedPreset === p.key
                      ? 'bg-blue-600 text-white'
                      : `${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} ${theme.hoverBg}`
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom rows/cols */}
          {selectedPreset === 'custom' && (
            <div className="flex gap-2">
              <div>
                <label className={`text-[10px] ${theme.textDim}`}>行数</label>
                <input
                  type="number"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1} max={10}
                  className={`w-16 px-2 py-1.5 rounded text-xs ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
                />
              </div>
              <div>
                <label className={`text-[10px] ${theme.textDim}`}>列数</label>
                <input
                  type="number"
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1} max={10}
                  className={`w-16 px-2 py-1.5 rounded text-xs ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
                />
              </div>
            </div>
          )}

          {/* Spacing */}
          <div>
            <p className={`text-xs font-semibold mb-2 ${theme.textDim}`}>间距: {spacingMm}mm</p>
            <input
              type="range"
              min={0} max={10} step={0.5}
              value={spacingMm}
              onChange={(e) => setSpacingMm(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-blue-500/30 cursor-pointer accent-blue-500"
            />
          </div>

          {/* Info */}
          <div className={`rounded-lg p-3 ${theme.inputBg} space-y-1`}>
            <div className="flex justify-between text-xs">
              <span className={theme.textDim}>纸张</span>
              <span className={theme.text}>6×4英寸 (6寸)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={theme.textDim}>分辨率</span>
              <span className={theme.text}>300 DPI</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={theme.textDim}>排列</span>
              <span className={theme.text}>{rows}行 × {cols}列 = {rows * cols}张</span>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !outputPath}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all
              ${loading || !outputPath
                ? 'bg-gray-500 opacity-50 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
              }`}
          >
            {loading ? '生成中...' : '生成打印文件'}
          </button>

          {/* Result */}
          {printLayoutResult && (
            <div className={`rounded-lg p-3 ${printLayoutResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              {printLayoutResult.success ? (
                <div className="space-y-1">
                  <p className="text-xs text-green-400 font-semibold">排版生成成功!</p>
                  <p className={`text-[10px] ${theme.textDim}`}>
                    共 {printLayoutResult.actualCount} 张
                  </p>
                  {printLayoutResult.outputPath && (
                    <p className={`text-[10px] ${theme.textDim} truncate`} title={printLayoutResult.outputPath}>
                      保存至: {printLayoutResult.outputPath}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-red-400">{printLayoutResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t px-4 py-3 flex items-center justify-between transition-colors ${theme.card} ${theme.border}`}>
        <button
          onClick={() => setPhase('done')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
        >
          返回
        </button>
      </div>
    </div>
  )
}
