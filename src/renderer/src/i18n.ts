import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import ja from './locales/ja.json'

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    en: { translation: en },
    ja: { translation: ja }
  },
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false }
})

export default i18n
