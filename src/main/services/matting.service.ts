import sharp from 'sharp'
import { join } from 'path'
import { app } from 'electron'

let ort: typeof import('onnxruntime-node') | null = null
let session: any = null

function getModelPath(): string {
  // In dev mode, resources are in project root
  // In prod, they're in process.resourcesPath
  const isDev = !app.isPackaged
  if (isDev) {
    return join(app.getAppPath(), 'resources', 'models', 'rmbg-1.4.onnx')
  }
  return join(process.resourcesPath, 'resources', 'models', 'rmbg-1.4.onnx')
}

async function getOrt() {
  if (!ort) {
    ort = await import('onnxruntime-node')
  }
  return ort
}

async function getSession() {
  if (!session) {
    const ortModule = await getOrt()
    session = await ortModule.InferenceSession.create(getModelPath(), {
      executionProviders: ['cpu']
    })
  }
  return session
}

/**
 * Generate alpha mask using RMBG-1.4 ONNX model
 * Returns mask as Uint8Array (0-255 per pixel) at original image dimensions
 */
export async function generateAlphaMask(
  inputPath: string
): Promise<{ mask: Buffer; width: number; height: number }> {
  const ortModule = await getOrt()
  const sess = await getSession()

  // Get original dimensions (after auto-rotate)
  const origMeta = await sharp(inputPath).rotate().metadata()
  const origW = origMeta.width ?? 1024
  const origH = origMeta.height ?? 1024

  // Preprocess: resize to 1024x1024, RGB, normalized to [0,1]
  const { data } = await sharp(inputPath)
    .rotate()
    .resize(1024, 1024, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Convert to NCHW float32 tensor
  const MODEL_SIZE = 1024
  const float32Data = new Float32Array(3 * MODEL_SIZE * MODEL_SIZE)
  const pixelCount = MODEL_SIZE * MODEL_SIZE

  for (let i = 0; i < pixelCount; i++) {
    float32Data[i] = data[i * 3] / 255.0                        // R
    float32Data[pixelCount + i] = data[i * 3 + 1] / 255.0       // G
    float32Data[2 * pixelCount + i] = data[i * 3 + 2] / 255.0   // B
  }

  const tensor = new ortModule.Tensor('float32', float32Data, [1, 3, MODEL_SIZE, MODEL_SIZE])

  // Run inference
  const feeds: Record<string, any> = {}
  feeds[sess.inputNames[0]] = tensor
  const results = await sess.run(feeds)
  const output = results[sess.outputNames[0]]

  // Post-process: sigmoid
  const maskData = output.data as Float32Array
  const mask1024 = new Uint8Array(pixelCount)
  for (let i = 0; i < maskData.length; i++) {
    const sigmoid = 1 / (1 + Math.exp(-maskData[i]))
    mask1024[i] = Math.round(sigmoid * 255)
  }

  // Resize mask to original dimensions using lanczos3
  const resizedMask = await sharp(Buffer.from(mask1024), {
    raw: { width: MODEL_SIZE, height: MODEL_SIZE, channels: 1 }
  })
    .resize(origW, origH, { kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer()

  return { mask: resizedMask, width: origW, height: origH }
}

/**
 * Composite foreground onto target background color using AI mask
 */
export async function compositeWithMask(
  inputPath: string,
  mask: Buffer,
  targetBgColor: { r: number; g: number; b: number },
  maskWidth: number,
  maskHeight: number
): Promise<Buffer> {
  const { data, info } = await sharp(inputPath)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const output = Buffer.from(data)
  const channels = info.channels

  for (let i = 0; i < maskWidth * maskHeight; i++) {
    const alpha = mask[i] / 255.0
    const pi = i * channels

    if (alpha > 0.99) {
      // Pure foreground - keep original pixel
    } else if (alpha < 0.01) {
      // Pure background - replace with target color
      output[pi] = targetBgColor.r
      output[pi + 1] = targetBgColor.g
      output[pi + 2] = targetBgColor.b
    } else {
      // Edge blend
      output[pi] = Math.round(data[pi] * alpha + targetBgColor.r * (1 - alpha))
      output[pi + 1] = Math.round(data[pi + 1] * alpha + targetBgColor.g * (1 - alpha))
      output[pi + 2] = Math.round(data[pi + 2] * alpha + targetBgColor.b * (1 - alpha))
    }
  }

  return sharp(output, { raw: { width: info.width, height: info.height, channels } })
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer()
}

/**
 * Composite foreground onto gradient background using AI mask
 */
export async function compositeWithGradient(
  inputPath: string,
  mask: Buffer,
  gradient: {
    type: 'linear'
    angle: number
    colorStops: Array<{ offset: number; color: string }>
  },
  maskWidth: number,
  maskHeight: number
): Promise<Buffer> {
  const { data, info } = await sharp(inputPath)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Generate gradient background
  const gradientBg = renderGradient(info.width, info.height, gradient)

  const output = Buffer.from(data)
  const channels = info.channels

  for (let i = 0; i < maskWidth * maskHeight; i++) {
    const alpha = mask[i] / 255.0
    const pi = i * channels
    const gi = i * 3

    if (alpha > 0.99) {
      // Pure foreground - keep original
    } else if (alpha < 0.01) {
      // Pure background - use gradient
      output[pi] = gradientBg[gi]
      output[pi + 1] = gradientBg[gi + 1]
      output[pi + 2] = gradientBg[gi + 2]
    } else {
      output[pi] = Math.round(data[pi] * alpha + gradientBg[gi] * (1 - alpha))
      output[pi + 1] = Math.round(data[pi + 1] * alpha + gradientBg[gi + 1] * (1 - alpha))
      output[pi + 2] = Math.round(data[pi + 2] * alpha + gradientBg[gi + 2] * (1 - alpha))
    }
  }

  return sharp(output, { raw: { width: info.width, height: info.height, channels } })
    .jpeg({ quality: 95, mozjpeg: true })
    .toBuffer()
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  }
}

/**
 * Render a linear gradient as RGB raw buffer
 */
export function renderGradient(
  width: number,
  height: number,
  gradient: {
    type: 'linear'
    angle: number
    colorStops: Array<{ offset: number; color: string }>
  }
): Buffer {
  const buf = Buffer.alloc(width * height * 3)
  const angleRad = ((gradient.angle - 90) * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  // Parse color stops
  const stops = gradient.colorStops.map((s) => ({
    offset: s.offset,
    color: parseHexColor(s.color)
  }))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Project pixel position onto gradient direction
      const nx = x / width - 0.5
      const ny = y / height - 0.5
      let t = nx * cos + ny * sin + 0.5
      t = Math.max(0, Math.min(1, t))

      // Find color at position t
      let r: number, g: number, b: number
      if (t <= stops[0].offset) {
        r = stops[0].color.r; g = stops[0].color.g; b = stops[0].color.b
      } else if (t >= stops[stops.length - 1].offset) {
        const last = stops[stops.length - 1]
        r = last.color.r; g = last.color.g; b = last.color.b
      } else {
        // Interpolate between two stops
        let i = 0
        while (i < stops.length - 1 && stops[i + 1].offset < t) i++
        const s0 = stops[i]
        const s1 = stops[i + 1]
        const localT = (t - s0.offset) / (s1.offset - s0.offset)
        r = Math.round(s0.color.r + (s1.color.r - s0.color.r) * localT)
        g = Math.round(s0.color.g + (s1.color.g - s0.color.g) * localT)
        b = Math.round(s0.color.b + (s1.color.b - s0.color.b) * localT)
      }

      const idx = (y * width + x) * 3
      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
    }
  }

  return buf
}

/**
 * Overlay formal wear template onto the image (bottom-aligned)
 */
export async function overlayFormalWear(
  inputBuffer: Buffer,
  inputWidth: number,
  inputHeight: number,
  templatePath: string
): Promise<Buffer> {
  try {
    // Read template PNG
    const templateMeta = await sharp(templatePath).metadata()
    const templateW = templateMeta.width ?? 600
    const templateH = templateMeta.height ?? 400

    // Scale template to match input width, bottom-aligned
    const scale = inputWidth / templateW
    const scaledH = Math.round(templateH * scale)

    const templateBuffer = await sharp(templatePath)
      .resize(inputWidth, scaledH, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer()

    // Composite: template on top of input, positioned at bottom
    const topOffset = inputHeight - scaledH

    // Manually blend
    const output = Buffer.from(inputBuffer)
    const inputChannels = 3 // assume RGB input

    for (let y = 0; y < scaledH; y++) {
      const outY = topOffset + y
      if (outY < 0 || outY >= inputHeight) continue

      for (let x = 0; x < inputWidth; x++) {
        const ti = (y * inputWidth + x) * 4 // template RGBA
        const oi = (outY * inputWidth + x) * inputChannels

        const alpha = templateBuffer[ti + 3] / 255.0
        if (alpha > 0.01) {
          output[oi] = Math.round(templateBuffer[ti] * alpha + output[oi] * (1 - alpha))
          output[oi + 1] = Math.round(templateBuffer[ti + 1] * alpha + output[oi + 1] * (1 - alpha))
          output[oi + 2] = Math.round(templateBuffer[ti + 2] * alpha + output[oi + 2] * (1 - alpha))
        }
      }
    }

    return sharp(output, { raw: { width: inputWidth, height: inputHeight, channels: inputChannels } })
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer()
  } catch {
    // If template not found, return original
    return inputBuffer
  }
}
