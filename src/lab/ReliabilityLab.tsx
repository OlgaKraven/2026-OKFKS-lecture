import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, RotateCcw, Printer, Wrench, Activity, Search, BookOpen } from 'lucide-react'
import { calculateReliability, referenceCycles, segments, mistakes, freshState, readLabState, meetsRequirement } from './reliability'
import type { Cycle, LabState } from './reliability'
import '@olgakraven/lecture-engine/style.css'
import './reliability-project.css'

const lecture='s07-02-reliability-metrics'
type ActivityId = 'timeline' | 'simulator' | 'game'
const activities = [
  { id:'timeline', title:'Разбери журнал', subtitle:'Увидеть исходные данные', icon:Activity, slide:'s027' },
  { id:'simulator', title:'Измени простой', subtitle:'Проверить последствия', icon:Wrench, slide:'s060' },
  { id:'game', title:'Найди ошибку', subtitle:'Обосновать решение', icon:Search, slide:'s071' },
] as const
const format = (n:number, digits=2) => n.toLocaleString('ru-RU',{maximumFractionDigits:digits})
const lessonLink = (base:string, slide:string) => `${base}?lecture=${lecture}&slide=${lecture}-${slide}`
const storageKey='okfks:reliability-workshop:pilot-1'

function Timeline({ cycles, active, onSelect }: { cycles:Cycle[]; active:number; onSelect:(n:number)=>void }) {
  const data=segments(cycles), total=calculateReliability(cycles).calendar
  return <div className="lab-timeline">
    <div className="lab-legend"><span><i className="work-dot" />Работа</span><span><i className="repair-dot" />Восстановление функции</span><span>Период: {format(total)} ч · в масштабе</span></div>
    <svg viewBox="0 0 960 118" role="img" aria-label={`Период ${format(total)} часов: ${cycles.map((c,i)=>`цикл ${i+1}, работа ${c.work} ч, восстановление ${c.repair} ч`).join('; ')}`}>
      {data.map(s=><g key={s.id} opacity={s.cycle===active ? 1 : 0.55}>
        <rect x={s.start/total*900+25} y={22} width={s.duration/total*900} height={40} fill={s.kind==='work'?'var(--blue)':'var(--red)'} />
        {s.kind==='work' && <text className="lab-duration" x={(s.start+s.duration/2)/total*900+25} y="48" textAnchor="middle" fill="white" fontSize="16">{format(s.duration)} ч</text>}
        {s.kind==='repair' && <><line x1={s.end/total*900+25} x2={s.end/total*900+25} y1="62" y2="79" stroke="var(--red)" /><text className="lab-duration" x={s.end/total*900+25} y="100" textAnchor={s.cycle===cycles.length-1?'end':'middle'} fill="var(--red-dark)" fontSize="14">{format(s.duration)} ч</text></>}
      </g>)}
      <text x="25" y="14" fontSize="13" fill="#65656d">0 ч</text><text x="925" y="14" textAnchor="end" fontSize="13" fill="#65656d">{format(total)} ч</text>
    </svg>
    <p className="lab-small">Ширина каждого участка пропорциональна его длительности. Короткие простои выделены красным и подписаны под лентой.</p>
    <div className="lab-cycles">{cycles.map((c,i)=><button type="button" key={i} aria-pressed={active===i} onClick={()=>onSelect(i)}><span>Цикл {i+1}</span><b>{format(c.work)} ч <ChevronRight size={15} /> {format(c.repair)} ч</b><small>работа → восстановление</small></button>)}</div>
  </div>
}

function Metrics({ cycles, threshold }: {cycles:Cycle[];threshold:number}) {
  const m=calculateReliability(cycles)
  const met=meetsRequirement(m.availability,threshold)
  return <>
    <div className="lab-metrics"><div><span>MTBF</span><strong>{format(m.mtbf)} <small>ч</small></strong><p>{format(m.work)} / {m.count}</p></div><div><span>MTTR</span><strong>{format(m.mttr)} <small>ч</small></strong><p>{format(m.repair)} / {m.count}</p></div><div className="lab-primary-metric"><span>Готовность</span><strong>{format(m.availability*100)} <small>%</small></strong><p>{format(m.work)} / ({format(m.work)} + {format(m.repair)})</p></div></div>
    <div className="lab-threshold"><div className="lab-threshold-head"><span>Доля времени работы</span><b>Порог {format(threshold,1)} %</b></div><div className="lab-meter" role="img" aria-label={`Готовность ${format(m.availability*100,4)} процентов, порог ${threshold} процентов, ${met?'выполнен':'не выполнен'}`}><span style={{width:`${m.availability*100}%`}} /><i style={{left:`${threshold}%`}} /></div><div className="lab-scale"><span>0 %</span><span>100 %</span></div><p className={met?'lab-pass':'lab-fail'}>{met?<Check size={18}/>:<CircleHelp size={18}/>} {met?'Требование выполнено в этой модели':'Требование не выполнено в этой модели'} <small>Сравнение до округления: {format(m.availability*100,4)} % {met?'≥':'<'} {format(threshold,1)} %.</small></p></div>
  </>
}

