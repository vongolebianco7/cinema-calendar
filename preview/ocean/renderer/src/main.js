import * as THREE from 'three';
import { clampDevicePixelRatio } from './runtime-policy.js';
import { selectQuality } from './quality.js';
import { createEnvironment } from './environment.js';
import { createAssetWorld } from './asset-world.js';

export function createOceanRenderer(canvas,dpr=globalThis.devicePixelRatio||1){
  if(!canvas)throw new Error('Ocean renderer requires a canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(clampDevicePixelRatio(dpr));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;return renderer;
}
export function mountOcean(canvas,options={}){
  const reduced=options.reducedMotion===true,quality=selectQuality({width:canvas.clientWidth||390,dpr:globalThis.devicePixelRatio||1,cores:globalThis.navigator?.hardwareConcurrency||4,reducedMotion:reduced}),renderer=createOceanRenderer(canvas,quality.dpr),scene=new THREE.Scene();
  scene.background=new THREE.Color(0x031a25);scene.fog=new THREE.FogExp2(0x082d39,.019);
  const camera=new THREE.PerspectiveCamera(50,1,.1,180);camera.position.set(0,7,24);camera.lookAt(0,-1,-25);
  const environment=createEnvironment(scene,quality),hemi=new THREE.HemisphereLight(0x9de5e2,0x071419,1.15),sun=new THREE.DirectionalLight(0xc9f6e9,2.8);sun.position.set(-10,24,8);scene.add(hemi,sun);
  let assetWorld=null,assetError=null;createAssetWorld(scene).then(w=>assetWorld=w).catch(err=>{assetError=err;console.error('[Ocean assets]',err)});
  const clock=new THREE.Clock();let raf=0,disposed=false,drag=null,yaw=0,pitch=-.04,targetYaw=0,targetPitch=-.04,distance=27,targetDistance=27;const look=new THREE.Vector3(0,-1,-27);
  function resize(){const w=Math.max(1,canvas.clientWidth||390),h=Math.max(1,canvas.clientHeight||520);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
  const down=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)},move=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};targetYaw-=dx*.006;targetPitch=THREE.MathUtils.clamp(targetPitch-dy*.0048,-.36,.24)},up=()=>drag=null,wheel=e=>{e.preventDefault();targetDistance=THREE.MathUtils.clamp(targetDistance+e.deltaY*.018,18,42)};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('wheel',wheel,{passive:false});
  function frame(){if(disposed)return;resize();const dt=Math.min(.034,clock.getDelta()),t=clock.elapsedTime;yaw=THREE.MathUtils.damp(yaw,targetYaw,4.2,dt);pitch=THREE.MathUtils.damp(pitch,targetPitch,4.2,dt);distance=THREE.MathUtils.damp(distance,targetDistance,4,dt);camera.position.set(Math.sin(yaw)*distance,7+pitch*20,look.z+Math.cos(yaw)*distance);camera.lookAt(look.x,look.y+pitch*5,look.z);environment.update(t);if(!reduced)assetWorld?.update(dt);renderer.render(scene,camera);raf=requestAnimationFrame(frame)}frame();
  return{renderer,scene,camera,quality,get assetError(){return assetError},dispose(){disposed=true;cancelAnimationFrame(raf);for(const [n,f] of [['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['wheel',wheel]])canvas.removeEventListener(n,f);assetWorld?.dispose();renderer.dispose();canvas.width=canvas.width}};
}
