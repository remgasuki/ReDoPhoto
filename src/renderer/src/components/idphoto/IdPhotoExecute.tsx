import { useState, useEffect } from 'react'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import type { ThemeClasses } from '../../types/theme'

interface IdPhotoExecuteProps {
  theme: ThemeClasses
}

export default function IdPhotoExecute({ theme }: IdPhotoExecuteProps) {
  const { phase, result, outputPath, selectedPreset, setPhase } = useIdPhotoStore()
  const [outputThumbnail, setOutputThumbnail] = useState<string | null>(null)

  useEffect(() => {
    if (phase === 'done' && result?.success && outputPath) {
      window.api.getThumbnail(outputPath, 400).then(setOutputThumbnail).catch(() => {})
    }
  }, [phase, result, outputPath])

  if (phase === 'executing') {
    return (
      <div className="h-full flex items-center justify-center p-8 animate-fade-in">
        <div className="max-w-md w-full text-center">
          <div className={`rounded-xl p-8 transition-colors ${theme.card}`}>
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className={`text-xl font-semibold mb-2 ${theme.text}`}>正在生成证件照...</h2>
            <div className={`flex items-center justify-center gap-2 ${theme.textDim}`}>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>处理中...</span>
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
              <h2 className="text-xl font-semibold text-green-400 mb-2">证件照生成完成！</h2>

              {outputThumbnail && (
                <div className="my-4 flex justify-center">
                  <img
                    src={outputThumbnail}
                    alt="生成的证件照"
                    className="rounded-lg shadow-lg border-2 border-green-500/30 max-h-48 object-contain"
                  />
                </div>
              )}

              {selectedPreset && (
                <div className={`space-y-1 text-sm mb-4 ${theme.textDim}`}>
                  <p>
                    尺寸: <span className={theme.text}>{selectedPreset.label}</span>
                  </p>
                  <p>
                    像素: <span className={theme.text}>{selectedPreset.widthPx} × {selectedPreset.heightPx}</span>
                  </p>
                  <p>
                    DPI: <span className={theme.text}>{selectedPreset.dpi}</span>
                  </p>
                </div>
              )}

              {outputPath && (
                <p className={`text-xs mb-6 ${theme.textDim} truncate`} title={outputPath}>
                  保存至: {outputPath}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">生成失败</h2>
              <p className="text-sm text-red-300 mb-6">
                {result?.error || '未知错误'}
              </p>
            </>
          )}

          <button
            onClick={() => useIdPhotoStore.getState().reset()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            制作新的证件照
          </button>
        </div>
      </div>
    </div>
  )
}
