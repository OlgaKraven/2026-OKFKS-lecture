import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { prepareTeacherNotes, prepareUpdatedTeacherNotes, prepareTeacherSession } from '../src/teacherNotes.ts'
import {createHash} from 'node:crypto'

const course = JSON.parse(fs.readFileSync('public/course.json', 'utf8'))
const pack = JSON.parse(fs.readFileSync('public/teaching/notes.json', 'utf8'))
const key = `lecture:/2026-OKFKS-lecture/:${course.id}:private:${course.contentVersion}`
const storage = () => {
  const values = new Map()
  return { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) }
}
test('a same-version publication refreshes known automatic fields and preserves manual fields without writing storage',async()=>{
  const store=storage(), revised=structuredClone(pack),id=course.lectures[0].slides[0].id
  const previous='Автоматический сценарий прежнего выпуска'
  revised.previousNoteHashes={[id]:{script:[createHash('sha256').update(previous).digest('hex')]}}
  const local={...pack.notes[id],script:previous,questions:'Мой вопрос этой группе'}
  const original=JSON.stringify({[id]:local});store.setItem(key,original)
  const updated=await prepareUpdatedTeacherNotes(course,'/2026-OKFKS-lecture/',revised,store)
  assert.equal(updated[id].script,pack.notes[id].script)
  assert.equal(updated[id].questions,local.questions)
  assert.equal(store.getItem(key),original)
  local.script='Мой изменённый сценарий'
  store.setItem(key,JSON.stringify({[id]:local}))
  assert.equal((await prepareUpdatedTeacherNotes(course,'/2026-OKFKS-lecture/',revised,store))[id].script,local.script)
})
test('published notes install all slides and preserve teacher edits on repeat visits', () => {
  const store = storage()
  const saved = prepareTeacherNotes(course, '/2026-OKFKS-lecture/', pack, store)
  assert.equal(store.getItem(key), null)
  assert.equal(Object.keys(saved).length, 756)
  const slideIds = course.lectures.flatMap(lecture => lecture.slides.map(slide => slide.id))
  assert.deepEqual(Object.keys(pack.notes).sort(), [...slideIds].sort())
  assert.deepEqual(Object.keys(saved).sort(), [...slideIds].sort())
  for (const lecture of course.lectures) assert.equal(pack.notes[`${lecture.id}-s111`], undefined)
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
    assert.equal(Object.keys(notes).length, 756)
    const id = course.lectures[0].slides[0].id
    assert.equal(notes[id].script, pack.notes[id].script)
  }
})

test('automatic timing refreshes together with the script, while a manual timer survives', async () => {
  const id=course.lectures[0].slides[0].id, store=storage(), revised=structuredClone(pack)
  revised.previousNoteHashes={[id]:{estimatedSeconds:[createHash('sha256').update('999').digest('hex')]}}
  store.setItem(key,JSON.stringify({[id]:{...pack.notes[id],estimatedSeconds:999}}))
  const original=store.getItem(key)
  assert.equal((await prepareUpdatedTeacherNotes(course,'/2026-OKFKS-lecture/',revised,store))[id].estimatedSeconds,pack.notes[id].estimatedSeconds)
  assert.equal(store.getItem(key),original)
  store.setItem(key,JSON.stringify({[id]:{...pack.notes[id],estimatedSeconds:998}}))
  assert.equal((await prepareUpdatedTeacherNotes(course,'/2026-OKFKS-lecture/',revised,store))[id].estimatedSeconds,998)
})
test('panel re-entry refreshes earlier automatic notes and reads edits saved after the initial load', async () => {
  const id=course.lectures[0].slides[0].id, store=storage(), revised=structuredClone(pack)
  const previous='Прежняя автоматическая речь'
  revised.previousNoteHashes={[id]:{script:[createHash('sha256').update(previous).digest('hex')]}}
  const old={...pack.notes[id],script:previous}
  store.setItem(key,JSON.stringify({[id]:old}))
  const original=store.getItem(key)
  const session=await prepareTeacherSession(course,'/2026-OKFKS-lecture/',revised,store)
  assert.equal(session.notes[id].script,pack.notes[id].script)
  assert.equal(session.resolve()[id].script,pack.notes[id].script)
  assert.equal(store.getItem(key),original)
  const manual={...old,script:'Моя речь для этой группы',answer:'Мой разбор'}
  store.setItem(key,JSON.stringify({[id]:manual}))
  assert.equal(session.resolve()[id].script,manual.script)
  assert.equal(session.resolve()[id].answer,manual.answer)
  assert.equal(pack.notes[id].script,revised.notes[id].script)
})
