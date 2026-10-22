import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { migrateCompatibleSession, resolveCourseSlideId } from '../src/compatibility.ts'
const read = name => JSON.parse(fs.readFileSync(name, 'utf8'))
const course = read('public/course.json'), manifest = read('public/teaching/compatibility.json')
const base = '/2026-OKFKS-lecture/'

test('retired closing links and saved positions reach final questions without changing valid positions or scores', async () => {
  const prefix = `lecture:${base}:${course.id}`
  for (const version of [course.contentVersion, manifest.previousVersion]) {
    const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value) }
    const scores = JSON.stringify({ unchanged: { seed: 1, attempts: 2 } })
    storage.setItem(`${prefix}:${course.contentVersion}:attempts`, scores)
    for (const lecture of course.lectures) {
      const retired = `${lecture.id}-s111`, target = `${lecture.id}-s112`
      assert.equal(resolveCourseSlideId(course, lecture.id, retired), target)
      assert.equal(resolveCourseSlideId(course, lecture.id, lecture.slides[0].id), lecture.slides[0].id)
      storage.setItem(`${prefix}:${version}:${lecture.id}:progress`, JSON.stringify(retired))
    }
    await migrateCompatibleSession(course, base, manifest, storage)
    for (const lecture of course.lectures) assert.equal(JSON.parse(storage.getItem(`${prefix}:${course.contentVersion}:${lecture.id}:progress`)), `${lecture.id}-s112`)
    assert.equal(storage.getItem(`${prefix}:${course.contentVersion}:attempts`), scores)
  }
})
