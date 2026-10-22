import {useEffect,useRef,useState} from 'react'
import type {ReactNode} from 'react'
import {createPortal} from 'react-dom'
import type {Course,Slide} from '@olgakraven/lecture-engine'
import {Diagram} from './Diagrams'
import {advance,authoredSpecs,chooseScenario,initialSnapshot,navigate,pauseSnapshot,scenarioFor,specification,togglePlayback} from './model'
import type {Snapshot,Spec} from './model'
import './learning-visuals.css'

type Message={kind:'snapshot';slideId:string;seq:number;state:Snapshot}|{kind:'hello';slideId:string}
const labels:Record<string,string>={flow:'Блок-схема',timeline:'Временная линия',sequence:'UML · последовательность',comparison:'Сравнительная таблица',matrix:'Матрица',tree:'Иерархия',network:'Схема связей',bars:'Диаграмма значений',process:'Последовательность',cycle:'Жизненный цикл'}
function role(){const url=new URL(location.href);return {mode:url.searchParams.get('mode')||'viewer',session:url.searchParams.get('session')||''}}
function validState(spec:Spec,value:unknown):value is Snapshot{
  if(!value||typeof value!=='object')return false
  const s=value as Snapshot,scenario=spec.scenarios.find(x=>x.id===s.scenario)
  return Boolean(scenario&&Number.isInteger(s.step)&&s.step>=0&&s.step<scenario.frames.length&&(s.target===null||s.target===s.step+1&&s.target<scenario.frames.length)&&Number.isFinite(s.progress)&&s.progress>=0&&s.progress<=1&&['move','hold'].includes(s.phase)&&typeof s.playing==='boolean'&&typeof s.resume==='boolean'&&typeof s.detail==='boolean'&&Number.isFinite(s.elapsed)&&s.elapsed>=0)
}
function Dialog({children,onClose,controlled}:{children:ReactNode;onClose:()=>void;controlled:boolean}){
  const ref=useRef<HTMLDialogElement>(null)
  useEffect(()=>{ref.current?.showModal();return()=>{ref.current?.close()}},[])
  return createPortal(<dialog className="lv-dialog" ref={ref} aria-label="Учебная схема" onCancel={e=>{e.preventDefault();if(!controlled)onClose()}}><div className="lv-dialog-header"><strong>{controlled?'Схемой управляет преподаватель':'Разбор учебной схемы'}</strong>{!controlled&&<button type="button" onClick={onClose}>Закрыть</button>}</div>{children}</dialog>,document.body)
}
function LearningVisual({spec,interactive,compact,replacesRows=false}:{spec:Spec;interactive:boolean;compact:boolean;replacesRows?:boolean}){
  const currentRole=role(),audience=currentRole.mode==='audience',print=currentRole.mode==='print'||/\/print\/?$/.test(location.pathname)
  const readonly=!interactive||audience||print
  const [snapshot,setSnapshot]=useState(()=>initialSnapshot(spec))
  const [localExpanded,setLocalExpanded]=useState(false)
  const expanded=localExpanded||snapshot.detail
  useEffect(()=>{if(audience&&snapshot.detail)setLocalExpanded(false)},[audience,snapshot.detail])
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [motionEnabled,setMotionEnabled]=useState(true)
  const root=useRef<HTMLDivElement>(null),stateRef=useRef(snapshot),channel=useRef<BroadcastChannel|null>(null),lastSent=useRef(0),sequence=useRef(0),receivedSequence=useRef(-1),publishRef=useRef<()=>void>(()=>{})
  stateRef.current=snapshot
  const scenario=scenarioFor(spec,snapshot.scenario),frames=scenario.frames,max=frames.length-1
  const committed=frames[snapshot.step],frame=frames[snapshot.target??snapshot.step]
  const canPlay=spec.kind!=='source'&&!reduced&&motionEnabled
  const channelName=`okfks-learning-visual:${location.pathname}:${currentRole.session}`
  const storageKey=`${channelName}:${spec.slideId}`
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>{setReduced(media.matches);if(media.matches&&!audience)setSnapshot(pauseSnapshot)}
    media.addEventListener('change',update);return()=>media.removeEventListener('change',update)
  },[])
  useEffect(()=>{
    const shell=root.current?.closest('.deck-shell,.audience-shell')
    if(!shell)return
    const update=()=>{const enabled=shell.classList.contains('motion-on');setMotionEnabled(enabled);if(!enabled&&!audience)setSnapshot(pauseSnapshot)}
    update();const observer=new MutationObserver(update);observer.observe(shell,{attributes:true,attributeFilter:['class']});return()=>observer.disconnect()
  },[audience])
  useEffect(()=>{
    if(readonly||!snapshot.playing)return
    let raf=0,last=performance.now()
    const tick=(now:number)=>{const delta=Math.min(100,now-last);last=now;setSnapshot(s=>advance(spec,s,delta));raf=requestAnimationFrame(tick)}
    raf=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(raf)
  },[spec,readonly,snapshot.playing])
  useEffect(()=>{
    if(readonly)return
    const pause=()=>{if(document.hidden)setSnapshot(pauseSnapshot)}
    document.addEventListener('visibilitychange',pause);return()=>document.removeEventListener('visibilitychange',pause)
  },[readonly])
  useEffect(()=>{
    if(!currentRole.session||(!audience&&(readonly||currentRole.mode!=='presenter')))return
    try{const cached=JSON.parse(localStorage.getItem(storageKey)||'null');if(Number.isSafeInteger(cached?.seq))sequence.current=Math.max(sequence.current,cached.seq)}catch{/* A fresh session starts at sequence zero. */}
    const publish=()=>{
      const message:Message={kind:'snapshot',slideId:spec.slideId,seq:++sequence.current,state:stateRef.current}
      channel.current?.postMessage(message)
      try{localStorage.setItem(storageKey,JSON.stringify(message))}catch{/* BroadcastChannel still carries public state. */}
    }
    publishRef.current=publish
    const receive=(message:Message)=>{
      if(!message||typeof message!=='object')return
      if(message.slideId!==spec.slideId)return
      if(message.kind==='hello'&&!audience){publish();return}
      if(message.kind==='snapshot'&&audience&&Number.isSafeInteger(message.seq)&&message.seq>receivedSequence.current&&validState(spec,message.state)){receivedSequence.current=message.seq;setSnapshot(message.state)}
    }
    if(typeof BroadcastChannel!=='undefined'){
      channel.current=new BroadcastChannel(channelName)
      channel.current.onmessage=event=>receive(event.data as Message)
    }
    const storage=(event:StorageEvent)=>{if(event.key===storageKey&&event.newValue){try{receive(JSON.parse(event.newValue))}catch{/* Ignore an invalid optional public snapshot. */}}}
    window.addEventListener('storage',storage)
    if(audience){
      try{const cached=JSON.parse(localStorage.getItem(storageKey)||'null') as Message;if(cached?.kind==='snapshot'&&Number.isSafeInteger(cached.seq)&&validState(spec,cached.state)){receivedSequence.current=cached.seq;setSnapshot({...cached.state,playing:false,detail:false})}}catch{/* Default overview remains available. */}
      channel.current?.postMessage({kind:'hello',slideId:spec.slideId} satisfies Message)
    }else publish()
    return()=>{window.removeEventListener('storage',storage);channel.current?.close();channel.current=null;publishRef.current=()=>{}}
  },[spec,audience,readonly,currentRole.session,channelName,storageKey])
  useEffect(()=>{
    if(currentRole.mode!=='presenter'||readonly||!currentRole.session)return
    const now=performance.now()
    if(snapshot.playing&&now-lastSent.current<90)return
    lastSent.current=now
    publishRef.current()
  },[snapshot,spec.slideId,storageKey,currentRole.mode,currentRole.session,readonly])
  function play(){
    if(!canPlay)return
    setSnapshot(s=>togglePlayback(spec,s))
  }
  const moving=snapshot.target!==null&&snapshot.phase==='move'
  const status=moving?`Переход к шагу ${snapshot.target}.`:`Шаг ${snapshot.step} / ${max}`
  const body=(large:boolean)=><div className={`lv-body ${large?'lv-expanded':''}`}>
    <div className="lv-heading"><span>{spec.title}</span><small>{labels[spec.kind==='source'?spec.visual?.type||'':spec.kind]||'Учебная схема'}</small></div>
    {spec.scenarios.length>1&&!print&&<label className="lv-choice"><span>{spec.scenarioLabel||'Сценарий'}</span><select aria-label={spec.scenarioLabel||'Сценарий'} value={scenario.id} disabled={readonly} onChange={e=>setSnapshot(s=>chooseScenario(spec,s,e.target.value))}>{spec.scenarios.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>}
    {(!compact||large||print)&&<Diagram spec={spec} frame={print?{caption:spec.overview,focus:[]}:reduced&&moving?committed:frame} committedFrame={print?{caption:spec.overview,focus:[]}:committed} moving={!reduced&&moving} progress={snapshot.progress} scenario={scenario.id} readonly={readonly}/>}
    {(large||!compact||print)&&<p className="lv-caption" aria-live={readonly?'off':'polite'} aria-atomic="true">{print?spec.overview:committed.caption}</p>}
    {committed.result&&!print&&(!compact||large)&&<p className="lv-result"><strong>Результат:</strong> {committed.result}</p>}
    {!print&&<div className="lv-control-row">
      {!readonly&&(!compact||large)&&<><button type="button" disabled={snapshot.step===0&&snapshot.target===null} onClick={()=>setSnapshot(s=>navigate(spec,s,-1))}>Назад</button>{spec.kind!=='source'&&<button type="button" className="lv-primary" disabled={!canPlay} onClick={play}>{snapshot.playing?'Пауза':snapshot.step>=max?'Повторить':'Показать'}</button>}<button type="button" disabled={snapshot.step===max&&snapshot.target===null} onClick={()=>setSnapshot(s=>navigate(spec,s,1))}>Далее</button></>}
      <span className="lv-step" role="status">{audience?'Показ преподавателя · ':''}{status}</span>
      {!large&&<button type="button" className="lv-expand" onClick={()=>audience?setLocalExpanded(true):setSnapshot(s=>({...s,detail:true}))}>{compact?'Разобрать схему':'Развернуть'}</button>}
    </div>}
    {(large||print)&&<p className="lv-scope">{!print&&`${scenario.condition.replace(/[.!?]$/,'')}. `}{spec.scope}{spec.kind==='timeline'&&spec.axis&&!print?' Полная шкала проходит за 12 с показа; остановки на событиях учитываются отдельно.':''}</p>}
    {print&&spec.scenarios.length>1&&<ul className="lv-print-scenarios">{spec.scenarios.map(s=><li key={s.id}><strong>{s.label}:</strong> {s.condition}; {s.frames.at(-1)?.result||s.frames.at(-1)?.caption}</li>)}</ul>}
    {!readonly&&reduced&&<span className="lv-accessibility-note">Уменьшенное движение: используйте ручные шаги.</span>}
  </div>
  return <div className={`lv ${compact?'lv-compact':''}`} data-learning-visual={spec.slideId} data-replaces-rows={replacesRows||undefined} ref={root}>
    <div inert={expanded||undefined}>{body(false)}</div>
    {expanded&&<Dialog controlled={audience&&snapshot.detail} onClose={()=>{setLocalExpanded(false);if(!audience)setSnapshot(s=>({...pauseSnapshot(s),detail:false}))}}><div className="lv">{body(true)}</div></Dialog>}
  </div>
}
export function renderLearningVisual({slide,interactive}:{slide:Slide;base:string;interactive:boolean}){
  // Keep the original fixed-size slide export; complete scenario diagrams follow in an appendix.
  if(role().mode==='print'||/\/print\/?$/.test(location.pathname))return undefined
  const spec=specification(slide)
  const replacesRows=spec?.kind==='source'&&Boolean(slide.rows&&!slide.visual&&!slide.steps)
  return spec?<LearningVisual key={slide.id} spec={spec} interactive={interactive} compact={!replacesRows&&!slide.visual&&!slide.steps} replacesRows={replacesRows}/>:undefined
}
export function LearningVisualPrintAppendix({course}:{course:Course}){
  const query=new URL(location.href).searchParams
  if(query.get('mode')!=='print')return null
  const scope=query.get('scope'),specs=authoredSpecs()
  return <aside className="lv-print-appendix" aria-label="Приложение: учебные схемы">{course.lectures.filter(l=>scope==='all'||scope===l.id||scope===`semester-${l.semester}`).flatMap(lecture=>lecture.slides.flatMap(slide=>{
    const spec=specs.find(s=>s.slideId===slide.id)
    return spec?[<section className="lv-print-sheet" key={slide.id} data-print-diagram={slide.id}><header><p>Приложение · учебные схемы · {lecture.semester} семестр</p><h2>{lecture.title}</h2><p>Слайд {lecture.slides.indexOf(slide)+1}: {slide.title}</p></header><LearningVisual spec={spec} interactive={false} compact={false}/></section>]:[]
  }))}</aside>
}
