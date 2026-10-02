import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, Check, CircleHelp, Printer, RotateCcw, Activity, Wrench, Search } from 'lucide-react'
import data from '../../authoring/workshops.json'
import { evaluateBoundary, evaluateFlow, readWorkshopProgress, workshopReturn } from './workshop-model'
import type { Flow } from './workshop-model'
import '@olgakraven/lecture-engine/style.css'
import './reliability-project.css'
import './workshops.css'
import { WorkshopDirectory } from './WorkshopDirectory'

type Case={title:string;context:string;options:string[];correct:number;hint:string;answer:string}
type Variant={label:string;metrics:{label:string;value:number;max:number;unit:string}[];outcome:string}
type Workshop={id:string;lecture:string;title:string;semester:number;slides:string[];intro:string;nodes:{title:string;detail:string}[];experiment:{kind:string;title:string;question:string;hint:string;variants?:Variant[]};cases:Case[];teacher:{question:string;sequence:string;answer:string;time:string}}
const workshops=data as Workshop[]
const stages=[{id:'map',title:'Разбери схему',subtitle:'Связать понятия',icon:Activity},{id:'experiment',title:'Измени условия',subtitle:'Проверить прогноз',icon:Wrench},{id:'game',title:'Обоснуй решение',subtitle:'Проверить вывод',icon:Search}] as const
type Stage=typeof stages[number]['id']
const outcome=(v:boolean)=>v?'разрешено':'отклонено'

function Experiment({lab}:{lab:Workshop}) {
  const [variant,setVariant]=useState(0)
  const [age,setAge]=useState(18)
  const [fixed,setFixed]=useState(false)
  const [broad,setBroad]=useState(false)
  const [flow,setFlow]=useState<Flow>({source:true,port:true,program:true,profile:true})
  const [run,setRun]=useState(false)
  const change=(fn:()=>void)=>{fn();setRun(false)}
  const comparison=lab.experiment.kind==='boundary'?evaluateBoundary(age,fixed):evaluateFlow(flow,broad)
  const current=lab.experiment.variants?.[variant]
  return <section><h2>{lab.experiment.title}</h2><p className="lab-intro">{lab.experiment.question}</p>
    <div className="lab-controls workshop-controls">
      {lab.experiment.kind==='boundary'&&<><fieldset><legend>Возраст на входе</legend><div className="lab-step-buttons">{[17,18,19].map(v=><button key={v} type="button" aria-pressed={age===v} onClick={()=>change(()=>setAge(v))}>{v} лет</button>)}</div></fieldset><label><input type="checkbox" checked={fixed} onChange={e=>change(()=>setFixed(e.target.checked))}/> Исправленное условие: {fixed?'age ≥ 18':'age > 18'}</label></>}
      {lab.experiment.kind==='firewall'&&<><fieldset><legend>Признаки потока — меняйте по одному</legend>{([{key:'source',label:'Источник — лабораторная подсеть'},{key:'port',label:'Порт — 8443'},{key:'program',label:'Программа — LabApp'},{key:'profile',label:'Профиль — Private'}] as const).map(item=><label key={item.key}><input type="checkbox" checked={flow[item.key]} onChange={e=>change(()=>setFlow(f=>({...f,[item.key]:e.target.checked})))}/>{item.label}{!flow[item.key]&&' — нет'}</label>)}</fieldset><label>Правило<select value={broad?'broad':'exact'} onChange={e=>change(()=>setBroad(e.target.value==='broad'))}><option value="exact">Все четыре признака обязательны</option><option value="broad">Любой источник; остальные признаки обязательны</option></select></label></>}
      {current&&<fieldset><legend>Условия сценария</legend><div className="lab-step-buttons">{lab.experiment.variants!.map((v,i)=><button key={v.label} type="button" aria-pressed={i===variant} onClick={()=>change(()=>setVariant(i))}>{v.label}</button>)}</div></fieldset>}
      <p className="lab-small">{lab.experiment.hint}</p><button className="button lab-primary" type="button" onClick={()=>setRun(true)}>Показать результат</button>
    </div>
    <div className="workshop-result" role="status" aria-live="polite">{!run?<p>Сначала сформулируйте прогноз. После изменения условий результат нужно открыть заново.</p>:current?<><div className="workshop-bars">{current.metrics.map(m=><div key={m.label}><span>{m.label} · <b>{m.value} {m.unit}</b></span><div className="workshop-bar" role="img" aria-label={`${m.label}: ${m.value} ${m.unit}`}><i style={{width:`${m.value/m.max*100}%`}}/></div></div>)}</div><p>{current.outcome}</p></>:<><div className="workshop-comparison"><div><span>По требованию</span><strong>{outcome(comparison.expected)}</strong></div><div><span>{lab.experiment.kind==='boundary'?'По выбранному условию':'По выбранному правилу'}</span><strong>{outcome(comparison.actual)}</strong></div></div><p className={comparison.matches?'lab-pass':'lab-fail'}>{comparison.matches?<Check size={18}/>:<CircleHelp size={18}/>} {comparison.matches?'В этом сценарии исход соответствует требованию':'Обнаружено расхождение с требованием'}</p><p className="lab-small">{lab.experiment.kind==='boundary'?'Проверьте оба соседних значения: успешный исход на одном входе не подтверждает весь модуль.':'Отметки меняют только логические признаки потока в учебной модели. Правило для любого источника может пропустить посторонний поток.'}</p></>}</div>
  </section>
}

