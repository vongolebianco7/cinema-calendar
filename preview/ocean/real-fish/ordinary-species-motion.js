(function(root){'use strict';
const PROFILES={
  'species-blue-tang.svg':'small-school-cruise',
  'species-firefish.svg':'hover-dart',
  'species-sixline-wrasse.svg':'reef-dart',
  'species-damselfish.svg':'dense-school-cruise',
  'species-lyretail-anthias.svg':'loose-school-glide',
  'species-madai.webp':'heavy-cruise',
  'species-filefish.svg':'fin-drift'
};
const CLASS_PREFIX='ordinaryMotion--';
function profileFor(node){const src=node?.querySelector?.('img')?.getAttribute('src')||'';for(const [asset,profile] of Object.entries(PROFILES))if(src.includes(asset))return profile;return null}
function applyNode(node){if(!(node instanceof Element)||!node.classList.contains('fishWrap'))return false;const profile=profileFor(node);if(!profile)return false;for(const cls of [...node.classList])if(cls.startsWith(CLASS_PREFIX))node.classList.remove(cls);node.classList.add(CLASS_PREFIX+profile);node.dataset.motionProfile=profile;return true}
function applyAll(stage=document){stage.querySelectorAll?.('.fishWrap').forEach(applyNode)}
function installStyles(){if(document.getElementById('ordinarySpeciesMotionStyles'))return;const style=document.createElement('style');style.id='ordinarySpeciesMotionStyles';style.textContent=`
.fishWrap.ordinaryMotion--small-school-cruise{animation-name:ordinarySchoolCruise;animation-timing-function:ease-in-out}
.fishWrap.ordinaryMotion--dense-school-cruise{animation-name:ordinaryDenseSchool;animation-duration:calc(var(--dur) * .82)}
.fishWrap.ordinaryMotion--loose-school-glide{animation-name:ordinaryLooseSchool;animation-duration:calc(var(--dur) * 1.08)}
.fishWrap.ordinaryMotion--hover-dart{animation-name:ordinaryHoverDart;animation-duration:calc(var(--dur) * .72)}
.fishWrap.ordinaryMotion--reef-dart{animation-name:ordinaryReefDart;animation-duration:calc(var(--dur) * .66)}
.fishWrap.ordinaryMotion--fin-drift{animation-name:ordinaryFinDrift;animation-duration:calc(var(--dur) * 1.35)}
.fishWrap.ordinaryMotion--heavy-cruise{animation-name:ordinaryHeavyCruise;animation-duration:calc(var(--dur) * 1.3)}
@keyframes ordinarySchoolCruise{0%{transform:translate3d(-5%,1%,0) rotate(-.4deg)}45%{transform:translate3d(6%,-2%,0) rotate(.5deg)}52%{transform:translate3d(7%,-1%,0) rotateY(180deg)}94%{transform:translate3d(-5%,2%,0) rotateY(180deg)}100%{transform:translate3d(-5%,1%,0) rotateY(360deg)}}
@keyframes ordinaryDenseSchool{0%{transform:translate3d(-4%,0,0)}35%{transform:translate3d(4%,-1%,0)}50%{transform:translate3d(6%,1%,0) rotateY(180deg)}82%{transform:translate3d(-3%,2%,0) rotateY(180deg)}100%{transform:translate3d(-4%,0,0) rotateY(360deg)}}
@keyframes ordinaryLooseSchool{0%{transform:translate3d(-7%,2%,0) rotate(-.7deg)}46%{transform:translate3d(8%,-3%,0) rotate(.6deg)}53%{transform:translate3d(9%,-2%,0) rotateY(180deg)}95%{transform:translate3d(-6%,3%,0) rotateY(180deg)}100%{transform:translate3d(-7%,2%,0) rotateY(360deg)}}
@keyframes ordinaryHoverDart{0%,18%{transform:translate3d(0,0,0)}28%{transform:translate3d(8%,-3%,0)}44%,58%{transform:translate3d(10%,-2%,0)}66%{transform:translate3d(2%,2%,0) rotateY(180deg)}84%{transform:translate3d(-2%,0,0) rotateY(180deg)}100%{transform:translate3d(0,0,0) rotateY(360deg)}}
@keyframes ordinaryReefDart{0%{transform:translate3d(-3%,1%,0)}20%{transform:translate3d(6%,-4%,0) rotate(-1deg)}38%{transform:translate3d(1%,3%,0) rotate(.8deg)}52%{transform:translate3d(8%,0,0) rotateY(180deg)}74%{transform:translate3d(-5%,-2%,0) rotateY(180deg)}100%{transform:translate3d(-3%,1%,0) rotateY(360deg)}}
@keyframes ordinaryFinDrift{0%{transform:translate3d(-2%,2%,0) rotate(-1deg)}46%{transform:translate3d(4%,-2%,0) rotate(.8deg)}55%{transform:translate3d(5%,-1%,0) rotateY(180deg)}96%{transform:translate3d(-2%,2%,0) rotateY(180deg)}100%{transform:translate3d(-2%,2%,0) rotateY(360deg)}}
@keyframes ordinaryHeavyCruise{0%{transform:translate3d(-6%,1%,0) rotate(-.25deg)}47%{transform:translate3d(7%,-1%,0) rotate(.25deg)}54%{transform:translate3d(8%,-1%,0) rotateY(180deg)}97%{transform:translate3d(-6%,1%,0) rotateY(180deg)}100%{transform:translate3d(-6%,1%,0) rotateY(360deg)}}`;
document.head.appendChild(style)}
function boot(){installStyles();const stage=document.getElementById('stage');if(!stage)return;applyAll(stage);const observer=new MutationObserver(mutations=>{for(const mutation of mutations)for(const node of mutation.addedNodes){if(node.nodeType!==1)continue;applyNode(node);node.querySelectorAll?.('.fishWrap').forEach(applyNode)}});observer.observe(stage,{childList:true,subtree:true});setTimeout(()=>applyAll(stage),0);setTimeout(()=>applyAll(stage),300)}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot()}
root.CinemapOceanOrdinarySpeciesMotion={PROFILES,profileFor,applyNode,applyAll};
})(typeof window!=='undefined'?window:globalThis);
