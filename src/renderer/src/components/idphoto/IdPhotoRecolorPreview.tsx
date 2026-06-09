import { useTranslation } from 'react-i18next'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import { useSettingsStore } from '../../stores/settingsStore'
import type { ThemeClasses } from '../../types/theme'

interface IdPhotoRecolorPreviewProps {
  theme: ThemeClasses
}

export default function IdPhotoRecolorPreview({ theme }: IdPhotoRecolorPreviewProps) {
  const { t } = useTranslation()
  const {
    sourceImageBase64, recoloredImageBase64,
    selectedBgColor, sourcePath, useAIMatting,
    setPhase, setOutputPath, setResult, setError
  } = useIdPhotoStore()
  const settings = useSettingsStore((s) => s.settings)

  const handleSave = async () => {
    if (!sourcePath || !selectedBgColor.colorValue) return

    const defaultName = `证件照_换背景_${selectedBgColor.label}.${settings.idphoto.outputFormat}`

    try {
      const outputPath = await window.api.showSaveDialog(defaultName)
      if (!outputPath) return

      setOutputPath(outputPath)
      setPhase('executing')

      const result = useAIMatting
        ? await window.api.recolorIdPhotoAI({
            sourcePath,
            outputPath,
            targetBgColor: selectedBgColor.colorValue,
            tolerance: 60,
            outputFormat: settings.idphoto.outputFormat,
            quality: settings.idphoto.quality
          })
        : await window.api.recolorIdPhoto({
            sourcePath,
            outputPath,
            targetBgColor: selectedBgColor.colorValue,
            tolerance: 60,
            outputFormat: settings.idphoto.outputFormat,
            quality: settings.idphoto.quality
          })

      setResult(result)
      if (result.success) {
        setPhase('done')
      } else {
        setError(result.error || t('idphoto.processFailed'))
        setPhase('done')
      }
    } catch (err) {
      setError(t('idphoto.processFailed') + ': ' + String(err))
      setPhase('import')
    }
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className={`shrink-0 border-b px-4 py-3 transition-colors ${theme.card} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${theme.text}`}>{t('idphoto.recolorPreviewTitle')}</h2>
          <div className="flex gap-2 text-xs">
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              {t('idphoto.targetColor')}: {selectedBgColor.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content: side-by-side comparison */}
      <div className="flex-1 flex items-center justify-center gap-8 p-6 overflow-auto">
        {/* Original */}
        <div className="flex flex-col items-center gap-3">
          <p className={`text-sm font-medium ${theme.textMuted}`}>{t('idphoto.originalPhoto')}</p>
          {sourceImageBase64 && (
            <div className={`rounded-xl overflow-hidden shadow-lg border-2 ${theme.border}`}>
              <img
                src={sourceImageBase64}
                alt={t('idphoto.originalPhoto')}
                className="max-h-72 max-w-56 object-contain"
              />
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-2">
          <svg className={`w-8 h-8 ${theme.textDim}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Recolored */}
        <div className="flex flex-col items-center gap-3">
          <p className={`text-sm font-medium ${theme.textMuted}`}>{t('idphoto.resultEffect')}</p>
          {recoloredImageBase64 && (
            <div className="rounded-xl overflow-hidden shadow-lg border-2 border-blue-500/30">
              <img
                src={recoloredImageBase64}
                alt={t('idphoto.resultEffect')}
                className="max-h-72 max-w-56 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className={`px-6 py-2 text-center ${theme.textDim} text-xs`}>
        <p>{t('idphoto.recolorInfo')}</p>
      </div>

      {/* Bottom bar */}
      <div className={`shrink-0 border-t px-4 py-3 flex items-center justify-between transition-colors ${theme.card} ${theme.border}`}>
        <button
          onClick={() => setPhase('import')}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${theme.border.replace('border-', 'bg-')} ${theme.hoverBg} ${theme.textMuted}`}
        >
          {t('idphoto.back')}
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 rounded-lg text-sm font-semibold transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25"
        >
          {t('idphoto.saveAndGenerate')}
        </button>
      </div>
    </div>
  )
}
