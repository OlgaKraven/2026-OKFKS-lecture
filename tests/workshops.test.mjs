import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {evaluateBoundary,evaluateFlow,readWorkshopProgress,workshopReturn} from '../src/lab/workshop-model.ts'
const labs=JSON.parse(fs.readFileSync('authoring/workshops.json','utf8'))
const course=JSON.parse(fs.readFileSync('public/course.json','utf8'))
const pack=JSON.parse(fs.readFileSync('public/teaching/notes.json','utf8'))
test('the boundary exercise reproduces the defect and verifies both neighbouring values',()=>{
  for(const age of [17,18,19]){
    assert.equal(evaluateBoundary(age,false).matches,age!==18)
    assert.equal(evaluateBoundary(age,true).matches,true)
  }
  assert.throws(()=>evaluateBoundary(NaN,true))
})
test('the flow matrix exposes only the excess source permission across all 16 flows',()=>{
  for(let mask=0;mask<16;mask++){
    const f={source:!!(mask&1),port:!!(mask&2),program:!!(mask&4),profile:!!(mask&8)}
    assert.equal(evaluateFlow(f,false).actual,mask===15)
    assert.equal(evaluateFlow(f,false).matches,true)
    assert.equal(evaluateFlow(f,true).actual,mask===14||mask===15)
    assert.equal(evaluateFlow(f,true).matches,mask!==14)
  }
})
test('all workshop entries resolve to existing slides and current published teacher notes',()=>{
  assert.equal(new Set(labs.map(l=>l.id)).size,6)
  assert.equal(new Set(labs.map(l=>l.lecture)).size,6)
  for(const l of labs){
    const lecture=course.lectures.find(x=>x.id===l.lecture)
    for(const n of ['001',...l.slides]){
      const slide=lecture.slides.find(s=>s.id===`${l.lecture}-s${n}`)
      const q=new URLSearchParams(slide.supplement.href.slice(1))
      assert.equal(q.get('workshop'),l.id);assert.equal(q.get('originSlide'),slide.id)
      assert.ok(['map','experiment','game'].includes(q.get('activity')))
      assert.ok(pack.notes[slide.id].script.includes(l.teacher.sequence))
    }
    for(const c of l.cases){assert.ok(c.options[c.correct]);assert.ok(c.answer && c.hint)}
    for(const v of l.experiment.variants||[])for(const m of v.metrics)assert.ok(m.value>=0&&m.value<=m.max&&m.max>0)
  }
})
test('corrupt progress cannot mark cases solved; reset and state are scoped to each workshop',()=>{
  assert.deepEqual(readWorkshopProgress('{',2),[false,false])
  assert.deepEqual(readWorkshopProgress('{"version":1,"solved":[true,"true",true]}',2),[true,false])
  assert.deepEqual(readWorkshopProgress('{"version":2,"solved":[true,true]}',2),[false,false])
})
test('return links preserve only a valid originating slide of the same lecture',()=>{
  const lecture=labs[0].lecture
  const make=origin=>new URL(workshopReturn('https://example.org/',lecture,'049',origin)).searchParams.get('slide')
  assert.equal(make(`${lecture}-s071`),`${lecture}-s071`)
  for(const bad of [`${labs[1].lecture}-s071`,`${lecture}-s113`,`${lecture}-s000`,'javascript:alert(1)'])assert.equal(make(bad),`${lecture}-s049`)
})
