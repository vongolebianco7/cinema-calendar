import * as THREE from 'three';
import { clampDevicePixelRatio } from './runtime-policy.js';
import { selectQuality } from './quality.js';
import { createEnvironment } from './environment.js';
import { createCreatureSchool } from './creatures.js';

export function createOceanRenderer(canvas,dpr=globalThis.devicePixelRatio||1){
  if(!canvas)throw new Error('Ocean renderer requires a canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(clampDevicePixelRatio(dpr));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  return renderer;
}

export function mountOcean(canvas,options={}){
  const reduced=options.reducedMotion===true;
  const quality=selectQuality({width:canvas.clientWidth||390,dpr:globalThis.devicePixelRatio||1,cores:globalThis.navigator?.hardwareConcurrency||4,reducedMotion:reduced});
  const renderer=createOceanRenderer(canvas,quality.dpr);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(48,1,.1,90);camera.position.set(0,1.1,8.5);camera.lookAt(0,-.5,-12);
  const environment=createEnvironment(scene,quality);
  const creatures=createCreatureSchool(scene,quality.schoolSize,Number(options.seed)||17);
  const clock=new THREE.Clock();let raf=0,disposed=false;
  function resize(){const w=Math.max(1,canvas.clientWidth||390),h=Math.max(1,canvas.clientHeight||520);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  function frame(){if(disposed)return;resize();const dt=Math.min(.034,clock.getDelta()),t=clock.elapsedTime;environment.update(t);creatures.update(reduced?0:dt,{x:0,y:-.5,z:-13});renderer.render(scene,camera);raf=requestAnimationFrame(frame)}
  frame();
  return {renderer,scene,camera,quality,dispose(){disposed=true;cancelAnimationFrame(raf);renderer.dispose();canvas.width=canvas.width}};
}
