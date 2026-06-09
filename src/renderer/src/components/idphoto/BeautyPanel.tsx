import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import type { BeautyParams } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'

interface BeautyPanelProps {
  theme: ThemeClasses
}

export default function BeautyPanel({ theme }: BeautyPanelProps) {
  const { t } = useTranslation()
  const {
    sourcePath, beautyParams, setBeautyParams, setBeautyPreviewBase64
  } = useIdPhotoStore()

  const [loading, setLoading] = useState(false)
  const [localParams, setLocalParams] = useState<BeautyParams>(
    beautyParams ?? { smooth: 0, brightness: 0, contrast: 0 }
  )

  const hasChanges = localParams.smooth !== 0 || localParams.brightness !== 0 || localParams.contrast !== 0

  const handlePreview = async () => {
    if (!sourcePath || !hasChanges) return
    setLoading(true)
    try {
      const preview = await window.api.getBeautyPreview(sourcePath, localParams)
      useIdPhotoStore.getState().setBeautyPreviewBase64(preview)
      setBeautyParams(localParams)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const reset = { smooth: 0, brightness: 0, contrast: 0 }
    setLocalParams(reset)
    setBeautyParams(null)
    setBeautyPreviewBase64(null)
  }

  const beautyPreviewBase64 = useIdPhotoStore((s) => s.beautyPreviewBase64)

  return (
    <div className={`rounded-xl p-4 ${theme.card} ${theme.border} border space-y-3`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${theme.textMuted}`}>{t('idphoto.beauty.title')}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className={`text-xs px-2 py-1 rounded ${theme.hoverBg} ${theme.textDim} transition-colors`}
          >
            {t('idphoto.beauty.reset')}
          </button>
          <button
            onClick={handlePreview}
            disabled={loading || !hasChanges}
            className={`text-xs px-3 py-1 rounded transition-colors
              ${loading || !hasChanges
                ? 'bg-gray-500 opacity-50 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            {loading ? t('idphoto.beauty.processing') : t('idphoto.beauty.preview')}
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-2">
        <SliderRow
          label={t('idphoto.beauty.smooth')}
          value={localParams.smooth}
          min={0} max={100} step={1}
          onChange={(v) => setLocalParams({ ...localParams, smooth: v })}
          theme={theme}
        />
        <SliderRow
          label={t('idphoto.beauty.brightness')}
          value={localParams.brightness}
          min={-50} max={50} step={1}
          onChange={(v) => setLocalParams({ ...localParams, brightness: v })}
          theme={theme}
        />
        <SliderRow
          label={t('idphoto.beauty.contrast')}
          value={localParams.contrast}
          min={-50} max={50} step={1}
          onChange={(v) => setLocalParams({ ...localParams, contrast: v })}
          theme={theme}
        />
      </div>

      {/* Preview */}
      {beautyPreviewBase64 && (
        <div className="flex justify-center">
          <img
            src={beautyPreviewBase64}
            alt="美颜预览"
            className="max-h-40 rounded-lg shadow-md"
          />
        </div>
      )}

      <p className={`text-[10px] ${theme.textDim}`}>
        {t('idphoto.beauty.hint')}
      </p>
    </div>
  )
}

function SliderRow({
  label, value, min, max, step, onChange, theme
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  theme: ThemeClasses
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-12 shrink-0 ${theme.textDim}`}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none bg-blue-500/30 cursor-pointer accent-blue-500"
      />
      <span className={`text-xs w-8 text-right ${theme.textDim}`}>{value}</span>
    </div>
  )
}
