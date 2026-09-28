(()=>{'use strict';
const host=document.querySelector('.oceanProbe'),canvas=host?.querySelector('canvas');if(!host||!canvas)return;
const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance'});if(!gl){host.dataset.failed='webgl2';return}
const VS=`#version 300 es
precision highp float;
const vec2 P[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
void main(){gl_Position=vec4(P[gl_VertexID],0.,1.);}`;
const FS=`#version 300 es
precision highp float;
out vec4 outColor;uniform vec2 r;uniform float t;uniform vec2 look;
float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+17.7;a*=.5;}return v;}
float caustic(vec2 p){float v=0.;for(int i=0;i<3;i++){p=abs(p)/dot(p,p)-.72;v+=exp(-7.*abs(sin(p.x*2.2+t*.16)+sin(p.y*2.05-t*.12)))*.34;}return clamp(v,0.,1.);}
void main(){
 vec2 uv=(gl_FragCoord.xy*2.-r)/r.y;uv+=look*vec2(.18,.11);
 float y=uv.y;
 vec3 deep=vec3(.006,.055,.082),mid=vec3(.015,.19,.245),surface=vec3(.12,.47,.52);
 float column=smoothstep(-1.05,.96,y);vec3 col=mix(deep,mid,column);col=mix(col,surface,smoothstep(.48,1.05,y)*.68);
 // soft volumetric shafts: broad, irregular, never bubble-like
 float haze=fbm(vec2(uv.x*1.7-t*.025,y*.72+t*.018));
 float rayA=pow(max(0.,1.-abs(uv.x*.92+y*.18-.05+haze*.16)),7.);
 float rayB=pow(max(0.,1.-abs(uv.x*1.35-y*.11+.28-haze*.12)),10.);
 float rays=(rayA*.7+rayB*.42)*smoothstep(-.72,.92,y)*smoothstep(1.12,.12,y);
 col+=vec3(.17,.46,.43)*rays*.28;
 // distant reef line gives scale without pre-baked animals
 float ridge=-.19+fbm(vec2(uv.x*3.1+7.,2.))*-.12;
 float distant=1.-smoothstep(ridge-.025,ridge+.025,y);
 col=mix(col,vec3(.008,.07,.075),distant*.48*smoothstep(-.72,.12,y));
 // sandy floor in perspective
 float floorMask=1.-smoothstep(-.34,-.10,y);
 float d=max(.055,-y-.045);vec2 wp=vec2(uv.x/(d*.72),1./d);wp.x+=look.x*.8;wp.y+=t*.018;
 float grain=fbm(wp*1.15);float c=caustic(wp*.42);
 vec3 sand=mix(vec3(.055,.20,.19),vec3(.19,.40,.34),grain*.58);sand+=vec3(.28,.55,.45)*c*.24;
 float distanceFog=smoothstep(.12,.95,d);sand=mix(mid*.55,sand,distanceFog);
 col=mix(col,sand,floorMask*.9);
 // natural surface shimmer at the top
 float shimmer=fbm(vec2(uv.x*7.+t*.06,y*12.-t*.04));col+=vec3(.16,.38,.35)*shimmer*smoothstep(.58,1.08,y)*.15;
 // fine marine snow, deliberately tiny and sparse
 vec2 cell=floor((uv+vec2(t*.004,-t*.009))*vec2(58.,84.));vec2 f=fract((uv+vec2(t*.004,-t*.009))*vec2(58.,84.));float h=hash21(cell);float dotp=(h>.965)?smoothstep(.07,0.,length(f-vec2(hash21(cell+2.3),hash21(cell+8.1)))):0.;col+=vec3(.38,.62,.58)*dotp*.18;
 // depth vignette and filmic response
 float vig=1.-.20*dot(uv*vec2(.85,.42),uv*vec2(.85,.42));col*=clamp(vig,.68,1.);
 col=col/(col+vec3(.72));col=pow(col,vec3(.88));outColor=vec4(col,1.);
}`;
function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
const ur=gl.getUniformLocation(p,'r'),ut=gl.getUniformLocation(p,'t'),ul=gl.getUniformLocation(p,'look');let look=[0,0],target=[0,0],down=null,raf=0;
function size(){const b=host.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(b.width*d)),h=Math.max(1,Math.round(b.height*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}return[w,h]}
function frame(ms){const [w,h]=size();look[0]+=(target[0]-look[0])*.055;look[1]+=(target[1]-look[1])*.055;gl.uniform2f(ur,w,h);gl.uniform1f(ut,ms*.001);gl.uniform2f(ul,look[0],look[1]);gl.drawArrays(gl.TRIANGLES,0,3);raf=requestAnimationFrame(frame)}
host.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY,target[0],target[1]];host.setPointerCapture?.(e.pointerId)});host.addEventListener('pointermove',e=>{if(!down)return;target[0]=Math.max(-1,Math.min(1,down[2]+(e.clientX-down[0])/260));target[1]=Math.max(-.7,Math.min(.7,down[3]-(e.clientY-down[1])/360))});const end=()=>down=null;host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);host.dataset.ready='true';raf=requestAnimationFrame(frame);
})();