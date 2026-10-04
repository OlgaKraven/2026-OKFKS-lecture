import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateReliability, segments, referenceCycles, meetsRequirement, readLabState, freshState, mistakes } from '../src/lab/reliability.ts'

test('completed cycles reproduce lecture numbers and account for calendar time',()=>{
  const m=calculateReliability(referenceCycles)
  assert.deepEqual([m.work,m.repair,m.count,m.calendar,m.mtbf,m.mttr],[120,6,3,126,40,2])
  assert.equal(m.availability,120/126)
  assert.ok(Math.abs(m.availability-m.mtbf/(m.mtbf+m.mttr))<1e-14)
  assert.deepEqual(segments(referenceCycles).map(s=>[s.start,s.end]),[[0,20],[20,21],[21,71],[71,73],[73,123],[123,126]])
})
test('changing repair time changes availability but preserves mean work; compare before rounding',()=>{
  const faster=calculateReliability(referenceCycles.map(c=>({...c,repair:c.repair/2})))
  const slower=calculateReliability(referenceCycles.map(c=>({...c,repair:c.repair*4})))
  assert.equal(faster.mtbf,40);assert.equal(faster.mttr,1)
  assert.equal(slower.mtbf,40);assert.equal(slower.mttr,8)
  assert.ok(faster.availability>120/126 && slower.availability<120/126)
  assert.equal(meetsRequirement(0.9496,95),false)
  assert.equal(meetsRequirement(0.95,95),true)
  assert.equal(calculateReliability([{work:20,repair:0}]).availability,1)
  for(const cycles of [[],[{work:0,repair:2}],[{work:20,repair:-1}],[{work:Infinity,repair:2}]])assert.throws(()=>calculateReliability(cycles))
})
test('optional workshop storage validates all fields and safely falls back on corruption',()=>{
  const valid={repairs:[0.5,1,1.5],threshold:99.9,solved:[true,false,false],attempts:[1,2,0]}
  assert.deepEqual(readLabState(JSON.stringify(valid)),valid)
  for(const raw of ['broken','null',JSON.stringify({...valid,repairs:[0,1,2]}),JSON.stringify({...valid,solved:[true]}),JSON.stringify({...valid,attempts:[-1,0,0]})])assert.deepEqual(readLabState(raw),freshState())
  assert.deepEqual(mistakes.map(c=>c.correct),[0,1,2])
})
