import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

const draco=new DRACOLoader();
draco.setDecoderPath(new URL('../assets/draco/',import.meta.url).href);
const loader=new GLTFLoader();loader.setDRACOLoader(draco);
const url=(kind,name)=>new URL(`../assets/${kind}/${name}.glb`,import.meta.url).href;
const SPECS={
  grouper:{kind:'creatures',file:'fish',size:1.0,yaw:Math.PI/2,clip:'Fish_Armature|Swimming_Normal'},
  clown:{kind:'creatures',file:'clownfish',size:.72,yaw:Math.PI},
  butterfly:{kind:'creatures',file:'butterflyfish',size:.82,yaw:Math.PI},
  sword:{kind:'creatures',file:'swordfish',size:2.4,yaw:Math.PI},
  shark:{kind:'creatures',file:'shark',size:4.2,yaw:Math.PI/2,clip:'Fish_Armature|Swimming_Normal'},
  manta:{kind:'creatures',file:'manta',size:5.0,yaw:Math.PI/2,clip:'Armature|Swim'},
  whale:{kind:'creatures',file:'whale',size:11.5,yaw:Math.PI/2,clip:'Armature|Swim'},
  angler:{kind:'creatures',file:'angler',size:1.45,yaw:Math.PI/2,clip:'Fish_Armature|Swimming_Normal'},
  coral:{kind:'habitat',file:'coral',size:10,ground:true},
  rocks:{kind:'habitat',file:'rocks',size:4.2,ground:true},
  wreck:{kind:'habitat',file:'shipwreck',size:14,ground:true}
};
const cache=new Map();
async function source(key){if(cache.has(key))return cache.get(key);const s=SPECS[key];const p=loader.loadAsync(url(s.kind,s.file));cache.set(key,p);return p}
function tune(root){root.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;if(!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=mats.map(src=>{const m=src.clone();if('envMapIntensity'in m)m.envMapIntensity=.42;if('roughness'in m)m.roughness=Math.max(.48,m.roughness??.6);m.side=THREE.DoubleSide;return m});if(o.material.length===1)o.material=o.material[0]})}
async function instance(key,sizeScale=1){const spec=SPECS[key],gltf=await source(key),raw=skeletonClone(gltf.scene);raw.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(raw),dims=box.getSize(new THREE.Vector3()),max=Math.max(dims.x,dims.y,dims.z)||1,center=box.getCenter(new THREE.Vector3());const holder=new THREE.Group();holder.add(raw);raw.position.set(-center.x,spec.ground?-box.min.y:-center.y,-center.z);holder.scale.setScalar(spec.size*sizeScale/max);holder.rotation.y=spec.yaw||0;tune(raw);let mixer=null;if(spec.clip&&gltf.animations.length){mixer=new THREE.AnimationMixer(raw);const clip=THREE.AnimationClip.findByName(gltf.animations,spec.clip)||gltf.animations[0];if(clip)mixer.clipAction(clip).play()}return{holder,mixer}}
function seeded(i){const x=Math.sin(i*9283.17)*43758.5453;return x-Math.floor(x)}
function circuit(obj,index,{radius=12,y=0,z=-10,speed=.1,phase=0,bob=.5}={}){const p=phase+index*.71+seeded(index)*2;return{obj,phase:p,radius:radius*(.72+seeded(index+8)*.45),y:y+(seeded(index+2)-.5)*5,z:z+(seeded(index+4)-.5)*8,speed:speed*(.75+seeded(index+6)*.5),bob}}
export async function createAssetWorld(scene){
  const root=new THREE.Group();root.name='cinemap-asset-ecosystem';scene.add(root);const mixers=[],movers=[];
  const habitat=await Promise.all(['coral','rocks','rocks','coral','wreck'].map((k,i)=>instance(k,i===4?.72:.8+seeded(i)*.45)));
  const habitatPos=[[-16,-11,-20],[14,-11,-12],[-4,-11,-28],[18,-11,-34],[5,-10,-42]];
  habitat.forEach(({holder},i)=>{holder.position.set(...habitatPos[i]);holder.rotation.y+=i*.8;root.add(holder)});
  const schoolKeys=['grouper','clown','butterfly','grouper','clown','butterfly','grouper','clown','butterfly','grouper','clown','butterfly','grouper','butterfly','clown','grouper','clown','butterfly'];
  const fish=await Promise.all(schoolKeys.map((k,i)=>instance(k,.72+seeded(i+20)*.55)));
  fish.forEach((entry,i)=>{root.add(entry.holder);if(entry.mixer)mixers.push(entry.mixer);movers.push(circuit(entry.holder,i,{radius:13,y:1,z:-17,speed:.09,bob:.7}))});
  const heroDefs=[['manta',{radius:18,y:5,z:-29,speed:.045,bob:1}],['shark',{radius:22,y:-2,z:-35,speed:.055,bob:.45}],['sword',{radius:20,y:2,z:-23,speed:.06,bob:.35}],['whale',{radius:30,y:9,z:-62,speed:.018,bob:1.2}],['angler',{radius:10,y:-6,z:-31,speed:.065,bob:.8}]];
  for(let i=0;i<heroDefs.length;i++){const [key,cfg]=heroDefs[i],entry=await instance(key);root.add(entry.holder);if(entry.mixer)mixers.push(entry.mixer);movers.push(circuit(entry.holder,40+i,cfg))}
  let elapsed=0;
  return{root,update(dt){elapsed+=dt;mixers.forEach(m=>m.update(dt));for(const m of movers){const a=elapsed*m.speed+m.phase,x=Math.cos(a)*m.radius,z=m.z+Math.sin(a)*m.radius*.42,y=m.y+Math.sin(a*1.7)*m.bob;m.obj.position.set(x,y,z);const dx=-Math.sin(a)*m.radius,dz=Math.cos(a)*m.radius*.42;m.obj.rotation.y=Math.atan2(dx,dz);m.obj.rotation.z=Math.sin(a)*.045}},dispose(){draco.dispose();scene.remove(root)}}
}
