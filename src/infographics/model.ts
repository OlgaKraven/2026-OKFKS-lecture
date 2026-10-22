import type { Slide } from '@olgakraven/lecture-engine'

export type Frame = {caption:string;focus:string[];edges?:string[];result?:string;time?:number}
export type Scenario = {id:string;label:string;condition:string;frames:Frame[]}
export type Node = {id:string;title:string;text?:string;kind?:'action'|'decision'|'start'|'end'|'state';column:number;row:number}
export type Edge = {id:string;from:string;to:string;label?:string}
export type Spec = {
  slideId:string;catalogId:string;kind:'flow'|'timeline'|'sequence'|'source';title:string;overview:string;scope:string;
  nodes?:Node[];edges?:Edge[];axis?:{min:number;max:number;unit:string};
  segments?:{id:string;label:string;start:number;end:number;lane?:number;scenario?:string}[];
  events?:{id:string;label:string;at:number;scenario?:string}[];
  participants?:{id:string;title:string}[];
  messages?:{id:string;from:string;to:string;label:string;kind:'call'|'return';branch?:string}[];
  scenarioLabel?:string;defaultScenario:string;scenarios:Scenario[];visual?:NonNullable<Slide['visual']>;
}
export type Snapshot = {scenario:string;step:number;target:number|null;progress:number;phase:'move'|'hold';elapsed:number;playing:boolean;resume:boolean;detail:boolean;revision:number}

const authored = Object.values(import.meta.glob('./data/*.json', {eager:true,import:'default'})).flat() as Spec[]
const bySlide = new Map(authored.map(spec=>[spec.slideId,spec]))
const sourceCache = new WeakMap<Slide,Spec>()
export function authoredSpecs(){return authored}
const titles:Record<string,string> = {comparison:'Сопоставление по единым критериям',matrix:'Матрица отношений',tree:'Состав и связи',network:'Границы и взаимодействие',bars:'Значения на общей шкале',cycle:'Этапы и условия перехода',process:'Порядок разбора',timeline:'Последовательность событий'}
export function specification(slide:Slide):Spec|undefined {
  const custom=bySlide.get(slide.id)
  if(custom)return custom
  const cached=sourceCache.get(slide)
  if(cached)return cached
  const rowsOnly=Boolean(slide.rows&&!slide.visual&&!slide.steps)
  const original=slide.visual||(slide.steps?{type:'process' as const,items:slide.steps,caption:'Последовательность действий с указанным результатом.'}:slide.rows?{type:'comparison' as const,columns:slide.columns||[],rows:slide.rows,caption:'Таблица показана целиком. На следующих шагах выделяется одна строка; значения сохраняются.'}:undefined)
  if(!original)return undefined
  const visual=original.type==='bars'&&!original.unit&&slide.title.includes('%')?{...original,unit:'%'}:original
  const frames:Frame[]=[{caption:visual.caption,focus:[]}]
  let catalogId='INFO-01'
  if(visual.type==='comparison'||visual.type==='matrix'){
    catalogId=visual.type==='matrix'?'TAB-03':'INFO-07'
    visual.rows.forEach((row,i)=>frames.push({caption:rowsOnly?`${visual.rows.length>1?`Строка ${i+1} из ${visual.rows.length}. `:''}Сопоставьте выделенные значения по заголовкам столбцов.`:row.map((cell,j)=>`${visual.columns[j]||'Значение'}: ${cell}`).join('; ')+'.',focus:[`row${i}`]}))
  } else if(visual.type==='tree') {
    catalogId='INFO-05';frames.push({caption:visual.root,focus:['root']})
    visual.branches.forEach((branch,i)=>frames.push({caption:`${branch.title}: ${branch.items.join('; ')}.`,focus:[`branch${i}`]}))
  } else if(visual.type==='network') {
    catalogId='ARCH-04'
    visual.nodes.forEach(node=>frames.push({caption:`${node.title}. ${node.text}`,focus:[node.id]}))
    visual.edges.forEach((edge,i)=>frames.push({caption:`${visual.nodes.find(n=>n.id===edge.from)?.title} → ${visual.nodes.find(n=>n.id===edge.to)?.title}: ${edge.label}.`,focus:[edge.from,edge.to],edges:[`edge${i}`]}))
  } else if(visual.type==='bars') {
    catalogId='INFO-14'
    visual.items.forEach((item,i)=>frames.push({caption:`${item.label}: ${item.value}${visual.unit?' '+visual.unit:slide.title.includes('%')?' %':''}. ${visual.caption}`,focus:[`bar${i}`]}))
  } else if(visual.type==='process'||visual.type==='timeline'||visual.type==='cycle') {
    catalogId=visual.type==='cycle'?'PROC-09':'INFO-01'
    visual.items.forEach((item,i)=>frames.push({caption:`${item.title}. ${item.text}`,focus:[`node${i}`]}))
  } else {
    frames.push({caption:visual.caption,focus:['all']})
  }
  const spec:Spec={slideId:slide.id,catalogId:rowsOnly?'TAB-01':catalogId,kind:'source',title:rowsOnly?'Разбор таблицы по строкам':titles[visual.type]||'Учебная схема',overview:visual.caption,scope:visual.type==='timeline'?'Порядок событий; интервалы без полной временной шкалы не сравниваются по длине.':'Фокус объяснения; исходные данные и связи сохраняются.',visual,defaultScenario:'overview',scenarios:[{id:'overview',label:'Разбор',condition:'Данные слайда',frames}]}
  sourceCache.set(slide,spec)
  return spec
}
export {scenarioFor,initialSnapshot,commonPrefix,chooseScenario,transitionDuration,advance,navigate,pauseSnapshot,togglePlayback} from './playback'
