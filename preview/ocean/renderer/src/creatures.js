import * as THREE from 'three';
import {createSchool,stepSchool} from './schooling.js';
import {creatureProfile} from './creature-profiles.js';

function material(profile,index){const c=new THREE.Color().setHSL((.47+profile.hue*.34)%1,.42,.38+((index%3)*.06));return new THREE.MeshPhysicalMaterial({color:c,roughness:.58,metalness:.02,clearcoat:.12,clearcoatRoughness:.72})}
function bodyGeometry(profile){
 const rings=18,sides=14,pos=[],idx=[];let h=.62,w=.52;
 if(profile.archetype==='disc'){h=1.05;w=.28}else if(profile.archetype==='slender'){h=.34;w=.31}else if(profile.archetype==='shark'){h=.42;w=.38}
 for(let r=0;r<=rings;r++){const t=r/rings,x=-1.45+t*2.9,rad=Math.pow(Math.sin(Math.PI*t),.58);for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2;pos.push(x,Math.cos(a)*rad*h,Math.sin(a)*rad*w)}}
 for(let r=0;r<rings;r++)for(let s=0;s<sides;s++){const a=r*sides+s,b=r*sides+(s+1)%sides,c=(r+1)*sides+s,d=(r+1)*sides+(s+1)%sides;idx.push(a,c,b,b,c,d)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g
}
function finGeometry(points){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.computeVertexNormals();return g}
function fishVisual(index){
 const p=creatureProfile(index),g=new THREE.Group(),mat=material(p,index);
 if(p.archetype==='ray'){
   const geo=finGeometry([1.25,0,0,0,0,1.5,-1.05,0,0,0,0,-1.5, 1.25,0,0,-1.05,0,0,0,0,-1.5, -1.05,0,0,-1.9,.04,0,0,0,1.5]);
   const ray=new THREE.Mesh(geo,mat);ray.rotation.x=.08;g.add(ray);return g
 }
 if(p.archetype==='jelly'){
   const bell=new THREE.Mesh(new THREE.SphereGeometry(.72,24,14,0,Math.PI*2,0,Math.PI*.52),new THREE.MeshPhysicalMaterial({color:0x8fc7c4,transparent:true,opacity:.58,roughness:.18,transmission:.08,side:THREE.DoubleSide}));bell.rotation.x=Math.PI;g.add(bell);
   for(let i=0;i<5;i++){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3((i-2)*.13,-.1,0),new THREE.Vector3((i-2)*.17,-.65,.08*Math.sin(i)),new THREE.Vector3((i-2)*.11,-1.35,.1*Math.cos(i))]);g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.018,5,false),mat))}return g
 }
 const body=new THREE.Mesh(bodyGeometry(p),mat);g.add(body);
 const tailScale=p.archetype==='slender'? .55:p.archetype==='shark'?1.05:.78;
 const tail=new THREE.Mesh(finGeometry([-1.28,0,0,-2.12,.78*tailScale,0,-1.92,0,0,-2.12,-.78*tailScale,0,-1.28,0,0,-2.12,-.78*tailScale,0]),mat);g.add(tail);
 const dorsal=new THREE.Mesh(finGeometry([-.3,.42,0,-.85,1.02,0,-1.1,.28,0]),mat);g.add(dorsal);
 if(p.archetype==='disc'){const fin=new THREE.Mesh(finGeometry([-.25,0,.22,-.75,-.15,1.05,.35,-.05,.26]),mat);g.add(fin)}
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshBasicMaterial({color:0xe8eee4}));eye.position.set(1.08,.15,.33);g.add(eye);const pupil=new THREE.Mesh(new THREE.SphereGeometry(.027,8,6),new THREE.MeshBasicMaterial({color:0x071015}));pupil.position.set(1.1,.15,.37);g.add(pupil);return g
}
export function createCreatureSchool(scene,count,seed=17){
 const state=createSchool(count,seed),root=new THREE.Group();scene.add(root);const profiles=state.map((_,i)=>creatureProfile(i));
 state.forEach((f,i)=>{const p=profiles[i];f.size=p.scale;if(p.depthBand==='far')f.p.z-=8;if(p.depthBand==='near')f.p.z+=2;if(p.solitary){f.p.x+=(i%2?8:-8);f.p.y+=((i%3)-1)*1.8}});
 const visuals=state.map((f,i)=>{const v=fishVisual(i);v.scale.setScalar(f.size);root.add(v);return v}),forward=new THREE.Vector3();
 return {state,root,update(dt,target){stepSchool(state,dt,target);state.forEach((f,i)=>{const o=visuals[i],p=profiles[i];o.position.set(f.p.x,f.p.y,f.p.z);if(p.archetype==='jelly'){o.rotation.y+=dt*.08;o.position.y+=Math.sin(performance.now()*.0015+f.phase)*.002;return}forward.set(f.p.x+f.v.x,f.p.y+f.v.y,f.p.z+f.v.z);o.lookAt(forward);o.rotation.y+=Math.PI/2;if(o.children[1]&&p.archetype!=='ray')o.children[1].rotation.x=Math.sin(performance.now()*.006+f.phase)*.08})}};
}
