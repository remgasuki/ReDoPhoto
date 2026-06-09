import { useState } from 'react'
import type { ThemeClasses } from '../../types/theme'

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  theme: ThemeClasses
}

const QUICK_COLORS = [
  { label: '深蓝', color: '#003078' },
  { label: '浅蓝', color: '#438EDB' },
  { label: '红色', color: '#FF0000' },
  { label: '白色', color: '#FFFFFF' },
  { label: '灰色', color: '#CCCCCC' },
  { label: '浅灰', color: '#F0F0F0' },
]

export default function ColorPicker({ value, onChange, theme }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value || '#438EDB')

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(inputValue)

  const handleInputChange = (v: string) => {
    let hex = v
    if (!hex.startsWith('#')) hex = '#' + hex
    setInputValue(hex)
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex)
    }
  }

  return (
    <div className={`rounded-lg p-3 ${theme.inputBg} space-y-2`}>
      {/* Hex input */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full border-2 border-white/30 shadow-inner shrink-0"
          style={{ backgroundColor: isValidHex ? inputValue : '#999' }}
        />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="#438EDB"
          maxLength={7}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-mono ${theme.inputBg} ${theme.inputBorder} border ${theme.inputText} focus:outline-none focus:border-blue-500`}
        />
      </div>

      {/* Quick colors */}
      <div className="flex gap-1.5 flex-wrap">
        {QUICK_COLORS.map((c) => (
          <button
            key={c.color}
            onClick={() => {
              setInputValue(c.color)
              onChange(c.color)
            }}
            className={`flex flex-col items-center gap-0.5 p-1 rounded transition-all
              ${inputValue === c.color ? 'ring-2 ring-blue-500' : theme.hoverBg}`}
          >
            <div
              className="w-6 h-6 rounded-full border border-white/20"
              style={{ backgroundColor: c.color }}
            />
            <span className={`text-[9px] ${theme.textDim}`}>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
