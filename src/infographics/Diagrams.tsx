import {useEffect,useId,useRef,useState} from 'react'
import type {CSSProperties,ReactNode} from 'react'
import type {Edge,Frame,Node,Spec} from './model'

type DiagramProps={spec:Spec;frame:Frame;committedFrame:Frame;progress:number;moving:boolean;scenario:string;readonly:boolean}
type Point={x:number;y:number}
type Box=Point&{width:number;height:number}
const number=new Intl.NumberFormat('ru-RU',{maximumSignificantDigits:5,useGrouping:false})
const clamp=(value:number,min=0,max=1)=>Math.min(max,Math.max(min,value))
const cls=(name:string,active:boolean)=>`${name}${active?' is-active':''}`
const focused=(frame:Frame,id:string)=>frame.focus.includes(id)
const edgeFocused=(frame:Frame,id:string)=>Boolean(frame.edges?.includes(id)||frame.focus.includes(id))
const ink='var(--lv-ink)',muted='var(--lv-muted)',line='var(--lv-line)',red='var(--lv-red)'
const textStyle:CSSProperties={fontFamily:'inherit',fontSize:12,fill:ink}

function useWidth(){
 const ref=useRef<HTMLDivElement>(null),[width,setWidth]=useState(0)
 useEffect(()=>{
  const node=ref.current
  if(!node)return
  const measure=()=>setWidth(Math.max(0,Math.floor(node.getBoundingClientRect().width)))
  measure()
  if(typeof ResizeObserver==='undefined')return
  const observer=new ResizeObserver(measure);observer.observe(node)
  return()=>observer.disconnect()
 },[])
 return {ref,width}
}

function textLines(text:string,width:number){
 const columns=Math.max(1,Math.floor(width/6.8))
 let lines=1,used=0
 for(const word of text.split(/\s+/)){
  const length=Array.from(word).length
  if(used&&used+1+length>columns){lines++;used=0}
  lines+=Math.max(0,Math.ceil(length/columns)-1)
  used=length>columns?length%columns:length+(used?used+1:0)
 }
 return lines
}

function LabelBox({box,title,text,center=true,backdrop=false}:{box:Box;title:string;text?:string;center?:boolean;backdrop?:boolean}){
 return <foreignObject x={box.x} y={box.y} width={box.width} height={box.height}>
  <div className="lv-svg-label" style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:center?'center':'flex-start',textAlign:center?'center':'left',overflowWrap:'anywhere',fontSize:12,lineHeight:'16px',color:ink,background:backdrop?'var(--lv-surface)':undefined}}>
   <span style={{fontWeight:600}}>{title}</span>{text&&<span style={{marginTop:3}}>{text}</span>}
  </div>
 </foreignObject>
}

function Markers({prefix}:{prefix:string}){
 return <defs>{[false,true].flatMap(active=>['call','return'].map(kind=>{
  const color=active?red:muted
  return <marker key={`${kind}-${active}`} id={`${prefix}-${kind}-${active?'active':'idle'}`} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
   {kind==='return'?<path d="M 0 0 L 8 4 L 0 8" fill="none" stroke={color} strokeWidth="1.5"/>:<path d="M 0 0 L 8 4 L 0 8 Z" fill={color}/>}
  </marker>
 }))}</defs>
}

function Path({id,d,active,prefix,kind='call'}:{id:string;d:string;active:boolean;prefix:string;kind?:'call'|'return'}){
 return <path className={cls('lv-edge',active)} data-edge={id} data-focus={id} d={d} fill="none" stroke={active?red:muted} strokeWidth={active?2:1.5} strokeDasharray={kind==='return'?'5 4':undefined} markerEnd={`url(#${prefix}-${kind}-${active?'active':'idle'})`}/>
}

function Card({id,title,text,active,kind}:{id:string;title:string;text?:string;active:boolean;kind?:string}){
 return <div className={cls('lv-node',active)} data-focus={id} data-node-id={id} aria-current={active?'step':undefined}>
  {kind==='decision'&&<span className="lv-node-kind">Условие</span>}<strong>{title}</strong>{text&&<p>{text}</p>}
 </div>
}

function Connections({nodes,edges,frame}:{nodes:{id:string;title:string}[];edges:Edge[];frame:Frame}){
 const titles=new Map(nodes.map(node=>[node.id,node.title]))
 return <ul className="lv-connections">{edges.map(edge=><li key={edge.id} className={cls('lv-edge',edgeFocused(frame,edge.id))} data-edge={edge.id} data-focus={edge.id} aria-current={edgeFocused(frame,edge.id)?'step':undefined}>
  <span>{titles.get(edge.from)||edge.from} → {titles.get(edge.to)||edge.to}</span>{edge.label&&<span> — {edge.label}</span>}
 </li>)}</ul>
}

