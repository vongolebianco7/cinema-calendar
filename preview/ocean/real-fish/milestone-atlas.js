(function(root){'use strict';
let catalog=null;
const STYLE_ID='ocean-articulated-milestones';
const DEFORMATION_FPS=30;
const DEFORMATION_FRAME_MS=1000/DEFORMATION_FPS;
const DEFORMATION_DPR_CAP=1.5;
const MOBILE_DEFORMATION_DPR_CAP=1.25;
const deformationScheduler={entries:new Set(),raf:0,lastFrame:-Infinity,observer:null};
function loadCatalog(){if(catalog)return Promise.resolve(catalog);return fetch('milestone-assets.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('milestone catalog '+r.status);return r.json()}).then(data=>(catalog=data));}
function ensureArticulationStyles(){if(document.getElementById(STYLE_ID))return;const style=document.createElement('style');style.id=STYLE_ID;style.textContent='@keyframes oceanMantaLeft{0%,100%{transform:rotate(5deg)}50%{transform:rotate(-10deg)}}@keyframes oceanMantaRight{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(10deg)}}@keyframes oceanTailVertical{0%,100%{transform:rotate(-11deg)}50%{transform:rotate(11deg)}}@keyframes oceanTailVerticalSlow{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}.milestoneArticulatedBody,.milestoneArticulatedPart{backface-visibility:hidden;-webkit-backface-visibility:hidden}.milestoneArticulatedPart{position:absolute;overflow:hidden;will-change:transform;transform-box:border-box}.milestoneArticulatedPart img{position:absolute;max-width:none;pointer-events:none;user-select:none;-webkit-user-drag:none}@media(prefers-reduced-motion:reduce){.milestoneArticulatedPart{animation-duration:5.5s!important}}';document.head.appendChild(style);}
function decorate(wrap,key,spec){wrap.className='milestoneAtlasCreature';wrap.dataset.milestoneKey=key;wrap.dataset.motion=spec.motion||'';wrap.dataset.habitat=spec.habitat||'';wrap.dataset.presentationScale=String(spec.presentationScale||1);wrap.dataset.pose=spec.bodyPose||'natural-cruise';return wrap;}
function configureImg(img,src){img.src=src;img.alt='';img.loading='eager';img.decoding='async';Object.assign(img.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none',userSelect:'none'});return img;}
function createDirectCreature(key,spec){const wrap=decorate(document.createElement('span'),key,spec),img=document.createElement('img');Object.assign(wrap.style,{display:'block',position:'relative',overflow:'visible',aspectRatio:String(Number(spec.assetAspect)||2),background:'transparent'});configureImg(img,spec.asset);wrap.appendChild(img);return wrap;}
function smoothstep(value){const x=Math.max(0,Math.min(1,value));return x*x*(3-2*x);}
function tailRamp(profile,u,flexSpan){
 const span=Math.max(.12,Math.min(.48,Number(flexSpan)||.48));
 if(profile==='tail-flex-left')return Math.pow(Math.max(0,(span-u)/span),2.1);
 if(profile==='tail-flex-right')return Math.pow(Math.max(0,(u-(1-span))/span),2.1);
 if(profile==='wing-flex'){
   const wingDistance=Math.abs(u-.5)*2;
   const centerGuard=smoothstep((wingDistance-.08)/.32);
   return Math.pow(wingDistance,.38)*centerGuard;
 }
 if(profile==='flipper-flex'){
   const left=Math.exp(-Math.pow((u-.30)/.12,2)),right=Math.exp(-Math.pow((u-.70)/.12,2));
   return Math.min(1,(left+right)*.95);
 }
 if(profile==='tentacle-wave')return .12+.88*Math.pow(Math.min(1,Math.abs(u-.5)*2),1.15);
 return Math.pow(Math.min(1,Math.abs(u-.5)*2),1.65);
}
function chromaScore(r,g,b){const max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max?((max-min)/max):0,blue=Math.max(0,(b-(r+g)/2)/255);return .72*sat+.28*blue;}
function createKeyedSource(img,cfg){
 if(!cfg.chromaKey&&!cfg.opaqueBody)return img;
 const off=document.createElement('canvas'),maxWidth=900,scale=Math.min(1,maxWidth/img.naturalWidth);
 off.width=Math.max(1,Math.round(img.naturalWidth*scale));off.height=Math.max(1,Math.round(img.naturalHeight*scale));
 const ctx=off.getContext('2d',{willReadFrequently:true});if(!ctx)return img;
 ctx.clearRect(0,0,off.width,off.height);ctx.drawImage(img,0,0,off.width,off.height);
 let imageData;try{imageData=ctx.getImageData(0,0,off.width,off.height);}catch(_){return img;}
 const data=imageData.data,low=Number(cfg.chromaLow)||.48,high=Math.max(low+.04,Number(cfg.chromaHigh)||.70);let shouldKey=Boolean(cfg.chromaKey);
 if(cfg.chromaKey==='auto'){
   let edgeBlue=0,edgeOpaque=0;const step=Math.max(1,Math.floor(Math.min(off.width,off.height)/48));
   const sample=(x,y)=>{const i=(y*off.width+x)*4,a=data[i+3];if(a<24)return;edgeOpaque++;if(chromaScore(data[i],data[i+1],data[i+2])>low)edgeBlue++;};
   for(let x=0;x<off.width;x+=step){sample(x,0);sample(x,off.height-1)}for(let y=step;y<off.height-step;y+=step){sample(0,y);sample(off.width-1,y)}
   const edgeBlueRatio=edgeOpaque?edgeBlue/edgeOpaque:0;shouldKey=edgeOpaque>0&&edgeBlueRatio>=.42;
 }
 if(shouldKey){for(let i=0;i<data.length;i+=4){const score=chromaScore(data[i],data[i+1],data[i+2]);if(score<=low)continue;const keyed=score>=high?1:smoothstep((score-low)/(high-low));data[i+3]=Math.round(data[i+3]*(1-keyed));}}
 if(cfg.opaqueBody){for(let i=0;i<data.length;i+=4)data[i+3]=data[i+3]>28?255:0;}
 ctx.putImageData(imageData,0,0);return off;
}
function thrustEnvelope(phase){if(phase===null||phase===undefined)return 1;const p=((phase%1)+1)%1;if(p<.48){const local=p/.48;return .58+.48*Math.sin(Math.PI*local);}return .14;}
function swimPhaseFor(wrap,elapsedSec){const node=wrap.closest?.('[data-swim-active="1"][data-swim-cadence="pulse-glide"]');if(!node)return null;const duration=Math.max(.15,parseFloat(node.style.getPropertyValue('--swim-pulse-duration'))||1.25),delay=parseFloat(node.style.getPropertyValue('--swim-delay'))||0;return((elapsedSec-delay)/duration)%1;}
function deformationDpr(width){const cap=width<=480?MOBILE_DEFORMATION_DPR_CAP:DEFORMATION_DPR_CAP;return Math.min(cap,Math.max(1,root.devicePixelRatio||1));}
function fitDeformationCanvas(entry,force=false){
 const now=performance.now();if(!force&&now-entry.lastFit<1000)return;entry.lastFit=now;
 const rect=entry.wrap.getBoundingClientRect(),cssWidth=Math.max(120,Math.min(720,rect.width||300)),dpr=deformationDpr(cssWidth),pixelWidth=Math.max(180,Math.round(cssWidth*dpr)),pixelHeight=Math.max(96,Math.round((cssWidth/entry.aspect)*1.2*dpr));
 if(entry.canvas.width!==pixelWidth||entry.canvas.height!==pixelHeight){entry.canvas.width=pixelWidth;entry.canvas.height=pixelHeight;entry.dpr=dpr;entry.wrap.dataset.deformationDpr=String(dpr);}
}
function ensureVisibilityObserver(){
 if(deformationScheduler.observer||!root.IntersectionObserver)return deformationScheduler.observer;
 deformationScheduler.observer=new root.IntersectionObserver(records=>{for(const record of records){const entry=record.target.__oceanDeformationEntry;if(!entry)continue;entry.visible=Boolean(record.isIntersecting&&record.intersectionRatio>0);if(entry.visible)scheduleDeformationFrame();}},{root:null,rootMargin:'12% 0px',threshold:0});
 return deformationScheduler.observer;
}
function unregisterDeformation(entry){deformationScheduler.entries.delete(entry);deformationScheduler.observer?.unobserve(entry.wrap);if(entry.wrap.__oceanDeformationEntry===entry)delete entry.wrap.__oceanDeformationEntry;}
function hasActiveDeformation(){if(document.hidden)return false;for(const entry of [...deformationScheduler.entries]){if(!entry.wrap.isConnected){unregisterDeformation(entry);continue;}if(entry.visible&&entry.source)return true;}return false;}
function scheduleDeformationFrame(){if(deformationScheduler.raf||!deformationScheduler.entries.size)return;if(!hasActiveDeformation())return;deformationScheduler.raf=requestAnimationFrame(tickDeformations);}
function drawDeformation(entry,ts){
 if(!entry.source)return;fitDeformationCanvas(entry);const {canvas,source,cfg,profile,amplitude,motionScale,effectivePeriod,aspect,wrap}=entry,ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);const slices=40,overlap=2,sliceW=source.width/slices,destW=canvas.width/slices,destH=canvas.width/aspect,baseY=(canvas.height-destH)/2,elapsedSec=(ts-entry.start)/1000,t=elapsedSec*(Math.PI*2/effectivePeriod),routePhase=swimPhaseFor(wrap,elapsedSec),thrust=thrustEnvelope(routePhase);
 for(let i=0;i<slices;i++){
   const u=(i+.5)/slices,ramp=tailRamp(profile,u,Number(cfg.flexSpan));let phase=t+u*.7;
   if(profile==='wing-flex')phase=t;
   if(profile==='flipper-flex')phase=t+(u-.5)*.65;
   if(profile==='tentacle-wave')phase=t*.78+u*3.6;
   const offset=Math.sin(phase)*amplitude*motionScale*thrust*ramp*(canvas.height/360),sx=i*sliceW,dx=i*destW;
   ctx.drawImage(source,sx,0,sliceW,source.height,dx-overlap*.5,baseY+offset,destW+overlap,destH);
 }
}
function tickDeformations(ts){
 deformationScheduler.raf=0;
 if(!hasActiveDeformation())return;
 const due=ts-deformationScheduler.lastFrame>=DEFORMATION_FRAME_MS*.92;
 if(due){
   deformationScheduler.lastFrame=ts;
   for(const entry of [...deformationScheduler.entries]){
     if(!entry.wrap.isConnected){unregisterDeformation(entry);continue;}
     if(!entry.visible||!entry.source)continue;
     if(!entry.start)entry.start=ts;
     drawDeformation(entry,ts);
   }
 }
 scheduleDeformationFrame();
}
function registerDeformation(entry){deformationScheduler.entries.add(entry);entry.wrap.__oceanDeformationEntry=entry;const observer=ensureVisibilityObserver();if(observer){entry.visible=false;observer.observe(entry.wrap);}else entry.visible=true;scheduleDeformationFrame();}
if(root.document?.addEventListener)root.document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleDeformationFrame();});
function createDeformedCreature(key,spec){
 const wrap=decorate(document.createElement('span'),key,spec),canvas=document.createElement('canvas'),img=new Image(),cfg=spec.deformation||{},profile=cfg.profile||'tail-flex-right',amplitude=Math.max(1,Number(cfg.amplitude)||24),period=Math.max(.8,Number(cfg.period)||2.4),aspect=Math.max(.8,Number(spec.assetAspect)||3),reduced=Boolean(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches),motionScale=reduced?.45:1,effectivePeriod=period*(reduced?1.35:1);
 Object.assign(wrap.style,{display:'block',position:'relative',overflow:'visible',aspectRatio:String(aspect),background:'transparent',opacity:'1'});wrap.dataset.deformed='1';wrap.dataset.sourceState='loading';wrap.dataset.reducedMotion=reduced?'1':'0';
 canvas.className='milestoneDeformedCanvas';Object.assign(canvas.style,{position:'absolute',left:'0',top:'-10%',width:'100%',height:'120%',display:'block',pointerEvents:'none',overflow:'visible',opacity:'1'});wrap.appendChild(canvas);
 const entry={wrap,canvas,img,cfg,profile,amplitude,period,aspect,motionScale,effectivePeriod,source:null,start:0,lastFit:-Infinity,visible:true,dpr:1};
 const prepare=()=>{if(entry.source||!img.complete||!img.naturalWidth)return;entry.source=createKeyedSource(img,cfg);wrap.dataset.backgroundKeyed=cfg.chromaKey?'1':'0';wrap.dataset.sourceState='ready';fitDeformationCanvas(entry,true);};
 const kick=()=>{entry.source=null;wrap.dataset.sourceState='loaded';prepare();if(entry.source){if(!entry.start)entry.start=performance.now();drawDeformation(entry,entry.start);}scheduleDeformationFrame();};
 img.onload=kick;img.onerror=()=>{wrap.dataset.sourceState='error';};img.decoding='async';img.loading='eager';img.src=spec.asset;registerDeformation(entry);if(img.complete&&img.naturalWidth)kick();return wrap;
}
function animationName(motion){return motion==='manta-left'?'oceanMantaLeft':motion==='manta-right'?'oceanMantaRight':motion==='tail-vertical-slow'?'oceanTailVerticalSlow':'oceanTailVertical';}
function createPartLayer(spec,part,index){const box=Array.isArray(part.box)?part.box:[0,0,100,100],x=Number(box[0])||0,y=Number(box[1])||0,w=Math.max(1,Number(box[2])||100),h=Math.max(1,Number(box[3])||100),layer=document.createElement('span'),img=document.createElement('img'),duration=Math.max(.6,Number(part.duration)||2);layer.className='milestoneArticulatedPart';layer.dataset.partMotion=part.motion||'';layer.dataset.animationName=animationName(part.motion);Object.assign(layer.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%',transformOrigin:part.origin||'50% 50%',webkitTransformOrigin:part.origin||'50% 50%',animation:animationName(part.motion)+' '+duration+'s ease-in-out infinite',animationDelay:(-((index+1)*duration*.23)).toFixed(2)+'s',zIndex:'2'});if(part.clipPath){layer.style.clipPath=part.clipPath;layer.style.webkitClipPath=part.clipPath;}img.src=spec.asset;img.alt='';img.loading='eager';img.decoding='async';Object.assign(img.style,{left:(-100*x/w)+'%',top:(-100*y/h)+'%',width:(10000/w)+'%',height:(10000/h)+'%',objectFit:'fill'});layer.appendChild(img);return layer;}
function createArticulatedCreature(key,spec){ensureArticulationStyles();const wrap=decorate(document.createElement('span'),key,spec),art=spec.articulation||{},body=document.createElement('img');Object.assign(wrap.style,{display:'block',position:'relative',overflow:'visible',aspectRatio:String(Number(spec.assetAspect)||2),background:'transparent'});wrap.dataset.articulated='1';configureImg(body,spec.asset);body.className='milestoneArticulatedBody';body.style.zIndex='1';if(art.bodyClip){body.style.clipPath=art.bodyClip;body.style.webkitClipPath=art.bodyClip;}wrap.appendChild(body);for(const [index,part] of (art.parts||[]).entries())wrap.appendChild(createPartLayer(spec,part,index));return wrap;}
function createAssetCropCreature(key,spec){if(!Array.isArray(spec.assetCrop))return null;const [x,y,w,h]=spec.assetCrop,sourceAspect=Math.max(.1,Number(spec.assetAspect)||1.5);const wrap=decorate(document.createElement('span'),key,spec),img=document.createElement('img');Object.assign(wrap.style,{display:'block',position:'relative',overflow:'hidden',aspectRatio:String(sourceAspect*w/h),background:'transparent'});img.src=spec.asset;img.alt='';img.loading='eager';img.decoding='async';Object.assign(img.style,{position:'absolute',width:(10000/w)+'%',height:'auto',maxWidth:'none',left:(-100*x/w)+'%',top:(-100*y/h)+'%',pointerEvents:'none',userSelect:'none'});wrap.appendChild(img);return wrap;}
function createAtlasCreature(key,spec,manifest){if(!Array.isArray(spec.crop))return null;const [x,y,w,h]=spec.crop;const wrap=decorate(document.createElement('span'),key,spec),img=document.createElement('img');Object.assign(wrap.style,{display:'block',position:'relative',overflow:'hidden',aspectRatio:String((2*w)/h),background:'transparent'});img.src=manifest.atlas;img.alt='';img.loading='eager';img.decoding='sync';Object.assign(img.style,{position:'absolute',width:(10000/w)+'%',height:'auto',maxWidth:'none',left:(-100*x/w)+'%',top:(-100*y/h)+'%',pointerEvents:'none',userSelect:'none'});wrap.appendChild(img);return wrap;}
function createCreature(key,manifest=catalog){const spec=manifest?.species?.[key];if(!spec)return null;if(spec.asset&&spec.deformation)return createDeformedCreature(key,spec);if(spec.asset&&spec.articulation)return createArticulatedCreature(key,spec);if(spec.asset&&Array.isArray(spec.assetCrop))return createAssetCropCreature(key,spec);if(spec.asset)return createDirectCreature(key,spec);return createAtlasCreature(key,spec,manifest);}
root.CinemapOceanMilestoneAtlas={loadCatalog,createCreature,get catalog(){return catalog},deformationMetrics(){return{entries:deformationScheduler.entries.size,fps:DEFORMATION_FPS,dprCap:DEFORMATION_DPR_CAP,mobileDprCap:MOBILE_DEFORMATION_DPR_CAP}}};
})(window);
