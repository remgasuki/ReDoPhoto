import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { scanFolder, type FileInfo } from '../services/scanner.service'
import {
  computeAllSHA256,
  computeAllPHash,
  generateThumbnail,
  type HashResult,
  type PhashResult
} from '../services/hash.service'
import {
  groupDuplicates,
  executeDedup,
  type DuplicateGroup,
  type DedupDecision,
  type DedupSettings
} from '../services/dedup.service'
import { getSettings, setSettings } from '../services/settings.service'
import {
  extractExifBatch,
  reverseGeocodeBatch,
  generateRenamePreview,
  executeRename,
  type ExifInfo,
  type RenameConfig
} from '../services/rename.service'
import {
  scanOrientations,
  fixOrientations,
  type OrientationInfo,
  type OrientationConfig
} from '../services/orientation.service'
import {
  processIdPhoto,
  getImageInfo,
  recolorBackground,
  getRecolorPreview,
  recolorBackgroundAI,
  getRecolorPreviewAI,
  type IdPhotoProcessParams,
  type RecolorParams
} from '../services/idphoto.service'
import { getBeautyPreview, type BeautyParams } from '../services/beauty.service'
import {
  compressToTargetSize,
  batchCompress,
  type CompressParams
} from '../services/compress.service'
import {
  generatePrintLayout,
  getPrintLayoutPreview,
  type PrintLayoutParams
} from '../services/print-layout.service'

