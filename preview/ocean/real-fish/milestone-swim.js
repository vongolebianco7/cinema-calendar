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
let rotationTimer=null;
function profileFor(key){return key&&profiles[key]?{key,...profiles[key]}:{key:key||'unknown',...fallback};}
function ensureStyles(doc){if(!doc||doc.getElementById('oceanMilestoneSwimStyles'))return;const style=doc.createElement('style');style.id='oceanMilestoneSwimStyles';style.textContent=`
[data-commemorative][data-swim-profile]{transform-origin:50% 50%}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"],[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-duration:var(--swim-duration)!important;animation-timing-function:ease-in-out!important;animation-iteration-count:infinite!important}
[data-commemorative][data-swim-profile="reef-dart"],[data-commemorative][data-swim-profile="sunfish-scull"]{animation-name:milestoneFishRoute!important}
[data-commemorative][data-swim-profile="octopus-drift"],[data-commemorative][data-swim-profile="gentle-cruise"]{animation-name:milestoneDriftRoute!important}
[data-commemorative][data-swim-active="1"]{animation-name:milestonePassRoute!important;animation-duration:var(--swim-duration)!important;animation-timing-function:cubic-bezier(.22,.58,.42,1)!important;animation-iteration-count:infinite!important;will-change:transform}
[data-commemorative][data-swim-key="sea-turtle"][data-swim-active="1"]{animation-name:turtlePassRoute!important}
[data-commemorative][data-swim-key="manta-ray"][data-swim-active="1"]{animation-name:mantaPassRoute!important}
[data-commemorative][data-swim-key="dolphin"][data-swim-active="1"]{animation-name:dolphinPassRoute!important}
[data-commemorative][data-swim-key="dugong"][data-swim-active="1"]{animation-name:dugongPassRoute!important}
[data-commemorative][data-swim-profile="cetacean-cruise"][data-swim-active="1"]{animation-name:cetaceanPassRoute!important}
[data-commemorative][data-swim-profile="shark-cruise"][data-swim-active="1"]{animation-name:sharkPassRoute!important}
[data-commemorative][data-swim-profile="turtle-stroke"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-glide"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="rigid-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="shark-cruise"]:not([data-swim-active="1"]),[data-commemorative][data-swim-profile="cetacean-cruise"]:not([data-swim-active="1"]){animation:none!important;transform:none!important;will-change:auto!important}
.milestoneAtlasCreature,.milestoneAtlasCreature > img{animation:none!important;transform:none!important;will-change:auto!important}
@keyframes milestoneFishRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(0deg)}42%{transform:translate3d(calc(var(--swim-travel)*.55),calc(var(--swim-bob)*-1),0) rotateY(0deg)}49%{transform:translate3d(calc(var(--swim-travel)*.62),calc(var(--swim-bob)*-.5),0) rotateY(180deg)}91%{transform:translate3d(calc(var(--swim-travel)*-.55),var(--swim-bob),0) rotateY(180deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.55),0,0) rotateY(360deg)}}
@keyframes milestoneDriftRoute{0%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}25%{transform:translate3d(0,calc(var(--swim-bob)*-1),0) rotateZ(1.5deg)}50%{transform:translate3d(calc(var(--swim-travel)*.25),0,0) rotateZ(0deg)}75%{transform:translate3d(0,var(--swim-bob),0) rotateZ(-1.5deg)}100%{transform:translate3d(calc(var(--swim-travel)*-.25),0,0) rotateZ(-1deg)}}
@keyframes milestonePassRoute{0%{transform:translate3d(-92vw,0,0);opacity:0}8%{transform:translate3d(-84vw,calc(var(--swim-bob)*-.08),0);opacity:1}38%{transform:translate3d(-28vw,calc(var(--swim-bob)*-.4),0);opacity:1}72%{transform:translate3d(38vw,calc(var(--swim-bob)*-.15),0);opacity:1}94%{transform:translate3d(84vw,calc(var(--swim-bob)*.7),0);opacity:1}100%{transform:translate3d(92vw,var(--swim-bob),0);opacity:0}}
@keyframes turtlePassRoute{0%{transform:translate3d(-92vw,0,0) rotateZ(-1deg);opacity:0}8%{transform:translate3d(-84vw,-.2vh,0) rotateZ(-.5deg);opacity:1}36%{transform:translate3d(-30vw,-1.1vh,0) rotateZ(.7deg);opacity:1}66%{transform:translate3d(28vw,.4vh,0) rotateZ(-.4deg);opacity:1}94%{transform:translate3d(84vw,-.4vh,0) rotateZ(.5deg);opacity:1}100%{transform:translate3d(92vw,0,0) rotateZ(0deg);opacity:0}}
@keyframes mantaPassRoute{0%{transform:translate3d(-92vw,0,0) rotateZ(-.7deg);opacity:0}8%{transform:translate3d(-84vw,-.15vh,0) rotateZ(-.35deg);opacity:1}34%{transform:translate3d(-34vw,-.8vh,0) rotateZ(.5deg);opacity:1}67%{transform:translate3d(30vw,.35vh,0) rotateZ(-.45deg);opacity:1}94%{transform:translate3d(84vw,-.25vh,0) rotateZ(.35deg);opacity:1}100%{transform:translate3d(92vw,0,0) rotateZ(0deg);opacity:0}}
@keyframes dolphinPassRoute{0%{transform:translate3d(-92vw,.25vh,0) rotateZ(-1deg);opacity:0}8%{transform:translate3d(-84vw,0,0) rotateZ(-.5deg);opacity:1}30%{transform:translate3d(-43vw,-1.05vh,0) rotateZ(.9deg);opacity:1}56%{transform:translate3d(7vw,.45vh,0) rotateZ(-.65deg);opacity:1}78%{transform:translate3d(50vw,-.75vh,0) rotateZ(.65deg);opacity:1}94%{transform:translate3d(84vw,.2vh,0) rotateZ(-.3deg);opacity:1}100%{transform:translate3d(92vw,0,0) rotateZ(0deg);opacity:0}}
@keyframes dugongPassRoute{0%{transform:translate3d(-92vw,.2vh,0) rotateZ(-.45deg);opacity:0}8%{transform:translate3d(-84vw,0,0) rotateZ(-.2deg);opacity:1}38%{transform:translate3d(-28vw,-.55vh,0) rotateZ(.35deg);opacity:1}70%{transform:translate3d(34vw,.35vh,0) rotateZ(-.3deg);opacity:1}94%{transform:translate3d(84vw,-.15vh,0) rotateZ(.2deg);opacity:1}100%{transform:translate3d(92vw,0,0) rotateZ(0deg);opacity:0}}
@keyframes cetaceanPassRoute{0%{transform:translate3d(-92vw,.25vh,0) rotateZ(-.55deg);opacity:0}8%{transform:translate3d(-84vw,0,0) rotateZ(-.2deg);opacity:1}32%{transform:translate3d(-39vw,-.8vh,0) rotateZ(.45deg);opacity:1}61%{transform:translate3d(17vw,.35vh,0) rotateZ(-.35deg);opacity:1}83%{transform:translate3d(58vw,-.55vh,0) rotateZ(.3deg);opacity:1}94%{transform:translate3d(84vw,.1vh,0) rotateZ(-.15deg);opacity:1}100%{transform:translate3d(92vw,0,0) rotateZ(0deg);opacity:0}}
@keyframes sharkPassRoute{0%{transform:translate3d(-92vw,.1vh,0) rotateZ(-.3deg);opacity:0}8%{transform:translate3d(-84vw,0,0) rotateZ(-.15deg);opacity:1}36%{transform:translate3d(-31vw,-.4vh,0) rotateZ(.25deg);opacity:1}68%{transform:translate3d(31vw,.25vh,0) rotateZ(-.2deg);opacity:1}94%{transform:translate3d(84vw,-.2vh,0) rotateZ(.15deg);opacity:1}100%{transform:translate3d(92vw,0,0) rotateZ(0deg);opacity:0}}
@media(prefers-reduced-motion:reduce){[data-commemorative][data-swim-profile]{animation:none!important}}
`;doc.head.appendChild(style);}
function apply(node,reward){if(!node||!reward)return null;const p=profileFor(reward.key);ensureStyles(node.ownerDocument||root.document);node.dataset.swimProfile=p.family;node.dataset.swimKey=p.key;node.style.setProperty('--swim-duration',p.duration+'s');node.style.setProperty('--swim-body-duration',Math.max(2.4,p.body||p.duration*.28)+'s');node.style.setProperty('--swim-travel',p.travel+'%');node.style.setProperty('--swim-bob',p.bob+'%');return p;}
function clearRotation(){if(rotationTimer!==null){if(root.clearTimeout)root.clearTimeout(rotationTimer);else if(root.clearInterval)root.clearInterval(rotationTimer);rotationTimer=null;}}
function activatePassThrough(nodes,maxActive=2){clearRotation();const list=(nodes||[]).filter(Boolean),requested=Math.min(Math.max(0,maxActive),list.length),cap=list.length>=8?1:requested;let cursor=0,active=[];const showWindow=()=>{for(const node of list)delete node.dataset.swimActive;active=[];if(!cap)return;for(let i=0;i<cap;i++){const node=list[(cursor+i)%list.length];if(node){node.dataset.swimActive='1';active.push(node)}}cursor=(cursor+cap)%Math.max(1,list.length);if(list.length>cap&&root.setTimeout){const dwell=Math.max(...active.map(node=>(parseFloat(node.style.getPropertyValue('--swim-duration'))||20)*1000))+600;rotationTimer=root.setTimeout(showWindow,dwell)}};showWindow();return active;}
root.CinemapOceanMilestoneSwim={profiles,profileFor,apply,activatePassThrough,ensureStyles,clearRotation};
})(window);
