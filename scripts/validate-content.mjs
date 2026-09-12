import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { validateCourse } from '@olgakraven/lecture-engine'
const course = JSON.parse(await fs.readFile('public/course.json', 'utf8'))
const bank = JSON.parse(await fs.readFile('public/assessment.json', 'utf8'))
validateCourse(course)
assert.equal(course.demo, false)
assert.equal(bank.courseId, course.id)
assert.equal(bank.contentVersion, course.contentVersion)
const ids = new Set(), taskIds = new Set()
const unique = id => { assert.ok(id && !ids.has(id), `Duplicate ID ${id}`); ids.add(id) }
for (const lecture of course.lectures) {
  unique(lecture.id)
  assert.ok(lecture.slides.length >= 80)
  assert.deepEqual(lecture.slides.slice(0, 5).map(s => s.kind), ['title', 'literature', 'literature', 'materials', 'agenda'])
  assert.equal(lecture.slides.at(-1).kind, 'questions')
  let block = []
  const checkBlock = () => {
    if (!block.length) return
    assert.deepEqual(block.filter(s => s.task).map(s => s.task.type), ['single', 'multiple', 'short', 'matching'])
    assert.ok(block.filter(s => s.visual || s.rows).length >= 2)
    assert.ok(block.some(s => s.notebook))
  }
  for (const s of lecture.slides) {
    unique(s.id)
    if (s.kind === 'section') { checkBlock(); block = [s] } else if (block.length) block.push(s)
    if (s.visual) assert.ok(s.visual.caption)
    if (!s.task) continue
    const t = s.task, key = bank.keys[t.id]
    unique(t.id); taskIds.add(t.id)
    assert.equal(key?.type, t.type)
    const options = new Set(t.options?.map(o => o.id))
    assert.equal(options.size, t.options?.length || 0)
    if (t.type === 'single' || t.type === 'multiple') {
      assert.equal(t.options.length, t.type === 'single' ? 4 : 5)
      assert.equal(key.correct.length, t.type === 'single' ? 1 : t.choose)
      key.correct.forEach(id => assert.ok(options.has(id)))
      assert.ok(t.options.every(o => key.optionExplanations[o.id]))
    }
    if (t.type === 'matching') {
      assert.equal(t.items.length, 4); assert.equal(t.options.length, 4)
      assert.equal(new Set(t.items.map(i => i.id)).size, 4)
      assert.equal(new Set(Object.values(key.pairs)).size, 4)
      t.items.forEach(i => assert.ok(options.has(key.pairs[i.id])))
    }
    if (t.type === 'short') assert.ok(key.accepted?.length || key.numeric)
  }
  checkBlock()
}
assert.deepEqual(new Set(Object.keys(bank.keys)), taskIds)
console.log(JSON.stringify({ lectures: course.lectures.length, slides: course.lectures.reduce((n, l) => n + l.slides.length, 0), tasks: taskIds.size, status: 'passed' }))
