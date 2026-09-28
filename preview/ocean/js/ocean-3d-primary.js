(function(root){'use strict';
let mounted=null;
const SNAPSHOT_KEY='cinemap:ocean:last-shown-growth';
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
function growthMoment(previous,current){
  const before=Number(previous?.stats?.watched)||0,after=Number(current?.stats?.watched)||0;
  if(!after||after<=before)return null;
  const previousLabel=previous?.milestone?.label||'',currentLabel=current?.milestone?.label||'';
  if(currentLabel&&currentLabel!==previousLabel)return{kind:'milestone',title:`${currentLabel}へ成長`,detail:`${after}本の映画から、海の景色がひとつ豊かになりました`};
  return{kind:'new-life',title:'新しい生命が生まれました',detail:`${after}本の記録が、この海の生態系を育てています`};
}
function readSnapshot(){try{return JSON.parse(root.localStorage?.getItem(SNAPSHOT_KEY)||'null')}catch(_){return null}}
function saveSnapshot(ecosystem){try{root.localStorage?.setItem(SNAPSHOT_KEY,JSON.stringify({stats:{watched:Number(ecosystem?.stats?.watched)||0},milestone:ecosystem?.milestone?{label:ecosystem.milestone.label}:null}))}catch(_){}}
function mount(){
  const host=document.getElementById('universe');if(!host)return;mounted?.dispose?.();
  const ecosystem=currentEcosystem(),copy=growthCopy(ecosystem),moment=growthMoment(readSnapshot(),ecosystem),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  host.innerHTML='<section class="ocean3dPrimary" aria-label="あなたの映画の海"><canvas class="ocean3dCanvas" aria-label="3Dで育つ映画の海。ドラッグで見回し、ピンチで移動"></canvas><div class="ocean3dStatus"><small>YOUR OCEAN · LIVING ECOSYSTEM</small><strong></strong><span></span></div><div class="oceanGrowthMoment" role="status" hidden><small>YOUR OCEAN GREW</small><strong></strong><span></span></div><p class="ocean3dError" role="alert" hidden>3Dの海を読み込めませんでした。</p></section>';
  const canvas=host.querySelector('.ocean3dCanvas'),error=host.querySelector('.ocean3dError'),status=host.querySelector('.ocean3dStatus'),growth=host.querySelector('.oceanGrowthMoment');
  status.querySelector('strong').textContent=copy.title;status.querySelector('span').textContent=copy.detail;
  if(moment){growth.querySelector('strong').textContent=moment.title;growth.querySelector('span').textContent=moment.detail;growth.hidden=false;growth.dataset.kind=moment.kind;if(!reducedMotion)growth.classList.add('is-arriving');root.setTimeout?.(()=>{growth.classList.remove('is-arriving');growth.classList.add('is-settled')},2600)}
  saveSnapshot(ecosystem);
  import('../renderer/dist/ocean-pages.js').then(({mountOcean})=>{mounted=mountOcean(canvas,{reducedMotion,ecosystem});mounted.ready.catch(()=>{error.hidden=false});}).catch(err=>{console.error('[Ocean 3D]',err);error.hidden=false;});
}
root.CinemapOcean3DPrimary={mount,growthCopy,growthMoment};
})(window);
