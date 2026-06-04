import * as crypto from 'crypto'
import * as fs from 'fs'
import sharp from 'sharp'
import type { FileInfo } from './scanner.service'

export interface HashResult {
  id: string
  sha256: string
}

export interface PhashResult {
  id: string
  phash: string
}

const SHA_BATCH_SIZE = 20
const PHASH_BATCH_SIZE = 5

export async function computeSHA256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256')
    const stream = fs.createReadStream(filePath)
    stream.on('data', (data) => hash.update(data))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}

export async function computeAllSHA256(
  files: FileInfo[],
  onProgress?: (current: number, total: number) => void
): Promise<HashResult[]> {
  const results: HashResult[] = []
  const total = files.length

  for (let i = 0; i < total; i += SHA_BATCH_SIZE) {
    const batch = files.slice(i, i + SHA_BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const sha256 = await computeSHA256(file.path)
          return { id: file.id, sha256 }
        } catch {
          return { id: file.id, sha256: 'ERROR' }
        }
      })
    )
    results.push(...batchResults)
    if (onProgress) {
      onProgress(Math.min(i + SHA_BATCH_SIZE, total), total)
    }
    await new Promise(resolve => setImmediate(resolve))
  }

  return results
}

async function computePHashForFile(filePath: string): Promise<string> {
  // pHash implementation:
  // 1. Resize to 32x32 grayscale
  // 2. Get raw pixel data
  // 3. Apply DCT and extract 8x8 low-frequency block
  // 4. Compute mean and generate 64-bit hash string

  const buffer = await sharp(filePath)
    .resize(32, 32, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer()

  const pixels = new Float64Array(1024)
  for (let i = 0; i < 1024; i++) {
    pixels[i] = buffer[i]
  }

  // 2D DCT
  const dctResult = applyDCT(pixels, 32)

  // Extract 8x8 low-frequency components
  const lowFreq = new Float64Array(64)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      lowFreq[y * 8 + x] = dctResult[y * 32 + x]
    }
  }

  // Skip DC component (index 0) for mean calculation
  let sum = 0
  for (let i = 1; i < 64; i++) {
    sum += lowFreq[i]
  }
  const mean = sum / 63

  // Generate hash
  let hash = ''
  for (let i = 0; i < 64; i++) {
    hash += lowFreq[i] > mean ? '1' : '0'
  }

  return hash
}

function applyDCT(pixels: Float64Array, size: number): Float64Array {
  const result = new Float64Array(size * size)
  const temp = new Float64Array(size * size)

  // Apply 1D DCT on rows
  for (let y = 0; y < size; y++) {
    for (let u = 0; u < size; u++) {
      let sum = 0
      for (let x = 0; x < size; x++) {
        sum += pixels[y * size + x] * Math.cos((Math.PI * u * (2 * x + 1)) / (2 * size))
      }
      temp[y * size + u] = sum * (u === 0 ? Math.sqrt(1 / size) : Math.sqrt(2 / size))
    }
  }

  // Apply 1D DCT on columns
  for (let x = 0; x < size; x++) {
    for (let v = 0; v < size; v++) {
      let sum = 0
      for (let y = 0; y < size; y++) {
        sum += temp[y * size + x] * Math.cos((Math.PI * v * (2 * y + 1)) / (2 * size))
      }
      result[v * size + x] = sum * (v === 0 ? Math.sqrt(1 / size) : Math.sqrt(2 / size))
    }
  }

  return result
}

export async function computeAllPHash(
  files: FileInfo[],
  onProgress?: (current: number, total: number) => void
): Promise<PhashResult[]> {
  const results: PhashResult[] = []
  const total = files.length

  for (let i = 0; i < total; i += PHASH_BATCH_SIZE) {
    const batch = files.slice(i, i + PHASH_BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        try {
          const phash = await computePHashForFile(file.path)
          return { id: file.id, phash }
        } catch {
          return { id: file.id, phash: '' }
        }
      })
    )
    results.push(...batchResults.filter(r => r.phash !== ''))
    if (onProgress) {
      onProgress(Math.min(i + PHASH_BATCH_SIZE, total), total)
    }
    await new Promise(resolve => setImmediate(resolve))
  }

  return results
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity
  let distance = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) distance++
  }
  return distance
}

export async function generateThumbnail(
  filePath: string,
  maxSize: number = 400
): Promise<string> {
  const buffer = await sharp(filePath)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()
  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}
