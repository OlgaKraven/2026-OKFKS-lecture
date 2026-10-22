import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'

const sourceRoot = 'authoring/teacher-text-20261022'
const fields = ['script', 'preparation', 'notebook', 'questions', 'answer', 'estimatedSeconds']
const sha256 = value => createHash('sha256').update(value).digest('hex')
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'))
// This is the final author-approved text layer. Run it after all historical
// content reviews and retired-slide removal, before calculating final timings.
export async function applyTeacherText(course, bank, pack) {
  const sourceCourse = await readJson(`${sourceRoot}/Источники/course.json`)
  const sourceBank = await readJson(`${sourceRoot}/Источники/assessment.json`)
  const approved = await readJson(`${sourceRoot}/Пакеты панели/teacher-pack.all.json`)
  const previousPack = await readJson(`${sourceRoot}/Источники/notes.baseline.json`)
  if (JSON.stringify(course) !== JSON.stringify(sourceCourse)
    || JSON.stringify(bank) !== JSON.stringify(sourceBank)) {
    throw Error('Teacher text requires the exact reviewed course and assessment revision')
  }
  if (approved.schemaVersion !== 1 || approved.courseId !== course.id
    || approved.contentVersion !== course.contentVersion) {
    throw Error('Teacher text belongs to another course or content version')
  }
  const slides = course.lectures.flatMap(lecture => lecture.slides)
  const ids = new Set(slides.map(slide => slide.id))
  if (Object.keys(approved.notes).length !== ids.size
    || Object.keys(approved.notes).some(id => !ids.has(id))) {
    throw Error('Teacher text does not cover exactly the reviewed slides')
  }
  for (const slide of slides) {
    const note = approved.notes[slide.id]
    if (Object.keys(note).length !== fields.length
      || fields.slice(0, -1).some(field => typeof note[field] !== 'string')
      || !Number.isFinite(note.estimatedSeconds) || note.estimatedSeconds < 0
      || note.notebook !== previousPack.notes[slide.id]?.notebook) {
      throw Error(`Invalid approved teacher text: ${slide.id}`)
    }
  }

  const previous = new Map([...ids].map(id => [id, Object.fromEntries(fields.map(field => [field, new Set()]))]))
  const addHash = (id, field, hash) => {
    if (previous.has(id) && fields.includes(field) && typeof hash === 'string') previous.get(id)[field].add(hash)
  }
  const addPack = old => {
    for (const [id, note] of Object.entries(old.notes || {})) {
      for (const field of fields) if (note[field] !== undefined) addHash(id, field, sha256(String(note[field])))
    }
    for (const [id, hashes] of Object.entries(old.previousNoteHashes || {})) {
      for (const [field, values] of Object.entries(hashes)) for (const hash of values) addHash(id, field, hash)
    }
  }
  addPack(pack)
  addPack(previousPack)
  // Also refresh the first published slide-aligned text layer. These exact
  // fingerprints were captured before removing implementation metadata.
  const previousAutomatic = await readJson(`${sourceRoot}/previous-auto-hashes.json`)
  if (previousAutomatic.courseId !== course.id || previousAutomatic.contentVersion !== course.contentVersion) {
    throw Error('Previous automatic-note fingerprints belong to another revision')
  }
  for (const [id, hashes] of Object.entries(previousAutomatic.noteHashes)) {
    for (const [field, hash] of Object.entries(hashes)) addHash(id, field, hash)
  }
  for (const file of ['baseline-20260918.json', 'baseline-20261021.json', 'baseline-pilot-20261021.json']) {
    const baseline = await readJson(`authoring/${file}`)
    for (const manifest of [baseline, ...(baseline.previousManifests || [])]) {
      for (const [id, hashes] of Object.entries(manifest.noteHashes || {})) {
        for (const [field, hash] of Object.entries(hashes)) addHash(id, field, hash)
      }
    }
  }
  pack.notes = structuredClone(approved.notes)
  pack.previousNoteHashes = Object.fromEntries([...previous].map(([id, hashes]) => [id,
    Object.fromEntries(fields.map(field => [field, [...hashes[field]].sort()]))]))
}
