import * as THREE from 'three';

const WATER_TOP=new THREE.Color(0x176b7d);
const WATER_DEEP=new THREE.Color(0x031a2b);

function seeded(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}

function makeShaftMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{uColor:{value:new THREE.Color(0x9be7dd)},uOpacity:{value:.12}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;void main(){float x=abs(vUv.x-.5)*2.;float side=smoothstep(1.,.05,x);float top=smoothstep(0.,.16,vUv.y);float bottom=1.-smoothstep(.58,1.,vUv.y);float grain=.92+.08*sin(vUv.y*31.);gl_FragColor=vec4(uColor,uOpacity*side*top*bottom*grain);}'
  });
}

function makeCausticMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(0x70d8cf)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;uniform float uTime;uniform vec3 uColor;void main(){vec2 p=vUv*13.;float a=sin(p.x*1.7+sin(p.y+uTime*.45));float b=sin(p.y*2.1+sin(p.x-uTime*.35));float c=sin((p.x+p.y)*1.2+uTime*.3);float line=smoothstep(.72,.98,(a+b+c)/3.*.5+.5);float edge=smoothstep(0.,.18,vUv.x)*smoothstep(0.,.18,vUv.y)*smoothstep(0.,.18,1.-vUv.x)*smoothstep(0.,.18,1.-vUv.y);gl_FragColor=vec4(uColor,line*.13*edge);}'
  });
}

export function createEnvironment(scene,quality){
  scene.background=WATER_DEEP.clone();
  scene.fog=new THREE.FogExp2(0x082f42,0.026);
  const ambient=new THREE.HemisphereLight(0x8ed8d3,0x03131f,1.25);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xb6fff1,2.4);sun.position.set(-8,18,4);scene.add(sun);
  const group=new THREE.Group();scene.add(group);
  const shaftGeo=new THREE.PlaneGeometry(2.4,25);
  const rng=seeded(7391);
  for(let i=0;i<quality.shafts;i++){
    const shaft=new THREE.Mesh(shaftGeo,makeShaftMaterial());
    shaft.position.set(-10+rng()*20,7,-5-rng()*18);shaft.rotation.z=(-.13+rng()*.12);shaft.scale.x=.6+rng()*1.2;group.add(shaft);
  }
  const seabedMat=new THREE.MeshStandardMaterial({color:0x17372f,roughness:1,metalness:0});
  const seabed=new THREE.Mesh(new THREE.PlaneGeometry(80,80,24,24),seabedMat);seabed.rotation.x=-Math.PI/2;seabed.position.y=-7.2;group.add(seabed);
  const rockMat=new THREE.MeshStandardMaterial({color:0x27443d,roughness:.96});
  for(let i=0;i<22;i++){
    const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.45+rng()*1.4,2),rockMat);
    rock.position.set(-16+rng()*32,-6.7,-4-rng()*28);rock.scale.set(1.4+rng()*1.8,.45+rng()*.8,.9+rng()*1.2);rock.rotation.set(rng(),rng(),rng());group.add(rock);
  }
  const particles=new THREE.BufferGeometry();const pos=new Float32Array(quality.particles*3);
  for(let i=0;i<quality.particles;i++){pos[i*3]=-20+rng()*40;pos[i*3+1]=-7+rng()*18;pos[i*3+2]=-3-rng()*32}particles.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const points=new THREE.Points(particles,new THREE.PointsMaterial({color:0x9edbd2,size:.035,transparent:true,opacity:.34,depthWrite:false}));group.add(points);
  let caustic=null;
  if(quality.caustics){caustic=new THREE.Mesh(new THREE.PlaneGeometry(42,36),makeCausticMaterial());caustic.rotation.x=-Math.PI/2;caustic.position.y=-7.05;group.add(caustic)}
  return {group,update(time){points.rotation.y=time*.006;if(caustic)caustic.material.uniforms.uTime.value=time}};
}
