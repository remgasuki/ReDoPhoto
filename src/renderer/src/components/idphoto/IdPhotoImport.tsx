import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import type { IdPhotoMode } from '../../stores/idphotoStore'
import { useDropZone } from '../../hooks/useDropZone'
import { ID_PHOTO_SIZE_PRESETS, BG_COLOR_OPTIONS, GRADIENT_PRESETS, PRESET_CATEGORY_LABELS } from '../../types/idphoto'
import type { IdPhotoSizePreset, BgColorOption, CustomSizeTemplate, GradientBg } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'
import { mmToPx } from '../../utils/customTemplates'
import BeautyPanel from './BeautyPanel'
import ColorPicker from './ColorPicker'
import FormalWearSelector from './FormalWearSelector'

interface IdPhotoImportProps {
  theme: ThemeClasses
}

// Recolor mode only allows actual colors (not "none")
const RECOLOR_BG_OPTIONS = BG_COLOR_OPTIONS.filter((o) => o.key !== 'none')

export default function IdPhotoImport({ theme }: IdPhotoImportProps) {
  const { t } = useTranslation()
  const {
    mode, sourcePath, sourceImageBase64, sourceWidth, sourceHeight,
    selectedPreset, selectedBgColor, error, customTemplates, useAIMatting, selectedGradient,
    setMode, setSourcePath, setSourceImage, setSelectedPreset, setSelectedBgColor,
    setCropRect, setPhase, setError, setRecoloredImageBase64,
    addCustomTemplate, removeCustomTemplate, setUseAIMatting, setSelectedGradient
  } = useIdPhotoStore()

  const [recolorProcessing, setRecolorProcessing] = useState(false)
  const [showCustomColor, setShowCustomColor] = useState(false)
  const [showGradient, setShowGradient] = useState(false)

  // Custom template form
  const [customName, setCustomName] = useState('')
  const [customWidthMm, setCustomWidthMm] = useState('')
  const [customHeightMm, setCustomHeightMm] = useState('')

  const handleSelectImage = async () => {
    try {
      const path = await window.api.selectImage()
      if (!path) return
      await loadImage(path)
    } catch (err) {
      setError(t('idphoto.selectPhotoError') + ': ' + String(err))
    }
  }

  const loadImage = useCallback(async (path: string) => {
    setSourcePath(path)
    setError(null)
    setRecoloredImageBase64(null)
    const info = await window.api.getImageInfo(path)
    const base64 = await window.api.getThumbnail(path, 800)
    setSourceImage(base64, info.width, info.height)
  }, [setSourcePath, setError, setRecoloredImageBase64, setSourceImage])

  const { isDragActive, dropZoneProps } = useDropZone({
    accept: 'image',
    onDropImage: (path) => loadImage(path),
    onError: (msg) => setError(msg)
  })

  const handleStartCreatePreview = () => {
    if (!sourcePath || !selectedPreset || !sourceWidth || !sourceHeight) return

    const targetRatio = selectedPreset.widthPx / selectedPreset.heightPx
    const imgRatio = sourceWidth / sourceHeight

    let cropW: number, cropH: number, cropX: number, cropY: number
    if (imgRatio > targetRatio) {
      cropH = sourceHeight
      cropW = sourceHeight * targetRatio
      cropX = (sourceWidth - cropW) / 2
      cropY = 0
    } else {
      cropW = sourceWidth
      cropH = sourceWidth / targetRatio
      cropX = 0
      cropY = (sourceHeight - cropH) / 2
    }

    setCropRect({ x: cropX, y: cropY, width: cropW, height: cropH })
    setPhase('preview')
  }

  const handleStartRecolorPreview = async () => {
    if (!sourcePath || !selectedBgColor.colorValue) return
    setRecolorProcessing(true)
    setError(null)

    try {
      const preview = useAIMatting
        ? await window.api.getRecolorPreviewAI(sourcePath, selectedBgColor.colorValue)
        : await window.api.getRecolorPreview(sourcePath, selectedBgColor.colorValue, 60)
      setRecoloredImageBase64(preview)
      setPhase('recolor_preview')
    } catch (err) {
      setError(t('idphoto.previewFailed') + ': ' + String(err))
    } finally {
      setRecolorProcessing(false)
    }
  }

  const handleModeSwitch = (newMode: IdPhotoMode) => {
    setMode(newMode)
  }

  const handleAddCustomTemplate = () => {
    const w = parseFloat(customWidthMm)
    const h = parseFloat(customHeightMm)
    const name = customName.trim()
    if (!name || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      setError(t('idphoto.customSizeError'))
      return
    }
    const dpi = 300
    const template: CustomSizeTemplate = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      label: name,
      widthMm: w,
      heightMm: h,
      widthPx: mmToPx(w, dpi),
      heightPx: mmToPx(h, dpi),
      dpi,
      format: 'jpg',
      category: 'custom',
      createdAt: Date.now()
    }
    addCustomTemplate(template)
    setCustomName('')
    setCustomWidthMm('')
    setCustomHeightMm('')
    setError(null)
  }

  const categories = ['common', 'passport', 'visa', 'exam', 'special', 'custom'] as const

  return (
    <div className="h-full overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-black/10">
          <ModeTab active={mode === 'create'} onClick={() => handleModeSwitch('create')} theme={theme}>
            {t('idphoto.modeCreate')}
          </ModeTab>
          <ModeTab active={mode === 'recolor'} onClick={() => handleModeSwitch('recolor')} theme={theme}>
            {t('idphoto.modeRecolor')}
          </ModeTab>
        </div>

        {/* Photo selection */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>{t('idphoto.selectPhoto')}</h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragActive ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' : theme.hoverBg + ' hover:border-blue-400'}`}
            onClick={handleSelectImage}
            {...dropZoneProps}
          >
            {isDragActive ? (
              <>
                <svg className={`w-12 h-12 mx-auto mb-3 text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={`text-sm text-blue-400`}>{t('import.dropImageHere')}</p>
              </>
            ) : sourceImageBase64 ? (
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
                  <p className={`text-xs mt-1 text-blue-400`}>{t('idphoto.clickReselect')}</p>
                </div>
              </div>
            ) : (
              <>
                <svg className={`w-12 h-12 mx-auto mb-3 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className={`text-sm ${theme.textMuted}`}>
                  {mode === 'create' ? t('idphoto.clickSelect') : t('idphoto.clickSelectRecolor')}
                </p>
                <p className={`text-xs mt-1 ${theme.textDim}`}>{t('import.dragImageHint')}</p>
              </>
            )}
          </div>
        </div>

        {/* === Create mode: size presets === */}
        {mode === 'create' && sourceImageBase64 && (
          <>
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>{t('idphoto.selectSize')}</h3>
            <div className="space-y-4">
              {categories.map((cat) => {
                if (cat === 'custom') {
                  // Render custom templates
                  const customPresets: IdPhotoSizePreset[] = customTemplates.map((t) => ({
                    key: t.id,
                    label: t.label,
                    widthMm: t.widthMm,
                    heightMm: t.heightMm,
                    widthPx: t.widthPx,
                    heightPx: t.heightPx,
                    dpi: t.dpi,
                    format: t.format,
                    category: 'custom' as const
                  }))
                  return (
                    <div key={cat}>
                      <p className={`text-xs font-medium mb-2 ${theme.textDim}`}>
                        {t(`idphoto.categoryLabels.${cat}`)}
                      </p>
                      {customPresets.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {customPresets.map((preset) => (
                            <div key={preset.key} className="relative">
                              <PresetCard
                                preset={preset}
                                isSelected={selectedPreset?.key === preset.key}
                                onClick={() => setSelectedPreset(preset)}
                                theme={theme}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const tpl = customTemplates.find((t) => t.id === preset.key)
                                  if (tpl) removeCustomTemplate(tpl.id)
                                  if (selectedPreset?.key === preset.key) setSelectedPreset(ID_PHOTO_SIZE_PRESETS[0])
                                }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white text-xs transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Custom template form */}
                      <div className={`rounded-lg p-3 ${theme.inputBg} space-y-2`}>
                        <p className={`text-xs font-medium ${theme.textDim}`}>{t('idphoto.addCustomSize')}</p>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className={`text-[10px] ${theme.textDim}`}>{t('idphoto.name')}</label>
                            <input
                              type="text"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              placeholder={t('idphoto.customNamePlaceholder')}
                              className={`w-full px-2 py-1.5 rounded text-xs ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
                            />
                          </div>
                          <div className="w-16">
                            <label className={`text-[10px] ${theme.textDim}`}>{t('idphoto.widthMm')}</label>
                            <input
                              type="number"
                              value={customWidthMm}
                              onChange={(e) => setCustomWidthMm(e.target.value)}
                              placeholder="25"
                              min={1}
                              className={`w-full px-2 py-1.5 rounded text-xs ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
                            />
                          </div>
                          <div className="w-16">
                            <label className={`text-[10px] ${theme.textDim}`}>{t('idphoto.heightMm')}</label>
                            <input
                              type="number"
                              value={customHeightMm}
                              onChange={(e) => setCustomHeightMm(e.target.value)}
                              placeholder="35"
                              min={1}
                              className={`w-full px-2 py-1.5 rounded text-xs ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
                            />
                          </div>
                          <button
                            onClick={handleAddCustomTemplate}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                          >
                            {t('idphoto.add')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                const presets = ID_PHOTO_SIZE_PRESETS.filter((p) => p.category === cat)
                if (presets.length === 0) return null
                return (
                  <div key={cat}>
                    <p className={`text-xs font-medium mb-2 ${theme.textDim}`}>
                      {t(`idphoto.categoryLabels.${cat}`)}
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

          {/* Beauty Panel */}
          <BeautyPanel theme={theme} />

          {/* AI Matting Toggle */}
          <div className={`rounded-xl p-4 ${theme.card} ${theme.border} border`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-semibold ${theme.textMuted}`}>{t('idphoto.aiMatting')}</h3>
                <p className={`text-[10px] mt-0.5 ${theme.textDim}`}>{t('idphoto.aiMattingDesc')}</p>
              </div>
              <button
                onClick={() => setUseAIMatting(!useAIMatting)}
                className={`relative w-11 h-6 rounded-full transition-colors ${useAIMatting ? 'bg-blue-600' : theme.inputBg}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${useAIMatting ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
          </>
        )}

        {/* Background color */}
        {sourceImageBase64 && (mode === 'create' ? selectedPreset : true) && (
          <div>
            <h3 className={`text-sm font-semibold mb-3 ${theme.textMuted}`}>
              {mode === 'create' ? t('idphoto.bgColor') : t('idphoto.bgColorTarget')}
            </h3>
            <div className="flex gap-3 flex-wrap">
              {(mode === 'create' ? BG_COLOR_OPTIONS : RECOLOR_BG_OPTIONS).map((opt) => (
                <BgColorButton
                  key={opt.key}
                  option={opt}
                  isSelected={selectedBgColor.key === opt.key}
                  onClick={() => {
                    setSelectedBgColor(opt)
                    setRecoloredImageBase64(null)
                    setSelectedGradient(null)
                    setShowCustomColor(false)
                    setShowGradient(false)
                  }}
                  theme={theme}
                />
              ))}
              {/* Custom color button */}
              {mode === 'create' && (
                <button
                  onClick={() => {
                    setShowCustomColor(!showCustomColor)
                    setShowGradient(false)
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                    ${showCustomColor ? 'ring-2 ring-blue-500' : theme.hoverBg}`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 ${theme.border} flex items-center justify-center`}>
                    <svg className={`w-4 h-4 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className={`text-[10px] ${showCustomColor ? 'text-blue-400' : theme.textDim}`}>{t('idphoto.custom')}</span>
                </button>
              )}
              {/* Gradient button */}
              {mode === 'create' && useAIMatting && (
                <button
                  onClick={() => {
                    setShowGradient(!showGradient)
                    setShowCustomColor(false)
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                    ${showGradient ? 'ring-2 ring-blue-500' : theme.hoverBg}`}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white/30 shadow-inner bg-gradient-to-b from-blue-400 to-purple-600" />
                  <span className={`text-[10px] ${showGradient ? 'text-blue-400' : theme.textDim}`}>{t('idphoto.gradient')}</span>
                </button>
              )}
            </div>

            {/* Custom color picker */}
            {showCustomColor && (
              <div className="mt-3">
                <ColorPicker
                  value={selectedBgColor.key === 'custom' ? selectedBgColor.colorValue : ''}
                  onChange={(hex) => {
                    setSelectedBgColor({ key: 'custom', label: '自定义', colorValue: hex })
                    setSelectedGradient(null)
                  }}
                  theme={theme}
                />
              </div>
            )}

            {/* Gradient presets */}
            {showGradient && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {GRADIENT_PRESETS.map((g, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedGradient(g)
                      setSelectedBgColor({ key: 'none', label: '保持原背景', colorValue: '' })
                    }}
                    className={`w-16 h-16 rounded-lg border-2 transition-all
                      ${selectedGradient === g ? 'ring-2 ring-blue-500 border-blue-500' : `${theme.border} ${theme.hoverBg}`}`}
                    style={{
                      background: `linear-gradient(${g.angle}deg, ${g.colorStops.map((s) => `${s.color} ${s.offset * 100}%`).join(', ')})`
                    }}
                  />
                ))}
              </div>
            )}

            {mode === 'recolor' && (
              <p className={`text-xs mt-2 ${theme.textDim}`}>
                {t('idphoto.recolorHint')}
              </p>
            )}
          </div>
        )}

        {/* Formal wear selector (create mode only) */}
        {mode === 'create' && sourceImageBase64 && selectedPreset && useAIMatting && (
          <FormalWearSelector theme={theme} />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 animate-fade-in">
            {error}
          </div>
        )}

        {/* Action button */}
        {mode === 'create' && sourceImageBase64 && selectedPreset && (
          <button
            onClick={handleStartCreatePreview}
            className="w-full py-3 rounded-lg text-white font-semibold transition-all bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25"
          >
            {t('idphoto.previewCrop')}
          </button>
        )}

        {mode === 'recolor' && sourceImageBase64 && selectedBgColor.key !== 'none' && (
          <button
            onClick={handleStartRecolorPreview}
            disabled={recolorProcessing}
            className={`w-full py-3 rounded-lg text-white font-semibold transition-all
              ${recolorProcessing
                ? 'bg-gray-500 opacity-50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25'
              }`}
          >
            {recolorProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('idphoto.generatingPreview')}
              </span>
            ) : t('idphoto.previewEffect')}
          </button>
        )}
      </div>
    </div>
  )
}

function ModeTab({ active, onClick, theme, children }: {
  active: boolean
  onClick: () => void
  theme: ThemeClasses
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all
        ${active
          ? 'bg-blue-600 text-white shadow-sm'
          : `${theme.textMuted} ${theme.hoverBg}`
        }`}
    >
      {children}
    </button>
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
