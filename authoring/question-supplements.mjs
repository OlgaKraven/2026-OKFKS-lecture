import fs from 'node:fs'
import {transferCases} from './transfer-cases.mjs'
const authoredIds=new Set(['semester7','semester8'].flatMap(name=>JSON.parse(fs.readFileSync(new URL(`../src/infographics/data/${name}.json`,import.meta.url),'utf8'))).map(s=>s.slideId))

// Additional activities do not replace or reorder the lecture's explanations.
export function addQuestionSupplements(course,pack,questionMap){
 const activities=[]
 course.lectures.forEach((lecture,li)=>{
  const slides=[],sections=lecture.slides.filter(s=>s.kind==='section')
  for(const slide of lecture.slides){
   if(slide.task){
    const number=Number(slide.task.id.match(/-q(\d+)-/)?.[1]),id=`${lecture.id}-q${number}-supplement`
    if(!slides.some(s=>s.id===id)){
     const section=sections[number-1],map=questionMap.find(q=>q.questionId===`${lecture.id}-q${number}`)
     const source=lecture.slides.filter(s=>map.explanationIds.includes(s.id))
     const referenceSlideIds=source.filter(s=>s.visual||s.steps||s.rows||authoredIds.has(s.id)).map(s=>s.id)
     if(!referenceSlideIds.length)throw Error(`No question diagram: ${id}`)
     const example=transferCases[li][number-1],overview='Сопоставьте наблюдения и выберите обоснованное решение.'
     const exerciseSpec={slideId:id,catalogId:'TAB-01',kind:'source',title:'Данные самостоятельной задачи',overview,scope:'Сопоставление наблюдений по условию учебного случая.',visual:{type:'comparison',columns:['Факт','Данные случая'],rows:example.evidence.map((text,i)=>[String(i+1),text]),caption:overview},defaultScenario:'case',scenarios:[{id:'case',label:'Учебный случай',condition:example.task,frames:[{caption:overview,focus:[]},...example.evidence.map((text,i)=>({caption:text,focus:[`row${i}`]}))]}]}
     const activity={id,revision:'transfer-v1',lectureId:lecture.id,number,title:section.title,task:example.task,check:map.outcome,referenceSlideIds,exerciseSpec,decision:example.decision,options:example.options,correct:example.correct,solution:example.solution,hint:example.hint}
     activities.push(activity)
     const href=`?${new URLSearchParams({mode:'question-lab',lecture:lecture.id,question:String(number)})}`
     slides.push({id,kind:'example',kicker:`Интерактивное дополнение · вопрос ${number}`,title:`Практика: ${section.title}`,activityPassport:{task:activity.task,check:activity.check,href}})
     pack.notes[id]={script:`Перед самопроверкой предложите самостоятельный учебный случай: ${activity.task}`,preparation:'Откройте дополнение. Попросите сформулировать прогноз, исследовать новые данные и обосновать выбор решения.',notebook:'',questions:activity.decision,answer:activity.solution,estimatedSeconds:120}
    }
   }
   if(slide.supplement?.href.startsWith('?mode=lab'))delete slide.supplement
   slides.push(slide)
  }
  lecture.slides=slides
 })
 return activities
}
