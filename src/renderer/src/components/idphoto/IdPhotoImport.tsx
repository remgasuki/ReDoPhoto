import { useIdPhotoStore } from '../../stores/idphotoStore'
import { ID_PHOTO_SIZE_PRESETS, BG_COLOR_OPTIONS, PRESET_CATEGORY_LABELS } from '../../types/idphoto'
import type { IdPhotoSizePreset, BgColorOption } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'

interface IdPhotoImportProps {
  theme: ThemeClasses
}

export default function IdPhotoImport({ theme }: IdPhotoImportProps) {
  const {
    sourcePath, sourceImageBase64, sourceWidth, sourceHeight,
    selectedPreset, selectedBgColor, error,
    setSourcePath, setSourceImage, setSelectedPreset, setSelectedBgColor,
    setCropRect, setPhase, setError
  } = useIdPhotoStore()

  const handleSelectImage = async () => {
    try {
      const path = await window.api.selectImage()
      if (!path) return
      setSourcePath(path)
      setError(null)

      // Get image info for original dimensions
      const info = await window.api.getImageInfo(path)

      // Get thumbnail for preview (base64)
      const base64 = await window.api.getThumbnail(path, 800)
      setSourceImage(base64, info.width, info.height)
    } catch (err) {
      setError('选择照片失败: ' + String(err))
    }
  }

  const handleStartPreview = () => {
    if (!sourcePath || !selectedPreset || !sourceWidth || !sourceHeight) return

    // Calculate initial crop rect (centered, max area with target aspect ratio)
    const targetRatio = selectedPreset.widthPx / selectedPreset.heightPx
    const imgRatio = sourceWidth / sourceHeight

    let cropW: number, cropH: number, cropX: number, cropY: number
    if (imgRatio > targetRatio) {
      // Image is wider than needed
      cropH = sourceHeight
      cropW = sourceHeight * targetRatio
      cropX = (sourceWidth - cropW) / 2
      cropY = 0
    } else {
      // Image is taller than needed
      cropW = sourceWidth
      cropH = sourceWidth / targetRatio
      cropX = 0
      cropY = (sourceHeight - cropH) / 2
    }

    setCropRect({ x: cropX, y: cropY, width: cropW, height: cropH })
    setPhase('preview')
  }

  const categories = ['common', 'passport', 'special'] as const
  const canProceed = sourcePath && selectedPreset && sourceImageBase64

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Photo selection */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>选择照片</h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${theme.hoverBg} hover:border-blue-400`}
            onClick={handleSelectImage}
          >
            {sourceImageBase64 ? (
              <div className="flex items-center gap-4">
                <img
                  src={sourceImageBase64}
                  alt="已选照片"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="text-left">
                  <p className={`text-sm ${theme.text}`}>
                    {sourcePath?.split(/[\\/]/).pop()}
                  </p>
                  <p className={`text-xs mt-1 ${theme.textDim}`}>
                    {sourceWidth} × {sourceHeight} px
                  </p>
                  <p className={`text-xs mt-1 text-blue-400`}>点击重新选择</p>
                </div>
              </div>
            ) : (
              <>
                <svg className={`w-12 h-12 mx-auto mb-3 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className={`text-sm ${theme.textMuted}`}>点击选择一张照片</p>
                <p className={`text-xs mt-1 ${theme.textDim}`}>支持 JPG、PNG、BMP、WebP 格式</p>
              </>
            )}
          </div>
        </div>

        {/* Size presets */}
        {sourceImageBase64 && (
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>选择证件照尺寸</h3>
            <div className="space-y-4">
              {categories.map((cat) => {
                const presets = ID_PHOTO_SIZE_PRESETS.filter((p) => p.category === cat)
                if (presets.length === 0) return null
                return (
                  <div key={cat}>
                    <p className={`text-xs font-medium mb-2 ${theme.textDim}`}>
                      {PRESET_CATEGORY_LABELS[cat]}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {presets.map((preset) => (
                        <PresetCard
                          key={preset.key}
                          preset={preset}
                          isSelected={selectedPreset?.key === preset.key}
                          onClick={() => setSelectedPreset(preset)}
                          theme={theme}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Background color */}
        {selectedPreset && (
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>背景颜色</h3>
            <div className="flex gap-3 flex-wrap">
              {BG_COLOR_OPTIONS.map((opt) => (
                <BgColorButton
                  key={opt.key}
                  option={opt}
                  isSelected={selectedBgColor.key === opt.key}
                  onClick={() => setSelectedBgColor(opt)}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        {/* Action button */}
        {sourceImageBase64 && selectedPreset && (
          <button
            onClick={handleStartPreview}
            disabled={!canProceed}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all
              ${canProceed
                ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25'
                : `bg-gray-500 opacity-50 cursor-not-allowed ${theme.textDim}`
              }`}
          >
            预览裁剪
          </button>
        )}
      </div>
    </div>
  )
}

function PresetCard({
  preset, isSelected, onClick, theme
}: {
  preset: IdPhotoSizePreset
  isSelected: boolean
  onClick: () => void
  theme: ThemeClasses
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border text-left transition-all
        ${isSelected
          ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/30'
          : `${theme.card} ${theme.border} ${theme.hoverBg}`
        }`}
    >
      <p className={`text-sm font-semibold ${isSelected ? 'text-blue-400' : theme.text}`}>
        {preset.label}
      </p>
      <p className={`text-xs mt-1 ${theme.textDim}`}>
        {preset.widthMm}×{preset.heightMm}mm
      </p>
      <p className={`text-xs ${theme.textDim}`}>
        {preset.widthPx}×{preset.heightPx}px
      </p>
      <p className={`text-xs ${theme.textDim}`}>
        {preset.dpi} DPI
      </p>
    </button>
  )
}

function BgColorButton({
  option, isSelected, onClick, theme
}: {
  option: BgColorOption
  isSelected: boolean
  onClick: () => void
  theme: ThemeClasses
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-transparent' : theme.hoverBg}`}
    >
      {option.key === 'none' ? (
        <div className={`w-8 h-8 rounded-full border-2 ${theme.border} flex items-center justify-center`}>
          <svg className={`w-4 h-4 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ) : (
        <div
          className="w-8 h-8 rounded-full border-2 border-white/30 shadow-inner"
          style={{ backgroundColor: option.colorValue }}
        />
      )}
      <span className={`text-[10px] ${isSelected ? 'text-blue-400' : theme.textDim}`}>
        {option.label}
      </span>
    </button>
  )
}
