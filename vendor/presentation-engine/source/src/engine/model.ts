export const TEMPLATE_VERSION = '0.1.0'
export type Profile = {fullName:string;position:string;department:string}
export type Option = {id:string;text:string}
export type Visual =
 | {type:'process'|'timeline';items:{title:string;text:string}[];caption:string}
 | {type:'tree';root:string;branches:{title:string;items:string[]}[];caption:string}
 | {type:'network';nodes:{id:string;title:string;text:string}[];edges:{from:string;to:string;label:string}[];caption:string}
 | {type:'bars';items:{label:string;value:number}[];max:number;unit:string;threshold?:number;caption:string}
 | {type:'decision';question:string;yes:string;no:string;start:string;caption:string}
 | {type:'cycle';items:{title:string;text:string}[];caption:string}
 | {type:'comparison'|'matrix';columns:string[];rows:string[][];caption:string}
 | {type:'beforeAfter';before:{title:string;fields:{label:string;value:string}[]};after:{title:string;fields:{label:string;value:string}[]};changes:string[];caption:string}
 | {type:'conceptMap';center:string;items:{title:string;example:string;relation:string}[];caption:string}
 | {type:'states';states:string[];cancelFrom:number[];caption:string}
 | {type:'cause';cause:string;effect:string;solution:string;caption:string}
 | {type:'callouts';image:string;alt:string;items:{x:number;y:number;title:string;text:string}[];caption:string}
 | {type:'codeParts';parts:{code:string;label:string;explanation:string}[];caption:string}
export type Task = {id:string;type:'single'|'multiple'|'short'|'matching';prompt:string;choose?:number;options?:Option[];items?:Option[]}
export type Reading = {citation:string;url?:string}
export type Slide = {id:string;kind:'title'|'theory'|'notebook'|'process'|'comparison'|'example'|'warning'|'test'|'summary'|'literature'|'materials'|'section'|'questions'|'agenda';readingGroup?:'primary'|'additional';references?:Reading[];definitionEntries?:{term:string;definition:string}[];title:string;kicker:string;body?:string;notebook?:string;bullets?:string[];visual?:Visual;steps?:{title:string;text:string}[];columns?:string[];rows?:string[][];task?:Task;source?:string;supplement?:{label:string;href:string}}
export type Lecture = {id:string;title:string;sourceTitle:string;semester:number;question:string;slides:Slide[]}
export type Course = {schemaVersion:1;contentVersion:string;id:string;code:string;discipline:string;year:string;heroTitle:string;heroAccent:string;slogan:string;mascot:string;mascotAlt:string;logo:string;ornament:string;font:string;materialsUrl:string;topicArrow?:string;literature?:{primary:Reading[];additional:Reading[]};assessment?:{mode:'autonomous';url:string};demo:boolean;semesters:number[];lectures:Lecture[]}
export type Note = {script:string;preparation:string;notebook:string;questions:string;answer:string;estimatedSeconds:number}
export type TeacherPack = {schemaVersion:1;courseId:string;contentVersion:string;notes:Record<string,Note>}
export const emptyNote = ():Note => ({script:'',preparation:'',notebook:'',questions:'',answer:'',estimatedSeconds:120})
export function safeUrl(value:string) {try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
export function assetUrl(path:string,base:string){return safeUrl(path)||`${base}${path.replace(/^\//,'')}`}
export function supplementUrl(value:string,base:string){
 if(safeUrl(value))return safeUrl(value)
 if(!value.trim()||value.startsWith('//')||/^[a-z][a-z0-9+.-]*:/i.test(value)||/[\\\u0000-\u001f]/.test(value))return ''
 return assetUrl(value,base)
}
export function validateCourse(value:unknown): asserts value is Course {
 const c=value as Course
 if(!c||c.schemaVersion!==1||!c.id||!c.contentVersion||!c.code||!c.discipline||!Array.isArray(c.semesters)||!Array.isArray(c.lectures)||!c.lectures.length)throw Error('Некорректная конфигурация курса')
 const ids=new Set<string>(); const kinds=['title','theory','notebook','process','comparison','example','warning','test','summary','literature','materials','section','questions','agenda']
 const checkReading=(entries:Reading[])=>{if(!Array.isArray(entries)||entries.some(e=>!e||typeof e.citation!=='string'||!e.citation.trim()||(e.url&&!safeUrl(e.url))))throw Error('Некорректная библиография')}
 if(c.literature){checkReading(c.literature.primary);checkReading(c.literature.additional)}
 for(const l of c.lectures){if(!l.id||ids.has(l.id)||!c.semesters.includes(l.semester)||!Array.isArray(l.slides)||!l.slides.length)throw Error('Некорректная лекция');ids.add(l.id)
 for(const s of l.slides){if(!s.id||ids.has(s.id)||!s.title||!kinds.includes(s.kind))throw Error('Некорректный слайд');ids.add(s.id)
 if(s.task&&!['single','multiple','short','matching'].includes(s.task.type))throw Error('Неизвестный тип задания')
 if(s.references)checkReading(s.references)
 if(s.supplement&&(typeof s.supplement.label!=='string'||!s.supplement.label.trim()||typeof s.supplement.href!=='string'||!supplementUrl(s.supplement.href,'/')))throw Error('Некорректная ссылка дополнения')
 if(s.readingGroup&&!['primary','additional'].includes(s.readingGroup))throw Error('Неизвестная группа литературы')
 }}
 const walk=(v:unknown):void=>{if(v&&typeof v==='object'){for(const [k,x] of Object.entries(v)){if(['keys','answer','correctAnswer','correctIndexes','script','preparation','notes'].includes(k))throw Error('Приватные данные в публичном курсе');walk(x)}}};walk(c)
}
