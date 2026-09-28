(function(root){'use strict';
let host,stage,bg,fauna,records={},films=[],spots=[],drag=null,cam={x:50,y:50,scale:1.06},target={x:50,y:50,scale:1.06},raf=0,livingPromise=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function ensureLivingAssets(){
  if(!document.querySelector('link[data-ocean-living]')){const link=document.createElement('link');link.rel='stylesheet';link.href='js/ocean-living.css?v=1';link.dataset.oceanLiving='1';document.head.appendChild(link)}
  if(root.CinemapOceanEcosystem)return Promise.resolve(root.CinemapOceanEcosystem);
  if(livingPromise)return livingPromise;
  livingPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='js/ocean-ecosystem.js?v=1';script.async=true;script.onload=()=>root.CinemapOceanEcosystem?resolve(root.CinemapOceanEcosystem):reject(new Error('Ocean ecosystem unavailable'));script.onerror=reject;document.head.appendChild(script)});
  return livingPromise;
}
function apply(){if(!bg||!stage)return;const t=performance.now()*.00012,driftX=Math.sin(t)*.75,driftY=Math.cos(t*.73)*.42;bg.style.transform='translate3d('+((50-cam.x)*.34+driftX)+'%, '+((50-cam.y)*.2+driftY)+'%,0) scale('+cam.scale+')';if(fauna)fauna.style.transform='translate3d('+((50-cam.x)*.62+driftX*1.35)+'%, '+((50-cam.y)*.34+driftY*1.2)+'%,0) scale('+(1+(cam.scale-1)*.35)+')';stage.style.setProperty('--cx',cam.x+'%');stage.style.setProperty('--cy',cam.y+'%')}
function loop(){cam.x+=(target.x-cam.x)*.055;cam.y+=(target.y-cam.y)*.055;cam.scale+=(target.scale-cam.scale)*.055;apply();raf=requestAnimationFrame(loop)}
function show(o){const p=host.querySelector('.oceanCreatureCard');p.hidden=false;p.innerHTML='<button class="oceanClose" aria-label="閉じる">×</button><small>'+(o.hero?'RARE DISCOVERY · 5.0':'DISCOVERED IN YOUR OCEAN')+'</small><h3>'+esc(o.film.title||'')+'</h3><p>'+(o.film.director?'監督 '+esc(o.film.director)+' · ':'')+(o.film.year||'')+'</p>';p.querySelector('button').onclick=()=>p.hidden=true;target.x=o.x;target.y=o.y;target.scale=1.18}
function esc(v){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function hit(px,py){const r=stage.getBoundingClientRect(),x=px-r.left,y=py-r.top;let best=null,d=58;for(const o of spots){const ox=o.x/100*r.width,oy=o.y/100*r.height,dd=Math.hypot(x-ox,y-oy);if(dd<d){d=dd;best=o}}return best}
function bind(){stage.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,tx:target.x,ty:target.y,moved:false};stage.setPointerCapture(e.pointerId)});stage.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>7)drag.moved=true;target.x=clamp(drag.tx-dx/stage.clientWidth*45,25,75);target.y=clamp(drag.ty-dy/stage.clientHeight*32,30,70)});stage.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const o=hit(e.clientX,e.clientY);if(o)show(o)}drag=null});stage.addEventListener('wheel',e=>{e.preventDefault();target.scale=clamp(target.scale-e.deltaY*.0008,1.03,1.28)},{passive:false})}
function animalMarkup(o,i){
  const depth=o.depthBand==='far'?'Far':o.depthBand==='mid'?'Mid':'Near';
  const width=Math.round((44+o.z*48)*o.scale);
  return '<button class="oceanAnimal oceanDepth'+depth+(o.hero?' oceanHero':'')+'" data-i="'+i+'" aria-label="'+esc(o.film.title||'海の生き物')+'" style="--x:'+o.x.toFixed(2)+'%;--y:'+o.y.toFixed(2)+'%;--z:'+o.z.toFixed(3)+';--w:'+width+'px;--atlas:'+o.atlas+';--col:'+(o.index%4)+';--row:'+Math.floor(o.index/4)+';--dir:'+o.direction+';--speed:'+o.speed.toFixed(1)+'s;--drift:'+o.drift.toFixed(0)+'px;--delay:-'+(i%11)+'s"></button>';
}
function render(){
  const scene=root.CinemapOceanEcosystem.build(films,records);spots=scene.organisms;
  const h=scene.habitat,life=Math.max(h.distantLife,h.schools/6),animals=spots.map(animalMarkup).join('');
  const schools=Array.from({length:h.schools},(_,i)=>'<span style="--school-speed:'+(38+i*7)+'s;animation-delay:-'+(i*9)+'s;top:'+(20+(i*13)%52)+'%"></span>').join('');
  const distant=Array.from({length:Math.ceil(h.distantLife*3)},()=>'<i></i>').join('');
  host.innerHTML='<section class="oceanWorld" style="--growth:'+scene.maturity.toFixed(3)+';--reef:'+h.reef.toFixed(3)+';--vegetation:'+h.vegetation.toFixed(3)+';--life:'+life.toFixed(3)+';--light:'+h.light.toFixed(3)+'"><div class="oceanBackdrop" aria-hidden="true"></div><div class="oceanReefArt" aria-hidden="true"></div><div class="oceanVegetation" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="oceanSurface" aria-hidden="true"></div><div class="oceanLightShafts" aria-hidden="true"></div><div class="oceanDistantLife" aria-hidden="true">'+distant+'</div><div class="oceanSchoolLayer" aria-hidden="true">'+schools+'</div><div class="oceanBubbles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="oceanFauna">'+animals+'</div><div class="oceanForeground" aria-hidden="true"></div><div class="oceanCaustics" aria-hidden="true"></div><div class="oceanHaze" aria-hidden="true"></div><div class="oceanParticles" aria-hidden="true"></div><div class="oceanExploreHint">SWIPE TO EXPLORE</div><aside class="oceanCreatureCard" hidden></aside></section>';
  stage=host.querySelector('.oceanWorld');bg=host.querySelector('.oceanBackdrop');fauna=host.querySelector('.oceanFauna');fauna.addEventListener('click',e=>{const b=e.target.closest('.oceanAnimal');if(b)show(spots[Number(b.dataset.i)])});bind();if(!raf)loop();
}
function mount(nextFilms,nextRecords){films=nextFilms||[];records=nextRecords||{};host=document.getElementById('universe');if(!host)return;document.body.classList.add('oceanExperience');host.innerHTML='<section class="oceanWorld"><div class="oceanBackdrop" aria-hidden="true"></div></section>';ensureLivingAssets().then(render).catch(()=>{host.innerHTML='<section class="oceanWorld"><div class="oceanBackdrop" aria-hidden="true"></div><p class="oceanExploreHint">OCEANを読み込めませんでした</p></section>'})}
root.CinemapOceanImmersive={mount};
})(window);