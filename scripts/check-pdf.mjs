import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const variants = ['student', 'teacher']
let checked = 0

const extractText = async (file) => {
  const data = new Uint8Array(await readFile(file))
  const document = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false }).promise
  if (document.numPages !== 85) throw new Error(`${file}: expected 85 pages, got ${document.numPages}`)
  const pages = []
  for (let number = 1; number <= document.numPages; number += 1) {
    const page = await document.getPage(number)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n')
}

for (const variant of variants) {
  const root = path.resolve('outputs', 'pdf', variant)
  const entries = (await readdir(root)).filter((name) => name.endsWith('.pdf')).sort()
  if (entries.length !== 7) throw new Error(`${root}: expected 7 PDFs, got ${entries.length}`)
  for (const entry of entries) {
    const file = path.join(root, entry)
    const text = await extractText(file)
    const hasAnswer = text.includes('Правильный ответ')
    const hasCriteria = text.includes('Критерии проверки')
    if (variant === 'student' && (hasAnswer || hasCriteria)) throw new Error(`${file}: student PDF contains teacher-only answers or criteria`)
    if (variant === 'teacher' && (!hasAnswer || !hasCriteria)) throw new Error(`${file}: teacher PDF is missing answers or criteria`)
    checked += 1
  }
}

console.log(`PDF checks passed: ${checked} files; 85 pages each; student answers absent; teacher answers and criteria present`)
