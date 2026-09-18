import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { installTeacherNotes } from '../src/teacherNotes.ts'

const course = JSON.parse(fs.readFileSync('public/course.json', 'utf8'))
const pack = JSON.parse(fs.readFileSync('public/teaching/notes.json', 'utf8'))
const key = `lecture:/2026-OKFKS-lecture/:${course.id}:private:${course.contentVersion}`
const storage = () => {
  const values = new Map()
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
}
test('published notes install all slides and preserve teacher edits on repeat visits', () => {
  const store = storage()
  installTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)
  const saved = JSON.parse(store.getItem(key))
  assert.equal(Object.keys(saved).length, 784)
  const id = course.lectures[0].slides[0].id
  saved[id].script = 'Моя правка для конкретной группы'
  store.setItem(key, JSON.stringify(saved))
  installTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)
  assert.equal(JSON.parse(store.getItem(key))[id].script, saved[id].script)
})
test('a mismatched or incomplete publication cannot replace existing notes', () => {
  const store = storage()
  store.setItem(key, '{"existing":"untouched"}')
  for (const invalid of [{ ...pack, contentVersion: 'wrong' }, { ...pack, notes: {} }]) {
    assert.throws(() => installTeacherNotes(course, '/2026-OKFKS-lecture/', invalid, store))
    assert.equal(store.getItem(key), '{"existing":"untouched"}')
  }
})
