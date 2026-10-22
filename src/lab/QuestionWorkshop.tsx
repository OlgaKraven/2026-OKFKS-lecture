import {useEffect,useState} from 'react'
import type {Course} from '@olgakraven/lecture-engine'
import type {Spec} from '../infographics/model'
import {PracticeDiagram} from '../infographics/LearningVisual'
import {presentationRole,usePresentationSync} from '../presentation/usePresentationSync'
import './question-workshops.css'

type Activity={id:string;revision:string;lectureId:string;number:number;title:string;task:string;check:string;referenceSlideIds:string[];exerciseSpec:Spec;decision:string;options:string[];correct:number;solution:string;hint:string}
type Draft={prediction:string;conclusion:string;choice:number|null}
const empty:Draft={prediction:'',conclusion:'',choice:null}
type ReviewState={draft:Draft;checked:boolean;revealed:boolean}
function validReview(value:unknown):value is ReviewState{
 if(!value||typeof value!=='object')return false
 const state=value as ReviewState,draft=state.draft
 return Boolean(draft&&typeof draft.prediction==='string'&&typeof draft.conclusion==='string'&&(draft.choice===null||Number.isInteger(draft.choice)&&draft.choice>=0)&&typeof state.checked==='boolean'&&typeof state.revealed==='boolean')
}
function readDraft(key:string):Draft{try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x.prediction==='string'&&typeof x.conclusion==='string'?{...x,choice:Number.isInteger(x.choice)?x.choice:null}:empty}catch{return empty}}
export function QuestionWorkshop({course,base,lectureId,question,onClose}:{course:Course;base:string;lectureId?:string;question?:number;onClose?:()=>void}){
 useEffect(()=>{try{const theme=JSON.parse(localStorage.getItem(`lecture:${base}:${course.id}:theme`)||'"light"');document.documentElement.dataset.theme=theme==='dark'||theme==='auto'&&matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}catch{document.documentElement.dataset.theme='light'}},[base,course.id])
 const [data,setData]=useState<Activity[]|null>(null),[error,setError]=useState('')
 const url=new URL(location.href),lecture=course.lectures.find(l=>l.id===(lectureId??url.searchParams.get('lecture'))),number=question??Number(url.searchParams.get('question'))
 useEffect(()=>{const abort=new AbortController();fetch(`${base}question-supplements.json`,{cache:'no-cache',signal:abort.signal}).then(r=>{if(!r.ok)throw Error('Не удалось загрузить дополнение');return r.json()}).then(x=>{if(x.schemaVersion!==1||x.courseId!==course.id||!Array.isArray(x.activities))throw Error('Дополнение относится к другой редакции курса');setData(x.activities)}).catch(e=>{if(e.name!=='AbortError')setError(String(e.message))});return()=>abort.abort()},[base,course.id])
 const activity=data?.find(a=>a.lectureId===lecture?.id&&a.number===number)
 if(error||!lecture||!Number.isInteger(number)||number<1||number>8||data&&!activity)return <main className="question-lab"><h1>Дополнение недоступно</h1><p>{error||'Проверьте выбранные лекцию и номер вопроса.'}</p><a className="button primary" href={base}>К лекциям</a></main>
 if(!activity)return <main className="question-lab" role="status">Загружаем дополнение…</main>
 return <ActivityView key={activity.id} course={course} base={base} activity={activity} onClose={onClose}/>
}
function ActivityView({course,base,activity,onClose}:{course:Course;base:string;activity:Activity;onClose?:()=>void}){
 const lecture=course.lectures.find(l=>l.id===activity.lectureId)!
 const [saveError,setSaveError]=useState(false)
 const key=`okfks:question-supplement:${activity.revision}:${activity.id}`
 const [review,setReview,readonly]=usePresentationSync(`${course.id}:${activity.id}:exercise`,()=>({draft:onClose&&presentationRole().mode==='audience'?empty:readDraft(key),checked:false,revealed:false}),validReview,Boolean(onClose))
 const {draft,checked,revealed}=review
 const setDraft=(value:Draft)=>setReview(state=>({...state,draft:value}))
 const setChecked=(value:boolean)=>setReview(state=>({...state,checked:value}))
 const setRevealed=(value:boolean)=>setReview(state=>({...state,revealed:value}))
 useEffect(()=>{if(readonly)return;try{localStorage.setItem(key,JSON.stringify(draft));setSaveError(false)}catch{setSaveError(true)}},[key,draft,readonly])
 const back=`${base}?${new URLSearchParams({lecture:lecture.id,slide:activity.id})}`
 return <main className="question-lab"><header className="question-lab-header">{onClose?<button className="button secondary" disabled={readonly} onClick={onClose}>← Вернуться к вопросу</button>:<a className="button secondary" href={back}>← Вернуться к вопросу</a>}<span>{course.code} · {lecture.semester} семестр</span></header><div className="question-lab-title"><p>Разбор задачи · вопрос {activity.number}</p><h1>{activity.title}</h1><span>{lecture.title}</span></div>
 <section className="question-lab-task"><div><h2>Задача</h2><p>{activity.task}</p></div><div><h2>Что проверить</h2><p>{activity.check}</p></div></section>
 <section className="question-lab-prediction"><h2>1. Сформулируйте прогноз</h2><label htmlFor="question-prediction">Какой результат вы ожидаете и какое наблюдение его подтвердит?</label><textarea readOnly={readonly} id="question-prediction" value={draft.prediction} onChange={e=>setDraft({...draft,prediction:e.target.value})} rows={3}/><p className="question-lab-muted">Самостоятельный учебный случай с новыми данными. Сначала запишите прогноз, затем исследуйте свидетельства.</p></section>
 <section className="question-lab-diagram"><h2>2. Исследуйте данные нового случая</h2><p>Сопоставьте наблюдения. Ручные шаги выделяют отдельные свидетельства; решение ещё не раскрыто.</p><PracticeDiagram spec={activity.exerciseSpec}/></section>
 <section className="question-lab-review"><h2>3. Примите решение</h2><fieldset className="question-lab-options"><legend>{activity.decision}</legend>{activity.options.map((option,i)=><label key={option}><input disabled={readonly} type="radio" name={activity.id} checked={draft.choice===i} onChange={()=>{setDraft({...draft,choice:i});setChecked(false)}}/><span>{option}</span></label>)}</fieldset><button className="button primary" disabled={readonly||draft.choice===null} onClick={()=>setChecked(true)}>Проверить решение</button>{checked&&<p className="question-lab-feedback" role="status"><strong>{draft.choice===activity.correct?'Решение обосновано.':'Пересмотрите основание решения.'}</strong> {draft.choice===activity.correct?activity.solution:activity.hint}</p>}<button disabled={readonly} className="button secondary" aria-expanded={revealed} aria-controls="question-worked-review" onClick={()=>setRevealed(!revealed)}>{revealed?'Скрыть разбор':'Сравнить с разбором задачи'}</button>{revealed&&<div id="question-worked-review"><h3>Обоснованное решение</h3><p>{activity.options[activity.correct]}</p><p>{activity.solution}</p></div>}<label htmlFor="question-conclusion">Ваш вывод: какое наблюдение обосновывает решение и где его границы?</label><textarea readOnly={readonly} id="question-conclusion" value={draft.conclusion} onChange={e=>setDraft({...draft,conclusion:e.target.value})} rows={3}/><p className="question-lab-muted" role="status">{saveError?'Не удалось сохранить записи на устройстве. Скопируйте их перед выходом.':'Записи сохраняются на этом устройстве для этого учебного случая. Свободное обоснование сравнивается с разбором самостоятельно.'}</p></section>
 <footer className="question-lab-footer">{onClose?<button className="button primary" disabled={readonly} onClick={onClose}>Вернуться к самопроверке →</button>:<a className="button primary" href={back}>Вернуться к самопроверке →</a>}</footer></main>
}
