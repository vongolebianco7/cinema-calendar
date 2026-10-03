(()=>{
'use strict';

const ASSET='assets/milestone-manta-ray-hq.svg';
const COLS=72;
const ROWS=32;
const NORMAL_CYCLE_S=3.15;
const GLIDE_START=.82;
const leftPhaseOffset=0;
const rightPhaseOffset=.012;
const clamp01=x=>Math.max(0,Math.min(1,x));
const smoothstep=x=>{x=clamp01(x);return x*x*(3-2*x)};
const smootherstep=x=>{x=clamp01(x);return x*x*x*(x*(x*6-15)+10)};
function powerStroke(t){return smootherstep(clamp01(t/.44));}
function recoveryStroke(t){return smootherstep(clamp01((t-.44)/(GLIDE_START-.44)));}
function strokeCurve(phase){
  const p=((phase%1)+1)%1;
  if(p<.44)return .34-1.34*powerStroke(p);
  if(p<GLIDE_START)return -1+1.34*recoveryStroke(p);
  return .34;
}
function projectedWingLift(span,phase,side){
  const torsoMask=smoothstep((span-.24)/.30);
  const tipGain=Math.pow(clamp01(span),1.62);
  const propagation=.075*tipGain;
  const sideOffset=side<0?leftPhaseOffset:rightPhaseOffset;
  return strokeCurve(phase-propagation-sideOffset)*torsoMask*(.14+.86*tipGain);
}

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');return s;}
function makeProgram(gl){
 const vs=shader(gl,gl.VERTEX_SHADER,`precision highp float;
attribute vec2 aPosition;
attribute vec2 aUv;
uniform float uPhase;
uniform float uAmplitude;
uniform float uCameraPitch;
uniform float uDepthPerspective;
varying vec2 vUv;
varying float vLiftNorm;
float sat(float x){return clamp(x,0.0,1.0);} 
float sstep(float x){x=sat(x);return x*x*(3.0-2.0*x);} 
float ss(float x){x=sat(x);return x*x*x*(x*(x*6.0-15.0)+10.0);} 
float stroke(float ph){
  float p=fract(ph+10.0);
  if(p<.44)return .34-1.34*ss(p/.44);
  if(p<${GLIDE_START.toFixed(2)})return -1.0+1.34*ss((p-.44)/(${GLIDE_START.toFixed(2)}-.44));
  return .34;
}
void main(){
  float u=aUv.x;
  float v=aUv.y;
  float side=u<.5?-1.0:1.0;
  float span=abs(u-.5)*2.0;
  float torsoMask=sstep((span-.24)/.30);
  float tipGain=pow(sat(span),1.62);
  float phaseDelay=.075*tipGain+(side<0.0?${leftPhaseOffset.toFixed(3)}:${rightPhaseOffset.toFixed(3)});
  float chord=.66+.34*sin(3.14159265*v);
  float liftNorm=stroke(uPhase-phaseDelay)*torsoMask*(.14+.86*tipGain)*chord;
  float lift=liftNorm*uAmplitude;

  float worldX=(u-.5)*2.0;
  float worldY=(v-.5)*1.15;
  float worldZ=lift;
  float spanCompress=1.0-.42*abs(worldZ)*(.15+.85*tipGain);
  worldX*=spanCompress;

  float cp=cos(uCameraPitch);
  float sp=sin(uCameraPitch);
  float cameraY=worldY*cp-worldZ*sp;
  float cameraZ=worldY*sp+worldZ*cp;
  float perspective=1.0/(1.0+cameraZ*uDepthPerspective);
  float screenX=worldX*perspective*.90;
  float screenY=cameraY*perspective*1.52;

  gl_Position=vec4(screenX,-screenY,0.0,1.0);
  vUv=aUv;
  vLiftNorm=liftNorm;
}`);
 const fs=shader(gl,gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D uTexture;varying vec2 vUv;varying float vLiftNorm;void main(){vec4 c=texture2D(uTexture,vUv);float shade=clamp(1.0+vLiftNorm*.14,.84,1.16);c.rgb*=shade;gl_FragColor=c;}`);
 const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'program link failed');return p;
}
function createMesh(gl){const data=[],indices=[];for(let y=0;y<=ROWS;y++){const v=y/ROWS;for(let x=0;x<=COLS;x++){const u=x/COLS;data.push(u,v,u,v);}}const stride=COLS+1;for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const a=y*stride+x,b=a+1,c=a+stride,d=c+1;indices.push(a,c,b,b,c,d);}const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);return{vb,ib,count:indices.length};}
function keyedSource(img){const c=document.createElement('canvas'),scale=Math.min(2,1200/img.naturalWidth);c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,c.width,c.height);return c;}
function initRigged(){const canvas=document.querySelector('#riggedManta'),status=document.querySelector('#rigStatus'),gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true})||canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});if(!gl){status.textContent='WebGL unavailable';return;}const p=makeProgram(gl),mesh=createMesh(gl),tex=gl.createTexture();gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vb);const stride=16;for(const [name,size,offset] of [['aPosition',2,0],['aUv',2,8]]){const loc=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);}gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ib);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);const phaseLoc=gl.getUniformLocation(p,'uPhase'),ampLoc=gl.getUniformLocation(p,'uAmplitude'),pitchLoc=gl.getUniformLocation(p,'uCameraPitch'),depthLoc=gl.getUniformLocation(p,'uDepthPerspective');gl.uniform1i(gl.getUniformLocation(p,'uTexture'),0);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,cycle=reduced?5.2:NORMAL_CYCLE_S,amp=reduced?.08:.24;const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}};let start=0;const render=ts=>{if(!start)start=ts;resize();const phase=((ts-start)/1000/cycle)%1;gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(p);gl.uniform1f(phaseLoc,phase);gl.uniform1f(ampLoc,amp);gl.uniform1f(pitchLoc,.52);gl.uniform1f(depthLoc,.34);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);requestAnimationFrame(render);};const img=new Image();img.decoding='async';img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,keyedSource(img));status.textContent='observed 3D cruise · live';canvas.dataset.ready='1';requestAnimationFrame(render);};img.onerror=()=>status.textContent='asset load failed';img.src=ASSET;}
async function initCurrent(){const host=document.querySelector('#currentManta'),status=document.querySelector('#currentStatus');try{const manifest=await window.CinemapOceanMilestoneAtlas.loadCatalog(),manta=window.CinemapOceanMilestoneAtlas.createCreature('manta-ray',manifest);manta.style.width='100%';manta.style.height='100%';manta.style.position='absolute';manta.style.inset='0';host.appendChild(manta);status.textContent='current mesh · live';}catch(e){status.textContent=String(e.message||e);}}
window.MantaRigPreview={NORMAL_CYCLE_S,GLIDE_START,powerStroke,recoveryStroke,strokeCurve,projectedWingLift,leftPhaseOffset,rightPhaseOffset};
window.addEventListener('DOMContentLoaded',()=>{initCurrent();initRigged();});
})();
