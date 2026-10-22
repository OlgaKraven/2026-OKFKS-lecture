import type {Frame,Scenario,Snapshot,Spec} from './model'

export function scenarioFor(spec:Spec,id:string){return spec.scenarios.find(s=>s.id===id)||spec.scenarios[0]}
export function initialSnapshot(spec:Spec):Snapshot{return {scenario:spec.defaultScenario,step:0,target:null,progress:0,phase:'hold',elapsed:0,playing:false,resume:false,detail:false,revision:0}}
export function commonPrefix(a:Scenario,b:Scenario){let common=0;for(let i=0;i<Math.min(a.frames.length,b.frames.length);i++){if(JSON.stringify(a.frames[i])!==JSON.stringify(b.frames[i]))break;common=i}return common}
export function chooseScenario(spec:Spec,state:Snapshot,id:string):Snapshot{
  const old=scenarioFor(spec,state.scenario),next=scenarioFor(spec,id)
  return {...initialSnapshot(spec),detail:state.detail,scenario:next.id,step:Math.min(state.step,commonPrefix(old,next)),revision:state.revision+1}
}
export function transitionDuration(spec:Spec,frames:Frame[],step:number){
  if(spec.kind==='timeline'&&spec.axis){const a=frames[step]?.time??spec.axis.min,b=frames[step+1]?.time??a;return Math.max(0,(b-a)*12000/(spec.axis.max-spec.axis.min))}
  return 700
}
export function advance(spec:Spec,state:Snapshot,delta:number):Snapshot{
  if(!state.playing)return state
  const frames=scenarioFor(spec,state.scenario).frames,max=frames.length-1
  if(state.step>=max)return {...state,playing:false,target:null,progress:1}
  const elapsed=state.elapsed+delta
  if(state.phase==='hold'){
    if(elapsed<1100)return {...state,elapsed}
    return {...state,phase:'move',target:state.step+1,elapsed:0,progress:0}
  }
  const duration=transitionDuration(spec,frames,state.step),progress=duration===0?1:Math.min(1,elapsed/duration)
  if(progress<1)return {...state,elapsed,progress}
  const step=state.target??state.step+1
  return {...state,step,target:null,phase:'hold',elapsed:0,progress:0,playing:step<max}
}
export function navigate(spec:Spec,state:Snapshot,delta:number):Snapshot{
  const max=scenarioFor(spec,state.scenario).frames.length-1
  const step=state.target!==null?(delta>0?state.target:state.step):Math.max(0,Math.min(max,state.step+delta))
  return {...state,step,target:null,progress:0,elapsed:0,phase:'hold',playing:false,resume:false,revision:state.revision+1}
}

export function pauseSnapshot(s:Snapshot):Snapshot{return {...s,playing:false,resume:s.playing||s.resume}}
export function togglePlayback(spec:Spec,s:Snapshot):Snapshot{
 const max=scenarioFor(spec,s.scenario).frames.length-1
 if(s.playing)return {...s,playing:false,resume:true}
 if(s.step>=max)return {...initialSnapshot(spec),detail:s.detail,scenario:s.scenario,playing:true,phase:'move',target:1,revision:s.revision+1}
 if(s.resume)return {...s,playing:true,resume:false,revision:s.revision+1}
 return {...s,playing:true,phase:'move',target:s.step+1,elapsed:0,revision:s.revision+1}
}
