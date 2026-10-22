import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { applyFourSlidePilot, pilotSlideIds } from '../authoring/four-slide-pilot.mjs'

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const before = read('authoring/baseline-20261021.json')
// Keep the approved four-slide transform independently reviewable as the full
// course grows; the public course is covered by the revision tests.
const course = structuredClone(before.course), bank = structuredClone(before.bank)
applyFourSlidePilot(course, bank, read('public/teaching/notes.json'))

test('the visual pilot changes only four slides and preserves course identity and notebook anchors', () => {
  const oldSlides = before.course.lectures.flatMap(l => l.slides)
  const slides = course.lectures.flatMap(l => l.slides)
  assert.deepEqual(slides.map(s => s.id), oldSlides.map(s => s.id))
  assert.deepEqual(slides.filter((s, i) => JSON.stringify(s) !== JSON.stringify(oldSlides[i])).map(s => s.id).sort(), [...pilotSlideIds].sort())
  slides.forEach((s, i) => assert.equal(s.notebook, oldSlides[i].notebook, s.id))
  for (const field of ['logo', 'mascot', 'mascotAlt', 'font', 'ornament', 'semesters', 'literature']) assert.deepEqual(course[field], before.course[field], field)
})

test('only the reviewed technical-role assessment changes its task and key', () => {
  const oldTasks = new Map(before.course.lectures.flatMap(l => l.slides).filter(s => s.task).map(s => [s.task.id, s.task]))
  const tasks = course.lectures.flatMap(l => l.slides).filter(s => s.task).map(s => s.task)
  const changed = tasks.filter(t => JSON.stringify(t) !== JSON.stringify(oldTasks.get(t.id)) || JSON.stringify(bank.keys[t.id]) !== JSON.stringify(before.bank.keys[t.id])).map(t => t.id)
  assert.deepEqual(changed, ['s08-03-encryption-and-security-testing-q3-choice-check'])
  assert.equal(tasks.length, 224)
  const task = tasks.find(t => t.id === changed[0])
  assert.equal(task.choose, 2)
  assert.equal(task.options.length, 5)
  assert.equal(bank.keys[task.id].correct.length, 2)
})
