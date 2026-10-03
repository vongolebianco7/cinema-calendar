(()=>{
'use strict';

const BONE_COUNT=7;
const COLS=42;
const ROWS=20;
const ASSET='assets/milestone-manta-ray-v2.webp';
const boneNames=['torso','leftRoot','leftMid','leftTip','rightRoot','rightMid','rightTip'];
const pivots=[
  [0.50,0.52],
  [0.39,0.52],[0.23,0.51],[0.07,0.50],
  [0.61,0.52],[0.77,0.51],[0.93,0.50]
];

const clamp01=x=>Math.max(0,Math.min(1,x));
const smoothstep=x=>{x=clamp01(x);return x*x*(3-2*x)};
const smootherstep=x=>{x=clamp01(x);return x*x*x*(x*(x*6-15)+10)};

function powerStroke(t){
  return smootherstep(clamp01(t/.43));
}
function recoveryStroke(t){
  return smootherstep(clamp01((t-.43)/.57));
}
function strokeCurve(phase){
  const p=((phase%1)+1)%1;
  if(p<.43) return -powerStroke(p);
  const r=recoveryStroke(p);
  return -1+(r*r*(3-2*r));
}
function angleAt(phase,delay,amplitude){
  return strokeCurve(phase-delay)*amplitude;
}

function makeWeights(u){
  const sig=.115;
  const candidates=pivots.map(([x],index)=>{
    let strength=Math.exp(-Math.pow((u-x)/sig,2));
    if(index===0) strength*=4.8;
    if(index===1||index===4) strength*=1.45;
    if(index===3||index===6) strength*=1.35;
    return {index,strength};
  }).sort((a,b)=>b.strength-a.strength).slice(0,4);
  const sum=candidates.reduce((s,c)=>s+c.strength,0)||1;
  while(candidates.length<4)candidates.push({index:0,strength:0});
  return {
    indices:candidates.map(c=>c.index),
    weights:candidates.map(c=>c.strength/sum)
  };
}

function createMesh(gl){
  const data=[];
  const indices=[];
  for(let y=0;y<=ROWS;y++){
    const v=y/ROWS;
    for(let x=0;x<=COLS;x++){
      const u=x/COLS;
      const w=makeWeights(u);
      data.push(u,v,u,v,...w.indices,...w.weights);
    }
  }
  const stride=COLS+1;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const a=y*stride+x,b=a+1,c=a+stride,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const vertexBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
  const indexBuffer=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  return {vertexBuffer,indexBuffer,indexCount:indices.length};
}

function shader(gl,type,source){
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'shader compile failed');
  return s;
}
function program(gl){
  const vs=shader(gl,gl.VERTEX_SHADER,`precision highp float;
attribute vec2 aPosition;
attribute vec2 aUv;
attribute vec4 aBoneIndices;
attribute vec4 aBoneWeights;
uniform vec2 uPivot0; uniform vec2 uPivot1; uniform vec2 uPivot2; uniform vec2 uPivot3;
uniform vec2 uPivot4; uniform vec2 uPivot5; uniform vec2 uPivot6;
uniform float uAngle0; uniform float uAngle1; uniform float uAngle2; uniform float uAngle3;
uniform float uAngle4; uniform float uAngle5; uniform float uAngle6;
varying vec2 vUv;
vec2 rotateAround(vec2 p, vec2 pivot, float a){float c=cos(a),s=sin(a);vec2 q=p-pivot;return pivot+vec2(q.x*c-q.y*s,q.x*s+q.y*c);}
vec2 applyBone(float i,vec2 p){
  if(i<.5)return rotateAround(p,uPivot0,uAngle0);
  if(i<1.5)return rotateAround(p,uPivot1,uAngle1);
  if(i<2.5)return rotateAround(p,uPivot2,uAngle2);
  if(i<3.5)return rotateAround(p,uPivot3,uAngle3);
  if(i<4.5)return rotateAround(p,uPivot4,uAngle4);
  if(i<5.5)return rotateAround(p,uPivot5,uAngle5);
  return rotateAround(p,uPivot6,uAngle6);
}
void main(){
  vec2 p=applyBone(aBoneIndices.x,aPosition)*aBoneWeights.x+
         applyBone(aBoneIndices.y,aPosition)*aBoneWeights.y+
         applyBone(aBoneIndices.z,aPosition)*aBoneWeights.z+
         applyBone(aBoneIndices.w,aPosition)*aBoneWeights.w;
  vec2 centered=p-vec2(.5,.5);
  centered.x*=.96;
  centered.y*=1.13;
  p=centered+vec2(.5,.5);
  gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);
  vUv=aUv;
}`);
  const fs=shader(gl,gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D uTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(uTexture,vUv);}`);
  const p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'program link failed');
  return p;
}

function keyedSource(img){
  const c=document.createElement('canvas');
  const scale=Math.min(1,900/img.naturalWidth);
  c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);
  const image=ctx.getImageData(0,0,c.width,c.height),d=image.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b);
    const sat=max?((max-min)/max):0;
    const blue=Math.max(0,(b-(r+g)/2)/255);
    const score=.72*sat+.28*blue;
    if(score<=.46)continue;
    const k=score>=.72?1:smoothstep((score-.46)/.26);
    d[i+3]=Math.round(d[i+3]*(1-k));
  }
  ctx.putImageData(image,0,0);return c;
}

function initRigged(){
  const canvas=document.querySelector('#riggedManta');
  const status=document.querySelector('#rigStatus');
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true})||canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
  if(!gl){status.textContent='WebGL unavailable';return;}
  const p=program(gl),mesh=createMesh(gl),texture=gl.createTexture();
  gl.useProgram(p);
  const stride=12*4;
  const bind=(name,size,offset)=>{const loc=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset*4)};
  gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vertexBuffer);
  bind('aPosition',2,0);bind('aUv',2,2);bind('aBoneIndices',4,4);bind('aBoneWeights',4,8);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
  const pivotLoc=pivots.map((_,i)=>gl.getUniformLocation(p,`uPivot${i}`));
  const angleLoc=pivots.map((_,i)=>gl.getUniformLocation(p,`uAngle${i}`));
  pivots.forEach((v,i)=>gl.uniform2f(pivotLoc[i],v[0],v[1]));
  gl.uniform1i(gl.getUniformLocation(p,'uTexture'),0);

  const resize=()=>{const r=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1);const w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}};
  const img=new Image();img.decoding='async';img.onload=()=>{
    gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,keyedSource(img));
    status.textContent='7-bone rig · live';
    canvas.dataset.ready='1';
    requestAnimationFrame(render);
  };img.onerror=()=>status.textContent='asset load failed';img.src=ASSET;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cycle=reduced?5.0:3.65;
  const amplitudeScale=reduced?.45:1;
  let start=0;
  function render(ts){
    if(!start)start=ts;resize();
    const phase=((ts-start)/1000/cycle)%1;
    const left=[0,.035,.090,.165].map((a,i)=>i===0?0:angleAt(phase,[0,0,.030,.058][i],a*amplitudeScale));
    const right=[0,-.035,-.090,-.165].map((a,i)=>i===0?0:angleAt(phase,[0,.018,.048,.076][i],Math.abs(a)*amplitudeScale)*-1);
    const angles=[0,left[1],left[2],left[3],right[1],right[2],right[3]];
    gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(p);angles.forEach((a,i)=>gl.uniform1f(angleLoc[i],a));gl.drawElements(gl.TRIANGLES,mesh.indexCount,gl.UNSIGNED_SHORT,0);
    requestAnimationFrame(render);
  }
}

async function initCurrent(){
  const host=document.querySelector('#currentManta');
  const status=document.querySelector('#currentStatus');
  try{
    if(!window.CinemapOceanMilestoneAtlas)throw new Error('renderer unavailable');
    const manifest=await window.CinemapOceanMilestoneAtlas.loadCatalog();
    const manta=window.CinemapOceanMilestoneAtlas.createCreature('manta-ray',manifest);
    manta.style.width='100%';manta.style.height='100%';manta.style.position='absolute';manta.style.inset='0';
    host.appendChild(manta);status.textContent='current mesh · live';
  }catch(error){status.textContent=String(error.message||error);}
}

window.MantaRigPreview={BONE_COUNT,boneNames,powerStroke,recoveryStroke,strokeCurve,makeWeights};
window.addEventListener('DOMContentLoaded',()=>{initCurrent();initRigged();});
})();
