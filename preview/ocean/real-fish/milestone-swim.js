(function(root){'use strict';
const PULSE_STEPS=200;
const PULSE_ROUTE_DURATION_FACTOR=13;
const PULSE_ROUTE_SPAN_VW=50;
const ORDINARY_ASSET_UPGRADES={
 'optimized/species-blue-tang.svg':'optimized/species-butterflyfish.webp',
 'optimized/species-damselfish.svg':'optimized/species-aji.webp',
 'optimized/species-firefish.svg':'optimized/nase.webp',
 'optimized/species-lyretail-anthias.svg':'optimized/species-aji.webp',
 'optimized/species-six-line-wrasse.svg':'optimized/nase.webp',
 'optimized/species-sixline-wrasse.svg':'optimized/nase.webp',
 'optimized/species-threadfin-butterflyfish.svg':'optimized/species-butterflyfish.webp',
 'optimized/species-filefish.webp':'optimized/species-butterflyfish.webp',
 'optimized/species-filefish.svg':'optimized/species-butterflyfish.webp',
 'optimized/species-stingray.webp':'assets/milestone-manta-ray-v2.webp',
 'optimized/species-stingray.svg':'assets/milestone-manta-ray-v2.webp'
};
const profiles={
 clownfish:{family:'reef-dart',duration:9,travel:8,bob:2,body:1.8,direction:'forward'},
 'sea-turtle':{family:'turtle-stroke',duration:26,travel:3,bob:.7,body:2.5,direction:'forward'},
 'ocean-sunfish':{family:'sunfish-scull',duration:17,travel:5,bob:4,body:2,direction:'forward'},
 'giant-octopus':{family:'octopus-jet',duration:24,travel:2.5,bob:.55,body:1.9,direction:'forward'},
 'manta-ray':{family:'rigid-glide',duration:28,travel:3,bob:.6,body:4,direction:'reverse'},
 dolphin:{family:'rigid-cruise',duration:20,travel:3.5,bob:.65,body:3,direction:'reverse'},
 'hammerhead-shark':{family:'shark-cruise',duration:27,travel:4,bob:.45,body:2,direction:'reverse'},
 'large-shark':{family:'shark-cruise',duration:31,travel:4,bob:.4,body:1.8,direction:'forward'},
 dugong:{family:'rigid-cruise',duration:31,travel:2.5,bob:.55,body:2,direction:'reverse'},
 'minke-whale':{family:'cetacean-cruise',duration:36,travel:3.5,bob:.55,body:2,direction:'forward'},
 orca:{family:'cetacean-cruise',duration:30,travel:4,bob:.7,body:2.4,direction:'forward'},
 'humpback-whale':{family:'cetacean-cruise',duration:42,travel:4,bob:.75,body:2.8,direction:'forward'},
 'whale-shark':{family:'shark-cruise',duration:46,travel:3.5,bob:.55,body:1.5,direction:'forward'},
 'blue-whale':{family:'cetacean-cruise',duration:50,travel:4,bob:.6,body:1.6,direction:'forward'}
};
const fallback={family:'gentle-cruise',duration:24,travel:8,bob:2,body:2,direction:'forward'};
let rotationTimer=null,assetObserver=null;
function profileFor(key){return key&&profiles[key]?{key,...profiles[key]}:{key:key||'unknown',...fallback};}
function buildPulseRoute(name,start,end,tilt){const out=['@keyframes '+name+'{'],step=(end-start)/PULSE_STEPS;for(let i=0;i<PULSE_STEPS;i++){const p0=(i/PULSE_STEPS*100).toFixed(3),pMove=((i+.48)/PULSE_STEPS*100).toFixed(3),pHold=((i+1)/PULSE_STEPS*100).toFixed(3),x0=(start+step*i).toFixed(3),x1=(start+step*(i+1)).toFixed(3),wave=((i%2?1:-1)*.09).toFixed(2),angle=((i%2?1:-1)*tilt).toFixed(2),y='calc(var(--swim-lane-y) + var(--swim-wave)*'+wave+')',pose='translate3d('+x1+'vw,'+y+',0) rotateZ('+angle+'deg)';out.push(p0+'%{transform:translate3d('+x0+'vw,'+y+',0) rotateZ('+angle+'deg);animation-timing-function:cubic-bezier(.16,.62,.28,1)}');out.push(pMove+'%{transform:'+pose+'}');out.push(pHold+'%{transform:'+pose+'}')}out.push('}');return out.join('')}
function upgradedAsset(src){if(!src)return null;const clean=String(src).replace(/^.*\/preview\/ocean\/real-fish\//,'').split('?')[0];return ORDINARY_ASSET_UPGRADES[clean]||ORDINARY_ASSET_UPGRADES[String(src).split('?')[0]]||null}
function upgradeOrdinaryAssets(scope){const rootNode=scope?.querySelectorAll?scope:root.document;if(!rootNode)return 0;let count=0;for(const img of rootNode.querySelectorAll('.fishWrap:not([data-commemorative]) > img')){const replacement=upgradedAsset(img.getAttribute('src')||img.currentSrc);if(!replacement)continue;img.src=replacement;img.dataset.assetUpgraded='photo';const host=img.closest('.fishWrap');if(host){host.dataset.assetUpgraded='1';host.setAttribute('data-asset-upgraded','1')}count++;}return count}
function observeOrdinaryAssets(doc){if(assetObserver||!doc?.body||!root.MutationObserver)return;assetObserver=new root.MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[])if(node.nodeType===1)upgradeOrdinaryAssets(node.matches?.('.fishWrap')?node:node)});assetObserver.observe(doc.body,{childList:true,subtree:true})}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative]{opacity:1!important}
[data-commemorative][data-swim-profile]{transform-origin:50% 50%}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"],[data-commemorative][data-swim-profile="octopus-jet"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important}
[data-commemorative][data-swim-profile="octopus-jet"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important}
[data-commemorative][data-swim-active="1"][data-swim-cadence="pulse-glide"]{animation-duration:var(--swim-route-duration)!important;animation-timing-function:ease-in-out!important;animation-delay:var(--swim-delay,0s)!important;animation-iteration-count:infinite!important;will-change:transform;opacity:1!important;backface-visibility:hidden;transform-style:preserve-3d}
[data-commemorative][data-swim-active="1"][data-swim-direction="forward"]{animation-name:milestoneForwardNatural!important}
[data-commemorative][data-swim-active="1"][data-swim-direction="reverse"]{animation-name:milestoneReverseNatural!important}
[data-commemorative][data-swim-profile="turtle-stroke"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-glide"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="shark-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="cetacean-cruise"]:not([data-swim-active="1"]){animation:none!important;transform:none!important;will-change:auto!important}
.milestoneAtlasCreature,.milestoneAtlasCreature > img{animation:none!important;transform:none!important;will-change:auto!important;opacity:1!important}
@keyframes milestoneFishRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(0deg)}42%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0) rotateY(0deg)}49%{transform:translate3d(calc(var(--swim-travel)*.62),calc(var(--swim-bob)*-.5),0) rotateY(180deg)}91%{transform:translate3d(calc(var(--swim-travel)*-.55),var(--swim-bob),0) rotateY(180deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(360deg)}}
@keyframes milestoneDriftRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.12),0,0) scaleX(1) scaleY(1)}20%{transform:translate3d(calc(var(--swim-travel)*.08),calc(var(--swim-bob)*-.18),0) scaleX(.97) scaleY(1.025)}38%{transform:translate3d(calc(var(--swim-travel)*.18),calc(var(--swim-bob)*-.06),0) scaleX(1.025) scaleY(.98)}58%{transform:translate3d(calc(var(--swim-travel)*.18),calc(var(--swim-bob)*-.06),0) scaleX(1.01) scaleY(.99)}78%{transform:translate3d(calc(var(--swim-travel)*.28),calc(var(--swim-bob)*.12),0) scaleX(.985) scaleY(1.015)}100%{transform:translate3d(calc(var(--swim-travel)*.34),0,0) scaleX(1) scaleY(1)}}
${buildPulseRoute('milestoneForwardNatural',-PULSE_ROUTE_SPAN_VW/2,PULSE_ROUTE_SPAN_VW/2,.05)}
${buildPulseRoute('milestoneReverseNatural',PULSE_ROUTE_SPAN_VW/2,-PULSE_ROUTE_SPAN_VW/2,.05)}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile]{animation-duration:calc(var(--swim-route-duration)*1.6)!important}}
`;doc.head.appendChild(style);upgradeOrdinaryAssets(doc);observeOrdinaryAssets(doc)}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key);ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.dataset.swimKey=p.key;node.dataset.swimDirection=p.direction||'forward';node.style.opacity='1';node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-route-duration',(p.duration*PULSE_ROUTE_DURATION_FACTOR)+'s');node.style.setProperty('--swim-pulse-duration',((p.duration*PULSE_ROUTE_DURATION_FACTOR)/PULSE_STEPS).toFixed(3)+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.body||p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');node.style.setProperty('--swim-wave',Math.max(.18,Math.min(.72,p.bob*.62))+'vh');return p}
function clearRotation(){if(rotationTimer!==null){if(root.clearTimeout)root.clearTimeout(rotationTimer);else if(root.clearInterval)root.clearInterval(rotationTimer);rotationTimer=null}}
function activatePassThrough(nodes,maxActive){clearRotation();const list=(nodes||[]).filter(Boolean),count=list.length,lanes=[-15,-11,-7,-3,1,5,9,13,16,-13,-9,-5,-1,3,7,11,15];for(const node of list){delete node.dataset.swimActive;delete node.dataset.swimCadence;node.style.removeProperty('--swim-delay');node.style.removeProperty('--swim-lane-y')}const active=list.slice(0,count);for(const [index,node] of active.entries()){const routeDuration=parseFloat(node.style.getPropertyValue('--swim-route-duration'))||260,phase=(index+.37)/(Math.max(1,count)),lane=lanes[index%lanes.length];node.dataset.swimActive='1';node.dataset.swimCadence='pulse-glide';node.style.left='50%';node.style.top='40%';node.style.opacity='1';node.style.setProperty('--swim-delay',(-routeDuration*phase).toFixed(2)+'s');node.style.setProperty('--swim-lane-y',lane+'vh')}return active}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,activatePassThrough,ensureStyles,clearRotation,buildPulseRoute,PULSE_STEPS,PULSE_ROUTE_DURATION_FACTOR,PULSE_ROUTE_SPAN_VW,upgradeOrdinaryAssets,upgradedAsset};
})(window);
