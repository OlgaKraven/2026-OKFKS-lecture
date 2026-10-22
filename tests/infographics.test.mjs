import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {advance,chooseScenario,commonPrefix,initialSnapshot,navigate,pauseSnapshot,scenarioFor,togglePlayback,transitionDuration} from '../src/infographics/playback.ts'
const specs=['semester7','semester8'].flatMap(name=>JSON.parse(fs.readFileSync(`src/infographics/data/${name}.json`,'utf8')))
const course=JSON.parse(fs.readFileSync('public/course.json','utf8'))
const slides=new Map(course.lectures.flatMap(l=>l.slides.map(s=>[s.id,s])))
test('authored diagrams use real slide IDs, complete frames and valid references',()=>{
 assert.equal(new Set(specs.map(s=>s.slideId)).size,specs.length)
 assert.equal(new Set(specs.map(s=>s.slideId.split('-s')[0])).size,7)
 for(const spec of specs){
  assert.ok(slides.has(spec.slideId),spec.slideId)
  assert.ok(spec.scenarios.some(s=>s.id===spec.defaultScenario))
  const ids=new Set([...(spec.nodes||[]),...(spec.edges||[]),...(spec.events||[]),...(spec.segments||[]),...(spec.messages||[])].map(n=>n.id))
  for(const edge of spec.edges||[]){assert.ok(ids.has(edge.from));assert.ok(ids.has(edge.to))}
  for(const scenario of spec.scenarios){
   assert.deepEqual(scenario.frames[0].focus,[],spec.slideId)
   assert.deepEqual(scenario.frames[0].edges||[],[])
   assert.ok(scenario.frames.length>1)
   assert.ok(scenario.frames.at(-1).result||scenario.frames.at(-1).caption)
   for(const frame of scenario.frames){for(const id of [...frame.focus,...(frame.edges||[])])assert.ok(ids.has(id),`${spec.slideId}: ${id}`)}
   if(spec.kind==='timeline'){
    assert.ok(spec.axis.max>spec.axis.min)
    const times=scenario.frames.map(f=>f.time??spec.axis.min)
    times.forEach((v,i)=>{assert.ok(v>=spec.axis.min&&v<=spec.axis.max);if(i)assert.ok(v>=times[i-1])})
   }
   if(spec.kind==='sequence')for(const frame of scenario.frames)for(const id of frame.focus){const m=spec.messages.find(m=>m.id===id);if(m?.branch)assert.equal(m.branch,scenario.id)}
  }
 }
})
test('every scenario starts stopped, can be walked in both directions, and stops at its end',()=>{
 for(const spec of specs)for(const scenario of spec.scenarios){
  let state=chooseScenario(spec,initialSnapshot(spec),scenario.id)
  assert.equal(state.playing,false);assert.equal(state.step,0)
  for(let i=1;i<scenario.frames.length;i++){state=navigate(spec,state,1);assert.equal(state.step,i)}
  assert.equal(navigate(spec,state,1).step,scenario.frames.length-1)
  for(let i=scenario.frames.length-2;i>=0;i--){state=navigate(spec,state,-1);assert.equal(state.step,i)}
  assert.equal(navigate(spec,state,-1).step,0)
  state=togglePlayback(spec,state)
  let ticks=0
  while(state.playing&&ticks++<2000)state=advance(spec,state,100)
  assert.ok(ticks<2000,`${spec.slideId}/${scenario.id}`)
  assert.equal(state.step,scenario.frames.length-1)
  assert.equal(state.target,null)
 }
})
test('changing a branch cancels movement and cannot jump ahead of the proven common prefix',()=>{
 for(const spec of specs)for(const old of spec.scenarios)for(const next of spec.scenarios){
  const shared=commonPrefix(old,next)
  for(let step=0;step<old.frames.length;step++){
   const state={...initialSnapshot(spec),scenario:old.id,step,target:step<old.frames.length-1?step+1:null,playing:true,progress:.6,elapsed:420,phase:'move',detail:true}
   const changed=chooseScenario(spec,state,next.id)
   assert.equal(changed.step,Math.min(step,shared));assert.equal(changed.playing,false)
   assert.equal(changed.target,null);assert.equal(changed.progress,0);assert.equal(changed.elapsed,0)
   assert.equal(changed.detail,true)
   assert.equal(scenarioFor(spec,changed.scenario).frames[changed.step].caption,next.frames[changed.step].caption)
  }
 }
})
test('pause and resume retain both in-flight progress and the remaining event hold',()=>{
 const spec=specs.find(s=>s.scenarios[0].frames.length>3)
 for(const [phase,target,elapsed,progress] of [['move',1,280,.4],['hold',null,600,0],['hold',null,0,0]]){
  const active={...initialSnapshot(spec),playing:true,phase,target,elapsed,progress}
  const paused=pauseSnapshot(active)
  assert.deepEqual(advance(spec,paused,5000),paused)
  const resumed=togglePlayback(spec,paused)
  assert.equal(resumed.phase,phase);assert.equal(resumed.target,target)
  assert.equal(resumed.elapsed,elapsed);assert.equal(resumed.progress,progress)
 }
 const held={...initialSnapshot(spec),step:1,phase:'hold',elapsed:600,playing:true}
 assert.equal(advance(spec,togglePlayback(spec,pauseSnapshot(held)),499).phase,'hold')
 assert.equal(advance(spec,togglePlayback(spec,pauseSnapshot(held)),500).phase,'move')
})
test('timeline travel uses a single numeric scale with explicit event holds',()=>{
 for(const spec of specs.filter(s=>s.kind==='timeline'))for(const scenario of spec.scenarios){
  for(let i=0;i<scenario.frames.length-1;i++){
   const a=scenario.frames[i].time??spec.axis.min,b=scenario.frames[i+1].time??a
   assert.equal(transitionDuration(spec,scenario.frames,i),(b-a)*12000/(spec.axis.max-spec.axis.min))
  }
 }
})
