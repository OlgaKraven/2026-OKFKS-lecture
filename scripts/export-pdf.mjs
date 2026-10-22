import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { PDFDocument } from 'pdf-lib'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'
import sharp from 'sharp'

const args = process.argv.slice(2)
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
if (arg('--variant', 'student') !== 'student') throw Error('Публичный экспорт поддерживает только student. Сценарий выдаётся отдельным TeacherPack.')
const output = path.resolve(arg('--output', 'outputs/pdf/student'))
const course = JSON.parse(await fs.readFile('dist/course.json', 'utf8'))
const topic = arg('--topic', '')
const lectures = course.lectures.filter(l => !topic || l.id === topic)
if (!lectures.length) throw Error(`Unknown topic ${topic}`)
const port = arg('--port', '5398')
const base = `http://127.0.0.1:${port}/2026-OKFKS-lecture/`
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', port, '--strictPort'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
let log = '', browser
server.stdout.on('data', b => { log += b }); server.stderr.on('data', b => { log += b })
const reports = []
const diagrams = (await Promise.all(['semester7','semester8'].map(name => fs.readFile(`src/infographics/data/${name}.json`, 'utf8')))).flatMap(text => JSON.parse(text))
try {
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw Error(log)
    if (await fetch(base).then(r => r.ok).catch(() => false)) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  if (server.exitCode !== null) throw Error(log)
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await fs.mkdir(output, { recursive: true })
  for (const lecture of lectures) {
    const expectedSlides = lecture.slides.filter(slide => !slide.task && slide.kind !== 'test').length
    const lectureDiagrams=diagrams.filter(spec=>lecture.slides.some(slide=>slide.id===spec.slideId))
    const expectedDiagrams=lectureDiagrams.length
    const diagramOnly=lectureDiagrams.filter(spec=>{const s=lecture.slides.find(slide=>slide.id===spec.slideId);return !s.body&&!s.bullets?.length&&!s.notebook&&!s.rows}).length
    const expectedTextPages=expectedSlides-diagramOnly
    await page.goto(`${base}?mode=print&scope=${lecture.id}`)
    await page.waitForFunction(count => document.querySelectorAll('.print-page').length === count, expectedTextPages)
    await page.waitForFunction(count => document.querySelectorAll('.lv-print-sheet').length === count, expectedDiagrams)
    await page.waitForFunction(() => document.fonts.check('16px Raleway'))
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())) })
    await page.waitForFunction(() => document.querySelectorAll('.resource-qr').length === 5)
    await page.evaluate(async () => Promise.all([...document.images].map(image => image.decode())))
    const qr = await page.locator('.resource-qr').evaluateAll(images => images.map(img => ({ svg: img.outerHTML, expected: img.parentElement.querySelector('a')?.href })))
    for (const code of qr) {
      const svg = code.svg.includes('xmlns=') ? code.svg : code.svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      const png = PNG.sync.read(await sharp(Buffer.from(svg)).resize(512, 512).png().toBuffer())
      const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
      if (!code.expected || decoded?.data !== code.expected) throw Error(`QR mismatch: ${code.expected}`)
    }
    await page.emulateMedia({ media: 'print' })
    const unstableOrders=await page.locator('.print-page .lv-ordered').evaluateAll(nodes=>nodes.filter(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length!==3).length)
    if(unstableOrders)throw Error('Printed sequence lost its three-column layout')
    const ambiguousGuards = await page.locator('.lv-print-sheet [data-label-edge]').evaluateAll(labels => labels.flatMap(label => {
      const svg = label.closest('svg'), box = label.querySelector('foreignObject')
      const point = { x: Number(box.getAttribute('x')) + Number(box.getAttribute('width')) / 2, y: Number(box.getAttribute('y')) + Number(box.getAttribute('height')) / 2 }
      const distances = [...svg.querySelectorAll('path[data-edge]')].map(edge => {
        const length = edge.getTotalLength()
        let distance = Infinity
        for (let n = 0; n <= Math.ceil(length); n++) {
          const p = edge.getPointAtLength(Math.min(n, length))
          distance = Math.min(distance, Math.hypot(p.x - point.x, p.y - point.y))
        }
        return { id: edge.dataset.edge, distance }
      })
      const own = distances.find(edge => edge.id === label.dataset.labelEdge)
      return !own || distances.some(edge => edge.id !== own.id && edge.distance <= own.distance + .2) ? [label.textContent] : []
    }))
    if (ambiguousGuards.length) throw Error(`Ambiguous branch labels: ${lecture.id}: ${ambiguousGuards.join('; ')}`)
    const layout = await page.locator('.slide-frame').evaluateAll(frames => frames.map(frame => {
      const copy = frame.querySelector('.slide-copy')
      const r = copy.getBoundingClientRect(), footer = frame.querySelector('.slide-footer').getBoundingClientRect()
      const content = [...copy.children].filter(x => x.getClientRects().length).map(x => x.getBoundingClientRect())
      const bottom = Math.max(...content.map(x => x.bottom))
      const svgOverflow = [...copy.querySelectorAll('svg')].flatMap(svg => {
        const vb = svg.viewBox.baseVal
        return [...svg.querySelectorAll('text')].filter(t => { const b = t.getBBox(); return b.x < -1 || b.x + b.width > vb.width + 1 || b.y + b.height > vb.height + 1 }).map(t => t.textContent)
      })
      const overlap = content.some((rect, i) => content.slice(i + 1).some(other => Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 2 && Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 2))
      return { id: frame.dataset.slideId, overflow: Math.max(0, bottom - footer.top, copy.scrollHeight - copy.clientHeight), rightOverflow: Math.max(0, ...content.map(x => x.right - r.right)), overlap, svgOverflow }
    }).filter(x => x.overflow > 2 || x.rightOverflow > 2 || x.overlap || x.svgOverflow.length))
    const file = path.join(output, `${lecture.id}.pdf`)
    await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true })
    const pdf = await PDFDocument.load(await fs.readFile(file))
    if (pdf.getPageCount() < expectedTextPages + expectedDiagrams) throw Error(`Missing printed content: ${lecture.id}: ${pdf.getPageCount()}`)
    if (errors.length) throw Error(errors.join('\n'))
    reports.push({ lectureId: lecture.id, file: path.relative(process.cwd(), file), pages: pdf.getPageCount(), sourceSlides: expectedSlides, diagramSheets: expectedDiagrams, qrDecoded: qr.length, branchLabelsChecked: true, layout })
    console.log(JSON.stringify(reports.at(-1)))
  }
  await fs.mkdir('reports', { recursive: true })
  await fs.writeFile('reports/pdf-qa.json', JSON.stringify(reports, null, 2))
} finally {
  if (browser) await browser.close()
  server.kill()
}
if (reports.some(r => r.layout.length)) process.exitCode = 1
