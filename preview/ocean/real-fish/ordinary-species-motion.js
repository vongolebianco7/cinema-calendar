(function(){'use strict';
const profiles={
  'dense-school-cruise':{dur:12,bob:1.2,travel:2.6},
  'loose-school-glide':{dur:15,bob:1.8,travel:3.4},
  'small-school-cruise':{dur:14,bob:1.5,travel:3},
  'hover-dart':{dur:7,bob:2.8,travel:1.1},
  'reef-dart':{dur:6.2,bob:1.9,travel:2},
  'fin-drift':{dur:17,bob:1.4,travel:1.7},
  'heavy-cruise':{dur:18,bob:.8,travel:2.4}
};
function applyNode(node){if(!(node instanceof Element))return;const profile=node.dataset.motionProfile;if(!profile||!profiles[profile])return;const p=profiles[profile];node.classList.add('ordinaryMotion');node.style.setProperty('--ordinary-dur',`${p.dur}s`);node.style.setProperty('--ordinary-bob',`${p.bob}px`);node.style.setProperty('--ordinary-travel',`${p.travel}px`);}
function applyAll(root=document){root.querySelectorAll?.('[data-motion-profile]').forEach(applyNode);if(root.matches?.('[data-motion-profile]'))applyNode(root)}
function boot(){const stage=document.getElementById('stage');if(!stage)return;applyAll(stage);new MutationObserver(mutations=>{for(const mutation of mutations){for(const node of mutation.addedNodes)applyAll(node)}}).observe(stage,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();window.CinemapOceanOrdinaryMotion={profiles,applyNode};
})();
