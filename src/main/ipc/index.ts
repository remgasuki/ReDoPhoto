import { ipcMain, dialog, BrowserWindow } from 'electron'
import * as path from 'path'
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

let cachedFiles: FileInfo[] = []

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
}
