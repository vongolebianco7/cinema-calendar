(function(root){'use strict';
const profiles={
 clownfish:{family:'reef-dart',duration:9,travel:8,bob:2,body:1.8},
 'sea-turtle':{family:'turtle-stroke',duration:22,travel:9,bob:3,body:2.5},
 'ocean-sunfish':{family:'sunfish-scull',duration:17,travel:5,bob:4,body:2},
 'giant-octopus':{family:'octopus-drift',duration:19,travel:5,bob:3,body:3},
 'manta-ray':{family:'rigid-glide',duration:24,travel:13,bob:1.2,body:4},
 dolphin:{family:'rigid-cruise',duration:20,travel:15,bob:1,body:3},
 'hammerhead-shark':{family:'shark-cruise',duration:24,travel:14,bob:2.5,body:2},
 'large-shark':{family:'shark-cruise',duration:27,travel:15,bob:2,body:1.8},
 dugong:{family:'rigid-cruise',duration:29,travel:10,bob:.8,body:2},
 'minke-whale':{family:'cetacean-cruise',duration:34,travel:17,bob:3.5,body:2},
 orca:{family:'cetacean-cruise',duration:30,travel:18,bob:4,body:2.4},
 'humpback-whale':{family:'cetacean-cruise',duration:39,travel:18,bob:5,body:2.8},
 'whale-shark':{family:'shark-cruise',duration:42,travel:16,bob:3,body:1.5},
 'blue-whale':{family:'cetacean-cruise',duration:46,travel:20,bob:4,body:1.6}
};
const fallback={family:'gentle-cruise',duration:18,travel:8,bob:3,body:2};
function profileFor(key){return key&&profiles[key]?{key,...profiles[key]}:{key:key||'unknown',...fallback};}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative][data-swim-profile]{animation-duration:var(--swim-duration)!important;animation-timing-function:linear!important;animation-iteration-count:infinite!important;transform-origin:50% 50%;will-change:transform}
[data-swim-profile="reef-dart"],[data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important;animation-timing-function:ease-in-out!important}
[data-swim-profile="turtle-stroke"],[data-swim-profile="rigid-glide"],[data-swim-profile="rigid-cruise"],[data-swim-profile="shark-cruise"],[data-swim-profile="cetacean-cruise"]{animation-name:milestonePassRoute!important}
[data-swim-profile="octopus-drift"],[data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important;animation-timing-function:ease-in-out!important}
[data-commemorative][data-swim-profile] img:first-child{animation-duration:var(--swim-body-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important;transform-origin:50% 55%;will-change:transform}
[data-swim-profile="reef-dart"] img:first-child{animation-name:reefBody!important}
[data-swim-profile="turtle-stroke"] img:first-child{animation-name:turtleBody!important}
[data-swim-profile="sunfish-scull"] img:first-child{animation-name:sunfishBody!important}
[data-swim-profile="octopus-drift"] img:first-child{animation-name:octopusBody!important}
[data-swim-profile="rigid-glide"] img:first-child,[data-swim-profile="rigid-cruise"] img:first-child{animation:none!important;transform:none!important;will-change:auto!important}
[data-swim-profile="cetacean-cruise"] img:first-child{animation-name:cetaceanBody!important}
[data-swim-profile="shark-cruise"] img:first-child{animation-name:sharkBody!important}
[data-swim-profile="gentle-cruise"] img:first-child{animation-name:gentleBody!important}
.milestoneAtlasCreature img{animation:none!important;transform:none!important}
@keyframes milestoneFishRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(0deg)}42%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0) rotateY(0deg)}49%{transform:translate3d(calc(var(--swim-travel)*.62),calc(var(--swim-bob)*-.5),0) rotateY(180deg)}91%{transform:translate3d(calc(var(--swim-travel)*-.55),var(--swim-bob),0) rotateY(180deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(360deg)}}
@keyframes milestonePassRoute{0%{transform:translate3d(-115vw,0,0);opacity:0}6%{opacity:1}48%{transform:translate3d(0,calc(var(--swim-bob)*-.45),0);opacity:1}94%{opacity:1}100%{transform:translate3d(115vw,var(--swim-bob),0);opacity:0}}
@keyframes milestoneDriftRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}25%{transform:translate3d(0,calc(var(--swim-bob)*-1),0) rotateZ(1.5deg)}50%{transform:translate3d(calc(var(--swim-travel)*.25),0,0) rotateZ(0deg)}75%{transform:translate3d(0,var(--swim-bob),0) rotateZ(-1.5deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}}
@keyframes reefBody{0%,100%{transform:rotate(-1deg) skewY(-1deg)}50%{transform:rotate(1.2deg) skewY(1.4deg)}}
@keyframes turtleBody{0%,100%{transform:translateY(0) rotate(-1.5deg) scaleY(.99)}50%{transform:translateY(-3%) rotate(1.8deg) scaleY(1.015)}}
@keyframes sunfishBody{0%,100%{transform:rotate(-1.4deg) scaleY(.985)}50%{transform:rotate(1.4deg) scaleY(1.015)}}
@keyframes octopusBody{0%,100%{transform:translateY(2%) rotate(-2deg) scaleX(.985)}50%{transform:translateY(-3%) rotate(2.5deg) scaleX(1.02)}}
@keyframes cetaceanBody{0%,100%{transform:translateY(1%) rotate(-.8deg)}50%{transform:translateY(-1.2%) rotate(.8deg)}}
@keyframes sharkBody{0%,100%{transform:skewY(-1.2deg) rotate(-.7deg)}50%{transform:skewY(1.2deg) rotate(.7deg)}}
@keyframes gentleBody{0%,100%{transform:translateY(0)}50%{transform:translateY(-1%)}}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile],[data-commemorative][data-swim-profile] img:first-child{animation:none!important}}
`;doc.head.appendChild(style);}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key);ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');return p;}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,ensureStyles};
})(window);
