import type { ThemeClasses } from '../types/theme'

interface TitleBarProps {
  theme: ThemeClasses
}

export default function TitleBar({ theme }: TitleBarProps) {
  return (
    <header className={`titlebar-drag h-9 border-b flex items-center justify-end px-4 shrink-0 transition-colors duration-300 ${theme.card} ${theme.border}`}>
      <div className="titlebar-no-drag flex items-center gap-2" style={{ marginRight: 138 }}>
      </div>
    </header>
  )
}
