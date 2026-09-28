import * as THREE from 'three';
import {createSchool,stepSchool} from './schooling.js';

function fishVisual(index){
  const g=new THREE.Group();
  const hue=[0x5aa6a2,0xb8a36a,0x6f91b6,0x9b6e67][index%4];
  const body=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),new THREE.MeshStandardMaterial({color:hue,roughness:.55,metalness:.05}));
  body.scale.set(1.35,.52,.46);g.add(body);
  const tailShape=new THREE.Shape();tailShape.moveTo(0,0);tailShape.lineTo(-.9,.62);tailShape.lineTo(-.72,0);tailShape.lineTo(-.9,-.62);tailShape.closePath();
  const tail=new THREE.Mesh(new THREE.ShapeGeometry(tailShape),new THREE.MeshStandardMaterial({color:hue,side:THREE.DoubleSide,roughness:.65}));tail.position.x=-1.18;tail.rotation.y=Math.PI/2;g.add(tail);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,10,8),new THREE.MeshBasicMaterial({color:0xf4f0dc}));eye.position.set(.92,.18,.4);g.add(eye);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0x071015}));pupil.position.set(.95,.18,.46);g.add(pupil);
  return g;
}

export function createCreatureSchool(scene,count,seed=17){
  const state=createSchool(count,seed);const root=new THREE.Group();scene.add(root);
  const visuals=state.map((f,i)=>{const v=fishVisual(i);v.scale.setScalar(f.size);root.add(v);return v});
  const forward=new THREE.Vector3();
  return {state,root,update(dt,target){stepSchool(state,dt,target);state.forEach((f,i)=>{const o=visuals[i];o.position.set(f.p.x,f.p.y,f.p.z);forward.set(f.p.x+f.v.x,f.p.y+f.v.y,f.p.z+f.v.z);o.lookAt(forward);o.rotation.y+=Math.PI/2;o.children[1].rotation.z=Math.sin(performance.now()*.008+f.phase)*.22})}};
}
