import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { migrateCompatibleSession, exportPreviousResults } from '../src/compatibility.ts'
import { prepareTeacherNotes } from '../src/teacherNotes.ts'
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const course = read('public/course.json'), baseline = read('authoring/baseline-20260918.json')
const manifest = read('public/teaching/compatibility.json'), pack = read('public/teaching/notes.json')
const base='/2026-OKFKS-lecture/', prefix=`lecture:${base}:okfks`
const store = () => { const values = new Map(); return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)} }

test('all slide positions, IDs, notebook anchors and taught definitions remain compatible', () => {
  for (let i=0;i<course.lectures.length;i++) {
    const after=course.lectures[i].slides, before=baseline.course.lectures[i].slides
    assert.equal(after.length,112)
    assert.deepEqual(after.map(s=>s.id),before.map(s=>s.id))
    before.forEach((s,j)=>assert.equal(after[j].notebook,s.notebook,s.id))
    if (i===0 || i===1) before.filter(s=>s.notebook && s.kind==='theory').forEach(s=>assert.equal(after.find(a=>a.id===s.id).body,s.body,s.id))
  }
  const text=JSON.stringify(course.lectures[1])
  for(const anchor of ['120','40','MTBF','MTTR','0,9524']) assert.ok(text.includes(anchor))
})
test('same-ID revised questions do not inherit old scores; unchanged tasks and progress do', async () => {
  const s=store(), safe=manifest.unchangedTaskIds[0]
  const changed=course.lectures[0].slides.find(s=>s.task?.type==='single').task.id
  const oldKey=`${prefix}:${manifest.previousVersion}:attempts`,newKey=`${prefix}:${course.contentVersion}:attempts`
  const prior={ [safe]:{seed:1,attempts:2,draft:[],result:{status:'correct',score:1}}, [changed]:{seed:2,attempts:1,draft:['o1'],result:{status:'correct',score:1}} }
  s.setItem(oldKey,JSON.stringify(prior))
  const l=course.lectures[1],id=l.slides[30].id
  s.setItem(`${prefix}:${manifest.previousVersion}:${l.id}:progress`,JSON.stringify(id))
  await migrateCompatibleSession(course,base,manifest,s)
  assert.ok(JSON.parse(s.getItem(newKey))[safe]);assert.equal(JSON.parse(s.getItem(newKey))[changed],undefined)
  assert.equal(JSON.parse(s.getItem(`${prefix}:${course.contentVersion}:${l.id}:progress`)),id)
  assert.deepEqual(exportPreviousResults(course,base,manifest.previousVersion,s).attempts,prior)
  s.setItem(newKey,JSON.stringify({[safe]:{seed:3,attempts:5}}))
  await migrateCompatibleSession(course,base,manifest,s)
  assert.equal(JSON.parse(s.getItem(newKey))[safe].attempts,5)
})
test('older authored fields survive while old baseline text does not hide revised notes', async () => {
  const s=store(),id=course.lectures[0].slides.find(s=>s.task?.type==='single').id
  const fixture=read('tests/fixtures/previous-note.json')
  assert.equal(fixture.id,id)
  s.setItem(`${prefix}:private:${manifest.previousVersion}`,JSON.stringify({[id]:{...fixture.note,questions:'Мой вопрос для этой группы'}}))
  await migrateCompatibleSession(course,base,manifest,s)
  const note=prepareTeacherNotes(course,base,pack,s)[id]
  assert.equal(note.script,pack.notes[id].script)
  assert.equal(note.questions,'Мой вопрос для этой группы')
  assert.equal(note.estimatedSeconds,pack.notes[id].estimatedSeconds)
  s.setItem(`${prefix}:private:${course.contentVersion}`,JSON.stringify({[id]:{...note,preparation:'Новая подготовка'}}))
  await migrateCompatibleSession(course,base,manifest,s)
  assert.equal(prepareTeacherNotes(course,base,pack,s)[id].preparation,'Новая подготовка')
  assert.ok(s.getItem(`${prefix}:private:${manifest.previousVersion}`))
  const timerStore=store()
  timerStore.setItem(`${prefix}:private:${manifest.previousVersion}`,JSON.stringify({[id]:{...fixture.note,estimatedSeconds:fixture.note.estimatedSeconds+5}}))
  await migrateCompatibleSession(course,base,manifest,timerStore)
  const timed=prepareTeacherNotes(course,base,pack,timerStore)[id]
  assert.equal(timed.script,pack.notes[id].script)
  assert.equal(timed.estimatedSeconds,fixture.note.estimatedSeconds+5)
})
test('route covers all eight sections and fits 90 minutes with discussion reserve',()=>{
  const route=read('public/teaching/route.json'),l=course.lectures.at(-1)
  assert.equal(route.estimatedCoreMinutes+route.reserveMinutes,90)
  for(const s of l.slides.filter(s=>s.kind==='section'))assert.ok(route.requiredSlideIds.includes(s.id))
  assert.equal(new Set([...route.requiredSlideIds,...route.independentSlideIds]).size,112)
  assert.ok(route.reserveMinutes>=5)
})