function Flow({spec,frame,committedFrame,progress,moving,width,prefix}:DiagramProps&{width:number;prefix:string}){
 const nodes=spec.nodes||[],edges=spec.edges||[]
 if(!nodes.length)return null
 const byId=new Map(nodes.map(node=>[node.id,node])),minColumn=Math.min(...nodes.map(node=>node.column)),minRow=Math.min(...nodes.map(node=>node.row))
 const columns=Math.max(...nodes.map(node=>node.column))-minColumn+1,rows=Math.max(...nodes.map(node=>node.row))-minRow+1
 const external=edges.filter(edge=>{
  const a=byId.get(edge.from),b=byId.get(edge.to)
  return a&&b&&(b.row<a.row||b.row-a.row>1)
 })
 const gapX=width>=840?76:44,gapY=80,pad=20,rightPad=external.length?24+112*external.length:pad
 const nodeWidth=(width-pad-rightPad-gapX*(columns-1))/columns,topPad=pad+external.length*16
 const nodeHeight=Math.max(62,...nodes.map(node=>{
  const inside=node.kind==='decision'?nodeWidth*.58:nodeWidth-18
  const lines=textLines(node.title,inside)+(node.text?textLines(node.text,inside):0)
  return node.kind==='decision'?Math.max(72,lines*23+24):lines*16+22
 }))
 const lastRowShelf=edges.some(edge=>{const a=byId.get(edge.from),b=byId.get(edge.to);return a&&b&&a.row===b.row&&Math.abs(a.column-b.column)>1&&a.row===minRow+rows-1})
 const height=topPad+rows*nodeHeight+(rows-1)*gapY+(lastRowShelf?68:36)
 const fits=width>0&&nodeWidth>=138&&height<=(width>=600?800:340)&&edges.every(edge=>byId.has(edge.from)&&byId.has(edge.to))
 const structural=()=> <div className="lv-structural lv-flow-structure"><div className="lv-node-list lv-grid" style={{gridTemplateColumns:width>=560?'repeat(2,minmax(0,1fr))':'minmax(0,1fr)'}}>{nodes.map(node=><Card key={node.id} {...node} active={focused(frame,node.id)}/>)}</div><Connections nodes={nodes} edges={edges} frame={frame}/></div>
 if(!fits)return structural()
 const boxes=new Map(nodes.map(node=>[node.id,{x:pad+(node.column-minColumn)*(nodeWidth+gapX),y:topPad+(node.row-minRow)*(nodeHeight+gapY),width:nodeWidth,height:nodeHeight}]))
 const sourceRails=new Map<number,number>(),targetRails=new Map<number,number>(),rowShelves=new Map<number,number>()
 type Route={edge:Edge;points:Point[];labelBox?:Box}
 const routes:Route[]=edges.map(edge=>{
  const a=boxes.get(edge.from)!,b=boxes.get(edge.to)!,from=byId.get(edge.from)!,to=byId.get(edge.to)!
  const ac={x:a.x+a.width/2,y:a.y+a.height/2},bc={x:b.x+b.width/2,y:b.y+b.height/2}
  let points:Point[]
  if(external.includes(edge)){
   const index=external.indexOf(edge),channel=width-rightPad+100+index*112
   const targetIndex=targetRails.get(to.row)||0;targetRails.set(to.row,targetIndex+1)
   const above=b.y-14-targetIndex*16
   if(from.column===minColumn+columns-1){
    points=[{x:a.x+a.width,y:ac.y},{x:channel,y:ac.y},{x:channel,y:above},{x:bc.x,y:above},{x:bc.x,y:b.y}]
   }else{
    const sourceIndex=sourceRails.get(from.row)||0;sourceRails.set(from.row,sourceIndex+1)
    const below=a.y+a.height+18+sourceIndex*16
    points=[{x:ac.x,y:a.y+a.height},{x:ac.x,y:below},{x:channel,y:below},{x:channel,y:above},{x:bc.x,y:above},{x:bc.x,y:b.y}]
   }
  }else if(from.row===to.row&&Math.abs(from.column-to.column)>1){
   const index=rowShelves.get(from.row)||0;rowShelves.set(from.row,index+1)
   const shelf=a.y+a.height+30+index*20
   points=[{x:ac.x,y:a.y+a.height},{x:ac.x,y:shelf},{x:bc.x,y:shelf},{x:bc.x,y:b.y+b.height}]
  }else if(b.y>a.y){
   const sy=a.y+a.height,ey=b.y,middle=(sy+ey)/2
   points=[{x:ac.x,y:sy},{x:ac.x,y:middle},{x:bc.x,y:middle},{x:bc.x,y:ey}]
  }else{
   const right=bc.x>ac.x
   points=[{x:right?a.x+a.width:a.x,y:ac.y},{x:right?b.x:b.x+b.width,y:bc.y}]
  }
  return {edge,points:points.filter((point,i,list)=>!i||point.x!==list[i-1].x||point.y!==list[i-1].y)}
 })
 const intersects=(a:Box,b:Box,padding=0)=>a.x<b.x+b.width+padding&&a.x+a.width>b.x-padding&&a.y<b.y+b.height+padding&&a.y+a.height>b.y-padding
 const segmentHits=(a:Point,b:Point,box:Box,padding=3)=>a.x===b.x?a.x>box.x-padding&&a.x<box.x+box.width+padding&&Math.max(a.y,b.y)>box.y-padding&&Math.min(a.y,b.y)<box.y+box.height+padding:a.y>box.y-padding&&a.y<box.y+box.height+padding&&Math.max(a.x,b.x)>box.x-padding&&Math.min(a.x,b.x)<box.x+box.width+padding
 const routeDistance=(point:Point,points:Point[])=>Math.min(...points.slice(1).map((b,i)=>{
  const a=points[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy
  const t=length?clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/length):0
  return Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy)
 }))
 const overlapsSegment=(a:Point,b:Point,c:Point,d:Point)=>a.x===b.x&&c.x===d.x&&a.x===c.x
  ?Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))>Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y))
  :a.y===b.y&&c.y===d.y&&a.y===c.y&&Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))>Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x))
 const labels:Box[]=[]
 let labelsFit=true
 // Place every label against the complete route set, so later edges cannot erase earlier guards.
 for(const route of [...routes].sort((a,b)=>(b.edge.label?.length||0)-(a.edge.label?.length||0))){
  const label=route.edge.label
  if(!label)continue
  const candidates:Box[]=[]
  for(let i=1;i<route.points.length;i++){
   const a=route.points[i-1],b=route.points[i],length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y)
   if(length<24)continue
   // A guard belongs to its own branch, beyond shared stems and merges.
   if(routes.some(other=>other!==route&&other.points.slice(1).some((d,j)=>overlapsSegment(a,b,other.points[j],d))))continue
   if(a.y===b.y){
    const labelWidth=Math.min(112,Math.max(28,length-12)),labelHeight=textLines(label,labelWidth)*16+6
    for(const t of [.5,.3,.7]){const x=a.x+(b.x-a.x)*t-labelWidth/2;candidates.push({x,y:a.y-labelHeight-7,width:labelWidth,height:labelHeight},{x,y:a.y+7,width:labelWidth,height:labelHeight})}
   }else{
    const labelWidth=88,labelHeight=textLines(label,labelWidth)*16+6
    for(const t of [.5,.28,.72]){const y=a.y+(b.y-a.y)*t-labelHeight/2;candidates.push({x:a.x-labelWidth-8,y,width:labelWidth,height:labelHeight},{x:a.x+8,y,width:labelWidth,height:labelHeight})}
   }
  }
  const owned=(box:Box)=>{
   const center={x:box.x+box.width/2,y:box.y+box.height/2},distance=routeDistance(center,route.points)
   return routes.every(other=>other===route||routeDistance(center,other.points)>distance+.5)
  }
  const available=candidates.filter(box=>owned(box)&&box.x>=4&&box.y>=3&&box.x+box.width<=width-4&&box.y+box.height<=height-3&&![...boxes.values()].some(node=>intersects(box,node,3))&&!labels.some(other=>intersects(box,other,6)))
  const scored=available.map((box,index)=>({box,index,hits:routes.reduce((sum,other)=>sum+other.points.slice(1).filter((point,i)=>segmentHits(other.points[i],point,box)).length,0)})).sort((a,b)=>a.hits-b.hits||a.index-b.index)
  const chosen=scored[0]?.hits===0?scored[0].box:undefined
  if(chosen){route.labelBox=chosen;labels.push(chosen)}
  else labelsFit=false
 }
 if(!labelsFit)return structural()
 const shape=(node:Node)=>{
  const box=boxes.get(node.id)!,active=focused(frame,node.id),cx=box.x+box.width/2,cy=box.y+box.height/2
  const props={fill:active?'var(--lv-accent)':'var(--lv-surface)',stroke:active?red:line,strokeWidth:active?2:1.5}
  return <g key={node.id} className={cls('lv-node',active)} data-focus={node.id} data-node-id={node.id} aria-current={active?'step':undefined}>
   <title>{`${node.id}: ${node.title}${node.text?`. ${node.text}`:''}`}</title>
   {node.kind==='decision'?<polygon points={`${cx},${box.y} ${box.x+box.width},${cy} ${cx},${box.y+box.height} ${box.x},${cy}`} {...props}/>:<rect {...box} rx={node.kind==='start'||node.kind==='end'?nodeHeight/2:node.kind==='state'?8:0} {...props}/>}
   <LabelBox box={node.kind==='decision'?{x:cx-box.width*.29,y:cy-box.height*.29,width:box.width*.58,height:box.height*.58}:{x:box.x+9,y:box.y+7,width:box.width-18,height:box.height-14}} title={node.title} text={node.text}/>
  </g>
 }
 const newlyActive=edges.filter(candidate=>edgeFocused(frame,candidate.id)&&!edgeFocused(committedFrame,candidate.id))
 return <svg role="img" aria-label={spec.title} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block'}}>
  <title>{spec.title}</title><Markers prefix={prefix}/>
  {routes.map(({edge,points})=>{
   const d=points.map((point,i)=>`${i?'L':'M'} ${point.x} ${point.y}`).join(' '),active=edgeFocused(frame,edge.id)
   return <g key={edge.id}><path d={d} fill="none" stroke="var(--lv-surface)" strokeWidth="7"/><Path id={edge.id} d={d} active={active} prefix={prefix}/></g>
  })}
  {routes.filter(route=>route.edge.label&&route.labelBox).map(({edge,labelBox})=><g key={edge.id} data-label-edge={edge.id}><LabelBox box={labelBox!} title={edge.label!} backdrop/></g>)}
  {nodes.map(shape)}
  {routes.filter(({edge})=>edgeFocused(frame,edge.id)&&moving&&(!newlyActive.length||newlyActive.some(candidate=>candidate.id===edge.id))).map(({edge,points})=>{const marker=along(points,progress);return <circle key={edge.id} className="lv-flow-marker" cx={marker.x} cy={marker.y} r="4" fill={red}/>})}
 </svg>
}

