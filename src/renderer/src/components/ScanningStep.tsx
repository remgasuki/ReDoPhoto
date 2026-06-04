import { useScanStore } from '../stores/scanStore'

export default function ScanningStep() {
  const progress = useScanStore((s) => s.progress)

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'scanning': return '正在扫描文件夹...'
      case 'hashing': return '正在计算文件哈希值...'
      case 'phashing': return '正在计算感知哈希...'
      case 'grouping': return '正在分组重复照片...'
      case 'done': return '扫描完成'
      default: return '处理中...'
    }
  }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'scanning': return '📂'
      case 'hashing': return '🔍'
      case 'phashing': return '🖼️'
      case 'grouping': return '📊'
      default: return '⏳'
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-md w-full text-center">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['导入', '扫描', '对比', '执行'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${i <= 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                {i < 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i <= 1 ? 'text-blue-400' : 'text-slate-500'}`}>{step}</span>
              {i < 3 && <div className="w-8 h-px bg-slate-700 ml-1" />}
            </div>
          ))}
        </div>

        {/* Progress display */}
        <div className="bg-slate-800 rounded-xl p-8">
          <div className="text-5xl mb-4">{getPhaseIcon(progress?.phase || 'scanning')}</div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            {getPhaseLabel(progress?.phase || 'scanning')}
          </h2>

          {progress && (
            <>
              <p className="text-sm text-slate-400 mb-6">
                {progress.current} / {progress.total} 个文件
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-slate-500">{progress.percentage}%</p>
            </>
          )}

          {!progress && (
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>准备中...</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-600">请耐心等待，不要关闭应用程序</p>
      </div>
    </div>
  )
}
