(function(root){
'use strict';
function params(query){
  try{return new URLSearchParams(String(query||'').replace(/^\?/,''));}
  catch(_){return new URLSearchParams();}
}
function chooseRenderer(options){
  const o=options||{};
  const webgl=o.webgl===true;
  const reduced=o.reducedMotion===true;
  const requested=params(o.query).get('renderer');
  if(!webgl||reduced)return 'dom';
  if(requested==='dom')return 'dom';
  return 'webgl';
}
function detectWebGL(doc){
  try{
    const canvas=(doc||document).createElement('canvas');
    return !!(canvas.getContext('webgl2')||canvas.getContext('webgl'));
  }catch(_){return false;}
}
function prefersReducedMotion(win){
  try{return !!(win||root).matchMedia('(prefers-reduced-motion: reduce)').matches;}
  catch(_){return false;}
}
root.CinemapOceanRendererContract={chooseRenderer,detectWebGL,prefersReducedMotion};
})(window);