function NumericTimeline({spec,frame,committedFrame,progress,moving,scenario,width}:DiagramProps&{width:number}){
 const segments=(spec.segments||[]).filter(item=>!item.scenario||item.scenario===scenario),events=(spec.events||[]).filter(item=>!item.scenario||item.scenario===scenario)
 const axis=spec.axis,valid=Boolean(axis&&Number.isFinite(axis.min)&&Number.isFinite(axis.max)&&axis.max>axis.min)
 const from=committedFrame.time??axis?.min??0,to=frame.time??from
 const time=moving?from+(to-from)*clamp(progress):to
 const lanes=[...new Set(segments.map(item=>item.lane??0))].sort((a,b)=>a-b)
 const height=78+Math.max(1,lanes.length)*36
 const inRange=axis&&segments.every(item=>Number.isFinite(item.start)&&Number.isFinite(item.end)&&item.start>=axis.min&&item.end<=axis.max&&item.end>=item.start)&&events.every(item=>Number.isFinite(item.at)&&item.at>=axis.min&&item.at<=axis.max)
 const chart=valid&&axis&&inRange&&width>=380&&height<=248
 const unit=axis?.unit||''
 return <div className="lv-timeline">
  {chart&&(()=>{
   const left=22,right=width-18,x=(value:number)=>left+(value-axis.min)/(axis.max-axis.min)*(right-left)
   const current=x(clamp(time,axis.min,axis.max)),ticks=width<520?3:5,tickValues=Array.from({length:ticks},(_,i)=>axis.min+(axis.max-axis.min)*i/(ticks-1))
   return <svg role="img" aria-label={`${spec.title}. Ось времени: ${axis.min}–${axis.max} ${unit}`} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block'}}>
    <title>{spec.title}</title><line x1={left} x2={right} y1="36" y2="36" stroke={line} strokeWidth="1.5"/>
    {tickValues.map((value,i)=><g key={i}><line x1={x(value)} x2={x(value)} y1="36" y2="41" stroke={muted}/><text x={x(value)} y="56" textAnchor={i===0?'start':i===ticks-1?'end':'middle'} style={textStyle}>{number.format(value)}</text></g>)}
    {segments.map((item,i)=>{
     const y=72+lanes.indexOf(item.lane??0)*36,active=focused(frame,item.id),barWidth=x(item.end)-x(item.start)
     return <g key={item.id} data-focus={item.id} className={cls('lv-bar',active)}><title>{`${item.id}: ${item.label}; ${item.start}–${item.end} ${unit}`}</title><rect x={x(item.start)} y={y-13} width={Math.max(0,barWidth)} height="22" fill={active?red:'var(--lv-soft)'}/>{barWidth>=21&&<text x={x(item.start)+barWidth/2} y={y+2} textAnchor="middle" style={{...textStyle,fill:active?'var(--lv-surface)':ink}}>{i+1}</text>}</g>
    })}
    {events.map(item=><g key={item.id} data-focus={item.id} className={cls('lv-event',focused(frame,item.id))}><title>{`${item.id}: ${item.label}; ${item.at} ${unit}`}</title><circle cx={x(item.at)} cy="36" r={focused(frame,item.id)?4.5:3} fill={focused(frame,item.id)?red:muted}/></g>)}
    <line className="lv-time-cursor" x1={current} x2={current} y1="20" y2={height-24} stroke={red} strokeWidth="1.5"/>
    <text x={current>width-110?current-4:current+4} y="15" textAnchor={current>width-110?'end':'start'} style={{...textStyle,fontWeight:600}}>{number.format(time)} {unit}</text>
    <text x={right} y={height-5} textAnchor="end" style={textStyle}>Время{unit?`, ${unit}`:''}</text>
   </svg>
  })()}
  {!chart&&axis&&<p className="lv-time-summary">Время: {number.format(time)} {unit}; шкала {axis.min}–{axis.max} {unit}</p>}
  <ul className="lv-time-values">{segments.map((item,i)=><li key={item.id} data-focus={item.id} className={cls('lv-node',focused(frame,item.id))}><span>{i+1}. {item.label}</span><span>{number.format(item.start)}–{number.format(item.end)} {unit}</span></li>)}{events.map(item=><li key={item.id} data-focus={item.id} className={cls('lv-node',focused(frame,item.id))}><span>{item.label}</span><span>{number.format(item.at)} {unit}</span></li>)}</ul>
 </div>
}

