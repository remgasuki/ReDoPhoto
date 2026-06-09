import sharp from 'sharp'

export interface BeautyParams {
  smooth: number      // 0-100, 0 = no smoothing
  brightness: number  // -50 to 50, 0 = original
  contrast: number    // -50 to 50, 0 = original
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}

export async function applyBeautyFilter(
  inputBuffer: Buffer,
  params: BeautyParams,
  width: number,
  height: number,
  channels: number
): Promise<Buffer> {
  const output = Buffer.from(inputBuffer)

  // Step 1: Skin smoothing via gaussian blur blend
  if (params.smooth > 0) {
    const sigma = 0.5 + (params.smooth / 100) * 4.5 // sigma 0.5 ~ 5.0
    const factor = (params.smooth / 100) * 0.65 // max 65% blend

    const blurred = await sharp(inputBuffer, { raw: { width, height, channels } })
      .blur(sigma)
      .raw()
      .toBuffer()

    for (let i = 0; i < width * height * channels; i++) {
      if (channels === 4 && i % 4 === 3) continue // skip alpha
      const channelIdx = i % channels
      if (channels === 4 && channelIdx === 3) continue
      output[i] = Math.round(inputBuffer[i] * (1 - factor) + blurred[i] * factor)
    }
  }

  // Step 2: Brightness and contrast (pixel-level)
  const brightnessVal = params.brightness * 2.55 // map -50~50 to -127~127
  const contrastFactor = (params.contrast + 100) / 100 // map -50~50 to 0.5~1.5

  if (params.brightness !== 0 || params.contrast !== 0) {
    for (let i = 0; i < width * height * channels; i++) {
      const channelIdx = i % channels
      if (channels === 4 && channelIdx === 3) continue // skip alpha

      let pixel = output[i]
      // Apply brightness
      pixel = pixel + brightnessVal
      // Apply contrast
      pixel = (pixel - 128) * contrastFactor + 128
      output[i] = clamp(Math.round(pixel), 0, 255)
    }
  }

  return output
}

export async function getBeautyPreview(
  sourcePath: string,
  params: BeautyParams
): Promise<string> {
  const { data, info } = await sharp(sourcePath)
    .rotate()
    .resize(400, null, { withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const result = await applyBeautyFilter(
    data,
    params,
    info.width,
    info.height,
    info.channels
  )

  return sharp(result, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .jpeg({ quality: 85 })
    .toBuffer()
    .then((buf) => `data:image/jpeg;base64,${buf.toString('base64')}`)
}
