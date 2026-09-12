import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const files = []
async function walk(dir) { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const p = path.join(dir, entry.name); if (entry.isDirectory()) await walk(p); else files.push(p) } }
await walk('dist')
const text = []
for (const file of files) {
  assert.ok(!/private|teacher-pack|\.map$|authoring|legacy/i.test(file), `Private output path: ${file}`)
  if (/\.(js|json|html|css)$/.test(file)) text.push(await fs.readFile(file, 'utf8'))
}
const bundle = text.join('\n')
const course = JSON.parse(await fs.readFile('dist/course.json', 'utf8'))
const forbidden = /"(?:script|preparation|notes|correctAnswer|correctIndexes)"\s*:/
assert.ok(!forbidden.test(JSON.stringify(course)))
const packFiles = await fs.readdir('private').catch(() => [])
let checked = 0
for (const file of packFiles.filter(f => /^teacher-pack.*\.json$/.test(f))) {
  const pack = JSON.parse(await fs.readFile(path.join('private', file), 'utf8'))
  assert.equal(pack.courseId, course.id); assert.equal(pack.contentVersion, course.contentVersion)
  for (const note of Object.values(pack.notes)) {
    assert.ok(!bundle.includes(note.script) && !bundle.includes(JSON.stringify(note.script).slice(1, -1)), 'Private script leaked into dist')
    checked++
  }
}
console.log(JSON.stringify({ files: files.length, privateScriptsChecked: checked, status: 'passed' }))
