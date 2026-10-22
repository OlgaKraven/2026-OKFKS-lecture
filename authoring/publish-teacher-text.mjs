import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { deflateRawSync } from 'node:zlib'

const sourceRoot = 'authoring/teacher-text-20261022'
const fields = ['script', 'preparation', 'notebook', 'questions', 'answer', 'estimatedSeconds']
const sha256 = value => createHash('sha256').update(value).digest('hex')
const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'))
const writeJson = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n')
}

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

// ZIP uses only Node's standard library. Fixed timestamps and sorted entries
// keep archives reproducible without adding a package or a Python dependency.
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})
const crc32 = bytes => {
  let crc = 0xffffffff
  for (const value of bytes) crc = crcTable[(crc ^ value) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function zip(entries) {
  const local = [], central = []
  let offset = 0
  for (const [name, input] of [...entries].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const filename = Buffer.from(name, 'utf8'), data = Buffer.from(input)
    const compressed = deflateRawSync(data, { level: 9 }), crc = crc32(data)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4)
    header.writeUInt16LE(0x800, 6); header.writeUInt16LE(8, 8)
    header.writeUInt16LE(0x5d56, 12) // 2026-10-22, 00:00:00
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18)
    header.writeUInt32LE(data.length, 22); header.writeUInt16LE(filename.length, 26)
    local.push(header, filename, compressed)
    const directory = Buffer.alloc(46)
    directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6)
    directory.writeUInt16LE(0x800, 8); directory.writeUInt16LE(8, 10); directory.writeUInt16LE(0x5d56, 14)
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(compressed.length, 20)
    directory.writeUInt32LE(data.length, 24); directory.writeUInt16LE(filename.length, 28)
    directory.writeUInt32LE(offset, 42); central.push(directory, filename)
    offset += header.length + filename.length + compressed.length
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16)
  return Buffer.concat([...local, directory, end])
}

export async function publishTeacherDownloads(course) {
  const lectures = [], archiveEntries = []
  for (const [index, lecture] of course.lectures.entries()) {
    const number = String(index + 1).padStart(2, '0')
    const alignmentFile = `alignment-${number}.json`
    const alignment = await readJson(`${sourceRoot}/${alignmentFile}`)
    if (alignment.courseId !== course.id || alignment.contentVersion !== course.contentVersion
      || alignment.lectureIds.length !== 1 || alignment.lectureIds[0] !== lecture.id
      || JSON.stringify(alignment.slides.map(slide => slide.slideId)) !== JSON.stringify(lecture.slides.map(slide => slide.id))) {
      throw Error(`Export alignment differs from the reviewed lecture: ${lecture.id}`)
    }
    const text = await fs.readFile(`${sourceRoot}/${alignment.documents.teacher}`)
    const scenario = await fs.readFile(`${sourceRoot}/${alignment.documents.presenter}`)
    const partialPath = `Пакеты панели/lecture-${number}.json`
    const partial = await fs.readFile(`${sourceRoot}/${partialPath}`)
    const textPath = `teaching/texts/${lecture.id}.md`
    const scenarioPath = `teaching/scenarios/${lecture.id}.md`
    for (const [file, bytes] of [[textPath, text], [scenarioPath, scenario], [`teaching/packs/${lecture.id}.json`, partial]]) {
      await fs.mkdir(path.dirname(`public/${file}`), { recursive: true })
      await fs.writeFile(`public/${file}`, bytes)
    }
    const webAlignment = { ...alignment, documents: { teacher: `texts/${lecture.id}.md`, presenter: `scenarios/${lecture.id}.md` } }
    await writeJson(`public/teaching/${alignmentFile}`, webAlignment)
    lectures.push({ id: lecture.id, title: lecture.title, semester: lecture.semester, slides: lecture.slides.length,
      textPath, scenarioPath, textSha256: sha256(text), scenarioSha256: sha256(scenario),
      alignmentPath: `teaching/${alignmentFile}`, packPath: `teaching/packs/${lecture.id}.json` })
    archiveEntries.push({ semester: lecture.semester, files: [
      [alignment.documents.teacher, text], [alignment.documents.presenter, scenario],
      [alignmentFile, await fs.readFile(`${sourceRoot}/${alignmentFile}`)], [partialPath, partial],
    ] })
  }
  const common = await Promise.all(['Источники/course.json', 'Источники/assessment.json'].map(async file => [file, await fs.readFile(`${sourceRoot}/${file}`)]))
  const approvedPack = await fs.readFile(`${sourceRoot}/Пакеты панели/teacher-pack.all.json`)
  const downloads = { all: 'teaching/exports/okfks-teacher-all.zip', semesters: {
    7: 'teaching/exports/okfks-teacher-semester-7.zip', 8: 'teaching/exports/okfks-teacher-semester-8.zip',
  } }
  const archives = {}
  for (const semester of [null, 7, 8]) {
    const selected = archiveEntries.filter(item => semester === null || item.semester === semester)
    const files = [...common, ...selected.flatMap(item => item.files)]
    if (semester === null) files.push(['Пакеты панели/teacher-pack.all.json', approvedPack])
    files.push(['README.md', Buffer.from(`# ОКФКС: тексты и сценарии преподавателя\n\nВерсия курса: ${course.contentVersion}. Лекций в архиве: ${selected.length}.\n\nТексты MD сохраняют привязку к реальным ID и порядку слайдов. Сценарии находятся в папке «Панель преподавателя», пакеты для приложения — в «Пакеты панели». Файлы alignment связывают оба документа с каждым слайдом; сохраняйте взаимное расположение файлов. Полный пакет доступен только в общем архиве.\n\nЭто опубликованные авторские сценарии. Персональные правки преподавателя из браузера в архив не включены. Оценки времени расчётные.\n`, 'utf8')])
    const target = semester === null ? downloads.all : downloads.semesters[semester]
    const bytes = zip(files)
    await fs.mkdir(path.dirname(`public/${target}`), { recursive: true })
    await fs.writeFile(`public/${target}`, bytes)
    archives[semester === null ? 'all' : semester] = { path: target, sha256: sha256(bytes), bytes: bytes.length, lectures: selected.length, files: files.length }
  }
  const manifest = { schemaVersion: 1, courseId: course.id, contentVersion: course.contentVersion,
    sourceSha256: sha256(await fs.readFile(`${sourceRoot}/Источники/course.json`)), lectures, downloads, archives }
  await writeJson('public/teaching/texts/manifest.json', manifest)
  return manifest
}
