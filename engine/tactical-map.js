/* Original tactical schematics, NOT surveyed Overwatch geometry. Units are model metres.
 * A shared navigability/height/LOS model is used by combat and by the observer. */
(()=>{'use strict';
 const W=120,H=72,C=2,cache=new Map(),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const rect=(x,y,w,h,label,height=8)=>({x,y,w,h,label,height});
 function build(name,mode){
  const escort=['Hybrid','Escort'].includes(mode),wide=['Push','Flashpoint'].includes(mode);
  const walls=escort?[rect(29,23,14,8,'Hotel'),rect(29,43,14,8,'Arcade'),rect(64,20,12,10,'Foundry'),rect(64,43,12,10,'Workshop'),rect(90,26,8,6,'Depot')]:
   [rect(32,25,13,8,'West cover'),rect(32,42,13,8,'West arcade'),rect(75,25,13,8,'East cover'),rect(75,42,13,8,'East arcade'),rect(55,8,10,8,'North block'),rect(55,57,10,8,'South block')];
  const platforms=[{x:28,y:12,w:20,h:10,z:4,label:'West balcony',ramp:{x:28,y:12,w:8,h:10}},{x:72,y:52,w:20,h:10,z:4,label:'East balcony',ramp:{x:84,y:52,w:8,h:10}}];
  const route=escort?[{x:19,y:36},{x:48,y:36},{x:58,y:36},{x:83,y:36},{x:102,y:36}]:[{x:18,y:36},{x:60,y:36},{x:102,y:36}];
  return {name,mode,width:W,height:H,cell:C,schematic:true,geometryVersion:1,walls,platforms,route,
   labels:[{x:8,y:36,text:'A SPAWN'},{x:112,y:36,text:'B SPAWN'},{x:58,y:23,text:escort?'STREETS / CHOKE':'CENTER POINT'},{x:58,y:54,text:'FLANK LANE'}],
   reference:'https://overwatch.blizzard.com/en-gb/news/23785339/uniting-gameplay-and-style-behind-overwatch-2-s-complex-map-design/'};
 }
 function geometry(s){const key=s.map+'|'+s.mode;if(!cache.has(key))cache.set(key,build(s.map,s.mode));return cache.get(key)}
 const inside=(p,r,pad=0)=>p.x>=r.x-pad&&p.x<=r.x+r.w+pad&&p.y>=r.y-pad&&p.y<=r.y+r.h+pad;
 function walkable(g,p){return p.x>=2&&p.x<=W-2&&p.y>=2&&p.y<=H-2&&!g.walls.some(r=>inside(p,r,.45))}
 function elevation(g,p){for(const r of g.platforms)if(inside(p,r)){const t=r.ramp;if(inside(p,t))return r.z*(r.x<50?clamp((p.x-t.x)/t.w,0,1):clamp((t.x+t.w-p.x)/t.w,0,1));return r.z;}return 0;}
 function segment(g,a,b,los=false){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/.8);let prev=elevation(g,a);
  for(let i=1;i<=n;i++){const t=i/n,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
   if(los){const z=(a.z??elevation(g,a))+1.5+((b.z??elevation(g,b))-(a.z??elevation(g,a)))*t;if(g.walls.some(w=>inside(p,w)&&z<=w.height))return false;}
   else{const z=elevation(g,p);if(!walkable(g,p)||Math.abs(z-prev)>1.0)return false;prev=z;}
  }return true;
 }
 function nearest(g,p){if(walkable(g,p))return {x:clamp(p.x,3,117),y:clamp(p.y,3,69)};
  for(let r=2;r<24;r+=2)for(let i=0;i<16;i++){const q={x:clamp(p.x+Math.cos(i*Math.PI/8)*r,3,117),y:clamp(p.y+Math.sin(i*Math.PI/8)*r,3,69)};if(walkable(g,q))return q;}return{x:60,y:36};}
 // Cached A* on a precomputed four-neighbour grid. Traversal respects ramps and walls.
 function path(g,a,target){const b=nearest(g,target);if(segment(g,a,b))return[b];const cols=W/C,rows=H/C;
  const idx=p=>clamp(Math.floor(p.y/C),1,rows-2)*cols+clamp(Math.floor(p.x/C),1,cols-2),pos=i=>({x:(i%cols)*C+C/2,y:Math.floor(i/cols)*C+C/2});
  if(!g.nav){g.nav=[];for(let u=0;u<cols*rows;u++){const p=pos(u),edges=[];if(walkable(g,p))for(const [dx,dy] of [[C,0],[-C,0],[0,C],[0,-C]]){const q={x:p.x+dx,y:p.y+dy};if(walkable(g,q)&&segment(g,p,q))edges.push(idx(q));}g.nav[u]=edges;}g.paths=new Map();}
  const snap=p=>{const base=idx(p);if(g.nav[base]?.length&&segment(g,p,pos(base)))return base;const candidates=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const id=base+dy*cols+dx;if(id>=0&&id<cols*rows&&g.nav[id]?.length){const q=pos(id);if(segment(g,p,q))candidates.push({id,d:Math.hypot(q.x-p.x,q.y-p.y)});}}candidates.sort((a,b)=>a.d-b.d);return candidates[0]?.id;};
  const start=snap(a),goal=snap(b);if(start===undefined||goal===undefined)return[];const ck=start+':'+goal;if(g.paths.has(ck)){const out=g.paths.get(ck).map(p=>({...p}));if(out.length)out[out.length-1]={...b};return out;}
  const heap=[],push=(id,f)=>{let i=heap.length;heap.push({id,f});while(i>0){let p=(i-1)>>1;if(heap[p].f<=f)break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}},pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){let l=i*2+1,r=l+1,j=i;if(l<heap.length&&heap[l].f<heap[j].f)j=l;if(r<heap.length&&heap[r].f<heap[j].f)j=r;if(j===i)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}}return root.id;};
  const cost=new Map([[start,0]]),parent=new Map(),closed=new Set();push(start,0);let found=false;
  while(heap.length){const u=pop();if(u===goal){found=true;break;}if(closed.has(u))continue;closed.add(u);
   for(const v of g.nav[u]||[]){if(closed.has(v))continue;const nc=cost.get(u)+C;if(nc<(cost.get(v)??Infinity)){cost.set(v,nc);parent.set(v,u);const p=pos(v);push(v,nc+Math.abs(p.x-b.x)+Math.abs(p.y-b.y));}}
  }
  if(!found){g.paths.set(ck,[]);return[];}const out=[b];let u=goal;while(u!==start){out.push(pos(u));u=parent.get(u);if(u===undefined)return[];}out.push(pos(start));out.reverse();if(g.paths.size>12000)g.paths.clear();g.paths.set(ck,out);return out.map(p=>({...p}));
 }
 function move(g,p,to,distance){p.lastMove=[{x:p.x,y:p.y,z:p.z}];if(!p.route||!p.route.length||Math.hypot((p.goal?.x??0)-to.x,(p.goal?.y??0)-to.y)>4){p.goal={...to};p.route=path(g,p,to)}
  while(distance>0&&p.route.length){const q=p.route[0],dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy);if(d<.05){p.route.shift();continue;}
   const step=Math.min(distance,d),next={x:p.x+dx/d*step,y:p.y+dy/d*step};if(!segment(g,p,next)){p.route=[];break;}
   p.facing=Math.atan2(dy,dx);p.x=next.x;p.y=next.y;p.z=elevation(g,p);p.lastMove.push({x:p.x,y:p.y,z:p.z});distance-=step;if(step>=d-.01)p.route.shift();
  }
 }
 window.RIVALRY_MAP=Object.freeze({geometry,walkable,elevation,segment,path,move,nearest,inside});
})();
