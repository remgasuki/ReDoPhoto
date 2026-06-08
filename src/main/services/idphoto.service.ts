import sharp from 'sharp'

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
}

export interface RecolorParams {
  sourcePath: string
  outputPath: string
  targetBgColor: string
  tolerance: number
  outputFormat: 'jpg' | 'png'
  quality: number
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

export async function processIdPhoto(
  params: IdPhotoProcessParams,
  onProgress?: (phase: string, percentage: number) => void
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    onProgress?.('processing', 10)

    // Auto-rotate based on EXIF orientation first
    let pipeline = sharp(params.sourcePath).rotate()

    onProgress?.('processing', 30)

    // Extract the crop region
    const { x, y, width, height } = params.cropRect
    pipeline = pipeline.extract({
      left: Math.round(x),
      top: Math.round(y),
      width: Math.round(width),
      height: Math.round(height)
    })

    onProgress?.('processing', 50)

    // Resize to target dimensions
    pipeline = pipeline.resize(params.targetWidthPx, params.targetHeightPx, {
      fit: 'fill'
    })

    onProgress?.('processing', 70)

    // Apply background color if specified (replaces alpha transparency)
    if (params.bgColor) {
      const color = parseHexColor(params.bgColor)
      pipeline = pipeline.flatten({ background: color })
    }

    // Set DPI metadata
    pipeline = pipeline.withMetadata({ density: params.dpi })

    onProgress?.('processing', 85)

    // Output format and quality
    if (params.outputFormat === 'png') {
      pipeline = pipeline.png({ quality: params.quality })
    } else {
      pipeline = pipeline.jpeg({ quality: params.quality, mozjpeg: true })
    }

    // Write to file
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
        // Full replacement
        output[i] = target.r
        output[i + 1] = target.g
        output[i + 2] = target.b
        if (channels === 4) output[i + 3] = 255
      } else if (dist < tolerance * 1.5) {
        // Feathered edge: blend proportionally
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
 * Replace background color of an ID photo (full resolution)
 */
export async function recolorBackground(
  params: RecolorParams,
  onProgress?: (phase: string, percentage: number) => void
): Promise<{ success: boolean; outputPath: string; error?: string }> {
  try {
    onProgress?.('processing', 10)

    const target = parseHexColor(params.targetBgColor)

    // Read image, auto-rotate, ensure alpha channel, get raw pixels
    const { data, info } = await sharp(params.sourcePath)
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height, channels } = info
    onProgress?.('processing', 30)

    // Detect background color from edges
    const bgColor = detectBackgroundColor(data, width, height, channels)
    const tolerance = params.tolerance

    // Replace background pixels
    const output = Buffer.from(data)
    const totalPixels = width * height
    let processedPixels = 0

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * channels
        const dist = colorDistance(data[i], data[i + 1], data[i + 2], bgColor.r, bgColor.g, bgColor.b)

        if (dist < tolerance) {
          // Full replacement
          output[i] = target.r
          output[i + 1] = target.g
          output[i + 2] = target.b
          if (channels === 4) output[i + 3] = 255
        } else if (dist < tolerance * 1.5) {
          // Feathered edge for smooth transition
          const blend = (dist - tolerance) / (tolerance * 0.5)
          output[i] = Math.round(target.r * (1 - blend) + data[i] * blend)
          output[i + 1] = Math.round(target.g * (1 - blend) + data[i + 1] * blend)
          output[i + 2] = Math.round(target.b * (1 - blend) + data[i + 2] * blend)
        }

        processedPixels++
      }

      // Report progress periodically
      if (processedPixels % (totalPixels / 5) < width) {
        onProgress?.('processing', 30 + Math.round((processedPixels / totalPixels) * 50))
      }
    }

    onProgress?.('processing', 85)

    // Reconstruct image from raw data
    let pipeline = sharp(output, { raw: { width, height, channels } })

    // Preserve original metadata (DPI etc.)
    const originalMeta = await sharp(params.sourcePath).metadata()
    if (originalMeta.density) {
      pipeline = pipeline.withMetadata({ density: originalMeta.density })
    }

    // Output format
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
