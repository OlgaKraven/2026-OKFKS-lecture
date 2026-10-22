import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
const files = []
async function walk(dir) { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const p = path.join(dir, entry.name); if (entry.isDirectory()) await walk(p); else files.push(p) } }
await walk('dist')
const course = JSON.parse(await fs.readFile('dist/course.json', 'utf8'))
const teacherManifest = JSON.parse(await fs.readFile('dist/teaching/texts/manifest.json', 'utf8'))
assert.equal(teacherManifest.contentVersion, course.contentVersion)
assert.deepEqual(teacherManifest.lectures.map(l => l.id), course.lectures.map(l => l.id))
const publicPacks = new Set(course.lectures.map(l => `teaching/packs/${l.id}.json`))
const text = []
for (const file of files) {
  assert.ok(!/private|teacher-pack|\.map$|authoring|legacy/i.test(file), `Private output path: ${file}`)
  if (/\.(js|json|html|css)$/.test(file) && !new Set(['teaching/notes.json', ...publicPacks]).has(path.relative('dist', file).replaceAll('\\', '/'))) text.push(await fs.readFile(file, 'utf8'))
}
const bundle = text.join('\n')
const forbidden = /"(?:script|preparation|notes|correctAnswer|correctIndexes)"\s*:/
assert.ok(!forbidden.test(JSON.stringify(course)))
// The author explicitly publishes the baseline notes as a separate resource.
// They must not be embedded into slides, scripts or the audience payload.
const published = JSON.parse(await fs.readFile('dist/teaching/notes.json', 'utf8'))
const authored = JSON.parse(await fs.readFile('public/teaching/notes.json', 'utf8'))
assert.deepEqual(published, authored)
assert.equal(published.courseId, course.id)
assert.equal(published.contentVersion, course.contentVersion)
assert.deepEqual(Object.keys(published.notes).sort(), course.lectures.flatMap(l => l.slides.map(s => s.id)).sort())
for (const note of Object.values(published.notes)) {
  assert.ok(!bundle.includes(note.script) && !bundle.includes(JSON.stringify(note.script).slice(1, -1)), 'Teacher script embedded outside the published notes resource')
}
// Teacher downloads are intentional separate resources, never audience payloads.
for (const entry of teacherManifest.lectures) {
  assert.equal(entry.packPath, `teaching/packs/${entry.id}.json`)
  for (const [field, checksum] of [['textPath', 'textSha256'], ['scenarioPath', 'scenarioSha256']]) {
    const expected = `teaching/${field === 'textPath' ? 'texts' : 'scenarios'}/${entry.id}.md`
    assert.equal(entry[field], expected)
    assert.equal(createHash('sha256').update(await fs.readFile(path.join('dist', expected))).digest('hex'), entry[checksum])
  }
  const partial = JSON.parse(await fs.readFile(path.join('dist', entry.packPath), 'utf8'))
  assert.equal(partial.contentVersion, course.contentVersion)
  const lecture = course.lectures.find(l => l.id === entry.id)
  assert.deepEqual(Object.keys(partial.notes), lecture.slides.map(s => s.id))
  for (const [id, note] of Object.entries(partial.notes)) assert.deepEqual(note, published.notes[id])
}
const packFiles = await fs.readdir('private').catch(() => [])
const compatibility = JSON.parse(await fs.readFile('dist/teaching/compatibility.json', 'utf8'))
const knownVersions = new Set([course.contentVersion])
const collectVersions = manifest => {
  knownVersions.add(manifest.previousVersion)
  for (const previous of manifest.previousManifests || []) collectVersions(previous)
}
collectVersions(compatibility)
let checked = 0
for (const file of packFiles.filter(f => /^teacher-pack.*\.json$/.test(f))) {
  const pack = JSON.parse(await fs.readFile(path.join('private', file), 'utf8'))
  assert.equal(pack.courseId, course.id)
  assert.ok(knownVersions.has(pack.contentVersion), 'Unrecognized private pack version')
  for (const note of Object.values(pack.notes)) {
    assert.ok(!bundle.includes(note.script) && !bundle.includes(JSON.stringify(note.script).slice(1, -1)), 'Private script leaked into dist')
    checked++
  }
}
console.log(JSON.stringify({ files: files.length, privateScriptsChecked: checked, status: 'passed' }))
