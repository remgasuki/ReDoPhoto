const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')

try {
  const files = fs.readdirSync(distDir).filter(f => f.endsWith('.exe'))
  for (const file of files) {
    const filePath = path.join(distDir, file)
    try {
      fs.unlinkSync(filePath)
      console.log(`cleaned: ${file}`)
    } catch (e) {
      console.warn(`skipped (locked): ${file}`)
    }
  }
} catch (e) {
  // dist directory doesn't exist yet, nothing to clean
}
