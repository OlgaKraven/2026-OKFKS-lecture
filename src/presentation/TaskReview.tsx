import {lazy,Suspense,useEffect,useRef} from 'react'
import {createPortal} from 'react-dom'
import type {Course} from '@olgakraven/lecture-engine'
import {presentationRole,usePresentationSync} from './usePresentationSync'
import './presentation-interactions.css'

const Workshop=lazy(()=>import('../lab/QuestionWorkshop').then(module=>({default:module.QuestionWorkshop})))
export function TaskReview({course,base,href,onClose}:{course:Course;base:string;href:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),audience=presentationRole().mode==='audience'
 const params=new URL(href,location.href).searchParams
 const [scroll,setScroll]=usePresentationSync(`${course.id}:${params.get('lecture')}:${params.get('question')}:review-scroll`,()=>0,(value):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1)
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();dialog?.focus({preventScroll:true});if(dialog)dialog.scrollTop=0;return()=>dialog?.close()},[])
 useEffect(()=>{
  if(!audience||!ref.current)return
  const dialog=ref.current,update=()=>{dialog.scrollTop=scroll*Math.max(0,dialog.scrollHeight-dialog.clientHeight)}
  const observer=new ResizeObserver(update);if(dialog.firstElementChild)observer.observe(dialog.firstElementChild)
  update();return()=>observer.disconnect()
 },[audience,scroll])
 return createPortal(<dialog ref={ref} tabIndex={-1} className="task-review-dialog" aria-label="Разбор задачи" onScroll={event=>{if(!audience){const node=event.currentTarget;setScroll(node.scrollHeight>node.clientHeight?node.scrollTop/(node.scrollHeight-node.clientHeight):0)}}} onCancel={event=>{event.preventDefault();if(!audience)onClose()}}>
  <Suspense fallback={<p role="status">Загружаем разбор задачи…</p>}><Workshop course={course} base={base} lectureId={params.get('lecture')||''} question={Number(params.get('question'))} onClose={onClose}/></Suspense>
 </dialog>,document.body)
}
