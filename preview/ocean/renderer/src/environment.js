import * as THREE from 'three';
const WATER_DEEP=new THREE.Color(0x031a2b);
function seeded(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)}
function makeShaftMaterial(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uColor:{value:new THREE.Color(0x9be7dd)},uOpacity:{value:.105}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;void main(){float x=abs(vUv.x-.5)*2.;float side=pow(max(0.,1.-x*x),2.4);float top=smoothstep(0.,.16,vUv.y);float bottom=1.-smoothstep(.48,1.,vUv.y);gl_FragColor=vec4(uColor,uOpacity*side*top*bottom);}'})}
function makeCausticMaterial(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(0x70d8cf)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime;uniform vec3 uColor;void main(){vec2 p=vUv*14.;float a=sin(p.x*1.7+sin(p.y+uTime*.45));float b=sin(p.y*2.1+sin(p.x-uTime*.35));float c=sin((p.x+p.y)*1.2+uTime*.3);float line=smoothstep(.73,.99,(a+b+c)/3.*.5+.5);float edge=smoothstep(0.,.18,vUv.x)*smoothstep(0.,.18,vUv.y)*smoothstep(0.,.18,1.-vUv.x)*smoothstep(0.,.18,1.-vUv.y);gl_FragColor=vec4(uColor,line*.12*edge);}'})}
function addKelp(group,rng,x,z,height){
 const pts=[];for(let i=0;i<7;i++){const t=i/6;pts.push(new THREE.Vector3(x+Math.sin(t*4.2+rng()*1.2)*.22,-6.9+t*height,z+Math.cos(t*3.4)*.12))}
 const curve=new THREE.CatmullRomCurve3(pts),mat=new THREE.MeshStandardMaterial({color:0x245d4d,roughness:.9,side:THREE.DoubleSide});
 group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,28,.055,6,false),mat));
 for(let i=2;i<6;i++){const p=curve.getPoint(i/6),leaf=new THREE.Mesh(new THREE.PlaneGeometry(.28,.9),mat);leaf.position.copy(p);leaf.rotation.set(0,rng()*Math.PI,(-.5+rng())*.5);group.add(leaf)}
}
export function createEnvironment(scene,quality){
 scene.background=WATER_DEEP.clone();scene.fog=new THREE.FogExp2(0x082f42,0.023);
 scene.add(new THREE.HemisphereLight(0x8ed8d3,0x03131f,1.35));const sun=new THREE.DirectionalLight(0xb6fff1,2.2);sun.position.set(-8,18,4);scene.add(sun);
 const group=new THREE.Group();scene.add(group);const rng=seeded(7391),shaftGeo=new THREE.PlaneGeometry(2.8,27);
 for(let i=0;i<quality.shafts;i++){const shaft=new THREE.Mesh(shaftGeo,makeShaftMaterial());shaft.position.set(-11+rng()*22,7,-8-rng()*20);shaft.rotation.z=(-.12+rng()*.09);shaft.scale.x=.75+rng()*1.35;group.add(shaft)}
 const seabed=new THREE.Mesh(new THREE.PlaneGeometry(90,90,18,18),new THREE.MeshStandardMaterial({color:0x102f2c,roughness:1}));seabed.rotation.x=-Math.PI/2;seabed.position.y=-7.2;group.add(seabed);
 const rockMat=new THREE.MeshStandardMaterial({color:0x1f3f3a,roughness:1});for(let i=0;i<12;i++){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.35+rng()*.7,1),rockMat);rock.position.set(-14+rng()*28,-6.75,-12-rng()*24);rock.scale.set(1.3+rng()*1.3,.45+rng()*.5,.8+rng()*.8);rock.rotation.set(rng(),rng(),rng());group.add(rock)}
 for(let i=0;i<15;i++)addKelp(group,rng,-12+rng()*24,-11-rng()*23,1.8+rng()*3.8);
 const particles=new THREE.BufferGeometry(),pos=new Float32Array(quality.particles*3);for(let i=0;i<quality.particles;i++){pos[i*3]=-20+rng()*40;pos[i*3+1]=-7+rng()*18;pos[i*3+2]=-5-rng()*34}particles.setAttribute('position',new THREE.BufferAttribute(pos,3));const points=new THREE.Points(particles,new THREE.PointsMaterial({color:0xa7ded5,size:.03,transparent:true,opacity:.28,depthWrite:false}));group.add(points);
 let caustic=null;if(quality.caustics){caustic=new THREE.Mesh(new THREE.PlaneGeometry(44,38),makeCausticMaterial());caustic.rotation.x=-Math.PI/2;caustic.position.set(0,-7.04,-17);group.add(caustic)}
 return {group,update(time){points.rotation.y=time*.004;if(caustic)caustic.material.uniforms.uTime.value=time}};
}
