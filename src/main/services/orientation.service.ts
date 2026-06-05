import * as fs from 'fs'
import * as path from 'path'
import exifr from 'exifr'
import sharp from 'sharp'
import type { FileInfo } from './scanner.service'

export interface OrientationInfo {
  id: string
  path: string
  name: string
  orientation: number | null
  needsFix: boolean
  description: string
}

export interface OrientationConfig {
  outputMode: 'copy' | 'fix-in-place'
}

const ORIENTATION_DESCRIPTIONS: Record<number, string> = {
  1: '正常 (无需修复)',
  2: '水平翻转',
  3: '旋转 180°',
  4: '垂直翻转',
  5: '旋转 90° 顺时针 + 水平翻转',
  6: '旋转 90° 顺时针',
  7: '旋转 90° 逆时针 + 水平翻转',
  8: '旋转 90° 逆时针'
}

const ORIENT_BATCH_SIZE = 20

export async function scanOrientations(
  files: FileInfo[],
  onProgress?: (current: number, total: number) => void
): Promise<OrientationInfo[]> {
  const results: OrientationInfo[] = []
  const total = files.length

  for (let i = 0; i < total; i += ORIENT_BATCH_SIZE) {
    const batch = files.slice(i, i + ORIENT_BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (file): Promise<OrientationInfo> => {
        try {
          const exif = await exifr.parse(file.path, { pick: ['Orientation'] })
          const orientation = exif?.Orientation ?? null
          const orientNum = typeof orientation === 'number' ? orientation : null

          return {
            id: file.id,
            path: file.path,
            name: file.name,
            orientation: orientNum,
            needsFix: orientNum !== null && orientNum !== 1,
            description: orientNum !== null
              ? `Orientation ${orientNum}: ${ORIENTATION_DESCRIPTIONS[orientNum] || '未知'}`
              : '无 Orientation 标签'
          }
        } catch {
          return {
            id: file.id,
            path: file.path,
            name: file.name,
            orientation: null,
            needsFix: false,
            description: '无法读取 EXIF 数据'
          }
        }
      })
    )
    results.push(...batchResults)
    if (onProgress) onProgress(Math.min(i + ORIENT_BATCH_SIZE, total), total)
    await new Promise((resolve) => setImmediate(resolve))
  }

  return results
}

export async function fixOrientations(
  files: OrientationInfo[],
  settings: OrientationConfig,
  sourceFolder: string,
  onProgress?: (current: number, total: number, currentFile: string) => void
): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = []
  let success = 0
  const filesToFix = files.filter((f) => f.needsFix)
  const total = filesToFix.length

  if (settings.outputMode === 'copy') {
    const destFolder = path.join(path.dirname(sourceFolder), path.basename(sourceFolder) + '_fixed')
    await fs.promises.mkdir(destFolder, { recursive: true })

    for (let i = 0; i < total; i++) {
      const info = filesToFix[i]
      if (onProgress) onProgress(i + 1, total, info.name)

      const relativePath = path.relative(sourceFolder, info.path)
      const destPath = path.join(destFolder, relativePath)

      try {
        await fs.promises.mkdir(path.dirname(destPath), { recursive: true })

        // Use sharp to auto-rotate based on EXIF orientation
        const buffer = await sharp(info.path)
          .rotate() // auto-rotates based on EXIF, then strips orientation tag
          .toBuffer()

        await fs.promises.writeFile(destPath, buffer)
        success++
      } catch (err) {
        errors.push(`Failed to fix ${info.name}: ${err}`)
      }

      if ((i + 1) % 5 === 0) await new Promise((resolve) => setImmediate(resolve))
    }
  } else {
    // Fix-in-place mode: write to temp file, then replace original
    for (let i = 0; i < total; i++) {
      const info = filesToFix[i]
      if (onProgress) onProgress(i + 1, total, info.name)

      const tempPath = info.path + '.tmp_fix'

      try {
        // Write rotated version to temp file
        const buffer = await sharp(info.path)
          .rotate()
          .toBuffer()

        await fs.promises.writeFile(tempPath, buffer)

        // Replace original with temp
        await fs.promises.unlink(info.path)
        await fs.promises.rename(tempPath, info.path)
        success++
      } catch (err) {
        // Clean up temp file if it exists
        try {
          await fs.promises.unlink(tempPath)
        } catch {
          // temp file doesn't exist
        }
        errors.push(`Failed to fix ${info.name}: ${err}`)
      }

      if ((i + 1) % 5 === 0) await new Promise((resolve) => setImmediate(resolve))
    }
  }

  return { success, errors }
}
