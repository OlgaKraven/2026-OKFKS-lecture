import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { context } from '../authoring/context.mjs'
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'))
const course = await read('public/course.json')
const map = await read('authoring/migration-map.json')
const workload = await read('authoring/course-map.json')
test('all legacy positions retain provenance; the retired s002 semester overviews and s111 summaries have no current slide', () => {
  assert.equal(map.length, 784)
  assert.equal(map.filter(entry => entry.slideIds.length === 0).length, 84)
  for (const lecture of course.lectures) {
    const entries = map.filter(m => m.lectureId === lecture.id)
    assert.deepEqual(entries.map(e => e.oldNumber), Array.from({ length: 112 }, (_, i) => i + 1))
    for (const entry of entries) {
      if ((entry.oldNumber===2||entry.oldNumber>=101&&entry.oldNumber<=111)) {
        assert.deepEqual(entry.slideIds, [])
        assert.match(entry.change, /^Удалён/)
      } else {
        assert.deepEqual(entry.slideIds, [`${lecture.id}-s${String(entry.oldNumber).padStart(3, '0')}`])
        assert.ok(lecture.slides.some(s => s.id === entry.slideIds[0]))
      }
    }
    assert.equal(lecture.slides.length, 108)
    assert.deepEqual(entries.flatMap(entry => entry.slideIds).sort(), lecture.slides.filter(s=>!s.activityPassport).map(slide => slide.id).sort())
  }
})
test('source workload and semester allocation remain separate', () => {
  assert.equal(workload.topics.reduce((n, t) => n + t.lectureHours, 0), 32)
  assert.equal(workload.laboratories.reduce((n, t) => n + t.hours, 0), 44)
  assert.equal(workload.semesterWorkloads.reduce((n, t) => n + t.selfStudyHours, 0), 28)
  assert.deepEqual(course.lectures.map(l => l.semester), [7, 7, 7, 7, 8, 8, 8])
})
test('all 56 questions have distinct worked context rather than placeholders', () => {
  assert.equal(context.length, 7)
  assert.ok(context.every(lecture => lecture.length === 8 && lecture.every(row => row.length === 6 && row.every(value => value.length > 40))))
  const explanations = context.flat().map(row => row[0])
  assert.equal(new Set(explanations).size, 56)
  assert.ok(!JSON.stringify(course).includes('Ответьте письменно: какое решение по теме'))
})
