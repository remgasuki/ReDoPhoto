import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '../stores/settingsStore'
import { useNavStore } from '../stores/navStore'
import { themes } from '../types/theme'
import type { Language } from '../types'

const LANGUAGES: { key: Language; label: string }[] = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
]

interface SettingsPanelProps {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { t, i18n: i18nInst } = useTranslation()
  const { settings, updateSettings } = useSettingsStore()
  const activeFeature = useNavStore((s) => s.activeFeature)

  const currentTheme = themes.find(t => t.key === settings.themeColor) ?? themes[0]
  const theme = currentTheme.classes

  const handleLanguageChange = (lang: Language) => {
    updateSettings({ language: lang })
    i18nInst.changeLanguage(lang)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className={`rounded-xl w-full max-w-md mx-4 shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col transition-colors ${theme.card} ${theme.border}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${theme.border}`}>
          <h2 className={`text-lg font-semibold ${theme.text}`}>{t('settings.title')}</h2>
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
            <label className={`block text-sm font-medium mb-3 ${theme.textMuted}`}>{t('settings.themeColor')}</label>
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

          {/* Language */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${theme.textMuted}`}>{t('settings.language')}</label>
            <div className="grid grid-cols-4 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.key}
                  onClick={() => handleLanguageChange(lang.key)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all
                    ${settings.language === lang.key
                      ? 'ring-2 ring-blue-500 bg-blue-500/10 text-blue-400 font-semibold'
                      : `${theme.hoverBg} ${theme.textMuted}`
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Output folder suffix (global) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.outputFolderSuffix')}</label>
            <input
              type="text"
              value={settings.outputFolderSuffix}
              onChange={(e) => updateSettings({ outputFolderSuffix: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
              placeholder="New"
            />
            <p className={`text-xs mt-1 ${theme.textDim}`}>
              {t('settings.outputFolderHint', { suffix: settings.outputFolderSuffix })}
            </p>
          </div>

          {/* Feature-specific settings */}
          {activeFeature === 'dedup' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>{t('settings.dedup.title')}</h3>

              {/* Hash mode */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.dedup.hashMode')}</label>
                <div className="space-y-2">
                  {([
                    { value: 'sha256' as const, label: t('settings.dedup.hashMode_sha256'), desc: t('settings.dedup.hashMode_sha256_desc') },
                    { value: 'phash' as const, label: t('settings.dedup.hashMode_phash'), desc: t('settings.dedup.hashMode_phash_desc') },
                    { value: 'both' as const, label: t('settings.dedup.hashMode_both'), desc: t('settings.dedup.hashMode_both_desc') }
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
                    {t('settings.dedup.phashThreshold')}: <span className="text-blue-400">{settings.dedup.phashThreshold}</span>
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
                    <span>{t('settings.dedup.phashStrict')}</span>
                    <span>{t('settings.dedup.phashLoose')}</span>
                  </div>
                </div>
              )}

              {/* Output mode */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.dedup.outputMode')}</label>
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
                      <div className={`text-sm ${theme.text}`}>{t('settings.dedup.outputMode_copy')}</div>
                      <div className={`text-xs ${theme.textDim}`}>{t('settings.dedup.outputMode_copy_desc')}</div>
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
                      <div className={`text-sm ${theme.text}`}>{t('settings.dedup.outputMode_delete')}</div>
                      <div className="text-xs text-red-400/70">{t('settings.dedup.outputMode_delete_desc')}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'rename' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>{t('settings.rename.title')}</h3>

              {/* Name format */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.rename.nameFormat')}</label>
                <input
                  type="text"
                  value={settings.rename.nameFormat}
                  onChange={(e) => updateSettings({ rename: { nameFormat: e.target.value } })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.inputText}`}
                  placeholder="{date}_{location}_{seq}"
                />
                <p className={`text-xs mt-1 ${theme.textDim}`}>
                  {t('settings.rename.nameFormatHint', { date: '{date}', location: '{location}', seq: '{seq}' })}
                </p>
              </div>

              {/* Date format */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.rename.dateFormat')}</label>
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
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.rename.outputMode')}</label>
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
                      <div className={`text-sm ${theme.text}`}>{t('settings.rename.outputMode_copy')}</div>
                      <div className={`text-xs ${theme.textDim}`}>{t('settings.rename.outputMode_copy_desc')}</div>
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
                      <div className={`text-sm ${theme.text}`}>{t('settings.rename.outputMode_renameInPlace')}</div>
                      <div className="text-xs text-amber-400/70">{t('settings.rename.outputMode_renameInPlace_desc')}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'orientation' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>{t('settings.orientation.title')}</h3>

              {/* Output mode */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.orientation.outputMode')}</label>
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
                      <div className={`text-sm ${theme.text}`}>{t('settings.orientation.outputMode_copy')}</div>
                      <div className={`text-xs ${theme.textDim}`}>{t('settings.orientation.outputMode_copy_desc')}</div>
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
                      <div className={`text-sm ${theme.text}`}>{t('settings.orientation.outputMode_fixInPlace')}</div>
                      <div className="text-xs text-amber-400/70">{t('settings.orientation.outputMode_fixInPlace_desc')}</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'idphoto' && (
            <div className={`border-t pt-4 ${theme.border}`}>
              <h3 className={`text-sm font-semibold mb-4 text-blue-400`}>{t('settings.idphoto.title')}</h3>

              {/* Output format */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>{t('settings.idphoto.outputFormat')}</label>
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
                      <div className={`text-xs ${theme.textDim}`}>{t('settings.idphoto.format_jpg_desc')}</div>
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
                      <div className={`text-xs ${theme.textDim}`}>{t('settings.idphoto.format_png_desc')}</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textMuted}`}>
                  {t('settings.idphoto.quality')}: <span className="text-blue-400">{settings.idphoto.quality}</span>
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
                  <span>{t('settings.idphoto.qualityLow')}</span>
                  <span>{t('settings.idphoto.qualityHigh')}</span>
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
            {t('settings.done')}
          </button>
        </div>
      </div>
    </div>
  )
}
