import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {context} from '../authoring/context.mjs'
import {transferCases} from '../authoring/transfer-cases.mjs'
import {definitions} from '../authoring/definitions.mjs'
const course=JSON.parse(fs.readFileSync('public/course.json','utf8')),pack=JSON.parse(fs.readFileSync('public/teaching/notes.json','utf8')),activities=JSON.parse(fs.readFileSync('public/question-supplements.json','utf8')).activities

test('definitions are written in the existing explanation slides, with the same slide count and final summaries',()=>{
 assert.equal(course.lectures.reduce((sum,l)=>sum+l.slides.length,0),756)
 assert.equal(definitions.flat().length,56)
 course.lectures.forEach((lecture,li)=>{
  assert.equal(lecture.slides.length,108)
  const sections=lecture.slides.filter(s=>s.kind==='section')
  sections.forEach((section,qi)=>{
   const slide=lecture.slides[lecture.slides.indexOf(section)+1]
   assert.equal(slide.kind,'notebook')
   assert.equal(slide.notebook,definitions[li][qi].map(([term,meaning])=>`${term} — ${meaning}`).join('\n'))
   assert.equal(pack.notes[slide.id].notebook,slide.notebook)
   const end=lecture.slides.find(s=>s.kicker===`Контроль понимания · ${qi+1}`)
   assert.ok(end?.notebook,'The closing criterion remains available')
  })
 })
})

test('all 56 practice cases have independent evidence and decisions, not copied lecture examples',()=>{
 assert.equal(transferCases.flat().length,56)
 const seen=new Set()
 course.lectures.forEach((lecture,li)=>{
  for(let qi=0;qi<8;qi++){
   const a=activities.find(a=>a.lectureId===lecture.id&&a.number===qi+1),example=transferCases[li][qi]
   assert.ok(!seen.has(a.task));seen.add(a.task)
   assert.ok(!context[li][qi].includes(a.task))
   assert.ok(!context[li][qi].includes(a.solution))
   assert.ok(a.options[a.correct])
   assert.equal(new Set(a.options).size,3)
   assert.deepEqual(a.exerciseSpec.visual.rows.map(row=>row[1]),example.evidence)
   assert.equal(a.exerciseSpec.scenarios[0].frames.length,example.evidence.length+1)
   for(const fact of example.evidence)assert.ok(fact.length>15)
   assert.equal(a.solution,example.solution)
   assert.notEqual(a.revision,'v1','Old predictions must not become answers to a different case')
  }
 })
})

test('the new numerical transfer cases use consistent intervals, denominators, units and unrounded thresholds',()=>{
 const cases=transferCases[1]
 assert.match(cases[1].options[cases[1].correct],new RegExp(String(270/6)))
 assert.match(cases[2].solution,new RegExp(String((20+40+60+120)/4)))
 assert.match(cases[3].solution,/35 минут/)
 assert.ok(Math.abs(54/(54+3)*100-94.73684210526315)<1e-10)
 assert.match(cases[5].solution,/0,75/)
 assert.ok(0.98496<0.985)
 assert.match(cases[7].solution,/не определяет конечную выборочную оценку/)
})
