(function(root){'use strict';
const PULSE_STEPS=200;
const PULSE_ROUTE_DURATION_FACTOR=13;
const PULSE_SPEED_MULTIPLIER=3;
const PULSE_ROUTE_SPAN_VW=50;
const PASS_THROUGH_BASE_X=[42];
const HABITAT_SWIM_BANDS={
 surface:{min:4,max:30,preferred:16,surfaceRise:-5,surfaceDip:2,cruiseOffset:0},
 upper:{min:10,max:38,preferred:24,surfaceRise:-4,surfaceDip:3,cruiseOffset:0},
 open:{min:18,max:58,preferred:36,surfaceRise:-3,surfaceDip:4,cruiseOffset:0},
 lower:{min:40,max:68,preferred:54,surfaceRise:-2,surfaceDip:3,cruiseOffset:0},
 seagrass:{min:54,max:74,preferred:64,surfaceRise:-1,surfaceDip:2,cruiseOffset:0},
 seabed:{min:64,max:80,preferred:72,surfaceRise:-1,surfaceDip:1,cruiseOffset:0}
};
const SPECIES_SWIM_BANDS={
 dolphin:{habitat:'surface',min:5,max:30,preferred:16,surfaceRise:-5,surfaceDip:2,cruiseOffset:0},
 orca:{habitat:'surface',min:6,max:34,preferred:18,surfaceRise:-6,surfaceDip:2,cruiseOffset:2},
 'humpback-whale':{habitat:'surface',min:7,max:38,preferred:21,surfaceRise:-8,surfaceDip:2,cruiseOffset:7},
 'minke-whale':{habitat:'surface',min:7,max:36,preferred:20,surfaceRise:-7,surfaceDip:2,cruiseOffset:4},
 'blue-whale':{habitat:'surface',min:8,max:40,preferred:23,surfaceRise:-8,surfaceDip:2,cruiseOffset:10},
 dugong:{habitat:'seagrass',min:50,max:72,preferred:62,surfaceRise:-2,surfaceDip:3,cruiseOffset:0},
 'giant-octopus':{habitat:'seabed',min:64,max:80,preferred:73,surfaceRise:-1,surfaceDip:2,cruiseOffset:0},
 'manta-ray':{habitat:'open',min:18,max:56,preferred:35,surfaceRise:-3,surfaceDip:5,cruiseOffset:0},
 'whale-shark':{habitat:'open',min:20,max:58,preferred:38,surfaceRise:-2,surfaceDip:5,cruiseOffset:0},
 'hammerhead-shark':{habitat:'open',min:24,max:62,preferred:42,surfaceRise:-2,surfaceDip:5,cruiseOffset:0},
 'large-shark':{habitat:'open',min:24,max:64,preferred:44,surfaceRise:-2,surfaceDip:5,cruiseOffset:0},
 'sea-turtle':{habitat:'upper',min:12,max:48,preferred:30,surfaceRise:-5,surfaceDip:5,cruiseOffset:0},
 'ocean-sunfish':{habitat:'open',min:20,max:58,preferred:38,surfaceRise:-2,surfaceDip:5,cruiseOffset:0},
 clownfish:{habitat:'lower',min:42,max:66,preferred:54,surfaceRise:-1,surfaceDip:3,cruiseOffset:0}
};
const ORDINARY_ASSET_UPGRADES={
 'optimized/species-blue-tang.svg':'optimized/species-moorish-idol.webp',
 'optimized/species-damselfish.svg':'optimized/species-puffer.webp',
 'optimized/species-firefish.svg':'optimized/species-lionfish.webp',
 'optimized/species-lyretail-anthias.svg':'optimized/species-madai.webp',
 'optimized/species-six-line-wrasse.svg':'optimized/species-grouper.webp',
 'optimized/species-sixline-wrasse.svg':'optimized/species-grouper.webp',
 'optimized/species-threadfin-butterflyfish.svg':'optimized/species-butterflyfish.webp',
 'optimized/species-filefish.webp':'optimized/fish-real.webp',
 'optimized/species-filefish.svg':'optimized/fish-real.webp',
 'optimized/species-stingray.webp':'assets/milestone-manta-ray-v2.webp',
 'optimized/species-stingray.svg':'assets/milestone-manta-ray-v2.webp'
};
const profiles={
 clownfish:{family:'reef-dart',duration:9,travel:8,bob:2,body:1.8,direction:'forward'},
 'sea-turtle':{family:'turtle-stroke',duration:26,travel:3,bob:.7,body:2.5,direction:'forward'},
 'ocean-sunfish':{family:'sunfish-scull',duration:17,travel:5,bob:4,body:2,direction:'forward'},
 'giant-octopus':{family:'octopus-jet',duration:19,travel:5,bob:3,body:3,direction:'forward'},
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
function bandFor(key){const species=SPECIES_SWIM_BANDS[key]||null;if(species)return species;return HABITAT_SWIM_BANDS.open;}
function buildPulseRoute(name,start,end,tilt){const out=['@keyframes '+name+'{'],step=(end-start)/PULSE_STEPS;for(let i=0;i<PULSE_STEPS;i++){const p0=(i/PULSE_STEPS*100).toFixed(3),pMove=((i+.48)/PULSE_STEPS*100).toFixed(3),pHold=((i+1)/PULSE_STEPS*100).toFixed(3),x0=(start+step*i).toFixed(3),x1=(start+step*(i+1)).toFixed(3),wave=((i%2?1:-1)*.09).toFixed(2),angle=((i%2?1:-1)*tilt).toFixed(2),y='calc(var(--swim-lane-y) + var(--swim-wave)*'+wave+')',pose='translate3d('+x1+'vw,'+y+',0) rotateZ('+angle+'deg)';out.push(p0+'%{transform:translate3d('+x0+'vw,'+y+',0) rotateZ('+angle+'deg);animation-timing-function:cubic-bezier(.16,.62,.28,1)}');out.push(pMove+'%{transform:'+pose+'}');out.push(pHold+'%{transform:'+pose+'}')}out.push('}');return out.join('')}
function upgradedAsset(src){if(!src)return null;const clean=String(src).replace(/^.*\/preview\/ocean\/real-fish\//,'').split('?')[0];return ORDINARY_ASSET_UPGRADES[clean]||ORDINARY_ASSET_UPGRADES[String(src).split('?')[0]]||null}
function upgradeOrdinaryAssets(scope){const rootNode=scope?.querySelectorAll?scope:root.document;if(!rootNode)return 0;let count=0;for(const img of rootNode.querySelectorAll('.fishWrap:not([data-commemorative]) > img')){const replacement=upgradedAsset(img.getAttribute('src')||img.currentSrc);if(!replacement)continue;img.src=replacement;img.dataset.assetUpgraded='photo';const host=img.closest('.fishWrap');if(host){host.dataset.assetUpgraded='1';host.setAttribute('data-asset-upgraded','1')}count++;}return count}
function observeOrdinaryAssets(doc){if(assetObserver||!doc?.body||!root.MutationObserver)return;assetObserver=new root.MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes||[])if(node.nodeType===1)upgradeOrdinaryAssets(node.matches?.('.fishWrap')?node:node)});assetObserver.observe(doc.body,{childList:true,subtree:true})}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative]{opacity:1!important}
[data-commemorative][data-swim-profile]{transform-origin:50% 50%}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"],[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important}
[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important}
[data-commemorative][data-swim-profile="octopus-jet"]{animation-name:octopusJetRoute!important;animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-delay:var(--swim-delay,0s)!important;animation-iteration-count:infinite!important;will-change:transform}
[data-commemorative][data-swim-profile="octopus-jet"] .milestoneAtlasCreature{animation:octopusJetPulse calc(var(--swim-duration)*.42) cubic-bezier(.2,.7,.25,1) infinite!important;transform-origin:45% 52%!important}
[data-commemorative][data-swim-active="1"][data-swim-cadence="pulse-glide"]{animation-duration:var(--swim-route-duration)!important;animation-timing-function:ease-in-out!important;animation-delay:var(--swim-delay,0s)!important;animation-iteration-count:infinite!important;will-change:transform;opacity:1!important}
[data-commemorative][data-swim-active="1"][data-swim-direction="forward"]{animation-name:milestoneForwardNatural!important}
[data-commemorative][data-swim-active="1"][data-swim-direction="reverse"]{animation-name:milestoneReverseNatural!important}
[data-commemorative][data-surface-breather="1"] .milestoneAtlasCreature{animation:surfaceRise var(--swim-route-duration) ease-in-out var(--swim-delay,0s) infinite!important;transform-origin:50% 50%!important}
[data-commemorative][data-swim-profile="turtle-stroke"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-glide"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="shark-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="cetacean-cruise"]:not([data-swim-active="1"]){animation:none!important;transform:none!important;will-change:auto!important}
.milestoneAtlasCreature,.milestoneAtlasCreature > img{animation:none!important;transform:none!important;will-change:auto!important;opacity:1!important}
[data-commemorative][data-surface-breather="1"] .milestoneAtlasCreature,[data-commemorative][data-swim-profile="octopus-jet"] .milestoneAtlasCreature{will-change:transform!important}
@keyframes milestoneFishRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(0deg)}42%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0) rotateY(0deg)}49%{transform:translate3d(calc(var(--swim-travel)*.62),calc(var(--swim-bob)*-.5),0) rotateY(180deg)}91%{transform:translate3d(calc(var(--swim-travel)*-.55),var(--swim-bob),0) rotateY(180deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(360deg)}}
@keyframes milestoneDriftRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.12),0,0) rotateZ(-.25deg)}22%{transform:translate3d(calc(var(--swim-travel)*.05),calc(var(--swim-bob)*-.2),0) rotateZ(.18deg)}44%{transform:translate3d(calc(var(--swim-travel)*.14),calc(var(--swim-bob)*-.05),0) rotateZ(.08deg)}61%{transform:translate3d(calc(var(--swim-travel)*.14),calc(var(--swim-bob)*-.05),0) rotateZ(.08deg)}82%{transform:translate3d(calc(var(--swim-travel)*.28),calc(var(--swim-bob)*.18),0) rotateZ(-.12deg)}100%{transform:translate3d(calc(var(--swim-travel)*.32),0,0) rotateZ(-.2deg)}}
@keyframes octopusJetRoute{0%,16%{transform:translate3d(-1.5vw,0,0) rotate(-.4deg)}28%{transform:translate3d(2.2vw,-1.8vh,0) rotate(.6deg)}40%,62%{transform:translate3d(3.2vw,-.9vh,0) rotate(.15deg)}76%{transform:translate3d(1.1vw,.4vh,0) rotate(-.25deg)}100%{transform:translate3d(-1.5vw,0,0) rotate(-.4deg)}}
@keyframes octopusJetPulse{0%,18%,100%{transform:scaleX(1) scaleY(1) translateX(0)}27%{transform:scaleX(.90) scaleY(1.07) translateX(.7%)}38%{transform:scaleX(1.04) scaleY(.98) translateX(-.4%)}65%{transform:scaleX(1) scaleY(1) translateX(0)}}
@keyframes surfaceRise{0%,100%{transform:translateY(calc(var(--swim-cruise-offset) + var(--swim-surface-dip)))}24%{transform:translateY(var(--swim-cruise-offset))}40%{transform:translateY(var(--swim-ascent-mid))}50%{transform:translateY(var(--swim-surface-rise))}62%{transform:translateY(var(--swim-ascent-mid))}78%{transform:translateY(var(--swim-cruise-offset))}}
${buildPulseRoute('milestoneForwardNatural',-PULSE_ROUTE_SPAN_VW/2,PULSE_ROUTE_SPAN_VW/2,.05)}
${buildPulseRoute('milestoneReverseNatural',PULSE_ROUTE_SPAN_VW/2,-PULSE_ROUTE_SPAN_VW/2,.05)}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile]{animation-duration:calc(var(--swim-route-duration)*1.6)!important}}
`;doc.head.appendChild(style);upgradeOrdinaryAssets(doc);observeOrdinaryAssets(doc)}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key),band=bandFor(reward.key),cruiseOffset=Number(band.cruiseOffset)||0,surfaceRise=Number(band.surfaceRise)||0;ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.dataset.swimKey=p.key;node.dataset.swimDirection=p.direction||'forward';node.dataset.swimHabitat=band.habitat||'open';if((band.habitat||'')==='surface')node.dataset.surfaceBreather='1';else delete node.dataset.surfaceBreather;node.style.opacity='1';node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-route-duration',(p.duration*PULSE_ROUTE_DURATION_FACTOR/PULSE_SPEED_MULTIPLIER)+'s');node.style.setProperty('--swim-pulse-duration',((p.duration*PULSE_ROUTE_DURATION_FACTOR/PULSE_SPEED_MULTIPLIER)/PULSE_STEPS).toFixed(3)+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.body||p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');node.style.setProperty('--swim-wave',Math.max(.18,Math.min(.72,p.bob*.62))+'vh');node.style.setProperty('--swim-surface-rise',surfaceRise+'vh');node.style.setProperty('--swim-surface-dip',(Number(band.surfaceDip)||0)+'vh');node.style.setProperty('--swim-cruise-offset',cruiseOffset+'vh');node.style.setProperty('--swim-ascent-mid',((cruiseOffset+surfaceRise)*.5).toFixed(2)+'vh');return p}
function clearRotation(){if(rotationTimer!==null){if(root.clearTimeout)root.clearTimeout(rotationTimer);else if(root.clearInterval)root.clearInterval(rotationTimer);rotationTimer=null}}
function activatePassThrough(nodes,maxActive){clearRotation();const list=(nodes||[]).filter(Boolean),count=list.length;for(const node of list){delete node.dataset.swimActive;delete node.dataset.swimCadence;node.style.removeProperty('--swim-delay');node.style.removeProperty('--swim-lane-y')}const active=list.slice(0,count);for(const [index,node] of active.entries()){const key=node.dataset.swimKey||node.dataset.commemorativeKey||'',band=bandFor(key),routeDuration=parseFloat(node.style.getPropertyValue('--swim-route-duration'))||260,phase=(index+.37)/(Math.max(1,count)),spread=((index%5)-2)*2.2,baseX=Math.max(18,Math.min(68,PASS_THROUGH_BASE_X[0]+spread)),top=Math.max(band.min,Math.min(band.max,band.preferred+((index%3)-1)*2.5));node.dataset.swimActive='1';node.dataset.swimSlot=String(index);node.style.left=baseX+'%';node.style.top=top+'%';node.style.opacity='1';node.style.setProperty('--swim-delay',(-routeDuration*phase).toFixed(2)+'s');node.style.setProperty('--swim-lane-y','0vh');if(key==='giant-octopus'){node.dataset.swimCadence='octopus-jet';node.style.setProperty('--swim-delay',(-((index%4)*1.6)).toFixed(2)+'s')}else{node.dataset.swimCadence='pulse-glide'}}return active}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,activatePassThrough,ensureStyles,clearRotation,buildPulseRoute,bandFor,PULSE_STEPS,PULSE_ROUTE_DURATION_FACTOR,PULSE_SPEED_MULTIPLIER,PULSE_ROUTE_SPAN_VW,PASS_THROUGH_BASE_X,HABITAT_SWIM_BANDS,SPECIES_SWIM_BANDS,upgradeOrdinaryAssets,upgradedAsset};
})(window);