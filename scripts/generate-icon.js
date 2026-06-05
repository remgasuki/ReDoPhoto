const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const INPUT = path.join(__dirname, '..', 'icon-source.jpg')
const BUILD_DIR = path.join(__dirname, '..', 'build')
const ICON_SIZES = [16, 32, 48, 64, 128, 256]

async function generateIcon() {
  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true })

  // Generate PNG buffers for each size
  const pngBuffers = []
  for (const size of ICON_SIZES) {
    const buf = await sharp(INPUT)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer()
    pngBuffers.push({ size, data: buf })
    console.log(`Generated ${size}x${size} PNG (${buf.length} bytes)`)
  }

  // Build ICO file (ICO format: header + directory entries + image data)
  const headerSize = 6
  const dirEntrySize = 16
  const numImages = pngBuffers.length
  const dirSize = headerSize + dirEntrySize * numImages

  // Calculate offsets for each image data
  let offset = dirSize
  const entries = pngBuffers.map(({ size, data }) => {
    const entry = { width: size, height: size, size: data.length, offset }
    offset += data.length
    return entry
  })

  const totalSize = offset
  const ico = Buffer.alloc(totalSize)

  // ICO Header
  ico.writeUInt16LE(0, 0)       // Reserved
  ico.writeUInt16LE(1, 2)       // Type: 1 = ICO
  ico.writeUInt16LE(numImages, 4) // Number of images

  // Directory Entries
  entries.forEach((entry, i) => {
    const base = headerSize + i * dirEntrySize
    ico.writeUInt8(entry.width === 256 ? 0 : entry.width, base)      // Width (0 = 256)
    ico.writeUInt8(entry.height === 256 ? 0 : entry.height, base + 1) // Height (0 = 256)
    ico.writeUInt8(0, base + 2)  // Color palette
    ico.writeUInt8(0, base + 3)  // Reserved
    ico.writeUInt16LE(1, base + 4)  // Color planes
    ico.writeUInt16LE(32, base + 6) // Bits per pixel
    ico.writeUInt32LE(entry.size, base + 8)   // Image data size
    ico.writeUInt32LE(entry.offset, base + 12) // Image data offset
  })

  // Image Data
  pngBuffers.forEach(({ data }, i) => {
    data.copy(ico, entries[i].offset)
  })

  const outputPath = path.join(BUILD_DIR, 'icon.ico')
  fs.writeFileSync(outputPath, ico)
  console.log(`\nICO file created: ${outputPath} (${(ico.length / 1024).toFixed(1)} KB)`)

  // Also save a 512x512 PNG for macOS/Linux
  const png512 = await sharp(INPUT).resize(512, 512, { fit: 'cover', position: 'centre' }).png().toBuffer()
  fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), png512)
  console.log(`PNG 512x512 created: ${path.join(BUILD_DIR, 'icon.png')}`)
}

generateIcon().catch(console.error)
