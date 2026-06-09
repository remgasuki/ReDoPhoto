import type { CustomSizeTemplate } from '../types/idphoto'

const STORAGE_KEY = 'redophoto_custom_templates'

export function loadCustomTemplates(): CustomSizeTemplate[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CustomSizeTemplate[]
  } catch {
    return []
  }
}

export function saveCustomTemplate(template: CustomSizeTemplate): void {
  const templates = loadCustomTemplates()
  templates.push(template)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function deleteCustomTemplate(id: string): void {
  const templates = loadCustomTemplates().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}
