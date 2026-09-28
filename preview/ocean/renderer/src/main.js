import * as THREE from 'three';
import { clampDevicePixelRatio } from './runtime-policy.js';

export function createOceanRenderer(canvas){
  if(!canvas)throw new Error('Ocean renderer requires a canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(clampDevicePixelRatio(globalThis.devicePixelRatio||1));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  return renderer;
}
