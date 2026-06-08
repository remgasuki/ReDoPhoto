import { useSettingsStore } from '../stores/settingsStore'
import { useNavStore } from '../stores/navStore'
import { themes } from '../types/theme'

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, updateSettings } = useSettingsStore()
  const activeFeature = useNavStore((s) => s.activeFeature)

  const currentTheme = themes.find(t => t.key === settings.themeColor) ?? themes[0]
  const theme = currentTheme.classes

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className={`rounded-xl w-full max-w-md mx-4 shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col transition-colors ${theme.card} ${theme.border}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${theme.border}`}>
          <h2 className={`text-lg font-semibold ${theme.text}`}>设置</h2>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${theme.hoverBg} ${theme.textDim}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Theme color */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${theme.textMuted}`}>主题颜色</label>
            <div className="grid grid-cols-7 gap-2">
              {themes.map((t) => (
                <button
                  key={t.key}
                  onClick={() => updateSettings({ themeColor: t.key })}
                  className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg transition-all
                    ${settings.themeColor === t.key
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent'
                      : `${theme.hoverBg}`
                    }`}
                  title={t.label}
                >
                  <div
                    className="w-7 h-7 rounded-full border-2 border-white/20 shadow-inner"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className={`text-[10px] leading-tight ${theme.textDim}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Output folder suffix (global) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>输出文件夹后缀</label>
            <input
              type="text"
              value={settings.outputFolderSuffix}
              onChange={(e) => updateSettings({ outputFolderSuffix: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
              placeholder="New"
            />
            <p className={`text-xs mt-1 ${theme.textDim}`}>
              输出文件夹将命名为: 原文件夹名 + _{settings.outputFolderSuffix}
            </p>
          </div>

          {/* Feature-specific settings */}
          {activeFeature === 'dedup' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>照片去重设置</h3>

              {/* Hash mode */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>检测模式</label>
                <div className="space-y-2">
                  {([
                    { value: 'sha256' as const, label: '精确匹配 (SHA-256)', desc: '基于文件内容哈希，仅检测完全相同的文件' },
                    { value: 'phash' as const, label: '相似检测 (pHash)', desc: '基于感知哈希，检测视觉相似的照片' },
                    { value: 'both' as const, label: '组合模式', desc: '同时使用两种检测方式' }
                  ]).map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${settings.dedup.hashMode === option.value ? 'bg-blue-500/10 border border-blue-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                    >
                      <input
                        type="radio"
                        name="hashMode"
                        checked={settings.dedup.hashMode === option.value}
                        onChange={() => updateSettings({ dedup: { hashMode: option.value } })}
                        className="mt-0.5 accent-blue-500"
                      />
                      <div>
                        <div className={`text-sm ${theme.text}`}>{option.label}</div>
                        <div className={`text-xs ${theme.textDim}`}>{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* pHash threshold */}
              {(settings.dedup.hashMode === 'phash' || settings.dedup.hashMode === 'both') && (
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                    相似度阈值: <span className="text-blue-400">{settings.dedup.phashThreshold}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={settings.dedup.phashThreshold}
                    onChange={(e) => updateSettings({ dedup: { phashThreshold: Number(e.target.value) } })}
                    className="w-full accent-blue-500"
                  />
                  <div className={`flex justify-between text-xs mt-1 ${theme.textDim}`}>
                    <span>更严格 (1)</span>
                    <span>更宽松 (15)</span>
                  </div>
                </div>
              )}

              {/* Output mode */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>输出方式</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.dedup.outputMode === 'copy' ? 'bg-blue-500/10 border border-blue-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="dedupOutputMode"
                      checked={settings.dedup.outputMode === 'copy'}
                      onChange={() => updateSettings({ dedup: { outputMode: 'copy' } })}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>复制到新文件夹</div>
                      <div className={`text-xs ${theme.textDim}`}>保留文件复制到新文件夹，原文件夹不变</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.dedup.outputMode === 'delete' ? 'bg-red-500/10 border border-red-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="dedupOutputMode"
                      checked={settings.dedup.outputMode === 'delete'}
                      onChange={() => updateSettings({ dedup: { outputMode: 'delete' } })}
                      className="mt-0.5 accent-red-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>原位删除</div>
                      <div className="text-xs text-red-400/70">直接删除重复文件，此操作不可撤销！</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'rename' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>智能批量重命名设置</h3>

              {/* Name format */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>文件名格式</label>
                <input
                  type="text"
                  value={settings.rename.nameFormat}
                  onChange={(e) => updateSettings({ rename: { nameFormat: e.target.value } })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
                  placeholder="{date}_{location}_{seq}"
                />
                <p className={`text-xs mt-1 ${theme.textDim}`}>
                  变量: {'{date}'} 日期, {'{location}'} 地点, {'{seq}'} 序号
                </p>
              </div>

              {/* Date format */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>日期格式</label>
                <select
                  value={settings.rename.dateFormat}
                  onChange={(e) => updateSettings({ rename: { dateFormat: e.target.value } })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-10-01)</option>
                  <option value="YYYYMMDD">YYYYMMDD (20241001)</option>
                  <option value="YYYY-MM-DD_HHmm">YYYY-MM-DD_HHmm (2024-10-01_1330)</option>
                </select>
              </div>

              {/* Output mode */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>输出方式</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.rename.outputMode === 'copy' ? 'bg-blue-500/10 border border-blue-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="renameOutputMode"
                      checked={settings.rename.outputMode === 'copy'}
                      onChange={() => updateSettings({ rename: { outputMode: 'copy' } })}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>复制到新文件夹</div>
                      <div className={`text-xs ${theme.textDim}`}>以新文件名复制到新文件夹</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.rename.outputMode === 'rename-in-place' ? 'bg-amber-500/10 border border-amber-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="renameOutputMode"
                      checked={settings.rename.outputMode === 'rename-in-place'}
                      onChange={() => updateSettings({ rename: { outputMode: 'rename-in-place' } })}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>原位重命名</div>
                      <div className="text-xs text-amber-400/70">直接修改原文件名，此操作不可撤销！</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'orientation' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>无损旋转/裁剪设置</h3>

              {/* Output mode */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>输出方式</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.orientation.outputMode === 'copy' ? 'bg-blue-500/10 border border-blue-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="orientOutputMode"
                      checked={settings.orientation.outputMode === 'copy'}
                      onChange={() => updateSettings({ orientation: { outputMode: 'copy' } })}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>复制到新文件夹</div>
                      <div className={`text-xs ${theme.textDim}`}>仅复制已修复的文件到新目录</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.orientation.outputMode === 'fix-in-place' ? 'bg-amber-500/10 border border-amber-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="orientOutputMode"
                      checked={settings.orientation.outputMode === 'fix-in-place'}
                      onChange={() => updateSettings({ orientation: { outputMode: 'fix-in-place' } })}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>原位修复</div>
                      <div className="text-xs text-amber-400/70">直接覆盖原始文件，此操作不可撤销！</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'idphoto' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>证件照制作设置</h3>

              {/* Output format */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>输出格式</label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.idphoto.outputFormat === 'jpg' ? 'bg-blue-500/10 border border-blue-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="idphotoFormat"
                      checked={settings.idphoto.outputFormat === 'jpg'}
                      onChange={() => updateSettings({ idphoto: { outputFormat: 'jpg' } })}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>JPEG</div>
                      <div className={`text-xs ${theme.textDim}`}>常用格式，适合打印和分享</div>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                      ${settings.idphoto.outputFormat === 'png' ? 'bg-blue-500/10 border border-blue-500/30' : `border border-transparent ${theme.hoverBg}`}`}
                  >
                    <input
                      type="radio"
                      name="idphotoFormat"
                      checked={settings.idphoto.outputFormat === 'png'}
                      onChange={() => updateSettings({ idphoto: { outputFormat: 'png' } })}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <div className={`text-sm ${theme.text}`}>PNG</div>
                      <div className={`text-xs ${theme.textDim}`}>无损格式，文件较大</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                  输出质量: <span className="text-blue-400">{settings.idphoto.quality}</span>
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  value={settings.idphoto.quality}
                  onChange={(e) => updateSettings({ idphoto: { quality: Number(e.target.value) } })}
                  className="w-full accent-blue-500"
                />
                <div className={`flex justify-between text-xs mt-1 ${theme.textDim}`}>
                  <span>较小文件 (50)</span>
                  <span>最高质量 (100)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end shrink-0 ${theme.border}`}>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-semibold"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
