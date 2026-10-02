import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {validateCourse} from '@olgakraven/lecture-engine'
const course=JSON.parse(fs.readFileSync('public/course.json','utf8'))
test('lecture entries address the correct workshop and preserve their originating slide',()=>{
  const slides=course.lectures[1].slides.filter(s=>s.supplement)
  assert.deepEqual(slides.map(s=>s.id.slice(-3)),['001','009','027','038','060','071'])
  for(const slide of slides){
    const q=new URLSearchParams(slide.supplement.href.slice(1))
    assert.equal(q.get('mode'),'lab')
    assert.equal(q.get('originSlide'),slide.id)
    assert.ok(['timeline','simulator','game'].includes(q.get('activity')))
  }
  validateCourse(course)
})
test('the engine refuses executable and protocol-relative supplement links',()=>{
  for(const href of ['javascript:alert(1)','data:text/html,x','//example.org','a\\b']){
    const unsafe=structuredClone(course)
    unsafe.lectures[1].slides[0].supplement.href=href
    assert.throws(()=>validateCourse(unsafe))
  }
})
