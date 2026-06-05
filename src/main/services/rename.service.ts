import * as fs from 'fs'
import * as path from 'path'
import exifr from 'exifr'
import type { FileInfo } from './scanner.service'

export interface ExifInfo {
  id: string
  dateTimeOriginal: string | null
  gpsLatitude: number | null
  gpsLongitude: number | null
  locationName: string | null
  originalName: string
}

export interface RenamePreview {
  id: string
  originalPath: string
  originalName: string
  newName: string
  newPath: string
  exifInfo: ExifInfo
  selected: boolean
}

export interface RenameConfig {
  outputMode: 'copy' | 'rename-in-place'
  nameFormat: string
  dateFormat: string
  separator: string
}

const EXIF_BATCH_SIZE = 10

// Geocode cache: round coords to ~1km precision
const geocodeCache = new Map<string, string | null>()

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)}_${lon.toFixed(2)}`
}

export async function extractExifBatch(
  files: FileInfo[],
  onProgress?: (current: number, total: number) => void
): Promise<ExifInfo[]> {
  const results: ExifInfo[] = []
  const total = files.length

  for (let i = 0; i < total; i += EXIF_BATCH_SIZE) {
    const batch = files.slice(i, i + EXIF_BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (file): Promise<ExifInfo> => {
        try {
          const exif = await exifr.parse(file.path, {
            pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude']
          })

          let dateTime: string | null = null
          let lat: number | null = null
          let lon: number | null = null

          if (exif) {
            if (exif.DateTimeOriginal) {
              dateTime = exif.DateTimeOriginal instanceof Date
                ? exif.DateTimeOriginal.toISOString()
                : String(exif.DateTimeOriginal)
            }
            if (exif.latitude !== undefined && exif.longitude !== undefined) {
              lat = exif.latitude
              lon = exif.longitude
            } else if (exif.GPSLatitude !== undefined && exif.GPSLongitude !== undefined) {
              lat = typeof exif.GPSLatitude === 'number' ? exif.GPSLatitude : null
              lon = typeof exif.GPSLongitude === 'number' ? exif.GPSLongitude : null
            }
          }

          return {
            id: file.id,
            dateTimeOriginal: dateTime,
            gpsLatitude: lat,
            gpsLongitude: lon,
            locationName: null,
            originalName: file.name
          }
        } catch {
          return {
            id: file.id,
            dateTimeOriginal: null,
            gpsLatitude: null,
            gpsLongitude: null,
            locationName: null,
            originalName: file.name
          }
        }
      })
    )
    results.push(...batchResults)
    if (onProgress) onProgress(Math.min(i + EXIF_BATCH_SIZE, total), total)
    await new Promise((resolve) => setImmediate(resolve))
  }

  return results
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = getCacheKey(lat, lon)
  if (geocodeCache.has(key)) return geocodeCache.get(key)!

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh&zoom=10`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ReDoPhoto/2.0' }
    })
    if (!response.ok) throw new Error('Geocode failed')
    const data = await response.json() as any
    const addr = data.address || {}
    const name = addr.city || addr.town || addr.village || addr.county || addr.state || null
    geocodeCache.set(key, name)
    return name
  } catch {
    geocodeCache.set(key, null)
    return null
  }
}

export async function reverseGeocodeBatch(
  coords: Array<{ lat: number; lon: number }>,
  onProgress?: (current: number, total: number) => void
): Promise<(string | null)[]> {
  const results: (string | null)[] = []
  const total = coords.length

  for (let i = 0; i < total; i++) {
    const { lat, lon } = coords[i]
    const name = await reverseGeocode(lat, lon)
    results.push(name)
    if (onProgress) onProgress(i + 1, total)

    // Rate limit: 1 req/sec for Nominatim
    if (i < total - 1) {
      const key = getCacheKey(lat, lon)
      if (!geocodeCache.has(key) || geocodeCache.get(key) === null) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        await new Promise((resolve) => setImmediate(resolve))
      }
    }
  }

  return results
}

function formatDate(date: Date, format: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')

  return format
    .replace('YYYY', String(y))
    .replace('MM', m)
    .replace('DD', d)
    .replace('HH', h)
    .replace('mm', min)
}

