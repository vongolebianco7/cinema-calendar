import { POC_MODES, POC_STATES, DEFAULT_SEED, scenarioFromSearch } from './poc-config.js';

const { mode, scenario } = scenarioFromSearch();
const stage = document.querySelector('#stage');
const hud = document.querySelector('#hud');
const modes = document.querySelector('#modes');
const states = document.querySelector('#states');

function href(nextMode, nextState) {
  const q = new URLSearchParams({ mode: nextMode, pocState: String(nextState), seed: scenario.seed || DEFAULT_SEED });
  return `?${q}`;
}

POC_MODES.forEach((id) => {
  const a = document.createElement('a');
  a.href = href(id, scenario.state); a.textContent = id; if (id === mode) a.className = 'active'; modes.append(a);
});
POC_STATES.forEach((value) => {
  const a = document.createElement('a');
  a.href = href(mode, value); a.textContent = `${value}本`; if (value === scenario.state) a.className = 'active'; states.append(a);
});

const metrics = { frames: [], longFrames: 0, started: performance.now(), ready: 0 };
let last = performance.now();
function tick(now) {
  const dt = now - last; last = now;
  if (dt < 1000) { metrics.frames.push(dt); if (dt > 50) metrics.longFrames += 1; if (metrics.frames.length > 360) metrics.frames.shift(); }
  const sorted = [...metrics.frames].sort((a,b)=>a-b);
  const median = sorted.length ? sorted[Math.floor(sorted.length/2)] : 0;
  const fps = median ? 1000 / median : 0;
  hud.innerHTML = `<b>PoC ${mode} · ${scenario.state}本</b><br>seed ${scenario.seed}<br>FPS median ${fps.toFixed(0)} · long ${metrics.longFrames}<br>ready ${metrics.ready ? metrics.ready.toFixed(0)+'ms' : '…'}`;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function canvas2d(kind) {
  const canvas = document.createElement('canvas'); stage.append(canvas);
  const ctx = canvas.getContext('2d'); let w=0,h=0,dpr=1;
  const resize=()=>{dpr=Math.min(devicePixelRatio||1,2);w=stage.clientWidth;h=stage.clientHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};resize();addEventListener('resize',resize);
  const fishCount = Math.min(34, Math.round(scenario.stats.species * 1.3 + scenario.habitat.schools * 2));
  const seedNum = [...scenario.seed].reduce((a,c)=>a+c.charCodeAt(0),0)+scenario.state;
  const rnd=(i)=>{const x=Math.sin((i+1)*(seedNum+17))*43758.5453;return x-Math.floor(x)};
  function fish(x,y,s,t){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=`hsla(${175+t*28},42%,${55+t*12}%,.9)`;ctx.beginPath();ctx.ellipse(0,0,16,7,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-25,-8);ctx.lineTo(-23,8);ctx.closePath();ctx.fill();ctx.restore()}
  function draw(now){
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0a6670');g.addColorStop(.42,'#0a4b51');g.addColorStop(1,'#092f31');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.18;for(let i=0;i<42;i++){const x=(rnd(i)*w+now*.006*(i%3+1))%w,y=rnd(i+50)*h;ctx.fillStyle='#d9fff3';ctx.beginPath();ctx.arc(x,y,1+rnd(i+90)*2,0,7);ctx.fill()}ctx.globalAlpha=1;
    const floor=h*.72;const sand=ctx.createLinearGradient(0,floor,0,h);sand.addColorStop(0,'#526d58');sand.addColorStop(1,'#263f37');ctx.fillStyle=sand;ctx.beginPath();ctx.moveTo(0,floor+10);for(let x=0;x<=w;x+=24)ctx.lineTo(x,floor+Math.sin(x*.027)*9+Math.sin(x*.011)*14);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
    const growth=scenario.maturity;for(let i=0;i<Math.round(4+growth*18);i++){const x=rnd(i+130)*w,base=h*(.76+rnd(i+160)*.18),len=18+rnd(i+190)*(32+growth*55);ctx.strokeStyle=`rgba(${55+Math.round(rnd(i)*35)},${105+Math.round(rnd(i+3)*45)},75,.8)`;ctx.lineWidth=2+rnd(i+6)*3;ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+Math.sin(now*.001+i)*8,base-len*.55,x+Math.sin(now*.0013+i)*12,base-len);ctx.stroke()}
    for(let i=0;i<fishCount;i++){const x=(rnd(i+230)*w+now*(.008+rnd(i)*.012))%(w+70)-35,y=h*(.18+rnd(i+260)*.48),s=.45+rnd(i+290)*.55;fish(x,y,s,rnd(i+310))}
    if(kind==='D'){ctx.globalCompositeOperation='screen';const glow=ctx.createRadialGradient(w*.55,h*.05,10,w*.55,h*.05,h*.9);glow.addColorStop(0,'rgba(190,255,235,.22)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over'}
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);return Promise.resolve();
}

async function mountA() {
  const mod = await import('../renderer/dist/ocean-renderer.js');
  const host = document.createElement('div'); host.style.cssText='width:100%;height:100%'; stage.append(host);
  await mod.mountOcean(host, scenario);
}

async function mountB() {
  // WebGPU candidate is deliberately capability-gated; no silent visual claim.
  if (!('gpu' in navigator)) throw new Error('WebGPU unavailable on this browser');
  return mountA();
}

async function mountC() { return mountA(); }
async function mountD() { return canvas2d('D'); }
async function mountE() { return canvas2d('E'); }

const mounts={A:mountA,B:mountB,C:mountC,D:mountD,E:mountE};
try {
  await mounts[mode]();
  metrics.ready=performance.now()-metrics.started;
  document.documentElement.dataset.pocReady='true';
} catch (error) {
  metrics.ready=performance.now()-metrics.started;
  hud.innerHTML=`<b>PoC ${mode} FAIL</b><br>${error.message}`;hud.classList.add('fail');
  document.documentElement.dataset.pocReady='false';
  console.error(error);
}
window.__OCEAN_POC__={mode,scenario,metrics};
