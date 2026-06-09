import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import type { ThemeClasses } from '../../types/theme'
import CompressPanel from './CompressPanel'

interface IdPhotoExecuteProps {
  theme: ThemeClasses
}

export default function IdPhotoExecute({ theme }: IdPhotoExecuteProps) {
  const { t } = useTranslation()
  const { phase, mode, result, outputPath, selectedPreset, selectedBgColor } = useIdPhotoStore()
  const [outputThumbnail, setOutputThumbnail] = useState<string | null>(null)

  useEffect(() => {
    if (phase === 'done' && result?.success && outputPath) {
      window.api.getThumbnail(outputPath, 400).then(setOutputThumbnail).catch(() => {})
    }
  }, [phase, result, outputPath])

  const isRecolor = mode === 'recolor'

  if (phase === 'executing') {
    return (
      <div className="h-full flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-md w-full text-center">
          <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>
              {isRecolor ? t('idphoto.executing_recolor') : t('idphoto.executing_create')}
            </h2>
            <div className={`flex items-center justify-center gap-2 ${theme.textDim}`}>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('idphoto.processing')}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Done phase
  const isSuccess = result?.success ?? false

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-lg w-full text-center">
        <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
          {isSuccess ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">
                {isRecolor ? t('idphoto.successRecolor') : t('idphoto.successCreate')}
              </h2>

              {outputThumbnail && (
                <div className="my-4 flex justify-center">
                  <img
                    src={outputThumbnail}
                    alt="处理结果"
                    className="rounded-lg shadow-lg border-2 border-green-500/30 max-h-48 object-contain"
                  />
                </div>
              )}

              {isRecolor ? (
                <div className={`space-y-1 text-sm mb-4 ${theme.textDim}`}>
                  <p>
                    {t('idphoto.bgColorLabel')}: <span className={theme.text}>{selectedBgColor.label}</span>
                  </p>
                </div>
              ) : (
                selectedPreset && (
                  <div className={`space-y-1 text-sm mb-4 ${theme.textDim}`}>
                    <p>
                      {t('idphoto.size')}: <span className={theme.text}>{selectedPreset.label}</span>
                    </p>
                    <p>
                      {t('idphoto.pixels')}: <span className={theme.text}>{selectedPreset.widthPx} × {selectedPreset.heightPx}</span>
                    </p>
                    <p>
                      DPI: <span className={theme.text}>{selectedPreset.dpi}</span>
                    </p>
                  </div>
                )
              )}

              {outputPath && (
                <p className={`text-xs mb-6 ${theme.textDim} truncate`} title={outputPath}>
                  {t('idphoto.savedTo', { path: outputPath })}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mb-4">
                <button
                  onClick={() => useIdPhotoStore.getState().setPhase('print_layout')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('idphoto.makePrintLayout')}
                </button>
              </div>

              {/* Compress panel */}
              <CompressPanel theme={theme} />
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                {isRecolor ? t('idphoto.failRecolor') : t('idphoto.failCreate')}
              </h2>
              <p className="text-sm text-red-300 mb-6">
                {result?.error || t('idphoto.processFailed')}
              </p>
            </>
          )}

          <button
            onClick={() => useIdPhotoStore.getState().reset()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {isRecolor ? t('idphoto.newRecolor') : t('idphoto.newIdPhoto')}
          </button>
        </div>
      </div>
    </div>
  )
}
