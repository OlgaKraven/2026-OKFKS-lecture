import {useContext,useLayoutEffect,useRef,useState} from 'react'
import {Resources} from './Resources'
import type {Course,Lecture,Profile,Slide} from './model'
import {assetUrl,supplementUrl} from './model'
import {Infographic} from './Infographic'
import {TaskView} from './Assessment'
import {VisualRendererContext} from './VisualRenderer'
export function SlideView({course,lecture,slide,profile,base,number,interactive=false}:{course:Course;lecture:Lecture;slide:Slide;profile:Profile;base:string;number:number;interactive?:boolean}){
 const renderVisual=useContext(VisualRendererContext)
 const customVisual=renderVisual?.({slide,base,interactive})
 const visual=customVisual===undefined
  ? slide.visual?<Infographic visual={slide.visual} base={base}/>
   :slide.steps?<Infographic visual={{type:'process',items:slide.steps,caption:'Порядок чтения: слева направо, от первого шага к последнему.'}}/>
   :undefined
  :customVisual
 const questionNumber=slide.kicker.match(/вопрос\s+(\d+)/i)?.[1]||slide.kicker.match(/^(?:Опорное понятие|Логика применения|Антиошибка|Контроль понимания)\s*·\s*(\d+)$/i)?.[1]
 const topic=String(course.lectures.indexOf(lecture)+1).padStart(2,'0')
 const hasVisual=slide.rows||(visual!==undefined&&visual!==null&&visual!==false)
 return <article className={`slide-frame kind-${slide.kind} ${hasVisual?'has-visual':''}`} data-slide-id={slide.id} data-definition-count={slide.definitionEntries?.length}>
 <div className="presentation-circles" aria-hidden="true"/>
 <header className="slide-header"><div className="slide-brand">{slide.kind==='title'&&<img className="presentation-wordmark" src={assetUrl('brand/synergy-wordmark.jpg',base)} alt="Университет Синергия"/>}<span>{course.code} · {lecture.semester} семестр</span></div><div className="slide-header-actions">{slide.supplement&&<a className="button secondary slide-supplement" href={supplementUrl(slide.supplement.href,base)} target="_blank" rel="noopener">{slide.supplement.label} ↗</a>}<span className="presentation-topic">Тема {topic}</span>{slide.kind!=='title'&&<img className="presentation-mark" src={assetUrl('brand/synergy-mark.png',base)} alt="Синергия"/>}</div></header>
 <div className="slide-content"><div className="slide-copy"><p className="slide-kicker">{slide.kind==='title'?'Лекция':slide.kicker}</p>{slide.kind==='section'?<QuestionHeading title={slide.title}/>:<h2>{slide.title}</h2>}
 {(slide.kind==='literature'||slide.kind==='materials')&&<Resources course={course} slide={slide} base={base}/>}
 {slide.kind==='agenda'&&<ol className="topic-agenda">{lecture.slides.filter(s=>s.kind==='section').map((s,i)=><li key={s.id}><span>{String(i+1).padStart(2,'0')}</span><strong>{s.title}</strong></li>)}</ol>}
 {slide.body&&<p className="slide-body-copy" data-long-context={slide.kind==='section'&&slide.body.length>160||undefined}>{slide.body}</p>}
 {slide.bullets&&<ul>{slide.bullets.map(x=><li key={x}>{x}</li>)}</ul>}
 {visual}
 {slide.rows&&<div className="table-scroll" tabIndex={0} role="region" aria-label={`Таблица: ${slide.title}`}><table className="comparison-table"><thead><tr>{slide.columns?.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{slide.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
 {slide.notebook&&<aside className="write-note"><span>Запишите</span><strong>{slide.notebook}</strong></aside>}
 {slide.task&&interactive&&<TaskView task={slide.task}/>}
 {slide.task&&!interactive&&<div className="public-task"><p>{slide.task.prompt}</p>{slide.task.type==='matching'?<div className="matching-public"><ol>{slide.task.items?.map(x=><li key={x.id}>{x.text}</li>)}</ol><ol type="A">{slide.task.options?.map(x=><li key={x.id}>{x.text}</li>)}</ol></div>:slide.task.options?<ol className="public-options">{slide.task.options.map((x,i)=><li key={x.id}><b>{String.fromCharCode(1040+i)}</b><span>{x.text}</span></li>)}</ol>:<div className="answer-line">Краткий ответ: __________________________________</div>}</div>}
 {slide.kind==='title'&&<><p className="presentation-discipline">{course.discipline}</p><div className="title-profile"><small>Преподаватель</small><strong>{profile.fullName}</strong><span>{profile.position}</span><span>{profile.department}</span></div></>}
 </div>{slide.kind==='section'&&<div className="topic-arrow presentation-chevron" aria-hidden="true"/>}{slide.kind==='title'&&<img className="title-mascot" src={assetUrl('brand/rhino-okfks.png',base)} alt={course.mascotAlt}/>}</div>
 <footer className="slide-footer"><span>{questionNumber?`Вопрос ${questionNumber}`:''}</span><span className="presentation-page">{String(number).padStart(2,'0')}</span></footer>
 </article>
}

// Accent the actual second line, including responsive and miniature layouts.
function QuestionHeading({title}:{title:string}){
 const ref=useRef<HTMLHeadingElement>(null)
 const [accent,setAccent]=useState<number[]>([])
 const [lines,setLines]=useState(1)
 useLayoutEffect(()=>{
  const node=ref.current;if(!node)return
  let frame=0,active=true
  const measure=()=>{
   if(!active)return
   const words=Array.from(node.querySelectorAll<HTMLElement>('[data-heading-word]'))
   const tops=words.map(word=>Math.round(word.getBoundingClientRect().top))
   const rows=[...new Set(tops)]
   const next=rows.length===2?tops.flatMap((top,index)=>top===rows[1]?[index]:[]):[]
   setLines(rows.length)
   setAccent(previous=>previous.join(',')===next.join(',')?previous:next)
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure)}
  const observer=new ResizeObserver(schedule);observer.observe(node)
  measure();document.fonts.ready.then(schedule)
  return()=>{active=false;observer.disconnect();cancelAnimationFrame(frame)}
 },[title])
 return <h2 ref={ref} data-question-lines={lines}>{(title.match(/\S+\s*/g)||[title]).map((word,index)=><span data-heading-word key={index} className={accent.includes(index)?'question-line-accent':undefined}>{word}</span>)}</h2>
}
