import workshops from '../../authoring/workshops.json'
import './workshops.css'
export function WorkshopDirectory({base,current}:{base:string;current?:string}) {
  return <details className="workshop-directory"><summary>Другие мастерские курса</summary><div><a href={`${base}?mode=lab`} aria-current={!current?'page':undefined}>Расчёт надёжности</a>{workshops.map(l=><a key={l.id} href={`${base}?${new URLSearchParams({mode:'lab',workshop:l.id})}`} aria-current={current===l.id?'page':undefined}>{l.title}</a>)}</div></details>
}
