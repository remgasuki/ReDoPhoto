import { useNavStore, type Feature } from '../stores/navStore'
import type { ThemeClasses } from '../types/theme'

interface SidebarProps {
  theme: ThemeClasses
  onSettingsClick: () => void
}

const menuItems: { key: Feature; label: string; icon: JSX.Element }[] = [
  {
    key: 'dedup',
    label: '照片去重',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    key: 'rename',
    label: '智能批量重命名',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    key: 'orientation',
    label: '无损旋转/裁剪',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  }
]

export default function Sidebar({ theme, onSettingsClick }: SidebarProps) {
  const activeFeature = useNavStore((s) => s.activeFeature)
  const setFeature = useNavStore((s) => s.setFeature)

  return (
    <div className={`w-56 shrink-0 flex flex-col border-r transition-colors duration-300 ${theme.card} ${theme.border}`}>
      {/* Logo area */}
      <div className={`px-4 py-3 border-b ${theme.border}`}>
        <div className="flex items-center gap-2.5">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <span className={`text-sm font-bold ${theme.text}`}>ReDoPhoto</span>
            <p className={`text-[10px] ${theme.textDim}`}>照片管理工具</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeFeature === item.key
          return (
            <button
              key={item.key}
              onClick={() => setFeature(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all
                ${isActive
                  ? 'bg-blue-500/15 text-blue-400 font-semibold border-l-2 border-blue-500 pl-2.5'
                  : `${theme.textMuted} ${theme.hoverBg} border-l-2 border-transparent pl-2.5`
                }`}
            >
              <span className={isActive ? 'text-blue-400' : theme.textDim}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Settings button */}
      <div className={`px-2 py-2 border-t ${theme.border}`}>
        <button
          onClick={onSettingsClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${theme.textMuted} ${theme.hoverBg}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>设置</span>
        </button>
      </div>
    </div>
  )
}
