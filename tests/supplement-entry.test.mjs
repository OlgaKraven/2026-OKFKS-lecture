import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {validateCourse} from '@olgakraven/lecture-engine'
const read=name=>JSON.parse(fs.readFileSync(name,'utf8'))
const course=read('public/course.json'),activities=read('public/question-supplements.json').activities,questions=read('authoring/question-map.json')
test('every question has an independent supplement passport directly before its first assessment',()=>{
 assert.equal(activities.length,56)
 assert.equal(new Set(activities.map(a=>a.id)).size,56)
 for(const lecture of course.lectures){
  assert.equal(lecture.slides.filter(s=>s.activityPassport).length,8)
  assert.ok(lecture.slides.every(s=>!s.supplement?.href.startsWith('?mode=lab')))
  for(let number=1;number<=8;number++){
   const activity=activities.find(a=>a.lectureId===lecture.id&&a.number===number),question=questions.find(q=>q.questionId===`${lecture.id}-q${number}`)
   const index=lecture.slides.findIndex(s=>s.task?.id.startsWith(`${question.questionId}-`)),passport=lecture.slides[index-1]
   assert.equal(passport.id,activity.id)
   assert.ok(activity.referenceSlideIds.length)
   for(const id of activity.referenceSlideIds){assert.ok(question.explanationIds.includes(id));assert.ok(lecture.slides.findIndex(s=>s.id===id)<index-1)}
   const q=new URLSearchParams(passport.activityPassport.href.slice(1))
   assert.equal(q.get('mode'),'question-lab');assert.equal(q.get('lecture'),lecture.id);assert.equal(q.get('question'),String(number))
   assert.equal(passport.activityPassport.task,activity.task);assert.equal(passport.activityPassport.check,activity.check)
  }
 }
 validateCourse(course)
})
test('the engine refuses executable and protocol-relative supplement links',()=>{
 for(const href of ['javascript:alert(1)','data:text/html,x','//example.org','a\\b']){
  const unsafe=structuredClone(course)
  unsafe.lectures[1].slides[0].supplement={label:'Supplement',href}
  assert.throws(()=>validateCourse(unsafe))
 }
})