function along(points:Point[],progress:number):Point{
 const lengths=points.slice(1).map((point,i)=>Math.hypot(point.x-points[i].x,point.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0)
 let distance=clamp(progress)*total
 for(let i=0;i<lengths.length;i++){
  if(distance<=lengths[i]){const t=lengths[i]?distance/lengths[i]:0;return {x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t}}
  distance-=lengths[i]
 }
 return points[points.length-1]
}

function Sequence({spec,frame,width,prefix,progress,moving,scenario}:DiagramProps&{width:number;prefix:string}){
 const participants=spec.participants||[],messages=spec.messages||[],titles=new Map(participants.map(item=>[item.id,item.title]))
 const groups:{id:string;messages:typeof messages}[]=[]
 for(const message of messages){
  const id=message.branch||'',last=groups[groups.length-1]
  if(last?.id===id)last.messages.push(message)
  else groups.push({id,messages:[message]})
 }
 const guard=(id:string)=>spec.scenarios.find(item=>item.id===id)?.condition||id
 const cell=(width-28)/Math.max(1,participants.length),positions=new Map(participants.map((item,i)=>[item.id,14+cell*(i+.5)]))
 let nextY=64
 const placements=groups.map(group=>{
  const start=nextY
  const guardHeight=group.id?Math.max(27,textLines(`[${guard(group.id)}]`,width-54)*16+10):0
  nextY+=guardHeight
  const rows=group.messages.map(message=>{
   const dx=Math.abs((positions.get(message.to)??0)-(positions.get(message.from)??0)),labelWidth=Math.max(50,dx-18)
   const rowHeight=Math.max(32,textLines(message.label,labelWidth)*16+15),y=nextY+rowHeight-3
   nextY+=rowHeight
   return {message,y,rowHeight,labelWidth}
  })
  return {...group,start,end:nextY,rows,guardHeight}
 })
 const height=nextY+15,fits=width>=470&&participants.length>=2&&participants.length<=3&&height<=900&&participants.every(item=>textLines(item.title,cell*.8)<=2)&&messages.every(message=>positions.has(message.from)&&positions.has(message.to))
 if(!fits)return <div className="lv-sequence-structure">
  <ul className="lv-participants">{participants.map(item=><li key={item.id} className={cls('lv-node',focused(frame,item.id))} data-focus={item.id}>{item.title}</li>)}</ul>
  {groups.filter(group=>group.messages.length).map((group,i)=><section key={`${group.id||'common'}-${i}`} className="lv-message-group" data-branch={group.id||undefined}>
   {group.id&&<h4>alt [{guard(group.id)}]</h4>}<ol>{group.messages.map(message=><li key={message.id} data-focus={message.id} data-message-id={message.id} className={cls('lv-edge',edgeFocused(frame,message.id))} aria-current={edgeFocused(frame,message.id)?'step':undefined}>
    <span>{titles.get(message.from)||message.from} → {titles.get(message.to)||message.to}</span><strong>{message.label}</strong><span className="lv-message-kind">{message.kind==='return'?'Ответ':'Вызов'}</span>
   </li>)}</ol>
  </section>)}
 </div>
 const altRanges:{start:number;end:number}[]=[]
 placements.forEach((group,i)=>{
  if(!group.id)return
  if(placements[i-1]?.id)altRanges[altRanges.length-1].end=group.end
  else altRanges.push({start:group.start,end:group.end})
 })
 return <svg role="img" aria-label={`${spec.title}; вертикальный порядок сообщений не является шкалой времени`} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block'}}>
  <title>{spec.title}</title><Markers prefix={prefix}/>
  {participants.map(item=>{const x=positions.get(item.id)!,active=focused(frame,item.id);return <g key={item.id} className={cls('lv-node',active)} data-focus={item.id}>
   <rect x={x-cell*.43} y="8" width={cell*.86} height="35" fill={active?'var(--lv-accent)':'var(--lv-surface)'} stroke={active?red:line} strokeWidth="1.5"/>
   <LabelBox box={{x:x-cell*.4,y:9,width:cell*.8,height:33}} title={item.title}/><line x1={x} x2={x} y1="43" y2={height-5} stroke={muted} strokeWidth="1" strokeDasharray="4 4"/>
  </g>})}
  {altRanges.map((range,i)=><g key={i}><rect x="4" y={range.start} width={width-8} height={range.end-range.start} fill="none" stroke={line} strokeWidth="1.5"/><path d={`M 4 ${range.start+21} H 31 L 40 ${range.start+12} V ${range.start}`} fill="none" stroke={line}/><text x="9" y={range.start+15} style={textStyle}>alt</text></g>)}
  {placements.map((group,groupIndex)=><g key={`${group.id||'common'}-${groupIndex}`} data-branch={group.id||undefined}>
   {group.id&&<>{placements[groupIndex-1]?.id&&<line x1="4" x2={width-4} y1={group.start} y2={group.start} stroke={line} strokeDasharray="5 4"/>}<LabelBox box={{x:44,y:group.start+1,width:width-54,height:group.guardHeight-3}} title={`[${guard(group.id)}]`} center={false} backdrop/></>}
   {group.rows.map(({message,y,rowHeight,labelWidth})=>{
    const from=positions.get(message.from)!,to=positions.get(message.to)!,active=edgeFocused(frame,message.id)
    const points=from===to?[{x:from,y:y-13},{x:from+35,y:y-13},{x:from+35,y},{x:to,y}]:[{x:from,y},{x:to,y}]
    const d=points.map((point,i)=>`${i?'L':'M'} ${point.x} ${point.y}`).join(' '),marker=along(points,progress)
    const labelX=from===to?from+5:Math.min(from,to)+9
    return <g key={message.id} data-message-id={message.id}>
     <LabelBox box={{x:labelX,y:y-rowHeight+1,width:labelWidth,height:rowHeight-9}} title={message.label} backdrop/>
     <Path id={message.id} d={d} active={active} prefix={prefix} kind={message.kind}/>
     {active&&moving&&(!message.branch||message.branch===scenario)&&<circle className="lv-message-marker" cx={marker.x} cy={marker.y} r="4" fill={red}/>}
    </g>
   })}
  </g>)}
 </svg>
}

function SourceTable({columns,rows,frame}:{columns:string[];rows:string[][];frame:Frame}){
 const count=Math.max(columns.length,...rows.map(row=>row.length),0),headers=Array.from({length:count},(_,i)=>columns[i]||`Поле ${i+1}`)
 return <div className="lv-table-wrap"><table className="lv-table"><thead><tr>{headers.map((column,i)=><th scope="col" key={i}>{column}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i} className={cls('lv-node',focused(frame,`row${i}`))} data-focus={`row${i}`} aria-current={focused(frame,`row${i}`)?'step':undefined}>{Array.from({length:count},(_,j)=>j===0?<th scope="row" key={j}>{row[j]??''}</th>:<td key={j}>{row[j]??''}</td>)}</tr>)}</tbody></table></div>
}

