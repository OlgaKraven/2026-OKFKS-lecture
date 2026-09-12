import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const source = path.resolve(root, 'public', 'brand', 'mascot', 'okfks-rhino.png')
const mascotDir = path.resolve(root, 'public', 'brand', 'mascot')

await sharp(source).resize({ width: 560, height: 560, fit: 'contain' }).png({ compressionLevel: 9 }).toFile(path.join(mascotDir, 'okfks-rhino-catalog.png'))
await sharp(source).resize({ width: 900, height: 900, fit: 'contain' }).png({ compressionLevel: 9 }).toFile(path.join(mascotDir, 'okfks-rhino-pdf.png'))
await sharp(source).webp({ quality: 92, alphaQuality: 100 }).toFile(path.join(mascotDir, 'okfks-rhino.webp'))

const cardText = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <style>
      .k { font: 800 29px Arial, sans-serif; letter-spacing: 2px; fill: #ffbbc0; }
      .h { font: 900 66px Arial, sans-serif; fill: #ffffff; }
      .s { font: 600 27px Arial, sans-serif; fill: #e0e1e5; }
    </style>
    <text x="70" y="105" class="k">МДК.04.02 · 7-Й И 8-Й СЕМЕСТРЫ</text>
    <text x="70" y="210" class="h">Качество, надёжность</text>
    <text x="70" y="292" class="h">и защита систем</text>
    <text x="70" y="388" class="s">7 тем · 32 ч лекций · 44 ч лабораторных работ</text>
  </svg>
`)

const mascot = await sharp(source).resize({ width: 500, height: 500, fit: 'contain' }).png().toBuffer()

await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#1C1C1C' } })
  .composite([
    { input: Buffer.from('<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><path d="M790 0H1200V630H690L870 315Z" fill="#ED131C"/><path d="M0 596H1200V630H0Z" fill="#ED131C"/></svg>') },
    { input: mascot, left: 755, top: 65 },
    { input: cardText, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(path.resolve(root, 'public', 'og.png'))

console.log('Brand assets prepared')
