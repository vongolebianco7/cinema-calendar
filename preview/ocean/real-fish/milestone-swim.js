(function(root){'use strict';
const PULSE_STEPS=800;
const PULSE_ROUTE_DURATION_FACTOR=50;
const profiles={
 clownfish:{family:'reef-dart',duration:9,travel:8,bob:2,body:1.8,direction:'forward'},
 'sea-turtle':{family:'turtle-stroke',duration:26,travel:3,bob:.7,body:2.5,direction:'forward'},
 'ocean-sunfish':{family:'sunfish-scull',duration:17,travel:5,bob:4,body:2,direction:'forward'},
 'giant-octopus':{family:'octopus-drift',duration:19,travel:5,bob:3,body:3,direction:'forward'},
 'manta-ray':{family:'rigid-glide',duration:28,travel:3,bob:.6,body:4,direction:'reverse'},
 dolphin:{family:'rigid-cruise',duration:20,travel:3.5,bob:.65,body:3,direction:'reverse'},
 'hammerhead-shark':{family:'shark-cruise',duration:27,travel:4,bob:.45,body:2,direction:'forward'},
 'large-shark':{family:'shark-cruise',duration:31,travel:4,bob:.4,body:1.8,direction:'forward'},
 dugong:{family:'rigid-cruise',duration:31,travel:2.5,bob:.55,body:2,direction:'reverse'},
 'minke-whale':{family:'cetacean-cruise',duration:36,travel:3.5,bob:.55,body:2,direction:'forward'},
 orca:{family:'cetacean-cruise',duration:30,travel:4,bob:.7,body:2.4,direction:'forward'},
 'humpback-whale':{family:'cetacean-cruise',duration:42,travel:4,bob:.75,body:2.8,direction:'forward'},
 'whale-shark':{family:'shark-cruise',duration:46,travel:3.5,bob:.55,body:1.5,direction:'forward'},
 'blue-whale':{family:'cetacean-cruise',duration:50,travel:4,bob:.6,body:1.6,direction:'forward'}
};
const fallback={family:'gentle-cruise',duration:24,travel:8,bob:2,body:2,direction:'forward'};
let rotationTimer=null;
function profileFor(key){return key&&profiles[key]?{key,...profiles[key]}:{key:key||'unknown',...fallback};}
function buildPulseRoute(name,start,end,tilt){
  const out=['@keyframes '+name+'{'],step=(end-start)/PULSE_STEPS;
  for(let i=0;i<PULSE_STEPS;i++){
    const p0=(i/PULSE_STEPS*100).toFixed(4),pMove=((i+.48)/PULSE_STEPS*100).toFixed(4),pHold=((i+1)/PULSE_STEPS*100).toFixed(4);
    const x0=(start+step*i).toFixed(4),x1=(start+step*(i+1)).toFixed(4),wave=((i%2?1:-1)*.08).toFixed(2),angle=((i%2?1:-1)*tilt).toFixed(2);
    const y='calc(var(--swim-lane-y) + var(--swim-wave)*'+wave+')';
    const pose='translate3d('+x1+'vw,'+y+',0) rotateZ('+angle+'deg)';
    out.push(p0+'%{transform:translate3d('+x0+'vw,'+y+',0) rotateZ('+angle+'deg);animation-timing-function:cubic-bezier(.18,.72,.28,1)}');
    out.push(pMove+'%{transform:'+pose+'}');
    out.push(pHold+'%{transform:'+pose+'}');
  }
  out.push('}');return out.join('');
}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative][data-swim-profile]{transform-origin:50% 50%}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"],[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important}
[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important}
[data-commemorative][data-swim-active="1"][data-swim-cadence="pulse-glide"]{animation-duration:var(--swim-route-duration)!important;animation-timing-function:ease-in-out!important;animation-delay:var(--swim-delay,0s)!important;animation-iteration-count:infinite!important;will-change:transform}
[data-commemorative][data-swim-active="1"][data-swim-direction="forward"]{animation-name:milestoneForwardNatural!important}
[data-commemorative][data-swim-active="1"][data-swim-direction="reverse"]{animation-name:milestoneReverseNatural!important}
[data-commemorative][data-swim-profile="turtle-stroke"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-glide"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="shark-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="cetacean-cruise"]:not([data-swim-active="1"]){animation:none!important;transform:none!important;will-change:auto!important}
.milestoneAtlasCreature,.milestoneAtlasCreature > img{animation:none!important;transform:none!important;will-change:auto!important}
@keyframes milestoneFishRoute{0%,100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0)}45%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0)}72%{transform:translate3d(calc(var(--swim-travel)*.2),var(--swim-bob),0)}}
@keyframes milestoneDriftRoute{0%,100%{transform:translate3d(calc(var(--swim-travel)*-.12),0,0) rotateZ(-.4deg)}30%{transform:translate3d(calc(var(--swim-travel)*.05),calc(var(--swim-bob)*-.45),0) rotateZ(.5deg)}60%{transform:translate3d(calc(var(--swim-travel)*.16),0,0) rotateZ(0deg)}82%{transform:translate3d(calc(var(--swim-travel)*.08),calc(var(--swim-bob)*.45),0) rotateZ(-.5deg)}}
${buildPulseRoute('milestoneForwardNatural',-72,128,.04)}
${buildPulseRoute('milestoneReverseNatural',128,-72,.04)}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile]{animation:none!important}}
`;doc.head.appendChild(style);}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key);ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.dataset.swimKey=p.key;node.dataset.swimDirection=p.direction||'forward';node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-route-duration',(p.duration*PULSE_ROUTE_DURATION_FACTOR)+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.body||p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');node.style.setProperty('--swim-wave',Math.max(.25,Math.min(.9,p.bob))+'vh');return p;}
function clearRotation(){if(rotationTimer!==null){if(root.clearTimeout)root.clearTimeout(rotationTimer);else if(root.clearInterval)root.clearInterval(rotationTimer);rotationTimer=null;}}
function activatePassThrough(nodes,maxActive){clearRotation();const list=(nodes||[]).filter(Boolean),count=list.length,lanes=[-13,-7,-2,4,10,15,-10,8,-15,1,13];for(const node of list){delete node.dataset.swimActive;delete node.dataset.swimCadence;node.style.removeProperty('--swim-delay');node.style.removeProperty('--swim-lane-y');}const active=list.slice(0,count);for(const [index,node] of active.entries()){const routeDuration=parseFloat(node.style.getPropertyValue('--swim-route-duration'))||120,phase=(index+.37)/(Math.max(1,count)),lane=lanes[index%lanes.length];node.dataset.swimActive='1';node.dataset.swimCadence='pulse-glide';node.style.left='0%';node.style.top='40%';node.style.setProperty('--swim-delay',(-routeDuration*phase).toFixed(2)+'s');node.style.setProperty('--swim-lane-y',lane+'vh');}return active;}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,activatePassThrough,ensureStyles,clearRotation,buildPulseRoute,PULSE_STEPS,PULSE_ROUTE_DURATION_FACTOR};
})(window);
