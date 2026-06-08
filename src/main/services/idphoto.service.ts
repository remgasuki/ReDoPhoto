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
