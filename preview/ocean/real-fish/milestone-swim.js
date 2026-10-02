(function(root){'use strict';
const profiles={
 clownfish:{family:'reef-dart',duration:9,travel:8,bob:2,body:1.8},
 'sea-turtle':{family:'turtle-stroke',duration:24,travel:3,bob:.7,body:2.5},
 'ocean-sunfish':{family:'sunfish-scull',duration:17,travel:5,bob:4,body:2},
 'giant-octopus':{family:'octopus-drift',duration:19,travel:5,bob:3,body:3},
 'manta-ray':{family:'rigid-glide',duration:24,travel:3,bob:.35,body:4},
 dolphin:{family:'rigid-cruise',duration:18,travel:3.5,bob:.45,body:3},
 'hammerhead-shark':{family:'shark-cruise',duration:24,travel:4,bob:.28,body:2},
 'large-shark':{family:'shark-cruise',duration:27,travel:4,bob:.25,body:1.8},
 dugong:{family:'rigid-cruise',duration:28,travel:2.5,bob:.3,body:2},
 'minke-whale':{family:'cetacean-cruise',duration:32,travel:3.5,bob:.4,body:2},
 orca:{family:'cetacean-cruise',duration:26,travel:4,bob:.45,body:2.4},
 'humpback-whale':{family:'cetacean-cruise',duration:36,travel:4,bob:.5,body:2.8},
 'whale-shark':{family:'shark-cruise',duration:38,travel:3.5,bob:.35,body:1.5},
 'blue-whale':{family:'cetacean-cruise',duration:42,travel:4,bob:.4,body:1.6}
};
const fallback={family:'gentle-cruise',duration:22,travel:8,bob:3,body:2};
let rotationTimer=null;
function profileFor(key){return key&&profiles[key]?{key,...profiles[key]}:{key:key||'unknown',...fallback};}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative][data-swim-profile]{transform-origin:50% 50%}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"],[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important}
[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important}
[data-commemorative][data-swim-active="1"]{animation-name:milestoneForwardPass!important;animation-duration:var(--swim-duration)!important;animation-timing-function:linear!important;animation-iteration-count:infinite!important;will-change:transform}
[data-commemorative][data-swim-profile="turtle-stroke"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-glide"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="shark-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="cetacean-cruise"]:not([data-swim-active="1"]){animation:none!important;transform:none!important;will-change:auto!important}
.milestoneAtlasCreature,.milestoneAtlasCreature > img{animation:none!important;transform:none!important;will-change:auto!important}
@keyframes milestoneFishRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(0deg)}42%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0) rotateY(0deg)}49%{transform:translate3d(calc(var(--swim-travel)*.62),calc(var(--swim-bob)*-.5),0) rotateY(180deg)}91%{transform:translate3d(calc(var(--swim-travel)*-.55),var(--swim-bob),0) rotateY(180deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(360deg)}}
@keyframes milestoneDriftRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}25%{transform:translate3d(0,calc(var(--swim-bob)*-1),0) rotateZ(1.5deg)}50%{transform:translate3d(calc(var(--swim-travel)*.25),0,0) rotateZ(0deg)}75%{transform:translate3d(0,var(--swim-bob),0) rotateZ(-1.5deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}}
@keyframes milestoneForwardPass{0%{transform:translate3d(-35vw,0,0)}100%{transform:translate3d(85vw,0,0)}}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile]{animation:none!important}}
`;doc.head.appendChild(style);}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key);ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.dataset.swimKey=p.key;node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.body||p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');return p;}
function clearRotation(){if(rotationTimer!==null){if(root.clearTimeout)root.clearTimeout(rotationTimer);else if(root.clearInterval)root.clearInterval(rotationTimer);rotationTimer=null;}}
function activatePassThrough(nodes,maxActive=2){clearRotation();const list=(nodes||[]).filter(Boolean),requested=Math.min(Math.max(0,maxActive),list.length),cap=list.length>=8?1:requested;let cursor=0,active=[];const showWindow=()=>{for(const node of list)delete node.dataset.swimActive;active=[];if(!cap)return;for(let i=0;i<cap;i++){const node=list[(cursor+i)%list.length];if(node){node.dataset.swimActive='1';active.push(node)}}cursor=(cursor+cap)%Math.max(1,list.length);if(list.length>cap&&root.setTimeout){const dwell=Math.max(...active.map(node=>(parseFloat(node.style.getPropertyValue('--swim-duration'))||20)*1000))+600;rotationTimer=root.setTimeout(showWindow,dwell)}};showWindow();return active;}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,activatePassThrough,ensureStyles,clearRotation};
})(window);
