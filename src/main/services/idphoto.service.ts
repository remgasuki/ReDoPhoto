import sharp from 'sharp'
import { join } from 'path'
import { app } from 'electron'
import type { BeautyParams } from './beauty.service'
import { applyBeautyFilter } from './beauty.service'
import {
  generateAlphaMask,
  compositeWithMask,
  compositeWithGradient,
  overlayFormalWear
} from './matting.service'

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface IdPhotoProcessParams {
  sourcePath: string
  outputPath: string
  cropRect: CropRect
  targetWidthPx: number
  targetHeightPx: number
  dpi: number
  bgColor: string | null
  outputFormat: 'jpg' | 'png'
  quality: number
  beauty?: BeautyParams
  gradient?: {
    type: 'linear'
    angle: number
    colorStops: Array<{ offset: number; color: string }>
  }
  formalWearTemplatePath?: string
  useAIMatting?: boolean
}

export interface RecolorParams {
  sourcePath: string
  outputPath: string
  targetBgColor: string
  tolerance: number
  outputFormat: 'jpg' | 'png'
  quality: number
  beauty?: BeautyParams
}

export interface ImageInfo {
  width: number
  height: number
  format: string
}

export async function getImageInfo(filePath: string): Promise<ImageInfo> {
  const metadata = await sharp(filePath).metadata()
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    format: metadata.format ?? 'unknown'
  }
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  }
}

function getTemplatePath(templateFileName: string): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return join(app.getAppPath(), 'resources', 'templates', templateFileName)
  }
  return join(process.resourcesPath, 'resources', 'templates', templateFileName)
}

export async function processIdPhoto(
  params: IdPhotoProcessParams,
  onProgress?: (phase: string, percentage: number) => void
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    onProgress?.('processing', 10)

    // Auto-rotate based on EXIF orientation first
    let pipeline = sharp(params.sourcePath).rotate()

    onProgress?.('processing', 20)

    // Extract the crop region
    const { x, y, width, height } = params.cropRect
    pipeline = pipeline.extract({
      left: Math.round(x),
      top: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    })

    onProgress?.('processing', 35)

    // Resize to target dimensions
    pipeline = pipeline.resize(params.targetWidthPx, params.targetHeightPx, {
      fit: 'fill'
    })

    onProgress?.('processing', 50)

    // Apply beauty filter if specified
    if (params.beauty && (params.beauty.smooth > 0 || params.beauty.brightness !== 0 || params.beauty.contrast !== 0)) {
      const rawResult = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      const beautified = await applyBeautyFilter(
        rawResult.data,
        params.beauty,
        rawResult.info.width,
        rawResult.info.height,
        rawResult.info.channels
      )
      pipeline = sharp(beautified, { raw: rawResult.info })
    }

    onProgress?.('processing', 65)

    // Handle background: gradient (AI matting required) or solid color
    if (params.gradient && params.useAIMatting) {
      // AI matting + gradient background
      onProgress?.('ai_matting', 70)
      const { mask, width: maskW, height: maskH } = await generateAlphaMask(params.sourcePath)

      // Re-extract and resize from original for full quality
      const fullPipeline = sharp(params.sourcePath).rotate()
        .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) })
        .resize(params.targetWidthPx, params.targetHeightPx, { fit: 'fill' })

      const fullRaw = await fullPipeline.removeAlpha().raw().toBuffer({ resolveWithObject: true })

      // Apply beauty on full quality if needed
      let imageData = fullRaw.data
      if (params.beauty && (params.beauty.smooth > 0 || params.beauty.brightness !== 0 || params.beauty.contrast !== 0)) {
        imageData = await applyBeautyFilter(imageData, params.beauty, fullRaw.info.width, fullRaw.info.height, fullRaw.info.channels)
      }

      // Regenerate mask at target size
      const tempBuffer = await sharp(imageData, { raw: fullRaw.info }).jpeg().toBuffer()
      const tempPath = params.outputPath + '.tmp.jpg'
      await sharp(tempBuffer).toFile(tempPath)
      const maskResult = await generateAlphaMask(tempPath)

      const resultBuffer = await compositeWithGradient(
        tempPath,
        maskResult.mask,
        params.gradient,
        maskResult.width,
        maskResult.height
      )

      // Apply formal wear if specified
      let finalBuffer = resultBuffer
      if (params.formalWearTemplatePath) {
        const tplPath = getTemplatePath(params.formalWearTemplatePath)
        const rawInfo = await sharp(resultBuffer).raw().toBuffer({ resolveWithObject: true })
        finalBuffer = await overlayFormalWear(
          rawInfo.data,
          rawInfo.info.width,
          rawInfo.info.height,
          tplPath
        )
      }

      // Save
      let outPipeline = sharp(finalBuffer)
      outPipeline = outPipeline.withMetadata({ density: params.dpi })
      if (params.outputFormat === 'png') {
        outPipeline = outPipeline.png({ quality: params.quality })
      } else {
        outPipeline = outPipeline.jpeg({ quality: params.quality, mozjpeg: true })
      }
      await outPipeline.toFile(params.outputPath)

      // Cleanup temp file
      try { await sharp(tempPath).metadata() } catch {}

      onProgress?.('done', 100)
      return { success: true, outputPath: params.outputPath }
    }

    // Apply background color if specified
    if (params.bgColor) {
      if (params.useAIMatting) {
        // AI matting path
        onProgress?.('ai_matting', 70)
        const color = parseHexColor(params.bgColor)

        const fullPipeline = sharp(params.sourcePath).rotate()
          .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(width), height: Math.round(height) })
          .resize(params.targetWidthPx, params.targetHeightPx, { fit: 'fill' })

        const fullRaw = await fullPipeline.removeAlpha().raw().toBuffer({ resolveWithObject: true })
        let imageData = fullRaw.data

        if (params.beauty && (params.beauty.smooth > 0 || params.beauty.brightness !== 0 || params.beauty.contrast !== 0)) {
          imageData = await applyBeautyFilter(imageData, params.beauty, fullRaw.info.width, fullRaw.info.height, fullRaw.info.channels)
        }

        const tempBuffer = await sharp(imageData, { raw: fullRaw.info }).jpeg().toBuffer()
        const tempPath = params.outputPath + '.tmp.jpg'
        await sharp(tempBuffer).toFile(tempPath)

        const maskResult = await generateAlphaMask(tempPath)
        const resultBuffer = await compositeWithMask(
          tempPath,
          maskResult.mask,
          color,
          maskResult.width,
          maskResult.height
        )

        let finalBuffer = resultBuffer
        if (params.formalWearTemplatePath) {
          const tplPath = getTemplatePath(params.formalWearTemplatePath)
          const rawInfo = await sharp(resultBuffer).raw().toBuffer({ resolveWithObject: true })
          finalBuffer = await overlayFormalWear(rawInfo.data, rawInfo.info.width, rawInfo.info.height, tplPath)
        }

        let outPipeline = sharp(finalBuffer)
        outPipeline = outPipeline.withMetadata({ density: params.dpi })
        if (params.outputFormat === 'png') {
          outPipeline = outPipeline.png({ quality: params.quality })
        } else {
          outPipeline = outPipeline.jpeg({ quality: params.quality, mozjpeg: true })
        }
        await outPipeline.toFile(params.outputPath)

        onProgress?.('done', 100)
        return { success: true, outputPath: params.outputPath }
      } else {
        // Legacy: simple flatten
        const color = parseHexColor(params.bgColor)
        pipeline = pipeline.flatten({ background: color })
      }
    }

    onProgress?.('processing', 85)

    // Set DPI metadata
    pipeline = pipeline.withMetadata({ density: params.dpi })

    // Output format and quality
    if (params.outputFormat === 'png') {
      pipeline = pipeline.png({ quality: params.quality })
    } else {
      pipeline = pipeline.jpeg({ quality: params.quality, mozjpeg: true })
    }

    await pipeline.toFile(params.outputPath)

    onProgress?.('done', 100)

    return { success: true, outputPath: params.outputPath }
  } catch (err) {
    return {
      success: false,
      outputPath: params.outputPath,
      error: `处理证件照失败: ${err}`
    }
  }
}