function SourceNetwork({visual,frame,width,prefix}:{visual:Extract<NonNullable<Spec['visual']>,{type:'network'}>;frame:Frame;width:number;prefix:string}){
 const nodes=visual.nodes,edges=visual.edges.map((edge,i)=>({...edge,id:`edge${i}`}))
 const fits=nodes.length>=2&&nodes.length<=3&&width>=(nodes.length===2?470:620)
 if(!fits)return <div className="lv-network-structure"><div className="lv-node-list lv-grid" style={{gridTemplateColumns:width>=560?'repeat(2,minmax(0,1fr))':'minmax(0,1fr)'}}>{nodes.map(node=><Card key={node.id} {...node} active={focused(frame,node.id)}/>)}</div><Connections nodes={nodes} edges={edges} frame={frame}/></div>
 const gap=nodes.length===2?Math.min(180,width*.3):Math.min(110,Math.max(80,(width-24-414)/2)),nodeWidth=(width-24-gap*(nodes.length-1))/nodes.length
 const nodeHeight=Math.max(104,...nodes.map(node=>(textLines(node.title,nodeWidth-20)+textLines(node.text,nodeWidth-20))*16+26))
 if(nodeHeight>172)return <div className="lv-network-structure"><div className="lv-node-list">{nodes.map(node=><Card key={node.id} {...node} active={focused(frame,node.id)}/>)}</div><Connections nodes={nodes} edges={edges} frame={frame}/></div>
 const height=280,top=(height-nodeHeight)/2,cy=height/2,boxes=new Map(nodes.map((node,i)=>[node.id,{x:12+i*(nodeWidth+gap),y:top,width:nodeWidth,height:nodeHeight}]))
 return <svg role="img" aria-label={visual.caption} viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block'}}><title>{visual.caption}</title><Markers prefix={prefix}/>
  {edges.map(edge=>{
   const a=boxes.get(edge.from),b=boxes.get(edge.to)
   if(!a||!b)return null
   const right=b.x>a.x,sx=right?a.x+a.width:a.x,ex=right?b.x:b.x+b.width,reverse=edges.some(other=>other.from===edge.to&&other.to===edge.from)
   const y=cy+(reverse?(right?-22:22):0),labelBox={x:Math.min(sx,ex)+4,y:right?y-57:y+5,width:Math.abs(ex-sx)-8,height:52}
   return <g key={edge.id}><Path id={edge.id} d={`M ${sx} ${y} H ${ex}`} active={edgeFocused(frame,edge.id)} prefix={prefix}/><LabelBox box={labelBox} title={edge.label}/><title>{`${edge.id}: ${edge.label}`}</title></g>
  })}
  {nodes.map(node=>{const box=boxes.get(node.id)!,active=focused(frame,node.id);return <g key={node.id} className={cls('lv-node',active)} data-focus={node.id}><title>{`${node.id}: ${node.title}`}</title><rect {...box} fill={active?'var(--lv-accent)':'var(--lv-surface)'} stroke={active?red:line} strokeWidth={active?2:1.5}/><LabelBox box={{x:box.x+10,y:box.y+7,width:box.width-20,height:box.height-14}} title={node.title} text={node.text}/></g>})}
 </svg>
}

