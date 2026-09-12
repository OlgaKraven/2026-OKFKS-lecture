import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import jsQR from 'jsqr'
import QRCode from 'qrcode'
import sharp from 'sharp'

const configs = [
  { id: 'okfks-materials', url: 'https://disk.yandex.ru/d/Vz62H71Jub1GLA', color: '#ED131C' },
  { id: 'lit-main-01', url: 'https://www.iprbookshop.ru/books/156708/details', color: '#4561C8' },
  { id: 'lit-main-02', url: 'https://www.iprbookshop.ru/books/156513/details', color: '#1C8D00' },
  { id: 'lit-additional-01', url: 'https://www.iprbookshop.ru/books/156620/details', color: '#4561C8' },
  { id: 'lit-additional-02', url: 'https://www.iprbookshop.ru/books/144785/details', color: '#1C8D00' },
]

const outputDir = path.resolve('public', 'qr')
const logoPath = path.resolve('public', 'brand', 'synergy-logo.png')
await mkdir(outputDir, { recursive: true })

const markSize = 150
const mark = await sharp(logoPath)
  .resize({ width: markSize, height: markSize, fit: 'contain', background: '#FFFFFF' })
  .png()
  .toBuffer()
const whitePlate = await sharp({
  create: { width: 190, height: 190, channels: 4, background: '#FFFFFF' },
})
  .composite([{ input: mark, left: 20, top: 20 }])
  .png()
  .toBuffer()

for (const config of configs) {
  const outputPath = path.join(outputDir, `${config.id}.png`)
  const qr = await QRCode.toBuffer(config.url, {
    type: 'png',
    errorCorrectionLevel: 'H',
    width: 1200,
    margin: 4,
    color: { dark: '#1C1C1C', light: '#FFFFFF' },
  })

  await sharp({
    create: { width: 1264, height: 1264, channels: 4, background: config.color },
  })
    .composite([
      { input: qr, left: 32, top: 32 },
      { input: whitePlate, left: 537, top: 537 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath)

  const decodedImage = await sharp(outputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const decoded = jsQR(
    new Uint8ClampedArray(decodedImage.data),
    decodedImage.info.width,
    decodedImage.info.height,
  )
  if (!decoded || decoded.data !== config.url) {
    throw new Error(`QR verification failed for ${config.id}`)
  }
  console.log(`QR verified: ${decoded.data} -> ${outputPath}`)
}
