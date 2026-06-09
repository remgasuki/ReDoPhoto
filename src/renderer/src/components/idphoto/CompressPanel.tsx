import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIdPhotoStore } from '../../stores/idphotoStore'
import type { CompressResult } from '../../types/idphoto'
import type { ThemeClasses } from '../../types/theme'

interface CompressPanelProps {
  theme: ThemeClasses
}

const QUICK_SIZES = [
  { label: '100KB', value: 100 },
  { label: '200KB', value: 200 },
  { label: '500KB', value: 500 },
]

export default function CompressPanel({ theme }: CompressPanelProps) {
  const { t } = useTranslation()
  const { outputPath, compressResult, setCompressResult } = useIdPhotoStore()
  const [targetKB, setTargetKB] = useState('200')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompress = async () => {
    if (!outputPath) return
    const target = parseInt(targetKB)
    if (isNaN(target) || target <= 0) {
      setError(t('idphoto.compress.invalidTarget'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Generate output path next to the original
      const ext = outputPath.endsWith('.png') ? '.png' : '.jpg'
      const compressedPath = outputPath.replace(ext, `_compressed${ext}`)

      const result = await window.api.compressToTargetSize({
        sourcePath: outputPath,
        outputPath: compressedPath,
        targetSizeKB: target
      })

      setCompressResult(result)
    } catch (err) {
      setError(t('idphoto.compress.compressFailed') + ': ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-xl p-4 ${theme.card} ${theme.border} border space-y-3`}>
      <h3 className={`text-sm font-semibold ${theme.textMuted}`}>{t('idphoto.compress.title')}</h3>

      {/* Quick size buttons */}
      <div className="flex gap-2 items-center">
        <span className={`text-xs ${theme.textDim}`}>{t('idphoto.compress.targetSize')}</span>
        <div className="flex gap-1.5">
          {QUICK_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setTargetKB(String(s.value))}
              className={`px-2 py-1 rounded text-xs transition-colors
                ${targetKB === String(s.value)
                  ? 'bg-blue-600 text-white'
                  : `${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} ${theme.hoverBg}`
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={targetKB}
            onChange={(e) => setTargetKB(e.target.value)}
            min={10}
            className={`w-16 px-2 py-1 rounded text-xs ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
          />
          <span className={`text-xs ${theme.textDim}`}>KB</span>
        </div>
      </div>

      {/* Compress button */}
      <button
        onClick={handleCompress}
        disabled={loading || !outputPath}
        className={`w-full py-2 rounded-lg text-sm font-semibold transition-all
          ${loading || !outputPath
            ? 'bg-gray-500 opacity-50 cursor-not-allowed text-white'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
          }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('idphoto.compress.compressing')}
          </span>
        ) : t('idphoto.compress.compress')}
      </button>

      {/* Result */}
      {compressResult && <CompressResultView result={compressResult} theme={theme} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}

function CompressResultView({ result, theme }: { result: CompressResult; theme: ThemeClasses }) {
  const { t } = useTranslation()
  return (
    <div className={`rounded-lg p-3 ${theme.inputBg} space-y-1.5`}>
      <div className="flex justify-between text-xs">
        <span className={theme.textDim}>{t('idphoto.compress.originalSize')}</span>
        <span className={theme.text}>{result.originalSizeKB.toFixed(1)} KB</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className={theme.textDim}>{t('idphoto.compress.compressedSize')}</span>
        <span className="text-green-400 font-semibold">{result.actualSizeKB.toFixed(1)} KB</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className={theme.textDim}>{t('idphoto.compress.compressRate')}</span>
        <span className={theme.text}>
          {result.originalSizeKB > 0
            ? ((1 - result.actualSizeKB / result.originalSizeKB) * 100).toFixed(1)
            : '0'}%
        </span>
      </div>
      <div className="flex justify-between text-xs">
        <span className={theme.textDim}>{t('idphoto.compress.jpegQuality')}</span>
        <span className={theme.text}>{result.quality}</span>
      </div>
      {result.outputPath && (
        <p className={`text-[10px] ${theme.textDim} truncate`} title={result.outputPath}>
          {t('idphoto.compress.savedTo')} {result.outputPath}
        </p>
      )}
    </div>
  )
}
