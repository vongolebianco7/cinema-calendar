/* Deterministic Ocean E2E diagnostics. No network, runtime AI, or side effects. */
(function(root){
'use strict';
function classify(s={}){
  const delivery=s.delivery||{},renderer=s.renderer||{},persistence=s.persistence||{},model=s.model||{},visual=s.visual||{},harness=s.harness||{};
  if(delivery.index===false||delivery.bundle===false||delivery.assets===false||delivery.bundleReal===false)return result('DELIVERY_FAIL','static delivery');
  if(renderer.booted===false||renderer.ready===false)return result('RENDERER_BOOT_FAIL','renderer boot');
  if(persistence.written===false)return result('PERSISTENCE_WRITE_FAIL','record write');
  if(persistence.restored===false)return result('PERSISTENCE_RESTORE_FAIL','record restore');
  if(model.valid===false)return result('MODEL_FAIL','ecosystem model');
  if(Number.isFinite(model.organisms)&&Number.isFinite(renderer.organisms)&&model.organisms!==renderer.organisms)return result('ADAPTER_FAIL','ecosystem to renderer');
  if(visual.valid===false)return result('RENDERER_VISUAL_FAIL','renderer visual');
  if(harness.valid===false)return result('E2E_HARNESS_FAIL','test harness');
  return result('PASS','complete');
}
function result(code,boundary){return{code,boundary};}
function report(state={},context={}){
  const classification=classify(state);
  return{
    classification:classification.code,
    boundary:classification.boundary,
    step:context.step||null,
    movieId:context.movieId||null,
    expectedOrganisms:Number.isFinite(state.model?.organisms)?state.model.organisms:null,
    actualOrganisms:Number.isFinite(state.renderer?.organisms)?state.renderer.organisms:null
  };
}
const api={classify,report};
root.CinemapOceanE2EDiagnostics=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
