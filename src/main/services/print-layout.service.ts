import sharp from 'sharp'

export interface PrintLayoutParams {
  photoPath: string
  paperWidthInch: number
  paperHeightInch: number
  dpi: number
  rows: number
  cols: number
  spacingMm: number
  outputPath: string
  outputFormat: 'jpg' | 'png'
  quality: number
}

export interface PrintLayoutResult {
  success: boolean
  outputPath: string
  paperSizePx: { width: number; height: number }
  actualCount: number
  error?: string
}

export async function generatePrintLayout(
  params: PrintLayoutParams,
  onProgress?: (phase: string, percentage: number) => void
): Promise<PrintLayoutResult> {
  try {
    onProgress?.('processing', 10)

    const paperW = Math.round(params.paperWidthInch * params.dpi)
    const paperH = Math.round(params.paperHeightInch * params.dpi)
    const spacingPx = Math.round((params.spacingMm / 25.4) * params.dpi)
    const { rows, cols } = params

    // Calculate cell size
    const totalSpacingW = (cols + 1) * spacingPx
    const totalSpacingH = (rows + 1) * spacingPx
    const cellW = Math.floor((paperW - totalSpacingW) / cols)
    const cellH = Math.floor((paperH - totalSpacingH) / rows)

    if (cellW <= 0 || cellH <= 0) {
      return {
        success: false,
        outputPath: params.outputPath,
        paperSizePx: { width: paperW, height: paperH },
        actualCount: 0,
        error: '照片尺寸超出纸张范围，请减少行列数或增大间距'
      }
    }

    onProgress?.('processing', 30)

    // Read and resize photo to fit cell (contain mode, fill with white)
    const photoBuffer = await sharp(params.photoPath)
      .rotate()
      .resize(cellW, cellH, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer()

    onProgress?.('processing', 50)

    // Build composite array
    const composites: Array<{ input: Buffer; left: number; top: number }> = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        composites.push({
          input: photoBuffer,
          left: Math.round(spacingPx + c * (cellW + spacingPx)),
          top: Math.round(spacingPx + r * (cellH + spacingPx))
        })
      }
    }

    onProgress?.('processing', 70)

    // Create white paper background and composite
    let pipeline = sharp({
      create: {
        width: paperW,
        height: paperH,
        channels: 3 as const,
        background: { r: 255, g: 255, b: 255 }
      }
    }).composite(composites)

    // Set DPI
    pipeline = pipeline.withMetadata({ density: params.dpi })

    onProgress?.('processing', 85)

    // Output format
    if (params.outputFormat === 'png') {
      pipeline = pipeline.png()
    } else {
      pipeline = pipeline.jpeg({ quality: params.quality, mozjpeg: true })
    }

    await pipeline.toFile(params.outputPath)

    onProgress?.('done', 100)

    return {
      success: true,
      outputPath: params.outputPath,
      paperSizePx: { width: paperW, height: paperH },
      actualCount: rows * cols
    }
  } catch (err) {
    return {
      success: false,
      outputPath: params.outputPath,
      paperSizePx: { width: 0, height: 0 },
      actualCount: 0,
      error: `排版失败: ${err}`
    }
  }
}

export async function getPrintLayoutPreview(
  photoPath: string,
  rows: number,
  cols: number,
  spacingMm: number = 2
): Promise<string> {
  const previewW = 600
  const previewH = 400
  const dpi = 72

  const spacingPx = Math.round((spacingMm / 25.4) * dpi)
  const totalSpacingW = (cols + 1) * spacingPx
  const totalSpacingH = (rows + 1) * spacingPx
  const cellW = Math.floor((previewW - totalSpacingW) / cols)
  const cellH = Math.floor((previewH - totalSpacingH) / rows)

  if (cellW <= 0 || cellH <= 0) {
    // Return blank white image
    return sharp({
      create: { width: previewW, height: previewH, channels: 3 as const, background: { r: 255, g: 255, b: 255 } }
    }).jpeg({ quality: 70 }).toBuffer().then((b) => `data:image/jpeg;base64,${b.toString('base64')}`)
  }

  const photoBuffer = await sharp(photoPath)
    .rotate()
    .resize(cellW, cellH, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .toBuffer()

  const composites: Array<{ input: Buffer; left: number; top: number }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      composites.push({
        input: photoBuffer,
        left: Math.round(spacingPx + c * (cellW + spacingPx)),
        top: Math.round(spacingPx + r * (cellH + spacingPx))
      })
    }
  }

  return sharp({
    create: { width: previewW, height: previewH, channels: 3 as const, background: { r: 255, g: 255, b: 255 } }
  })
    .composite(composites)
    .jpeg({ quality: 70 })
    .toBuffer()
    .then((b) => `data:image/jpeg;base64,${b.toString('base64')}`)
}
