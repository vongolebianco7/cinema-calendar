(function(){'use strict';
const profiles={
  'dense-school-cruise':{dur:11,bob:.8,travel:3.2},
  'loose-school-glide':{dur:14,bob:1.3,travel:3.8},
  'small-school-cruise':{dur:13,bob:1.1,travel:3.4},
  'hover-dart':{dur:7,bob:2.8,travel:1.1},
  'reef-dart':{dur:6.2,bob:1.9,travel:2},
  'fin-drift':{dur:17,bob:1.4,travel:1.7},
  'heavy-cruise':{dur:20,bob:.55,travel:2.1}
};
function ensureStyle(){if(document.getElementById('ordinarySpeciesMotionStyle'))return;const style=document.createElement('style');style.id='ordinarySpeciesMotionStyle';style.textContent=`
.ordinaryMotion .fishBody{animation:ordinarySwimBody var(--ordinary-dur,14s) ease-in-out var(--ordinary-delay,0s) infinite;transform-origin:52% 52%;will-change:transform}
.ordinaryMotion.ordinarySchooling .fishBody{animation-timing-function:cubic-bezier(.45,.05,.35,.95)}
.ordinaryMotion[data-motion-profile="hover-dart"] .fishBody{animation-name:ordinaryHoverDart;animation-timing-function:cubic-bezier(.4,0,.2,1)}
.ordinaryMotion[data-motion-profile="reef-dart"] .fishBody{animation-name:ordinaryReefDart;animation-timing-function:cubic-bezier(.2,.8,.3,1)}
.ordinaryMotion[data-motion-profile="fin-drift"] .fishBody{animation-name:ordinaryFinDrift}
.ordinaryMotion[data-motion-profile="heavy-cruise"] .fishBody{animation-name:ordinaryHeavyCruise}
@keyframes ordinarySwimBody{0%,100%{transform:translate3d(0,0,0) rotate(-.6deg)}45%{transform:translate3d(var(--ordinary-travel),calc(var(--ordinary-bob)*-1),0) rotate(.7deg)}72%{transform:translate3d(calc(var(--ordinary-travel)*.45),var(--ordinary-bob),0) rotate(-.2deg)}}
@keyframes ordinaryHoverDart{0%,18%,100%{transform:translate3d(0,0,0) rotate(-1deg)}34%{transform:translate3d(calc(var(--ordinary-travel)*2.4),calc(var(--ordinary-bob)*-1),0) rotate(1.4deg)}55%{transform:translate3d(calc(var(--ordinary-travel)*.7),var(--ordinary-bob),0) rotate(-.5deg)}}
@keyframes ordinaryReefDart{0%,12%,100%{transform:translate3d(0,0,0) rotate(-1deg)}29%{transform:translate3d(calc(var(--ordinary-travel)*2.8),calc(var(--ordinary-bob)*-.7),0) rotate(1.8deg)}48%{transform:translate3d(calc(var(--ordinary-travel)*.8),var(--ordinary-bob),0) rotate(-1deg)}68%{transform:translate3d(calc(var(--ordinary-travel)*2),0,0) rotate(.8deg)}}
@keyframes ordinaryFinDrift{0%,100%{transform:translate3d(0,0,0) rotate(-1.1deg)}50%{transform:translate3d(var(--ordinary-travel),calc(var(--ordinary-bob)*-1),0) rotate(1.1deg)}}
@keyframes ordinaryHeavyCruise{0%,100%{transform:translate3d(0,0,0) rotate(-.2deg)}50%{transform:translate3d(var(--ordinary-travel),calc(var(--ordinary-bob)*-1),0) rotate(.2deg)}}`;(document.head||document.documentElement).appendChild(style)}
function applyNode(node){if(!(node instanceof Element))return;const profile=node.dataset.motionProfile;if(!profile||!profiles[profile])return;ensureStyle();const p=profiles[profile],seed=[...(node.dataset.creatureId||profile)].reduce((n,c)=>n+c.charCodeAt(0),0),schooling=node.dataset.schooling==='1';node.classList.add('ordinaryMotion');node.classList.toggle('ordinarySchooling',schooling);node.style.setProperty('--ordinary-dur',`${p.dur}s`);node.style.setProperty('--ordinary-bob',`${p.bob}px`);node.style.setProperty('--ordinary-travel',`${p.travel}px`);node.style.setProperty('--ordinary-delay',`${-(seed%70)/10}s`)}
function applyAll(root=document){root.querySelectorAll?.('[data-motion-profile]').forEach(applyNode);if(root.matches?.('[data-motion-profile]'))applyNode(root)}
function boot(){ensureStyle();const stage=document.getElementById('stage');if(!stage)return;applyAll(stage);new MutationObserver(mutations=>{for(const mutation of mutations){for(const node of mutation.addedNodes)applyAll(node)}}).observe(stage,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.CinemapOceanOrdinaryMotion={profiles,applyNode,applyAll};
})();