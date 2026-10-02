(function(root){'use strict';
const profiles={
 clownfish:{family:'reef-dart',duration:9,travel:8,bob:2,body:1.8,direction:'forward'},
 'sea-turtle':{family:'turtle-stroke',duration:26,travel:3,bob:.7,body:2.5,direction:'forward'},
 'ocean-sunfish':{family:'sunfish-scull',duration:17,travel:5,bob:4,body:2,direction:'forward'},
 'giant-octopus':{family:'octopus-drift',duration:19,travel:5,bob:3,body:3,direction:'forward'},
 'manta-ray':{family:'rigid-glide',duration:28,travel:3,bob:.6,body:4,direction:'reverse'},
 dolphin:{family:'rigid-cruise',duration:20,travel:3.5,bob:.65,body:3,direction:'forward'},
 'hammerhead-shark':{family:'shark-cruise',duration:27,travel:4,bob:.45,body:2,direction:'forward'},
 'large-shark':{family:'shark-cruise',duration:31,travel:4,bob:.4,body:1.8,direction:'forward'},
 dugong:{family:'rigid-cruise',duration:31,travel:2.5,bob:.55,body:2,direction:'forward'},
 'minke-whale':{family:'cetacean-cruise',duration:36,travel:3.5,bob:.55,body:2,direction:'forward'},
 orca:{family:'cetacean-cruise',duration:30,travel:4,bob:.7,body:2.4,direction:'forward'},
 'humpback-whale':{family:'cetacean-cruise',duration:42,travel:4,bob:.75,body:2.8,direction:'forward'},
 'whale-shark':{family:'shark-cruise',duration:46,travel:3.5,bob:.55,body:1.5,direction:'forward'},
 'blue-whale':{family:'cetacean-cruise',duration:50,travel:4,bob:.6,body:1.6,direction:'forward'}
};
const fallback={family:'gentle-cruise',duration:24,travel:8,bob:2,body:2,direction:'forward'};
let rotationTimer=null;
function profileFor(key){return key&&profiles[key]?{key,...profiles[key]}:{key:key||'unknown',...fallback};}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative][data-swim-profile]{transform-origin:50% 50%}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"],[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important}
[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important}
[data-commemorative][data-swim-active="1"]{animation-duration:var(--swim-duration)!important;animation-timing-function:cubic-bezier(.37,.02,.63,.98)!important;animation-delay:var(--swim-delay,0s)!important;animation-iteration-count:infinite!important;will-change:transform}
[data-commemorative][data-swim-active="1"][data-swim-direction="forward"]{animation-name:milestoneForwardNatural!important}
[data-commemorative][data-swim-active="1"][data-swim-direction="reverse"]{animation-name:milestoneReverseNatural!important}
[data-commemorative][data-swim-profile="turtle-stroke"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-glide"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="shark-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="cetacean-cruise"]:not([data-swim-active="1"]){animation:none!important;transform:none!important;will-change:auto!important}
.milestoneAtlasCreature,.milestoneAtlasCreature > img{animation:none!important;transform:none!important;will-change:auto!important}
@keyframes milestoneFishRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(0deg)}42%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0) rotateY(0deg)}49%{transform:translate3d(calc(var(--swim-travel)*.62),calc(var(--swim-bob)*-.5),0) rotateY(180deg)}91%{transform:translate3d(calc(var(--swim-travel)*-.55),var(--swim-bob),0) rotateY(180deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(360deg)}}
@keyframes milestoneDriftRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}25%{transform:translate3d(0,calc(var(--swim-bob)*-1),0) rotateZ(1.5deg)}50%{transform:translate3d(calc(var(--swim-travel)*.25),0,0) rotateZ(0deg)}75%{transform:translate3d(0,var(--swim-bob),0) rotateZ(-1.5deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}}
@keyframes milestoneForwardNatural{0%{transform:translate3d(-72vw,var(--swim-lane-y),0) rotateZ(-.35deg)}16%{transform:translate3d(-48vw,calc(var(--swim-lane-y) - var(--swim-wave)*.55),0) rotateZ(.2deg)}38%{transform:translate3d(-8vw,calc(var(--swim-lane-y) + var(--swim-wave)*.3),0) rotateZ(.35deg)}63%{transform:translate3d(46vw,calc(var(--swim-lane-y) - var(--swim-wave)*.4),0) rotateZ(-.15deg)}84%{transform:translate3d(91vw,calc(var(--swim-lane-y) + var(--swim-wave)*.5),0) rotateZ(.2deg)}100%{transform:translate3d(128vw,var(--swim-lane-y),0) rotateZ(-.35deg)}}
@keyframes milestoneReverseNatural{0%{transform:translate3d(128vw,var(--swim-lane-y),0) rotateZ(.3deg)}17%{transform:translate3d(96vw,calc(var(--swim-lane-y) + var(--swim-wave)*.45),0) rotateZ(-.2deg)}39%{transform:translate3d(54vw,calc(var(--swim-lane-y) - var(--swim-wave)*.35),0) rotateZ(-.3deg)}64%{transform:translate3d(8vw,calc(var(--swim-lane-y) + var(--swim-wave)*.5),0) rotateZ(.15deg)}85%{transform:translate3d(-39vw,calc(var(--swim-lane-y) - var(--swim-wave)*.4),0) rotateZ(-.2deg)}100%{transform:translate3d(-72vw,var(--swim-lane-y),0) rotateZ(.3deg)}}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile]{animation:none!important}}
`;doc.head.appendChild(style);}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key);ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.dataset.swimKey=p.key;node.dataset.swimDirection=p.direction||'forward';node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.body||p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');node.style.setProperty('--swim-wave',Math.max(.35,Math.min(1.4,p.bob*1.35))+'vh');return p;}
function clearRotation(){if(rotationTimer!==null){if(root.clearTimeout)root.clearTimeout(rotationTimer);else if(root.clearInterval)root.clearInterval(rotationTimer);rotationTimer=null;}}
function activatePassThrough(nodes,maxActive){clearRotation();const list=(nodes||[]).filter(Boolean),count=list.length,lanes=[-13,-7,-2,4,10,15,-10,8,-15,1,13];for(const node of list){delete node.dataset.swimActive;node.style.removeProperty('--swim-delay');node.style.removeProperty('--swim-lane-y');}const active=list.slice(0,count);for(const [index,node] of active.entries()){const duration=parseFloat(node.style.getPropertyValue('--swim-duration'))||24,phase=(index+.37)/(Math.max(1,count)),lane=lanes[index%lanes.length];node.dataset.swimActive='1';node.style.left='0%';node.style.setProperty('--swim-delay',(-duration*phase).toFixed(2)+'s');node.style.setProperty('--swim-lane-y',lane+'vh');}return active;}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,activatePassThrough,ensureStyles,clearRotation};
})(window);
