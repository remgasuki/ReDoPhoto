export type ThemeColor = 'black' | 'white' | 'beige' | 'skyblue' | 'darkblue' | 'kleinblue' | 'gray'

export interface ThemeClasses {
  bg: string
  card: string
  border: string
  text: string
  textMuted: string
  textDim: string
  hoverBg: string
  inputBg: string
  inputBorder: string
  inputText: string
}

export interface ThemeOption {
  key: ThemeColor
  label: string
  swatch: string
  classes: ThemeClasses
}

export const themes: ThemeOption[] = [
  {
    key: 'black',
    label: '深灰色',
    swatch: '#0f172a',
    classes: {
      bg: 'bg-slate-900',
      card: 'bg-slate-800',
      border: 'border-slate-700',
      text: 'text-slate-100',
      textMuted: 'text-slate-300',
      textDim: 'text-slate-400',
      hoverBg: 'hover:bg-slate-700',
      inputBg: 'bg-slate-700',
      inputBorder: 'border-slate-600',
      inputText: 'text-slate-100'
    }
  },
  {
    key: 'white',
    label: '白色',
    swatch: '#f8fafc',
    classes: {
      bg: 'bg-gray-50',
      card: 'bg-white',
      border: 'border-gray-300',
      text: 'text-gray-900',
      textMuted: 'text-gray-700',
      textDim: 'text-gray-500',
      hoverBg: 'hover:bg-gray-200',
      inputBg: 'bg-white',
      inputBorder: 'border-gray-300',
      inputText: 'text-gray-900'
    }
  },
  {
    key: 'beige',
    label: '米色',
    swatch: '#f5f0e8',
    classes: {
      bg: 'bg-amber-50',
      card: 'bg-orange-50',
      border: 'border-amber-300',
      text: 'text-amber-950',
      textMuted: 'text-amber-800',
      textDim: 'text-amber-600',
      hoverBg: 'hover:bg-amber-200',
      inputBg: 'bg-white',
      inputBorder: 'border-amber-300',
      inputText: 'text-amber-950'
    }
  },
  {
    key: 'skyblue',
    label: '天蓝色',
    swatch: '#e0f2fe',
    classes: {
      bg: 'bg-sky-100',
      card: 'bg-sky-50',
      border: 'border-sky-300',
      text: 'text-sky-950',
      textMuted: 'text-sky-800',
      textDim: 'text-sky-600',
      hoverBg: 'hover:bg-sky-200',
      inputBg: 'bg-white',
      inputBorder: 'border-sky-300',
      inputText: 'text-sky-950'
    }
  },
  {
    key: 'darkblue',
    label: '深蓝色',
    swatch: '#172554',
    classes: {
      bg: 'bg-blue-950',
      card: 'bg-blue-900',
      border: 'border-blue-800',
      text: 'text-blue-50',
      textMuted: 'text-blue-200',
      textDim: 'text-blue-400',
      hoverBg: 'hover:bg-blue-800',
      inputBg: 'bg-blue-800',
      inputBorder: 'border-blue-700',
      inputText: 'text-blue-50'
    }
  },
  {
    key: 'kleinblue',
    label: '克莱因蓝',
    swatch: '#002FA7',
    classes: {
      bg: 'bg-indigo-950',
      card: 'bg-indigo-900',
      border: 'border-indigo-700',
      text: 'text-indigo-50',
      textMuted: 'text-indigo-200',
      textDim: 'text-indigo-400',
      hoverBg: 'hover:bg-indigo-800',
      inputBg: 'bg-indigo-800',
      inputBorder: 'border-indigo-600',
      inputText: 'text-indigo-50'
    }
  },
  {
    key: 'gray',
    label: '灰色',
    swatch: '#6b7280',
    classes: {
      bg: 'bg-gray-800',
      card: 'bg-gray-700',
      border: 'border-gray-600',
      text: 'text-gray-50',
      textMuted: 'text-gray-200',
      textDim: 'text-gray-400',
      hoverBg: 'hover:bg-gray-600',
      inputBg: 'bg-gray-600',
      inputBorder: 'border-gray-500',
      inputText: 'text-gray-50'
    }
  }
]

export const defaultTheme = themes[0]

export function getThemeClasses(color: ThemeColor): ThemeClasses {
  return themes.find(t => t.key === color)?.classes ?? defaultTheme.classes
}