let cachedFiles: FileInfo[] = []
const cachedFilesMap = new Map<string, FileInfo[]>()

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Window controls
  ipcMain.handle('window:minimize', () => mainWindow.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.handle('window:close', () => mainWindow.close())

  // Folder selection
  ipcMain.handle('folder:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: '选择照片文件夹'
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // Folder scanning
  ipcMain.handle('folder:scan', async (_event, { folderPath }: { folderPath: string }) => {
    const files = await scanFolder(folderPath, (current, total) => {
      mainWindow.webContents.send('scan:progress', {
        phase: 'scanning',
        current,
        total,
        percentage: Math.round((current / total) * 100)
      })
    })
    cachedFiles = files
    return files
  })

  // SHA-256 hash computation
  ipcMain.handle(
    'hash:computeAll',
    async (_event, { files }: { files: FileInfo[] }) => {
      return computeAllSHA256(files, (current, total) => {
        mainWindow.webContents.send('hash:progress', {
          phase: 'hashing',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        })
      })
    }
  )

  // pHash computation
  ipcMain.handle(
    'phash:computeAll',
    async (_event, { files }: { files: FileInfo[] }) => {
      return computeAllPHash(files, (current, total) => {
        mainWindow.webContents.send('hash:progress', {
          phase: 'phashing',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        })
      })
    }
  )

  // Group duplicates
  ipcMain.handle(
    'dedup:group',
    async (
      _event,
      {
        hashResults,
        phashResults,
        phashThreshold
      }: {
        hashResults: HashResult[]
        phashResults?: PhashResult[]
        phashThreshold?: number
      }
    ) => {
      return groupDuplicates(
        cachedFiles,
        hashResults,
        phashResults || [],
        phashThreshold || 5
      )
    }
  )

  // Execute dedup
  ipcMain.handle(
    'dedup:execute',
    async (
      _event,
      {
        decisions,
        settings,
        sourceFolder,
        files
      }: {
        decisions: DedupDecision[]
        settings: DedupSettings
        sourceFolder: string
        files: FileInfo[]
      }
    ) => {
      return executeDedup(
        decisions,
        files.length > 0 ? files : cachedFiles,
        [],
        settings,
        sourceFolder,
        (current, total, currentFile) => {
          mainWindow.webContents.send('dedup:progress', {
            current,
            total,
            currentFile,
            percentage: Math.round((current / total) * 100)
          })
        }
      )
    }
  )

  // Thumbnail generation
  ipcMain.handle(
    'file:thumbnail',
    async (_event, { filePath, maxSize }: { filePath: string; maxSize?: number }) => {
      return generateThumbnail(filePath, maxSize || 400)
    }
  )

  // Settings
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:set', (_event, partial) => setSettings(partial))

  // === Rename feature ===
  ipcMain.handle('rename:scanExif', async (_event, { files }: { files: FileInfo[] }) => {
    const exifInfos = await extractExifBatch(files, (current, total) => {
      mainWindow.webContents.send('rename:progress', {
        phase: 'scanning',
        current,
        total,
        percentage: Math.round((current / total) * 100)
      })
    })

    // Reverse geocode GPS coordinates
    const coordsWithIndex: Array<{ lat: number; lon: number; index: number }> = []
    exifInfos.forEach((info, index) => {
      if (info.gpsLatitude !== null && info.gpsLongitude !== null) {
        coordsWithIndex.push({ lat: info.gpsLatitude, lon: info.gpsLongitude, index })
      }
    })

    if (coordsWithIndex.length > 0) {
      // Deduplicate by cache key
      const uniqueCoords = new Map<string, { lat: number; lon: number }>()
      coordsWithIndex.forEach(({ lat, lon }) => {
        const key = `${lat.toFixed(2)}_${lon.toFixed(2)}`
        if (!uniqueCoords.has(key)) uniqueCoords.set(key, { lat, lon })
      })

      const uniqueArray = Array.from(uniqueCoords.values())
      const names = await reverseGeocodeBatch(uniqueArray, (current, total) => {
        mainWindow.webContents.send('rename:progress', {
          phase: 'geocoding',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        })
      })

      // Map results back to exifInfos
      const nameMap = new Map<string, string | null>()
      uniqueArray.forEach((coord, i) => {
        const key = `${coord.lat.toFixed(2)}_${coord.lon.toFixed(2)}`
        nameMap.set(key, names[i])
      })

      coordsWithIndex.forEach(({ lat, lon, index }) => {
        const key = `${lat.toFixed(2)}_${lon.toFixed(2)}`
        exifInfos[index].locationName = nameMap.get(key) || null
      })
    }

    cachedFilesMap.set('rename', files)
    return exifInfos
  })

  ipcMain.handle(
    'rename:preview',
    async (
      _event,
      {
        exifInfos,
        settings,
        sourceFolder
      }: {
        exifInfos: ExifInfo[]
        settings: RenameConfig
        sourceFolder: string
      }
    ) => {
      const files = cachedFilesMap.get('rename') || cachedFiles
      const fileMap = new Map(files.map((f) => [f.id, f]))
      return generateRenamePreview(exifInfos, settings, sourceFolder, fileMap)
    }
  )

  ipcMain.handle(
    'rename:execute',
    async (
      _event,
      {
        previews,
        settings,
        sourceFolder
      }: {
        previews: any[]
        settings: RenameConfig
        sourceFolder: string
      }
    ) => {
      return executeRename(previews, settings, sourceFolder, (current, total, currentFile) => {
        mainWindow.webContents.send('rename:progress', {
          phase: 'executing',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        })
      })
    }
  )

  // === Orientation feature ===
  ipcMain.handle('orientation:scan', async (_event, { files }: { files: FileInfo[] }) => {
    const infos = await scanOrientations(files, (current, total) => {
      mainWindow.webContents.send('orientation:progress', {
        phase: 'scanning',
        current,
        total,
        percentage: Math.round((current / total) * 100)
      })
    })
    cachedFilesMap.set('orientation', files)
    return infos
  })

  ipcMain.handle(
    'orientation:fix',
    async (
      _event,
      {
        files,
        settings,
        sourceFolder
      }: {
        files: OrientationInfo[]
        settings: OrientationConfig
        sourceFolder: string
      }
    ) => {
      return fixOrientations(files, settings, sourceFolder, (current, total, currentFile) => {
        mainWindow.webContents.send('orientation:progress', {
          phase: 'fixing',
          current,
          total,
          percentage: Math.round((current / total) * 100)
        })
      })
    }
  )

  // === File operations ===
  ipcMain.handle('file:selectImage', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      title: '选择照片文件',
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'webp', 'tiff'] }
      ]
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('file:imageInfo', async (_event, { filePath }: { filePath: string }) => {
    return getImageInfo(filePath)
  })

  ipcMain.handle('file:saveDialog', async (_event, { defaultName }: { defaultName: string }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存证件照',
      defaultPath: defaultName,
      filters: [
        { name: 'JPEG', extensions: ['jpg', 'jpeg'] },
        { name: 'PNG', extensions: ['png'] }
      ]
    })
    if (result.canceled) return null
    return result.filePath
  })

  // === ID Photo feature ===
  ipcMain.handle(
    'idphoto:process',
    async (_event, { params }: { params: IdPhotoProcessParams }) => {
      return processIdPhoto(params, (phase, percentage) => {
        mainWindow.webContents.send('idphoto:progress', { phase, percentage })
      })
    }
  )

  ipcMain.handle(
    'idphoto:recolor',
    async (_event, { params }: { params: RecolorParams }) => {
      return recolorBackground(params, (phase, percentage) => {
        mainWindow.webContents.send('idphoto:progress', { phase, percentage })
      })
    }
  )

  ipcMain.handle(
    'idphoto:recolorPreview',
    async (_event, { sourcePath, targetBgColor, tolerance }: { sourcePath: string; targetBgColor: string; tolerance: number }) => {
      return getRecolorPreview(sourcePath, targetBgColor, tolerance)
    }
  )

  // === AI Recolor ===
  ipcMain.handle(
    'idphoto:recolorAI',
    async (_event, { params }: { params: RecolorParams }) => {
      return recolorBackgroundAI(params, (phase, percentage) => {
        mainWindow.webContents.send('idphoto:progress', { phase, percentage })
      })
    }
  )

  ipcMain.handle(
    'idphoto:recolorPreviewAI',
    async (_event, { sourcePath, targetBgColor }: { sourcePath: string; targetBgColor: string }) => {
      return getRecolorPreviewAI(sourcePath, targetBgColor)
    }
  )

  // === Beauty filter ===
  ipcMain.handle(
    'idphoto:beautyPreview',
    async (_event, { sourcePath, params }: { sourcePath: string; params: BeautyParams }) => {
      return getBeautyPreview(sourcePath, params)
    }
  )

  // === Compress ===
  ipcMain.handle(
    'idphoto:compress',
    async (_event, { params }: { params: CompressParams }) => {
      return compressToTargetSize(params, (iteration, currentSizeKB, quality) => {
        mainWindow.webContents.send('idphoto:compressProgress', { iteration, currentSizeKB, quality })
      })
    }
  )

  ipcMain.handle(
    'idphoto:batchCompress',
    async (_event, { sources, targetSizeKB }: { sources: Array<{ sourcePath: string; outputPath: string }>; targetSizeKB: number }) => {
      return batchCompress(sources, targetSizeKB, (current, total, file) => {
        mainWindow.webContents.send('idphoto:batchCompressProgress', { current, total, file })
      })
    }
  )

  // === Print Layout ===
  ipcMain.handle(
    'idphoto:printLayout',
    async (_event, { params }: { params: PrintLayoutParams }) => {
      return generatePrintLayout(params, (phase, percentage) => {
        mainWindow.webContents.send('idphoto:printLayoutProgress', { phase, percentage })
      })
    }
  )

  ipcMain.handle(
    'idphoto:printLayoutPreview',
    async (_event, { photoPath, rows, cols, spacingMm }: { photoPath: string; rows: number; cols: number; spacingMm: number }) => {
      return getPrintLayoutPreview(photoPath, rows, cols, spacingMm)
    }
  )

  // === Path validation for drag & drop ===
  const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff', '.tif', '.gif'])

  ipcMain.handle(
    'path:validate',
    async (_event, { paths }: { paths: string[] }) => {
      return paths.map((p) => {
        try {
          const stat = fs.statSync(p)
          const isDir = stat.isDirectory()
          const ext = path.extname(p).toLowerCase()
          const isImage = !isDir && IMAGE_EXTENSIONS.has(ext)
          return {
            path: p,
            type: isDir ? 'directory' as const : 'file' as const,
            isImage
          }
        } catch {
          return {
            path: p,
            type: 'invalid' as const,
            isImage: false
          }
        }
      })
    }
  )
}
