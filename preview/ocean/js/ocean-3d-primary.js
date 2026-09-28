(function(root){'use strict';
let mounted=null;
function mount(){
  const host=document.getElementById('universe');
  if(!host)return;
  mounted?.dispose?.();
  host.innerHTML='<section class="ocean3dPrimary" aria-label="あなたの映画の海"><canvas class="ocean3dCanvas" aria-label="3Dで育つ映画の海。ドラッグで見回し、ピンチで移動"></canvas><div class="ocean3dStatus"><small>YOUR OCEAN · LIVING ECOSYSTEM</small><strong>映画を観るほど、この海は育つ</strong><span>ドラッグで見回す · ピンチで泳ぐ</span></div><p class="ocean3dError" role="alert" hidden>3Dの海を読み込めませんでした。</p></section>';
  const canvas=host.querySelector('.ocean3dCanvas'),error=host.querySelector('.ocean3dError');
  import('../renderer/src/main.js').then(({mountOcean})=>{
    mounted=mountOcean(canvas,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
    mounted.ready.catch(()=>{error.hidden=false});
  }).catch(()=>{error.hidden=false});
}
root.CinemapOcean3DPrimary={mount};
})(window);
