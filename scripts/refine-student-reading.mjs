import fs from 'node:fs/promises'
import {applyStudentReading} from '../authoring/student-reading.mjs'
import {createHash} from 'node:crypto'
const read=async path=>JSON.parse(await fs.readFile(path,'utf8'))
const course=await read('public/course.json'),pack=await read('public/teaching/notes.json')
applyStudentReading(course,pack)
const baseline=await read('authoring/student-reading-baseline.json')
const hash=value=>createHash('sha256').update(JSON.stringify(value??null)).digest('hex')
const slides=course.lectures.flatMap(l=>l.slides)
const changed=slides.filter(s=>hash(s)!==baseline.slides.find(b=>b.id===s.id)?.fingerprint).map(s=>s.id)
for(const[file,value]of [['public/course.json',course],['public/teaching/notes.json',pack]])await fs.writeFile(file,JSON.stringify(value,null,2)+'\n')
await fs.mkdir('reports',{recursive:true})
await fs.writeFile('reports/student-reading-changes.json',JSON.stringify({courseId:course.id,sourceRevision:baseline.sourceRevision,slidesBefore:baseline.slides.length,slidesAfter:slides.length,changedSlides:changed},null,2)+'\n')
console.log(JSON.stringify({changed:changed.length,slides:course.lectures.flatMap(l=>l.slides).length}))
