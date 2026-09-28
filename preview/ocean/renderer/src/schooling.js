function rng(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function limit(v,max,min=.2){const n=Math.hypot(v.x,v.y,v.z)||1;if(n>max){v.x*=max/n;v.y*=max/n;v.z*=max/n}else if(n<min){v.x*=min/n;v.y*=min/n;v.z*=min/n}return v}
export function createSchool(count,seed=1){const r=rng(seed);return Array.from({length:count},(_,i)=>({id:i,p:{x:-8+r()*16,y:-3+r()*7,z:-8-r()*14},v:{x:.45+r()*1.1,y:-.18+r()*.36,z:-.25+r()*.5},phase:r()*Math.PI*2,size:.65+r()*.75,depth:r()}))}
export function stepSchool(fish,dt,target={x:0,y:0,z:-12}){
  const next=fish.map(f=>({x:f.v.x,y:f.v.y,z:f.v.z}));
  for(let i=0;i<fish.length;i++){
    const f=fish[i];let cx=0,cy=0,cz=0,ax=0,ay=0,az=0,sx=0,sy=0,sz=0,n=0;
    for(let j=0;j<fish.length;j++){if(i===j)continue;const o=fish[j],dx=o.p.x-f.p.x,dy=o.p.y-f.p.y,dz=o.p.z-f.p.z,d=Math.hypot(dx,dy,dz);if(d<5.5){cx+=o.p.x;cy+=o.p.y;cz+=o.p.z;ax+=o.v.x;ay+=o.v.y;az+=o.v.z;n++}if(d<1.35&&d>.001){sx-=dx/(d*d);sy-=dy/(d*d);sz-=dz/(d*d)}}
    const v=next[i];if(n){v.x+=(cx/n-f.p.x)*.12*dt+(ax/n-f.v.x)*.35*dt;v.y+=(cy/n-f.p.y)*.12*dt+(ay/n-f.v.y)*.35*dt;v.z+=(cz/n-f.p.z)*.12*dt+(az/n-f.v.z)*.35*dt}
    v.x+=(target.x-f.p.x)*.018*dt+sx*.72*dt;v.y+=(target.y-f.p.y)*.014*dt+sy*.72*dt;v.z+=(target.z-f.p.z)*.018*dt+sz*.72*dt;
    if(f.p.y<-6)v.y+=.8*dt;if(f.p.y>7.6)v.y-=.8*dt;if(Math.abs(f.p.x)>15)v.x-=Math.sign(f.p.x)*.9*dt;if(f.p.z>-3||f.p.z<-30)v.z-=Math.sign(f.p.z+16)*.8*dt;limit(v,2.2,.2)
  }
  for(let i=0;i<fish.length;i++){const f=fish[i],v=next[i];f.v=v;f.p.x+=v.x*dt;f.p.y=clamp(f.p.y+v.y*dt,-6.7,8.4);f.p.z=clamp(f.p.z+v.z*dt,-30,-3)}
  return fish;
}