export function WorkshopLab({base,id}:{base:string;id:string}) {
  const lab=workshops.find(l=>l.id===id)
  return lab?<Workshop key={lab.id} base={base} lab={lab}/>:<main className="reliability-lab"><h1>Дополнение не найдено</h1><p><a href={base}>Вернуться к курсу</a></p></main>
}

function Workshop({base,lab}:{base:string;lab:Workshop}) {
  const url=new URL(location.href), requested=url.searchParams.get('activity')
  const [stage,setStage]=useState<Stage>(stages.some(s=>s.id===requested)?requested as Stage:'map')
  const [node,setNode]=useState(0)
  const [teacher,setTeacher]=useState(url.searchParams.get('teacher')==='1')
  const [index,setIndex]=useState(0), [choice,setChoice]=useState<number|null>(null)
  const [feedback,setFeedback]=useState<boolean|null>(null), [hint,setHint]=useState(false)
  const key=`okfks:workshop:${lab.id}:v1`
  const [solved,setSolved]=useState<boolean[]>(()=>{try{return readWorkshopProgress(localStorage.getItem(key),lab.cases.length)}catch{return lab.cases.map(()=>false)}})
  const [saveError,setSaveError]=useState(false),[epoch,setEpoch]=useState(0)
  const current=lab.cases[index], stageIndex=stages.findIndex(s=>s.id===stage)
  const back=workshopReturn(base,lab.lecture,lab.slides[stageIndex],url.searchParams.get('originSlide'))
  useEffect(()=>{document.title=`${lab.title} · Мастерская ОКФКС`},[lab.title])
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify({version:1,solved}));setSaveError(false)}catch{setSaveError(true)}},[key,solved])
  const selectStage=(id:Stage)=>{setStage(id);const next=new URL(location.href);next.searchParams.set('activity',id);history.replaceState({},'',next)}
  const selectCase=(i:number)=>{setIndex(i);setChoice(null);setFeedback(null);setHint(false)}
  const check=()=>{if(choice===null)return;const correct=choice===current.correct;setFeedback(correct);if(correct)setSolved(s=>s.map((v,i)=>i===index||v))}
  const reset=()=>{setSolved(lab.cases.map(()=>false));selectCase(0);setNode(0);setEpoch(e=>e+1)}
  return <main className="reliability-lab">
    <header className="deck-toolbar lab-top"><a className="button secondary" href={back}><ArrowLeft size={18}/>К лекции</a><div className="deck-topic"><strong>{lab.title}</strong><span>{lab.semester} семестр · интерактивное дополнение</span></div><div className="toolbar-actions"><button className="icon-button" type="button" aria-label="Преподавателю" title="Преподавателю" aria-pressed={teacher} onClick={()=>{setTeacher(!teacher);const next=new URL(location.href);if(teacher)next.searchParams.delete('teacher');else next.searchParams.set('teacher','1');history.replaceState({},'',next)}}><BookOpen size={19}/></button><button className="icon-button" type="button" aria-label="Печать" title="Печать" onClick={()=>window.print()}><Printer size={19}/></button></div></header>
    <div className="progress-track lab-progress" role="img" aria-label={`Этап ${stageIndex+1} из 3`}><span style={{width:`${(stageIndex+1)/3*100}%`}}/></div>
    <nav className="lab-nav" aria-label="Этапы мастерской">{stages.map((s,i)=><button key={s.id} className="button secondary" type="button" aria-current={stage===s.id?'step':undefined} onClick={()=>selectStage(s.id)}><s.icon size={19}/><span><b>{i+1}. {s.title}</b><small>{s.subtitle}</small></span>{s.id==='game'&&solved.every(Boolean)&&<Check size={18}/>}</button>)}</nav>
    {saveError&&<p className="lab-storage" role="status">Сохранение на устройстве недоступно. Упражнения работают; прогресс может потеряться после закрытия.</p>}
    <article className="slide-frame has-visual lab-frame"><header className="slide-header"><div className="slide-brand"><img src={`${base}brand/synergy-logo.png`} alt="Синергия"/><span>МДК.04.02 · {lab.semester}-й семестр</span></div><span className="slide-number">0{stageIndex+1} / 03</span></header><img className="side-ornament lab-ornament" src={`${base}brand/side-ornament.png`} alt="" aria-hidden="true"/>
      <div className="lab-content">
        {stage==='map'&&<section><p className="lab-eyebrow">01 / СВЯЗЬ ПОНЯТИЙ</p><h2>{lab.title}</h2><p className="lab-intro">{lab.intro}</p><div className="workshop-path" role="group" aria-label="Узлы схемы">{lab.nodes.map((n,i)=><button type="button" key={n.title} aria-pressed={node===i} onClick={()=>setNode(i)}><span>0{i+1}</span><b>{n.title}</b>{i<lab.nodes.length-1&&<span className="workshop-arrow" aria-hidden="true">→</span>}</button>)}</div><div className="lab-reveal"><span>УЗЕЛ {node+1} ИЗ {lab.nodes.length}</span><h3>{lab.nodes[node].title}</h3><p>{lab.nodes[node].detail}</p></div><button type="button" className="lab-link-button" onClick={()=>selectStage('experiment')}>Перейти к эксперименту →</button></section>}
        <div hidden={stage!=='experiment'}><Experiment key={epoch} lab={lab}/></div>
        {stage==='game'&&<section><p className="lab-eyebrow">03 / РЕШЕНИЕ И ЕГО ОСНОВАНИЕ</p><h2>Обоснуй решение</h2><p className="lab-intro">Разобрано случаев: {solved.filter(Boolean).length} / {lab.cases.length}. Объясните выбор до проверки.</p><div className="lab-case-tabs">{lab.cases.map((c,i)=><button key={c.title} type="button" aria-pressed={index===i} onClick={()=>selectCase(i)}>Случай {i+1} {solved[i]&&<Check size={17}/>}</button>)}</div><div className="lab-case"><div className="lab-case-copy"><h3>{current.title}</h3><p>{current.context}</p><button className="lab-link-button" type="button" aria-expanded={hint} onClick={()=>setHint(!hint)}>Подсказка</button>{hint&&<p className="lab-hint">{current.hint}</p>}</div><div className="lab-case-choice"><fieldset><legend>Какой вывод обоснован?</legend>{current.options.map((option,i)=><label key={option} className={choice===i?'selected':''}><input type="radio" name="workshop-answer" checked={choice===i} onChange={()=>{setChoice(i);setFeedback(null)}}/>{option}</label>)}</fieldset><button className="button lab-primary" type="button" disabled={choice===null} onClick={check}>Проверить решение</button>{feedback!==null&&<div className={`lab-feedback ${feedback?'correct':'wrong'}`} role="status"><b>{feedback?'Верно. Объясните правило своими словами.':'Пересмотрите основание и попробуйте ещё раз.'}</b><p>{feedback?current.answer:current.hint}</p></div>}</div></div>{solved.every(Boolean)&&<div className="lab-complete"><Check size={23}/><div><b>Оба случая разобраны</b><p>Сформулируйте одно правило, которое примените в новой ситуации.</p><a href={back}>Вернуться к лекции →</a></div></div>}</section>}
        {teacher&&<aside className="lab-teacher"><p className="lab-eyebrow">СЦЕНАРИЙ ПРЕПОДАВАТЕЛЯ · {lab.teacher.time}</p><p><b>Вопрос группе:</b> {lab.teacher.question}</p><p><b>Порядок:</b> {lab.teacher.sequence}</p><p><b>Ожидаемый вывод:</b> {lab.teacher.answer}</p><p className="lab-small">Дополнение заменяет часть устного разбора. Отдельное окно аудитории не синхронизируется; показывайте эту вкладку на проекторе.</p></aside>}
      </div><footer className="slide-footer"><span>Авторский учебный разбор · МДК.04.02</span><span>Интерактивная мастерская</span></footer></article>
    <footer className="lab-footer"><span>Учебные данные · Прогресс отдельно от оценок лекции</span><button type="button" onClick={reset}><RotateCcw size={16}/>Начать эту мастерскую заново</button></footer>
    <WorkshopDirectory base={base} current={lab.id}/>
    <section className="lab-print"><h1>{lab.title}</h1><p>{lab.intro}</p><h2>1. Схема</h2>{lab.nodes.map(n=><div key={n.title}><h3>{n.title}</h3><p>{n.detail}</p></div>)}<h2>2. Эксперимент</h2><p>{lab.experiment.question}</p><p>{lab.experiment.hint}</p>{lab.experiment.variants?.map(v=><div key={v.label}><h3>{v.label}</h3><p>{v.outcome}</p></div>)}{lab.experiment.kind==='boundary'&&<p>Для 17: отказ в обеих версиях; для 18: отказ до исправления и приём после; для 19: приём в обеих версиях.</p>}{lab.experiment.kind==='firewall'&&<p>Точное правило требует совпадения всех четырёх признаков. Разрешение любого источника даёт лишний доступ, если остальные три признака совпадают.</p>}<h2>3. Случаи и решения</h2>{lab.cases.map(c=><div key={c.title}><h3>{c.title}</h3><p>{c.context}</p><p><b>Решение:</b> {c.options[c.correct]}</p><p>{c.answer}</p></div>)}</section>
  </main>
}