const teacherGuides:Record<ActivityId,{question:string;sequence:string;answer:string;time:string}> = {
  timeline:{time:'3–4 минуты',question:'120 часов — весь период наблюдения или только время работы?',sequence:'Выберите каждый цикл. До раскрытия формул попросите сложить наработку и простои отдельно. Раскрывайте четыре шага после ответов группы.',answer:'Работа 120 ч; восстановление 6 ч; календарный период 126 ч. При трёх отказах и трёх завершённых восстановлениях MTBF = 40 ч, MTTR = 2 ч.'},
  simulator:{time:'3–5 минут',question:'Что изменится, если восстановления станут быстрее, а интервалы работы останутся прежними?',sequence:'Сначала соберите прогнозы. Выберите «Быстрее восстановление», затем «Долгое восстановление». Попросите назвать изменившиеся и неизменившиеся показатели. Сбросьте к примеру лекции.',answer:'MTBF остаётся 40 ч. MTTR уменьшается либо увеличивается; доля времени работы изменяется. Это следствие учебной модели, а не доказательство эффективности реального средства.'},
  game:{time:'4–6 минут',question:'Какая ошибка в этой ведомости меняет вывод?',sequence:'Предложите ответить и объяснить основание до проверки. Для неверного ответа используйте подсказку. После каждого случая попросите сформулировать правило своими словами.',answer:'Согласовать единицы; считать независимые отказы вместо уведомлений; сравнивать значение с порогом до округления. Число завершённых случаев задано явно.'},
}

