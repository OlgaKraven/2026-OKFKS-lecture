import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { prepareTeacherNotes } from '../src/teacherNotes.ts'

const course = JSON.parse(fs.readFileSync('public/course.json', 'utf8'))
const pack = JSON.parse(fs.readFileSync('public/teaching/notes.json', 'utf8'))
const key = `lecture:/2026-OKFKS-lecture/:${course.id}:private:${course.contentVersion}`
const storage = () => {
  const values = new Map()
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
}
test('published notes install all slides and preserve teacher edits on repeat visits', () => {
  const store = storage()
  const saved = prepareTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)
  assert.equal(store.getItem(key), null)
  assert.equal(Object.keys(saved).length, 784)
  const id = course.lectures[0].slides[0].id
  saved[id].script = 'Моя правка для конкретной группы'
  store.setItem(key, JSON.stringify(saved))
  const restored = prepareTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)
  assert.equal(restored[id].script, saved[id].script)
})
test('a mismatched or incomplete publication cannot replace existing notes', () => {
  const store = storage()
  store.setItem(key, '{"existing":"untouched"}')
  for (const invalid of [{ ...pack, contentVersion: 'wrong' }, { ...pack, notes: {} }]) {
    assert.throws(() => prepareTeacherNotes(course, '/2026-OKFKS-lecture/', invalid, store))
    assert.equal(store.getItem(key), '{"existing":"untouched"}')
  }
})
test('empty local sections do not hide the published notes, while edited text survives', () => {
  const store = storage()
  const id = course.lectures[0].slides[0].id
  store.setItem(key, JSON.stringify({ [id]: { script: '', preparation: 'Моя подготовка', notebook: '', questions: '  ', answer: '', estimatedSeconds: 0 } }))
  const note = prepareTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)[id]
  assert.equal(note.script, pack.notes[id].script)
  assert.equal(note.questions, pack.notes[id].questions)
  assert.equal(note.preparation, 'Моя подготовка')
  assert.equal(note.estimatedSeconds, 0)
})
test('unavailable or corrupt storage does not hide the published notes', () => {
  for (const store of [{ getItem: () => { throw new Error('Storage disabled') } }, { getItem: () => '{broken' }]) {
    const notes = prepareTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)
    assert.equal(Object.keys(notes).length, 784)
    const id = course.lectures[0].slides[0].id
    assert.equal(notes[id].script, pack.notes[id].script)
  }
})