/**
 * Detect the dominant background color by sampling edge pixels
 */
function detectBackgroundColor(
  data: Buffer,
  width: number,
  height: number,
  channels: number
): { r: number; g: number; b: number } {
  const samples: Array<{ r: number; g: number; b: number }> = []
  const step = Math.max(1, Math.floor(Math.min(width, height) / 20))

  // Sample top edge
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < Math.min(10, height); y++) {
      const i = (y * width + x) * channels
      samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
    }
  }

  // Sample bottom edge
  for (let x = 0; x < width; x += step) {
    for (let y = Math.max(0, height - 10); y < height; y++) {
      const i = (y * width + x) * channels
      samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
    }
  }

  // Sample left edge
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < Math.min(10, width); x++) {
      const i = (y * width + x) * channels
      samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
    }
  }

  // Sample right edge
  for (let y = 0; y < height; y += step) {
    for (let x = Math.max(0, width - 10); x < width; x++) {
      const i = (y * width + x) * channels
      samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] })
    }
  }

  // Average
  const avg = samples.reduce(
    (acc, s) => ({ r: acc.r + s.r, g: acc.g + s.g, b: acc.b + s.b }),
    { r: 0, g: 0, b: 0 }
  )
  return {
    r: Math.round(avg.r / samples.length),
    g: Math.round(avg.g / samples.length),
    b: Math.round(avg.b / samples.length)
  }
}

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

/**
 * Generate a recolor preview as base64 (small thumbnail for UI preview)
 */