export function ReliabilityLab({base, assets}:{base:string;assets?:{logo:string;ornament:string}}) {
  const url=new URL(location.href)
  const requested=url.searchParams.get('activity')
  const [activity,setActivity]=useState<ActivityId>(activities.some(a=>a.id===requested)?requested as ActivityId:'timeline')
  const [teacher,setTeacher]=useState(url.searchParams.get('teacher')==='1')
  const [state,setState]=useState<LabState>(()=>{try{return readLabState(localStorage.getItem(storageKey))}catch{return freshState()}})
  const [saveError,setSaveError]=useState(false)
  const [cycle,setCycle]=useState(0)
  const [step,setStep]=useState(0)
  const [caseIndex,setCaseIndex]=useState(0)
  const [choice,setChoice]=useState<number|null>(null)
  const [feedback,setFeedback]=useState<'correct'|'wrong'|null>(null)
  const [hint,setHint]=useState(false)
  const currentCase=mistakes[caseIndex]
  const cycles=referenceCycles.map((c,i)=>({...c,repair:state.repairs[i]}))
  const currentActivity=activities.find(a=>a.id===activity)!
  const reference=calculateReliability(referenceCycles)
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(state));setSaveError(false)}catch{setSaveError(true)}},[state])
  useEffect(()=>{document.title='Мастерская надёжности · ОКФКС'},[])
  const selectActivity=(id:ActivityId)=>{setActivity(id);const next=new URL(location.href);next.searchParams.set('activity',id);history.replaceState({},'',next)}
  const selectCase=(i:number)=>{setCaseIndex(i);setChoice(null);setFeedback(null);setHint(false)}
  const check=()=>{
    if(choice===null)return
    const correct=choice===currentCase.correct
    setFeedback(correct?'correct':'wrong')
    setState(s=>({...s,solved:s.solved.map((v,i)=>i===caseIndex?v||correct:v),attempts:s.attempts.map((n,i)=>i===caseIndex?n+1:n)}))
  }
  const reset=()=>{setState(freshState());setCycle(0);setStep(0);selectCase(0)}
  const guide=teacherGuides[activity]
  return <main className="reliability-lab">
    <header className="deck-toolbar lab-top">
      <a className="button secondary" href={lessonLink(base,currentActivity.slide)}><ArrowLeft size={18}/> К лекции</a>
      <div className="deck-topic"><strong>Расчёт показателей надёжности</strong><span>7 семестр · интерактивное дополнение</span></div>
      <div className="toolbar-actions">
        <button className="icon-button" type="button" aria-label="Преподавателю" title="Преподавателю" aria-pressed={teacher} onClick={()=>{setTeacher(!teacher);const next=new URL(location.href);if(!teacher)next.searchParams.set('teacher','1');else next.searchParams.delete('teacher');history.replaceState({},'',next)}}><BookOpen size={19}/></button>
        <button className="icon-button" type="button" aria-label="Печать" title="Печать" onClick={()=>window.print()}><Printer size={19}/></button>
      </div>
    </header>
    <div className="progress-track lab-progress" role="img" aria-label={`Этап ${activities.findIndex(a=>a.id===activity)+1} из 3`}><span style={{width:`${(activities.findIndex(a=>a.id===activity)+1)/3*100}%`}}/></div>
    <nav className="lab-nav" aria-label="Этапы мастерской">{activities.map((a,i)=><button className="button secondary" type="button" key={a.id} aria-current={activity===a.id?'step':undefined} onClick={()=>selectActivity(a.id)}><a.icon size={19}/><span><b>{i+1}. {a.title}</b><small>{a.subtitle}</small></span>{a.id==='game'&&state.solved.every(Boolean)&&<Check size={19}/>}</button>)}</nav>
    {saveError&&<p className="lab-storage" role="status">Сохранение на устройстве недоступно. Мастерская работает; после закрытия страницы прогресс может потеряться.</p>}
    <article className="slide-frame has-visual lab-frame">
      <header className="slide-header"><div className="slide-brand"><img src={assets?.logo || `${base}brand/synergy-logo.png`} alt="Синергия"/><span>МДК.04.02 · 7-й семестр</span></div><span className="slide-number">{String(activities.findIndex(a=>a.id===activity)+1).padStart(2,'0')} / 03</span></header>
      <img className="side-ornament lab-ornament" src={assets?.ornament || `${base}brand/side-ornament.png`} alt="" aria-hidden="true"/>
      <div className="lab-content">
      {activity==='timeline'&&<section aria-labelledby="timeline-title"><div className="lab-section-head"><div><p className="lab-eyebrow">01 / ОТ СОБЫТИЙ К ЧИСЛАМ</p><h2 id="timeline-title">Что считать временем работы?</h2></div><span className="lab-badge">3 завершённых цикла</span></div><Timeline cycles={referenceCycles} active={cycle} onSelect={setCycle}/><div className="lab-inspector"><Activity size={22}/><div><b>Цикл {cycle+1}: от работы до подтверждённого восстановления</b><p>Работа: {referenceCycles[cycle].work} ч. Затем отказ и недоступность функции: {referenceCycles[cycle].repair} ч. Календарная длительность цикла: {referenceCycles[cycle].work+referenceCycles[cycle].repair} ч.</p></div></div><h3>Собери расчёт по шагам</h3><div className="lab-step-buttons">{['Время работы','Отказы и MTBF','Простои и MTTR','Готовность'].map((title,i)=><button type="button" key={title} aria-pressed={step===i} onClick={()=>setStep(i)}>{i+1}. {title}</button>)}</div><div className="lab-reveal" aria-live="polite"><span>ШАГ {step+1}</span><h3>{['20 + 50 + 50 = 120 ч','120 / 3 = 40 ч','(1 + 2 + 3) / 3 = 2 ч','40 / (40 + 2) ≈ 95,24 %'][step]}</h3><p>{['120 часов — чистая наработка. Вместе с 6 часами простоев календарный период составляет 126 часов.','Три независимых отказа. MTBF — среднее по этим интервалам, а не обещание, что следующий отказ произойдёт ровно через 40 часов.','Все три восстановления завершены. В нашей модели учитывается вся недоступность функции, включая ожидание; незавершённый случай нельзя считать нулевым.','Оба средних получены по трём завершённым циклам. Поэтому здесь 40 / (40 + 2) совпадает с долей времени работы 120 / 126.'][step]}</p>{step<3&&<button type="button" className="text-button lab-link-button" onClick={()=>setStep(step+1)}>Следующий шаг <ArrowRight size={16}/></button>}</div><button type="button" className="button primary lab-primary" onClick={()=>selectActivity('simulator')}>Теперь изменим условия <ArrowRight size={18}/></button></section>}
      {activity==='simulator'&&<section aria-labelledby="sim-title"><div className="lab-section-head"><div><p className="lab-eyebrow">02 / ПРОГНОЗ → ПРОВЕРКА</p><h2 id="sim-title">А если восстанавливать быстрее?</h2></div><span className="lab-badge">Наработка остаётся 120 ч</span></div><p className="lab-intro">До изменения настроек предположи: что произойдёт с MTBF, MTTR и готовностью?</p><div className="lab-sim-grid"><div className="lab-controls"><h3>Время недоступности функции</h3>{state.repairs.map((value,i)=><label key={i}>Восстановление {i+1}<output>{format(value,1)} ч</output><input type="range" aria-label={`Восстановление ${i+1}, часы`} min="0.5" max="12" step="0.5" value={value} onChange={e=>setState(s=>({...s,repairs:s.repairs.map((v,j)=>j===i?Number(e.target.value):v)}))}/><span className="lab-range-labels"><small>0,5 ч</small><small>12 ч</small></span></label>)}<div className="lab-presets"><button type="button" onClick={()=>setState(s=>({...s,repairs:[0.5,1,1.5]}))}>Быстрее восстановление</button><button type="button" onClick={()=>setState(s=>({...s,repairs:[4,8,12]}))}>Долгое восстановление</button><button type="button" onClick={()=>setState(s=>({...s,repairs:[1,2,3],threshold:95}))}><RotateCcw size={14}/> Пример лекции</button></div><label className="lab-threshold-control">Требование к готовности<output>{format(state.threshold,1)} %</output><input type="range" aria-label="Требование к готовности, проценты" min="90" max="99.9" step="0.1" value={state.threshold} onChange={e=>setState(s=>({...s,threshold:Number(e.target.value)}))}/><span className="lab-range-labels"><small>90 %</small><small>99,9 %</small></span></label></div><div><Metrics cycles={cycles} threshold={state.threshold}/><div className="lab-takeaway" aria-live="polite"><b>Что изменилось относительно примера?</b><p>MTBF остаётся 40 ч. MTTR: {format(calculateReliability(cycles).mttr)} ч вместо 2 ч. Готовность: {format(calculateReliability(cycles).availability*100)} % вместо {format(reference.availability*100)} %.</p><small>Изменили только длительность трёх завершённых восстановлений. Число отказов и интервалы работы прежние.</small></div></div></div><Timeline cycles={cycles} active={cycle} onSelect={setCycle}/><button type="button" className="button primary lab-primary" onClick={()=>selectActivity('game')}>Найти ошибки в чужом расчёте <ArrowRight size={18}/></button></section>}
      {activity==='game'&&<section aria-labelledby="game-title"><div className="lab-section-head"><div><p className="lab-eyebrow">03 / ПРОВЕРКА ВЕДОМОСТИ</p><h2 id="game-title">Найди ошибку до принятия решения</h2></div><span className="lab-badge">Разобрано {state.solved.filter(Boolean).length} из 3</span></div><div className="lab-case-tabs">{mistakes.map((c,i)=><button type="button" key={c.id} aria-pressed={caseIndex===i} onClick={()=>selectCase(i)}>{state.solved[i]?<Check size={16}/>:<span>{i+1}</span>}{c.label}</button>)}</div><div className="lab-case"><div className="lab-case-copy"><p className="lab-eyebrow">СЛУЧАЙ {caseIndex+1}</p><h3>{currentCase.title}</h3><p>{currentCase.context}</p><div className="lab-wrong-formula"><span>ЗАПИСЬ В ВЕДОМОСТИ</span><b>{currentCase.formula}</b></div><button type="button" className="text-button lab-link-button" onClick={()=>setHint(!hint)} aria-expanded={hint}><CircleHelp size={17}/> {hint?'Скрыть подсказку':'Нужна подсказка'}</button>{hint&&<p className="lab-hint">{currentCase.hint}</p>}</div><div className="lab-case-choice"><fieldset><legend>{currentCase.question}</legend>{currentCase.options.map((option,i)=><label key={option} className={choice===i?'selected':''}><input type="radio" name={`case-${currentCase.id}`} checked={choice===i} onChange={()=>{setChoice(i);setFeedback(null)}}/><span>{option}</span></label>)}</fieldset><button type="button" className="button primary lab-primary" disabled={choice===null||feedback==='correct'} onClick={check}>Проверить решение <ArrowRight size={17}/></button><div aria-live="polite">{feedback&&<div className={`lab-feedback ${feedback}`}><b>{feedback==='correct'?'Верно. Вот основание:':'Проверь основание ещё раз.'}</b><p>{feedback==='correct'?currentCase.explanation:currentCase.hint}</p></div>}</div></div></div>{feedback==='correct'&&caseIndex<2&&<button type="button" className="text-button lab-link-button" onClick={()=>selectCase(caseIndex+1)}>Следующий случай <ArrowRight size={17}/></button>}{state.solved.every(Boolean)&&<div className="lab-complete"><Check size={25}/><div><h3>Три ошибки разобраны</h3><p>Единицы согласованы. Отказы отделены от уведомлений. Порог проверен до округления.</p><a href={lessonLink(base,'s071')}>Вернуться к примеру с переводом минут в часы <ArrowRight size={16}/></a></div></div>}<p className="lab-small">Это тренировка с повторными попытками. Результаты тестов лекции она не меняет.</p></section>}
      <aside className="lab-model-note"><CircleHelp size={20}/><p><b>Границы модели.</b> Учебные данные: три отказа и три завершённых восстановления. MTBF = T / N; MTTR = R / N; K = T / (T + R). Равенство с MTBF / (MTBF + MTTR) здесь следует из одинакового числа случаев. Незавершённые восстановления требуют отдельного учёта. Средние не предсказывают следующий отказ.</p></aside>
      {teacher&&<aside className="lab-teacher"><p className="lab-eyebrow">ПОДСКАЗКИ ПРЕПОДАВАТЕЛЮ · {guide.time}</p><h3>Сначала прогноз, затем действие</h3><p><b>Вопрос группе:</b> {guide.question}</p><p><b>Порядок показа:</b> {guide.sequence}</p><p><b>Ожидаемое объяснение:</b> {guide.answer}</p><p className="lab-small">Мастерская дополняет примеры второй темы. Для проекторного показа управляйте одной страницей; интерактив не синхронизируется с отдельным окном audience. Прогресс сохраняется только на этом устройстве.</p></aside>}
      </div>
      <footer className="slide-footer"><span>Авторский учебный разбор · МДК.04.02</span><span>Мастерская надёжности</span></footer>
    </article>
    <footer className="lab-footer"><span>Пилот · Только учебные данные · Прогресс на этом устройстве</span><button type="button" onClick={reset}><RotateCcw size={16}/> Начать мастерскую заново</button></footer>
    <section className="lab-print"><h1>Мастерская надёжности · Тема 2</h1><h2>1. Журнал: пример лекции</h2><table><thead><tr><th>Цикл</th><th>Работа, ч</th><th>Восстановление, ч</th></tr></thead><tbody>{referenceCycles.map((c,i)=><tr key={i}><td>{i+1}</td><td>{c.work}</td><td>{c.repair}</td></tr>)}</tbody></table><p>T = 120 ч, R = 6 ч, N = 3, период 126 ч. MTBF = 40 ч; MTTR = 2 ч; K = 120 / 126 ≈ 95,24 %. Все восстановления завершены.</p><h2>2. Изменённые условия</h2><p>Работа: 20, 50, 50 ч; восстановления: {state.repairs.map(v=>format(v)).join('; ')} ч.</p><p>MTBF = {format(calculateReliability(cycles).mtbf)} ч; MTTR = {format(calculateReliability(cycles).mttr)} ч; готовность = {format(calculateReliability(cycles).availability*100,4)} %. Порог {format(state.threshold,1)} %: {meetsRequirement(calculateReliability(cycles).availability,state.threshold)?'выполнен':'не выполнен'} до округления.</p><h2>3. Найди ошибку — разобранные решения</h2>{mistakes.map(c=><div key={c.id}><h3>{c.title}</h3><p>{c.context}</p><p>Ошибочная запись: {c.formula}</p><p><b>Разбор:</b> {c.explanation}</p></div>)}<p>Учебная модель завершённых циклов; средние не гарантируют время следующего отказа. Интерактивный источник: {base}?mode=lab</p></section>
  </main>
}
