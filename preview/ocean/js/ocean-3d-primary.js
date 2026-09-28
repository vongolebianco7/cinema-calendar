(function(root){'use strict';
let mounted=null;
function currentEcosystem(){
  try{
    const records=root.CinemapRecords?.read?.()||{};
    const catalog=root.CINEMAP_MOVIES||root.movies||root.MOVIES||[];
    return root.CinemapOceanEcosystem?.build?.(catalog,records)||null;
  }catch(err){console.warn('[Ocean ecosystem]',err);return null;}
}
function growthCopy(ecosystem){
  const watched=Number(ecosystem?.stats?.watched)||0,milestone=ecosystem?.milestone;
  if(!watched)return{title:'まだ静かな海',detail:'映画を記録すると、最初の生命が生まれます'};
  if(!milestone)return{title:`${watched}本から育った海`,detail:'ドラッグで見回す · ピンチで泳ぐ'};
  const title=`${milestone.label} · ${watched}本の記録`;
  const detail=milestone.nextAt?`あと${milestone.remaining}本で「${milestone.nextLabel}」へ`:'ここからも、観た映画と評価で生態系が変わり続けます';
  return{title,detail};
}
function mount(){
  const host=document.getElementById('universe');if(!host)return;mounted?.dispose?.();
  const ecosystem=currentEcosystem(),copy=growthCopy(ecosystem);
  host.innerHTML='<section class="ocean3dPrimary" aria-label="あなたの映画の海"><canvas class="ocean3dCanvas" aria-label="3Dで育つ映画の海。ドラッグで見回し、ピンチで移動"></canvas><div class="ocean3dStatus"><small>YOUR OCEAN · LIVING ECOSYSTEM</small><strong></strong><span></span></div><p class="ocean3dError" role="alert" hidden>3Dの海を読み込めませんでした。</p></section>';
  const canvas=host.querySelector('.ocean3dCanvas'),error=host.querySelector('.ocean3dError'),status=host.querySelector('.ocean3dStatus');
  status.querySelector('strong').textContent=copy.title;status.querySelector('span').textContent=copy.detail;
  import('../renderer/dist/ocean-pages.js').then(({mountOcean})=>{mounted=mountOcean(canvas,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,ecosystem});mounted.ready.catch(()=>{error.hidden=false});}).catch(err=>{console.error('[Ocean 3D]',err);error.hidden=false;});
}
root.CinemapOcean3DPrimary={mount,growthCopy};
})(window);
