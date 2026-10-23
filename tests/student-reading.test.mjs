import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {applyStudentReading} from '../authoring/student-reading.mjs'
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'))
const course=read('public/course.json'),pack=read('public/teaching/notes.json'),baseline=read('authoring/student-reading-baseline.json')
const hash=v=>createHash('sha256').update(JSON.stringify(v??null)).digest('hex')
const slides=course.lectures.flatMap(l=>l.slides)
test('student reading review preserves the current slide order, all definitions, diagrams, tasks and answer keys',()=>{
 assert.deepEqual(slides.map(s=>s.id),baseline.slides.map(s=>s.id))
 for(const[s,b]of slides.map((s,i)=>[s,baseline.slides[i]]))for(const[f,oldHash]of Object.entries(b.retained))assert.equal(hash(s[f]),oldHash,`${s.id}: ${f}`)
 assert.equal(hash(read('public/assessment.json')),baseline.assessmentHash)
})
test('each changed-condition example has a visible reasoning path and its teacher script follows the same case',()=>{
 for(const lecture of course.lectures)for(const section of lecture.slides.filter(s=>s.kind==='section')){
  const slide=lecture.slides[lecture.slides.indexOf(section)+4]
  assert.ok(slide.bullets?.length>=2,slide.id)
  assert.ok(!slide.bullets.some(s=>/^Назовите изменённое|^Сначала предположите|^Обоснуйте ответ/.test(s)),slide.id)
  assert.ok(pack.notes[slide.id].script.includes(slide.body),slide.id)
  for(const line of slide.bullets)assert.ok(pack.notes[slide.id].script.includes(line),slide.id)
 }
})
test('visible quantitative checks have consistent denominators, units and percentage points',()=>{
 const slide=(li,n)=>course.lectures[li].slides.find(s=>s.id.endsWith(`-s${n}`)).bullets.join(' ')
 assert.match(slide(1,'017'),new RegExp(`= ${120-6} ч`))
 assert.match(slide(1,'028'),new RegExp(`= ${120/6} ч`))
 assert.match(slide(1,'072'),new RegExp(`= ${24/(24+1)}`.replace('.',',')))
 assert.match(slide(1,'083'),/0,04 процентного пункта/)
 assert.equal(Math.round((0.9504-0.95)*10000)/100,0.04)
 assert.match(slide(1,'094'),new RegExp(`= ${(6+9)/4}`.replace('.',',')))
 assert.match(slide(2,'094'),new RegExp(`= ${80*(1+2)} попыток`))
})
test('the content refinement is idempotent and retains former automatic-note fingerprints for safe refresh',()=>{
 const c=structuredClone(course),p=structuredClone(pack)
 assert.deepEqual(applyStudentReading(c,p),[])
 assert.deepEqual(c,course);assert.deepEqual(p,pack)
 for(const l of c.lectures){const id=l.slides.find(s=>s.id.endsWith('-s017')).id;assert.ok(p.previousNoteHashes[id].script.length)}
})
