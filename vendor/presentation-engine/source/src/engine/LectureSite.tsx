import {useEffect,useState,lazy,Suspense} from 'react'
import type {ReactNode} from 'react'
import {CircleHelp,ArrowLeft,ArrowRight,BarChart3,BookOpen,Download,ExternalLink,List,Maximize,Minimize,MonitorPlay,MousePointer2,Moon,Search,Sun,UserRound} from 'lucide-react'
import type {Course,Lecture,Profile,Note} from './model'
import {assetUrl,safeUrl,TEMPLATE_VERSION} from './model'
import {read,save} from './storage'
import {Modal} from './Modal'
import {SlideView} from './SlideView'
import {AssessmentProvider,AssessmentResults} from './Assessment'
import './reference.css'
import './template.css'
import './assessment.css'
import './layout-final.css'
const Teaching=lazy(()=>import('./Teaching'))
const blankProfile:Profile={fullName:'',position:'',department:''}
export type CatalogProps={
 course:Course
 base:string
 profile:Profile
 materials:string
 theme:'light'|'dark'
 onThemeChange:(theme:'light'|'dark')=>void
 storagePrefix:string
 invalidLecture:boolean
 onOpenLecture:(lecture:Lecture)=>void
 onPrint:(scope:string)=>void
 onProfileChange:(profile:Profile)=>void
 onMaterialsChange:(url:string)=>void
}
export function LectureSite({course,base='/',teacherNotes,resolveTeacherNotes,renderCatalog,renderPrintSlide}:{course:Course;base?:string;teacherNotes?:Record<string,Note>;resolveTeacherNotes?:()=>Record<string,Note>;renderCatalog?:(props:CatalogProps)=>ReactNode;renderPrintSlide?:(props:{slide:import('./model').Slide;lecture:Lecture;number:number;defaultSlide:ReactNode})=>ReactNode|undefined}){
 const prefix=`lecture:${base}:${course.id}`
 const [query,setQuery]=useState(()=>new URLSearchParams(location.search))
 const [themeMode,setThemeMode]=useState<'light'|'dark'|'auto'>(()=>read(`${prefix}:theme`,'light'))
 const [systemDark,setSystemDark]=useState(()=>matchMedia('(prefers-color-scheme: dark)').matches)
 const theme=themeMode==='auto'?(systemDark?'dark':'light'):themeMode
 const setTheme=(value:'light'|'dark'|'auto')=>setThemeMode(value)
 useEffect(()=>{const mq=matchMedia('(prefers-color-scheme: dark)');const system=()=>setSystemDark(mq.matches);const sync=(event:StorageEvent)=>{if(event.key===`${prefix}:theme`)setThemeMode(read(`${prefix}:theme`,'light'))};mq.addEventListener('change',system);window.addEventListener('storage',sync);return()=>{mq.removeEventListener('change',system);window.removeEventListener('storage',sync)}},[prefix])
 const [profile,setProfile]=useState<Profile>(()=>read(`${prefix}:profile`,blankProfile))
 const [materials,setMaterials]=useState(()=>read(`${prefix}:materials`,course.materialsUrl))
 const [modal,setModal]=useState('');const [search,setSearch]=useState('');const [semester,setSemester]=useState<number|'all'>('all')
 const [pointerEnabled,setPointerEnabled]=useState(false);const [pointer,setPointer]=useState<{x:number;y:number}|null>(null)
 const [fullscreen,setFullscreen]=useState(false);const [notice,setNotice]=useState('')
 const mode=query.get('mode')||'viewer'
 const lecture=course.lectures.find(x=>x.id===query.get('lecture'))
 const index=lecture?Math.max(0,lecture.slides.findIndex(s=>s.id===query.get('slide'))):0
 const slide=lecture?.slides[index]
 const navigate=(params:Record<string,string>)=>{const u=new URL(location.href);u.search=new URLSearchParams(params).toString();history.pushState({},'',u);setQuery(new URLSearchParams(u.search));window.scrollTo(0,0)}
 const go=(n:number)=>{if(!lecture)return;const s=lecture.slides[Math.max(0,Math.min(lecture.slides.length-1,n))];save(`${prefix}:${course.contentVersion}:${lecture.id}:progress`,s.id);const u=new URL(location.href);u.searchParams.set('slide',s.id);history.replaceState({},'',u);setQuery(new URLSearchParams(u.search))}
 const open=(l:Lecture)=>{const stored=read(`${prefix}:${course.contentVersion}:${l.id}:progress`,l.slides[0].id);navigate({lecture:l.id,slide:l.slides.some(s=>s.id===stored)?stored:l.slides[0].id})}
 const print=(scope:string)=>{const u=new URL(location.href);u.search=new URLSearchParams({mode:'print',scope,auto:'1'}).toString();window.open(u,'_blank','noopener')}
 const toggleFull=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{setNotice('Полноэкранный режим недоступен. Используйте полноэкранный режим браузера.')}}
 useEffect(()=>{const pop=()=>setQuery(new URLSearchParams(location.search));const full=()=>setFullscreen(Boolean(document.fullscreenElement));window.addEventListener('popstate',pop);document.addEventListener('fullscreenchange',full);return()=>{window.removeEventListener('popstate',pop);document.removeEventListener('fullscreenchange',full)}},[])
 useEffect(()=>{document.documentElement.dataset.theme=theme;save(`${prefix}:theme`,themeMode)},[theme,themeMode,prefix])
 useEffect(()=>{const font=new FontFace('Raleway',`url(${assetUrl(course.font,base)})`,{weight:'100 900'});font.load().then(f=>document.fonts.add(f)).catch(()=>{});},[course.font,base])
 useEffect(()=>{if(mode!=='viewer'||!lecture)return;const key=(e:KeyboardEvent)=>{const target=e.target instanceof Element?e.target:null;if(!target||modal||e.defaultPrevented||e.isComposing||e.altKey||e.ctrlKey||e.metaKey||document.querySelector('dialog[open]')||target.closest('input,textarea,select,[contenteditable],.table-scroll,.infographic,.choice-grid,.matching-fields,.short-field,.code-block,.template-dialog,.lv-dialog,.lv,.pd-menu,.pd-more[open],[role="region"]'))return;if(e.key===' '&&target.closest('button,a,summary'))return;const next=['ArrowRight','PageDown',' '].includes(e.key);const previous=['ArrowLeft','PageUp'].includes(e.key);if(next||previous||['Home','End'].includes(e.key)){e.preventDefault();go(e.key==='Home'?0:e.key==='End'?lecture.slides.length-1:index+(next?1:-1))}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[mode,lecture,index,modal])
 useEffect(()=>{if(mode==='print'&&query.get('auto')==='1'){Promise.all([document.fonts.ready,...Array.from(document.images).map(img=>img.decode().catch(()=>{}))]).then(()=>{setTimeout(()=>window.print(),150)})}},[mode,query])
 const startTeaching=()=>{if(!lecture)return;const session=crypto.randomUUID();const u=new URL(location.href);u.search=new URLSearchParams({mode:'audience',lecture:lecture.id,session}).toString();const popup=window.open(u,`audience-${session}`);(window as Window&{lectureAudience?:Window|null}).lectureAudience=popup;navigate({mode:'presenter',lecture:lecture.id,slide:slide!.id,session})}
 const icon=(label:string,child:React.ReactNode,fn:()=>void,pressed?:boolean)=><button className="icon-button" title={label} aria-label={label} aria-pressed={pressed} onClick={fn}>{child}</button>
 const themeButton=icon(theme==='light'?'Включить тёмную тему':'Включить светлую тему',theme==='light'?<Moon size={19}/>:<Sun size={19}/>,()=>setTheme(theme==='light'?'dark':'light'))
 if((mode==='presenter'||mode==='audience')&&lecture)return <Suspense fallback={<p>Открываем занятие…</p>}><Teaching onProfileChange={p=>{setProfile(p);save(`${prefix}:profile`,p)}} themeMode={themeMode} onThemeChange={setTheme} teacherNotes={mode==='presenter'?teacherNotes:undefined} resolveTeacherNotes={mode==='presenter'?resolveTeacherNotes:undefined} course={course} lecture={lecture} base={base} profile={profile} mode={mode} session={query.get('session')||''} initialSlide={slide!.id} onExit={currentId=>{const id=lecture.slides.some(s=>s.id===currentId)?currentId:slide!.id;save(`${prefix}:${course.contentVersion}:${lecture.id}:progress`,id);navigate({lecture:lecture.id,slide:id})}}/></Suspense>
 if(mode==='print'){const scope=query.get('scope');const list=course.lectures.filter(l=>scope==='all'||scope===l.id||scope===`semester-${l.semester}`);return <main className="print-document"><div className="print-hint"><strong>PDF · {list.length} лекций</strong><button className="button primary" onClick={()=>window.print()}>Сохранить PDF</button></div>{list.flatMap(l=>l.slides.filter(s=>!s.task&&s.kind!=='test').map((s,i)=>{const defaultSlide=<section className="print-page" key={s.id}><SlideView course={course} lecture={l} slide={s} number={i+1} base={base} profile={profile}/></section>;return renderPrintSlide?.({slide:s,lecture:l,number:i+1,defaultSlide})??defaultSlide}))}</main>}
 return <AssessmentProvider course={course} base={base}>
 {!lecture?renderCatalog?renderCatalog({course,base,profile,materials,theme,onThemeChange:setTheme,storagePrefix:prefix,invalidLecture:query.has('lecture'),onOpenLecture:open,onPrint:print,onProfileChange:p=>{setProfile(p);save(`${prefix}:profile`,p)},onMaterialsChange:url=>{setMaterials(url);save(`${prefix}:materials`,url)}}):<main className="catalog"><header className="catalog-header"><a className="brand-lockup" href={base}><img src={assetUrl(course.logo,base)} alt="Логотип компании"/><span><strong>{course.code}</strong><small>{course.discipline}</small></span></a><nav><button className="button ghost settings-button" onClick={()=>setModal('settings')}><UserRound size={19}/><span>Настройка перед занятием</span></button><label className="presentation-theme">Тема<select aria-label="Тема презентации" value={themeMode} onChange={e=>setTheme(e.target.value as typeof themeMode)}><option value="auto">Авто</option><option value="light">Светлая</option><option value="dark">Тёмная</option></select></label><a className="icon-button" href={assetUrl('guide.html',base)} target="_blank" rel="noopener noreferrer" title="Как пользоваться сайтом" aria-label="Как пользоваться сайтом"><CircleHelp size={19}/></a></nav></header>
 {query.has('lecture')&&<div className="notice">Лекция не найдена. Выберите тему в каталоге.</div>}
 <section className="catalog-hero"><div className="hero-copy"><p className="eyebrow">{course.semesters.join(' и ')} семестры{course.year?` · ${course.year}`:''}</p><h1>{course.heroTitle} <span>{course.heroAccent}</span></h1><p className="hero-lead">{course.slogan}</p><div className="teacher-summary"><span>Преподаватель</span><strong>{profile.fullName||'Ваше имя на каждой лекции'}</strong><small>{profile.position||'Заполните данные перед занятием'}</small>{profile.department&&<small>{profile.department}</small>}</div></div><div className="hero-mascot"><div className="chevron-backdrop"/><img src={assetUrl(course.mascot,base)} alt={course.mascotAlt}/></div></section>
 <section className="catalog-tools" aria-label="Поиск и фильтры"><label className="search-field"><Search size={19}/><input aria-label="Поиск по темам" placeholder="Поиск по темам" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="semester-filter">{(['all',...course.semesters] as const).map(s=><button key={s} className={semester===s?'active':''} aria-pressed={semester===s} onClick={()=>setSemester(s)}>{s==='all'?'Все темы':`${s} семестр`}</button>)}</div>{safeUrl(materials)?<a className="materials-link" href={safeUrl(materials)} target="_blank" rel="noopener noreferrer"><BookOpen size={18}/>Материалы<ExternalLink size={15}/></a>:<button className="materials-link" onClick={()=>setModal('settings')}><BookOpen size={18}/>Прикрепить материалы</button>}</section>
 <section className="topic-grid">{course.lectures.filter(l=>(semester==='all'||l.semester===semester)&&`${l.title} ${l.sourceTitle}`.toLowerCase().includes(search.toLowerCase())).map(l=><article className={`topic-card period-${course.semesters.indexOf(l.semester)%2}`} key={l.id}><div className="topic-card-top"><span className="topic-index">{String(course.lectures.indexOf(l)+1).padStart(2,'0')}</span><span className="semester-tag">{l.semester} семестр</span></div><h2>{l.title}</h2><p>{l.sourceTitle}</p><div className="topic-card-footer"><div className="topic-card-actions"><button className="button ghost" onClick={()=>print(l.id)}><Download size={17}/>Сохранить PDF</button><button className="button primary" onClick={()=>open(l)}>Открыть</button></div></div></article>)}</section>
 {!course.lectures.some(l=>(semester==='all'||l.semester===semester)&&`${l.title} ${l.sourceTitle}`.toLowerCase().includes(search.toLowerCase()))&&<section className="empty-state"><h2>Темы не найдены</h2><p>Измените запрос или выберите другой семестр.</p></section>}
 <footer className="catalog-footer"><a href={assetUrl('guide.html',base)} target="_blank" rel="noopener noreferrer">Как пользоваться сайтом</a><span>{course.demo?'Демонстрационный курс · образцы макетов, не полный комплект по РПД':course.discipline}</span>{course.year&&<span>Учебный год {course.year}</span>}</footer></main>:<main className="deck-shell">
 <header className="deck-toolbar pd-toolbar"><button className="button ghost" onClick={()=>navigate({})}><ArrowLeft size={18}/>Каталог</button><div className="pd-brand"><small>{course.code} · {lecture.semester} семестр</small><strong>{lecture.title}</strong></div><div className="pd-tools">
 {icon('Содержание',<List size={19}/>,()=>{setSearch('');setModal('toc')})}
 {icon('Указка',<MousePointer2 size={19}/>,()=>{setPointerEnabled(!pointerEnabled);setPointer(null)},pointerEnabled)}
 {icon('Во весь экран',fullscreen?<Minimize size={19}/>:<Maximize size={19}/>,toggleFull)}
 <details className="pd-more"><summary className="icon-button" aria-label="Ещё" title="Ещё">•••</summary><div className="pd-menu">
 <label className="presentation-theme">Тема<select aria-label="Тема презентации" value={themeMode} onChange={e=>setTheme(e.target.value as typeof themeMode)}><option value="auto">Авто</option><option value="light">Светлая</option><option value="dark">Тёмная</option></select></label>
 <button className="button ghost" onClick={()=>setModal('settings')}><UserRound size={18}/>Преподаватель</button>
 <button className="button ghost" onClick={()=>setModal('results')}><BarChart3 size={18}/>Самопроверка</button>
 <button className="button ghost" onClick={()=>setModal('download')}><Download size={18}/>Скачать PDF</button>
 </div></details>
 <button className="button primary" onClick={startTeaching}><MonitorPlay size={18}/>Режим показа</button>
 </div></header><div className="progress-track" role="progressbar" aria-label="Прогресс лекции" aria-valuemin={0} aria-valuemax={lecture.slides.length} aria-valuenow={index+1}><span style={{width:`${(index+1)/lecture.slides.length*100}%`}}/></div>
 <section className="player-stage"><div className="active-slide" onPointerMove={e=>{if(pointerEnabled){const r=e.currentTarget.getBoundingClientRect();setPointer({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height})}}} onPointerLeave={()=>setPointer(null)} key={slide!.id}><SlideView course={course} lecture={lecture} slide={slide!} profile={profile} base={base} number={index+1} interactive/>{pointerEnabled&&pointer&&<span className="laser-pointer" style={{left:`${pointer.x*100}%`,top:`${pointer.y*100}%`}}/>}</div></section>
 <nav className="deck-controls" aria-label="Навигация по слайдам"><button className="button secondary" disabled={!index} onClick={()=>go(index-1)}><ArrowLeft size={18}/>Назад</button><button className="slide-counter" onClick={()=>{setSearch('');setModal('toc')}} aria-label="Счётчик и содержание">{index+1} / {lecture.slides.length}</button><button className="button primary" disabled={index===lecture.slides.length-1} onClick={()=>go(index+1)}>Вперёд<ArrowRight size={18}/></button></nav>
 <span className="sr-only" aria-live="polite">Слайд {index+1}: {slide!.title}</span></main>}
 {notice&&<div className="floating-notice" role="status" onClick={()=>setNotice('')}>{notice}</div>}
 {modal==='settings'&&<Settings course={course} profile={profile} materials={materials} onClose={()=>setModal('')} onSave={(p,m)=>{setProfile(p);setMaterials(m);save(`${prefix}:profile`,p);save(`${prefix}:materials`,m)}} print={print}/>}
 {modal==='toc'&&lecture&&<Modal title="Содержание лекции" onClose={()=>setModal('')}><label className="search-field"><Search size={18}/><input autoFocus aria-label="Найти слайд" placeholder="Найти слайд" value={search} onChange={e=>setSearch(e.target.value)}/></label><ol className="toc-list">{lecture.slides.map((s,i)=>({s,i})).filter(({s})=>`${s.kicker} ${s.title}`.toLowerCase().includes(search.toLowerCase())).map(({s,i})=><li key={s.id}><button aria-current={i===index?'step':undefined} onClick={()=>{go(i);setModal('')}}><b>{String(i+1).padStart(2,'0')}</b>{s.kind==='section'?`${s.kicker} · ${s.title}`:s.title}</button></li>)}</ol></Modal>}
 {modal==='download'&&lecture&&<Modal title="Скачать лекцию" onClose={()=>setModal('')}><p>Материал текущей лекции без тестовых заданий. Заметки и ответы преподавателя не включаются.</p><button className="button primary" onClick={()=>print(lecture.id)}><Download size={18}/>Сохранить PDF</button></Modal>}
 {modal==='results'&&lecture&&<Modal title="Самопроверка" onClose={()=>setModal('')}><AssessmentResults lecture={lecture} onGo={i=>{go(i);setModal('')}}/></Modal>}
 <span className="sr-only">Версия шаблона {TEMPLATE_VERSION}</span></AssessmentProvider>
}
function Settings({course,profile,materials,onSave,onClose,print}:{course:Course;profile:Profile;materials:string;onSave:(p:Profile,m:string)=>void;onClose:()=>void;print:(scope:string)=>void}){
 const [p,setP]=useState(profile);const [m,setM]=useState(materials);const [error,setError]=useState('')
 const persist=()=>{if(m&&!safeUrl(m)){setError('Укажите полный адрес папки, начинающийся с https:// или http://');return false}onSave(p,m);return true}
 return <Modal title="Настройка перед занятием" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(persist())onClose()}} className="settings-form"><label>ФИО преподавателя<input autoComplete="name" value={p.fullName} onChange={e=>setP({...p,fullName:e.target.value})}/></label><label>Должность<input value={p.position} onChange={e=>setP({...p,position:e.target.value})}/></label><label>Кафедра или лаборатория<input value={p.department} onChange={e=>setP({...p,department:e.target.value})}/></label><label>Ссылка на папку с материалами<input type="url" placeholder="https://…" value={m} onChange={e=>setM(e.target.value)}/></label><p className="field-help">Настройки сохраняются в этом браузере. В опубликованном курсе общая ссылка задаётся автором.</p>{error&&<p role="alert">{error}</p>}<section className="profile-downloads"><strong>Сохранить лекции в PDF</strong><div>{course.semesters.map(s=><button type="button" className="button ghost" key={s} onClick={()=>{if(persist())print(`semester-${s}`)}}><Download size={17}/>{s} семестр</button>)}<button type="button" className="button ghost" onClick={()=>{if(persist())print('all')}}><Download size={17}/>{course.year?`За ${course.year} год`:'Все лекции'}</button></div></section>
 <div className="dialog-actions"><button className="button primary" type="submit">Сохранить настройки</button></div></form></Modal>
}
