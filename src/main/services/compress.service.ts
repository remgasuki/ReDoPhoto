import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

export interface CompressParams {
  sourcePath: string
  outputPath: string
  targetSizeKB: number
  toleranceKB?: number
  minQuality?: number
  maxQuality?: number
  format?: 'jpg' | 'png'
}

export interface CompressResult {
  success: boolean
  outputPath: string
  originalSizeKB: number
  actualSizeKB: number
  quality: number
  iterations: number
  error?: string
}

function getFileSizeKB(filePath: string): number {
  const stats = fs.statSync(filePath)
  return stats.size / 1024
}

export async function compressToTargetSize(
  params: CompressParams,
  onProgress?: (iteration: number, currentSizeKB: number, quality: number) => void
): Promise<CompressResult> {
  const tolerance = params.toleranceKB ?? 10
  const minQ = params.minQuality ?? 10
  const maxQ = params.maxQuality ?? 95
  const format = params.format ?? 'jpg'
  const outputPath = params.outputPath

  let originalSizeKB = 0
  try {
    originalSizeKB = getFileSizeKB(params.sourcePath)
  } catch {
    // ignore
  }

  // First check if already under target
  if (originalSizeKB > 0 && originalSizeKB <= params.targetSizeKB) {
    // Just copy with max quality
    const pipeline = sharp(params.sourcePath).rotate()
    if (format === 'png') {
      await pipeline.png().toFile(outputPath)
    } else {
      await pipeline.jpeg({ quality: maxQ, mozjpeg: true }).toFile(outputPath)
    }
    return {
      success: true,
      outputPath,
      originalSizeKB,
      actualSizeKB: getFileSizeKB(outputPath),
      quality: maxQ,
      iterations: 0
    }
  }

  let low = minQ
  let high = maxQ
  let iterations = 0
  let bestQuality = minQ
  let bestSizeKB = 0

  while (high - low > 1 && iterations < 15) {
    const mid = Math.round((low + high) / 2)
    iterations++

    const pipeline = sharp(params.sourcePath).rotate()
    let buffer: Buffer
    if (format === 'png') {
      buffer = await pipeline.png({ quality: mid }).toBuffer()
    } else {
      buffer = await pipeline.jpeg({ quality: mid, mozjpeg: true }).toBuffer()
    }

    const sizeKB = buffer.length / 1024
    onProgress?.(iterations, sizeKB, mid)

    if (Math.abs(sizeKB - params.targetSizeKB) <= tolerance) {
      // Hit target
      await fs.promises.writeFile(outputPath, buffer)
      return {
        success: true,
        outputPath,
        originalSizeKB,
        actualSizeKB: sizeKB,
        quality: mid,
        iterations
      }
    }

    if (sizeKB > params.targetSizeKB) {
      high = mid
    } else {
      low = mid
      bestQuality = mid
      bestSizeKB = sizeKB
    }
  }

  // Use best quality that's under target
  const pipeline = sharp(params.sourcePath).rotate()
  if (format === 'png') {
    await pipeline.png({ quality: bestQuality }).toFile(outputPath)
  } else {
    await pipeline.jpeg({ quality: bestQuality, mozjpeg: true }).toFile(outputPath)
  }

  const finalSize = getFileSizeKB(outputPath)
  return {
    success: true,
    outputPath,
    originalSizeKB,
    actualSizeKB: finalSize,
    quality: bestQuality,
    iterations
  }
}

export async function batchCompress(
  sources: Array<{ sourcePath: string; outputPath: string }>,
  targetSizeKB: number,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<CompressResult[]> {
  const results: CompressResult[] = []
  for (let i = 0; i < sources.length; i++) {
    const { sourcePath, outputPath } = sources[i]
    onProgress?.(i + 1, sources.length, path.basename(sourcePath))
    const result = await compressToTargetSize({ sourcePath, outputPath, targetSizeKB })
    results.push(result)
  }
  return results
}