export async function getRecolorPreview(
  sourcePath: string,
  targetBgColor: string,
  tolerance: number
): Promise<string> {
  const target = parseHexColor(targetBgColor)

  // Process at small size for preview
  const { data, info } = await sharp(sourcePath)
    .rotate()
    .resize(400, null, { withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const bgColor = detectBackgroundColor(data, width, height, channels)
  const output = Buffer.from(data)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const dist = colorDistance(data[i], data[i + 1], data[i + 2], bgColor.r, bgColor.g, bgColor.b)

      if (dist < tolerance) {
        output[i] = target.r
        output[i + 1] = target.g
        output[i + 2] = target.b
        if (channels === 4) output[i + 3] = 255
      } else if (dist < tolerance * 1.5) {
        const blend = (dist - tolerance) / (tolerance * 0.5)
        output[i] = Math.round(target.r * (1 - blend) + data[i] * blend)
        output[i + 1] = Math.round(target.g * (1 - blend) + data[i + 1] * blend)
        output[i + 2] = Math.round(target.b * (1 - blend) + data[i + 2] * blend)
      }
    }
  }

  return sharp(output, { raw: { width, height, channels } })
    .jpeg({ quality: 85 })
    .toBuffer()
    .then((buf) => `data:image/jpeg;base64,${buf.toString('base64')}`)
}

/**
 * Replace background color of an ID photo (full resolution) - legacy method
 */
export async function recolorBackground(
  params: RecolorParams,
  onProgress?: (phase: string, percentage: number) => void
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    onProgress?.('processing', 10)

    const target = parseHexColor(params.targetBgColor)

    const { data, info } = await sharp(params.sourcePath)
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height, channels } = info
    onProgress?.('processing', 30)

    const bgColor = detectBackgroundColor(data, width, height, channels)
    const tolerance = params.tolerance

    const output = Buffer.from(data)
    const totalPixels = width * height
    let processedPixels = 0

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels
        const dist = colorDistance(data[i], data[i + 1], data[i + 2], bgColor.r, bgColor.g, bgColor.b)

        if (dist < tolerance) {
          output[i] = target.r
          output[i + 1] = target.g
          output[i + 2] = target.b
          if (channels === 4) output[i + 3] = 255
        } else if (dist < tolerance * 1.5) {
          const blend = (dist - tolerance) / (tolerance * 0.5)
          output[i] = Math.round(target.r * (1 - blend) + data[i] * blend)
          output[i + 1] = Math.round(target.g * (1 - blend) + data[i + 1] * blend)
          output[i + 2] = Math.round(target.b * (1 - blend) + data[i + 2] * blend)
        }

        processedPixels++
      }

      if (processedPixels % (totalPixels / 5) < width) {
        onProgress?.('processing', 30 + Math.round((processedPixels / totalPixels) * 50))
      }
    }

    onProgress?.('processing', 85)

    let pipeline = sharp(output, { raw: { width, height, channels } })

    const originalMeta = await sharp(params.sourcePath).metadata()
    if (originalMeta.density) {
      pipeline = pipeline.withMetadata({ density: originalMeta.density })
    }

    if (params.outputFormat === 'png') {
      pipeline = pipeline.png({ quality: params.quality })
    } else {
      pipeline = pipeline.jpeg({ quality: params.quality, mozjpeg: true })
    }

    await pipeline.toFile(params.outputPath)

    onProgress?.('done', 100)
    return { success: true, outputPath: params.outputPath }
  } catch (err) {
    return {
      success: false,
      outputPath: params.outputPath,
      error: `背景色替换失败: ${err}`
    }
  }
}

/**
 * AI-powered background recolor (full resolution)
 */
export async function recolorBackgroundAI(
  params: RecolorParams,
  onProgress?: (phase: string, percentage: number) => void
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    onProgress?.('ai_matting', 10)
    const { mask, width, height } = await generateAlphaMask(params.sourcePath)

    onProgress?.('compositing', 60)
    const target = parseHexColor(params.targetBgColor)

    // Create temp file for compositing (since compositeWithMask reads from path)
    const resultBuffer = await compositeWithMask(params.sourcePath, mask, target, width, height)

    onProgress?.('saving', 90)

    let pipeline = sharp(resultBuffer)
    const originalMeta = await sharp(params.sourcePath).metadata()
    if (originalMeta.density) {
      pipeline = pipeline.withMetadata({ density: originalMeta.density })
    }

    if (params.outputFormat === 'png') {
      pipeline = pipeline.png({ quality: params.quality })
    } else {
      pipeline = pipeline.jpeg({ quality: params.quality, mozjpeg: true })
    }

    await pipeline.toFile(params.outputPath)

    onProgress?.('done', 100)
    return { success: true, outputPath: params.outputPath }
  } catch (err) {
    // Fallback to legacy method
    return recolorBackground(params, onProgress)
  }
}

/**
 * AI-powered recolor preview (base64 thumbnail)
 */
export async function getRecolorPreviewAI(
  sourcePath: string,
  targetBgColor: string
): Promise<string> {
  try {
    const target = parseHexColor(targetBgColor)
    const { mask, width, height } = await generateAlphaMask(sourcePath)
    const resultBuffer = await compositeWithMask(sourcePath, mask, target, width, height)

    // Resize to thumbnail for preview
    return sharp(resultBuffer)
      .resize(400, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()
      .then((buf) => `data:image/jpeg;base64,${buf.toString('base64')}`)
  } catch {
    // Fallback to legacy preview
    return getRecolorPreview(sourcePath, targetBgColor, 60)
  }
}
