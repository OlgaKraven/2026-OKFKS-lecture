import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { migrateCompatibleSession, exportPreviousResults } from '../src/compatibility.ts'

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const baseline = read('authoring/baseline-20261021.json')
const fixture = read('tests/fixtures/previous-note.json')
const targetVersion = '2.0.3-four-slide-pilot-20261021'
const course = { ...baseline.course, contentVersion: targetVersion }
const changed = 's08-03-encryption-and-security-testing-q3-choice-check'
const taskIds = course.lectures.flatMap(l => l.slides.flatMap(s => s.task ? [s.task.id] : []))
const base = '/2026-OKFKS-lecture/', prefix = `lecture:${base}:${course.id}`
const middleVersion = baseline.course.contentVersion
const legacy = baseline.previousManifests[0]
const attempt = seed => ({ seed, attempts: 2, draft: ['o1'], result: { status: 'correct', score: 1 } })
const store = () => {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}
const manifest = () => ({
  courseId: course.id, previousVersion: middleVersion, contentVersion: targetVersion,
  unchangedTaskIds: taskIds.filter(id => id !== changed), noteHashes: baseline.noteHashes,
  noteSeconds: { [fixture.id]: fixture.note.estimatedSeconds + 1 }, previousManifests: [structuredClone(legacy)],
})
const attemptsKey = version => `${prefix}:${version}:attempts`
const notesKey = version => `${prefix}:private:${version}`
const hashes = note => Object.fromEntries(Object.entries(note).map(([field, value]) => [field, createHash('sha256').update(String(value)).digest('hex')]))

test('the new baseline preserves every published note fingerprint and the original migration edge', () => {
  assert.equal(taskIds.length, 224)
  assert.equal(Object.keys(baseline.noteHashes).length, 784)
  assert.deepEqual(baseline.noteHashes[fixture.id], hashes(fixture.note))
  assert.equal(legacy.previousVersion, '2.0.1-content-review-20260918')
  assert.equal(legacy.contentVersion, middleVersion)
  assert.equal(legacy.unchangedTaskIds.length, 129)
})

test('2.0.2 results migrate for all 223 unchanged tasks, with the changed task archived', async () => {
  const s = store(), currentTask = taskIds.find(id => id !== changed)
  const prior = Object.fromEntries(taskIds.map((id, index) => [id, attempt(index + 1)]))
  s.setItem(attemptsKey(middleVersion), JSON.stringify(prior))
  s.setItem(attemptsKey(targetVersion), JSON.stringify({ [currentTask]: attempt(999) }))
  await migrateCompatibleSession(course, base, manifest(), s)
  const migrated = JSON.parse(s.getItem(attemptsKey(targetVersion)))
  assert.equal(Object.keys(migrated).length, 223)
  assert.equal(migrated[changed], undefined)
  assert.equal(migrated[currentTask].seed, 999)
  assert.deepEqual(exportPreviousResults(course, base, middleVersion, s).attempts, prior)
})

test('a skipped 2.0.2 update migrates legacy results, reading position and authored fields through both edges', async () => {
  const s = store(), m = manifest()
  const safe = legacy.unchangedTaskIds.find(id => id !== changed)
  const oldOnly = taskIds.find(id => !legacy.unchangedTaskIds.includes(id))
  const prior = { [safe]: attempt(1), [changed]: attempt(2), [oldOnly]: attempt(3) }
  s.setItem(attemptsKey(legacy.previousVersion), JSON.stringify(prior))
  const lecture = course.lectures.at(-1), slideId = lecture.slides[30].id
  s.setItem(`${prefix}:${legacy.previousVersion}:${lecture.id}:progress`, JSON.stringify(slideId))
  const oldNote = { ...fixture.note, script: 'Прежний опубликованный сценарий', estimatedSeconds: 80 }
  m.previousManifests[0].noteHashes[fixture.id] = hashes(oldNote)
  m.previousManifests[0].noteSeconds[fixture.id] = fixture.note.estimatedSeconds
  s.setItem(notesKey(legacy.previousVersion), JSON.stringify({ [fixture.id]: { ...oldNote, questions: 'Мой прежний вопрос' } }))
  s.setItem(notesKey(targetVersion), JSON.stringify({ [fixture.id]: { script: '', preparation: 'Моя новая подготовка', notebook: '', questions: '', answer: '', estimatedSeconds: 77 } }))
  const result = await migrateCompatibleSession(course, base, m, s)
  const migrated = JSON.parse(s.getItem(attemptsKey(targetVersion)))
  assert.deepEqual(migrated, { [safe]: prior[safe] })
  assert.equal(JSON.parse(s.getItem(`${prefix}:${targetVersion}:${lecture.id}:progress`)), slideId)
  const note = JSON.parse(s.getItem(notesKey(targetVersion)))[fixture.id]
  assert.equal(note.script, '')
  assert.equal(note.questions, 'Мой прежний вопрос')
  assert.equal(note.preparation, 'Моя новая подготовка')
  assert.equal(note.estimatedSeconds, 77)
  assert.ok(result.archiveVersions.includes(legacy.previousVersion))
  assert.deepEqual(exportPreviousResults(course, base, legacy.previousVersion, s).attempts, prior)
})