export function generateRenamePreview(
  exifInfos: ExifInfo[],
  settings: RenameConfig,
  sourceFolder: string,
  fileMap: Map<string, FileInfo>
): RenamePreview[] {
  // Sort by date (null dates go to end)
  const sorted = [...exifInfos].sort((a, b) => {
    if (!a.dateTimeOriginal && !b.dateTimeOriginal) return 0
    if (!a.dateTimeOriginal) return 1
    if (!b.dateTimeOriginal) return -1
    return new Date(a.dateTimeOriginal).getTime() - new Date(b.dateTimeOriginal).getTime()
  })

  // Group by location for sequence numbering
  const locationCounters = new Map<string, number>()
  const previews: RenamePreview[] = []
  const usedNames = new Set<string>()

  for (const info of sorted) {
    const file = fileMap.get(info.id)
    if (!file) continue

    // Determine date string
    let dateStr = 'unknown-date'
    if (info.dateTimeOriginal) {
      try {
        dateStr = formatDate(new Date(info.dateTimeOriginal), settings.dateFormat)
      } catch {
        dateStr = 'unknown-date'
      }
    } else {
      // Fallback to file modified time
      try {
        dateStr = formatDate(new Date(file.modifiedTime), settings.dateFormat)
      } catch {
        // keep default
      }
    }

    // Determine location string
    let locationStr = 'unknown'
    if (info.locationName) {
      locationStr = info.locationName
    } else if (info.gpsLatitude !== null && info.gpsLongitude !== null) {
      locationStr = `${info.gpsLatitude.toFixed(2)}N${info.gpsLongitude.toFixed(2)}E`
    }

    // Build sequence number based on location group
    const locationKey = locationStr.toLowerCase()
    const currentSeq = (locationCounters.get(locationKey) || 0) + 1
    locationCounters.set(locationKey, currentSeq)
    const seqStr = String(currentSeq).padStart(2, '0')

    // Format the name
    let newName = settings.nameFormat
      .replace('{date}', dateStr)
      .replace('{location}', locationStr)
      .replace('{seq}', seqStr)

    // Add extension
    const ext = path.extname(file.name)
    newName = newName + ext

    // Handle name conflicts
    let finalName = newName
    let conflictCounter = 1
    while (usedNames.has(finalName.toLowerCase())) {
      const nameWithoutExt = newName.slice(0, -ext.length)
      finalName = `${nameWithoutExt}_${conflictCounter}${ext}`
      conflictCounter++
    }
    usedNames.add(finalName.toLowerCase())

    const destFolder = path.join(path.dirname(sourceFolder), path.basename(sourceFolder) + '_renamed')
    const newPath = settings.outputMode === 'copy'
      ? path.join(destFolder, finalName)
      : path.join(path.dirname(file.path), finalName)

    previews.push({
      id: info.id,
      originalPath: file.path,
      originalName: file.name,
      newName: finalName,
      newPath,
      exifInfo: info,
      selected: true
    })
  }

  return previews
}

export async function executeRename(
  previews: RenamePreview[],
  settings: RenameConfig,
  sourceFolder: string,
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = []
  let success = 0
  const total = previews.length

  if (settings.outputMode === 'copy') {
    // Copy mode: copy files to new folder with new names
    const destFolder = path.join(path.dirname(sourceFolder), path.basename(sourceFolder) + '_renamed')
    await fs.promises.mkdir(destFolder, { recursive: true })

    for (let i = 0; i < total; i++) {
      const preview = previews[i]
      if (onProgress) onProgress(i + 1, total, preview.originalName)

      const destPath = path.join(destFolder, preview.newName)
      try {
        await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
        await fs.promises.copyFile(preview.originalPath, destPath)
        success++
      } catch (err) {
        errors.push(`Failed to copy ${preview.originalName}: ${err}`)
      }

      if ((i + 1) % 20 === 0) await new Promise((resolve) => setImmediate(resolve))
    }
  } else {
    // Rename-in-place mode: use temp names to avoid conflicts
    const tempNames: Array<{ original: string; temp: string }> = []

    // Phase 1: rename all to temp names
    for (let i = 0; i < total; i++) {
      const preview = previews[i]
      const dir = path.dirname(preview.originalPath)
      const tempName = `__redophoto_temp_${i}_${Date.now()}${path.extname(preview.originalName)}`
      const tempPath = path.join(dir, tempName)

      try {
        await fs.promises.rename(preview.originalPath, tempPath)
        tempNames.push({ original: preview.originalPath, temp: tempPath })
      } catch (err) {
        errors.push(`Failed to temp-rename ${preview.originalName}: ${err}`)
      }
    }

    // Phase 2: rename from temp to final names
    for (let i = 0; i < tempNames.length; i++) {
      const preview = previews[i]
      if (onProgress) onProgress(i + 1, total, preview.newName)

      const dir = path.dirname(tempNames[i].original)
      const finalPath = path.join(dir, preview.newName)

      try {
        await fs.promises.rename(tempNames[i].temp, finalPath)
        success++
      } catch (err) {
        // Try to restore original name
        try {
          await fs.promises.rename(tempNames[i].temp, tempNames[i].original)
        } catch {
          // File is stuck with temp name
        }
        errors.push(`Failed to rename to ${preview.newName}: ${err}`)
      }

      if ((i + 1) % 20 === 0) await new Promise((resolve) => setImmediate(resolve))
    }
  }

  return { success, errors }
}