function Source({spec,frame,width,prefix}:{spec:Spec;frame:Frame;width:number;prefix:string}){
 const v=spec.visual
 if(!v)return null
 if(v.type==='comparison'||v.type==='matrix')return <SourceTable columns={v.columns} rows={v.rows} frame={frame}/>
 if(v.type==='tree')return <div className="lv-tree"><Card id="root" title={v.root} active={focused(frame,'root')}/><ul>{v.branches.map((branch,i)=><li key={i} className={cls('lv-node',focused(frame,`branch${i}`))} data-focus={`branch${i}`}><strong>{branch.title}</strong><ul>{branch.items.map((item,j)=><li key={j}>{item}</li>)}</ul></li>)}</ul></div>
 if(v.type==='process'||v.type==='timeline'||v.type==='cycle')return <div className="lv-ordered-container">
  {v.type==='timeline'&&<p className="lv-order-note">Порядок событий; ширина блоков не обозначает длительность.</p>}
  <ol className={`lv-ordered lv-ordered-${v.type}`} style={{gridTemplateColumns:width>=560?'repeat(3,minmax(0,1fr))':'minmax(0,1fr)'}}>{v.items.map((item,i)=><li key={i} className={cls('lv-node',focused(frame,`node${i}`))} data-focus={`node${i}`}><span className="lv-step-number">{i+1}</span><strong>{item.title}</strong><p>{item.text}</p></li>)}</ol>
  {v.type==='cycle'&&<p className="lv-cycle-return">↩ Возврат к этапу 1</p>}
 </div>
 if(v.type==='bars'){
  const values=v.items.map(item=>item.value),min=Math.min(0,...values),max=Math.max(0,v.max,...values),range=max-min||1,position=(value:number)=>(value-min)/range*100
  return <div className="lv-bars"><p className="lv-bar-scale">Общая шкала: {number.format(min)}–{number.format(max)} {v.unit}{v.threshold!==undefined?`; порог ${number.format(v.threshold)} ${v.unit}`:''}</p>
   {v.items.map((item,i)=>{const active=focused(frame,`bar${i}`),start=Math.min(position(0),position(item.value)),span=Math.abs(position(item.value)-position(0));return <div className={cls('lv-bar-row',active)} data-focus={`bar${i}`} key={i}><span>{item.label}</span><div className="lv-bar-track" style={{position:'relative',height:18,background:'var(--lv-soft)'}}><div className={cls('lv-bar',active)} style={{position:'absolute',left:`${start}%`,width:`${span}%`,height:'100%',background:active?red:muted,transition:'none'}}/>{v.threshold!==undefined&&v.threshold>=min&&v.threshold<=max&&<span className="lv-bar-threshold" style={{position:'absolute',left:`${position(v.threshold)}%`,height:'100%',borderLeft:`1.5px dashed ${ink}`}}/>}</div><strong>{number.format(item.value)} {v.unit}</strong></div>})}
  </div>
 }
 if(v.type==='network')return <SourceNetwork visual={v} frame={frame} width={width} prefix={prefix}/>
 let content:ReactNode=null
 if(v.type==='decision')content=<><Card id="start" title={v.start} active={false}/><Card id="condition" title={v.question} active={false} kind="decision"/><dl><dt>Да</dt><dd>{v.yes}</dd><dt>Нет</dt><dd>{v.no}</dd></dl></>
 else if(v.type==='beforeAfter'){
  const fields=[...new Set([...v.before.fields,...v.after.fields].map(item=>item.label))]
  content=<><SourceTable columns={['Поле',v.before.title,v.after.title]} rows={fields.map(field=>[field,v.before.fields.find(item=>item.label===field)?.value??'—',v.after.fields.find(item=>item.label===field)?.value??'—'])} frame={frame}/><ul>{v.changes.map((change,i)=><li key={i}>{change}</li>)}</ul></>
 }else if(v.type==='conceptMap')content=<><Card id="root" title={v.center} active={focused(frame,'root')}/><ul>{v.items.map((item,i)=><li key={i}><strong>{item.title}</strong><span> — {item.relation}</span><p>{item.example}</p></li>)}</ul></>
 else if(v.type==='states')content=<><ol>{v.states.map((state,i)=><li key={i}>{state}</li>)}</ol><p>Отмена допускается из: {v.cancelFrom.map(index=>v.states[index]||String(index)).join('; ')||'не задано'}.</p></>
 else if(v.type==='cause')content=<dl><dt>Причина</dt><dd>{v.cause}</dd><dt>Последствие</dt><dd>{v.effect}</dd><dt>Мера</dt><dd>{v.solution}</dd></dl>
 else if(v.type==='callouts')content=<><p>{v.alt}</p><ol>{v.items.map((item,i)=><li key={i}><strong>{item.title}</strong><p>{item.text}</p><span>Область: {item.x}, {item.y}</span></li>)}</ol></>
 else if(v.type==='codeParts')content=<ol>{v.parts.map((part,i)=><li key={i}><pre className="lv-code"><code>{part.code}</code></pre><strong>{part.label}</strong><p>{part.explanation}</p></li>)}</ol>
 return <div className={cls('lv-source-detail',focused(frame,'all'))} data-focus="all">{content}</div>
}

export function Diagram(props:DiagramProps){
 const {ref,width}=useWidth(),prefix=`lv-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`
 const {spec,frame}=props
 return <div ref={ref} className={`lv-diagram lv-diagram-${spec.kind}`} data-readonly={props.readonly||undefined}>
  {spec.kind==='flow'?<Flow {...props} width={width} prefix={prefix}/>:spec.kind==='timeline'?<NumericTimeline {...props} width={width}/>:spec.kind==='sequence'?<Sequence {...props} width={width} prefix={prefix}/>:<Source spec={spec} frame={frame} width={width} prefix={prefix}/>}
 </div>
}