test('the engine reset persisted as an empty attempts map survives reload and repeated chained migration', async () => {
  const s = store(), m = manifest(), safe = legacy.unchangedTaskIds.find(id => id !== changed)
  const prior = { [safe]: attempt(4) }
  s.setItem(attemptsKey(legacy.previousVersion), JSON.stringify(prior))
  await migrateCompatibleSession(course, base, m, s)
  assert.ok(JSON.parse(s.getItem(attemptsKey(targetVersion)))[safe])
  // The pinned lecture-engine reset persists {} at this exact key.
  s.setItem(attemptsKey(targetVersion), JSON.stringify({}))
  await migrateCompatibleSession(course, base, m, s)
  await migrateCompatibleSession(course, base, m, s)
  assert.deepEqual(JSON.parse(s.getItem(attemptsKey(targetVersion))), {})
  assert.deepEqual(exportPreviousResults(course, base, legacy.previousVersion, s).attempts, prior)
  // Clearing the attempts key rather than writing {} must not replay import either.
  s.removeItem(attemptsKey(targetVersion))
  await migrateCompatibleSession(course, base, m, s)
  assert.equal(s.getItem(attemptsKey(targetVersion)), null)
})

test('an existing 2.0.2 reset or partial result map is preserved when upgrading from a release without migration markers', async () => {
  const safe = legacy.unchangedTaskIds.filter(id => id !== changed).slice(0, 2)
  const prior = { [safe[0]]: attempt(7), [safe[1]]: attempt(8) }
  for (const middle of [{}, { [safe[0]]: attempt(9) }]) {
    const s = store(), m = manifest()
    s.setItem(attemptsKey(legacy.previousVersion), JSON.stringify(prior))
    // 2.0.2 persisted resets as {}, before one-time migration markers existed.
    s.setItem(attemptsKey(middleVersion), JSON.stringify(middle))
    await migrateCompatibleSession(course, base, m, s)
    await migrateCompatibleSession(course, base, m, s)
    assert.deepEqual(JSON.parse(s.getItem(attemptsKey(middleVersion))), middle)
    assert.deepEqual(JSON.parse(s.getItem(attemptsKey(targetVersion)) || '{}'), middle)
    assert.deepEqual(exportPreviousResults(course, base, legacy.previousVersion, s).attempts, prior)
  }
})

test('legacy-only incompatible attempts stay exportable even when no intermediate results migrate', async () => {
  const s = store(), oldOnly = taskIds.find(id => !legacy.unchangedTaskIds.includes(id))
  const prior = { [oldOnly]: attempt(5) }
  s.setItem(attemptsKey(legacy.previousVersion), JSON.stringify(prior))
  const result = await migrateCompatibleSession(course, base, manifest(), s)
  assert.equal(s.getItem(attemptsKey(targetVersion)), null)
  assert.equal(result.previousVersion, legacy.previousVersion)
  assert.equal(result.archiveAvailable, true)
  assert.deepEqual(exportPreviousResults(course, base, result.previousVersion, s).attempts, prior)
})

test('an invalid or cyclic historical chain is rejected before any results are written', async () => {
  for (const version of ['unrelated-version', targetVersion]) {
    const s = store(), m = manifest(), safe = m.unchangedTaskIds[0]
    s.setItem(attemptsKey(middleVersion), JSON.stringify({ [safe]: attempt(6) }))
    if (version === targetVersion) m.previousManifests[0].previousVersion = version
    else m.previousManifests[0].contentVersion = version
    await assert.rejects(migrateCompatibleSession(course, base, m, s), /Некорректная карта/)
    assert.equal(s.getItem(attemptsKey(targetVersion)), null)
  }
})
