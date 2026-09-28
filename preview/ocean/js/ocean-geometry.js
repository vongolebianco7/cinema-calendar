(function(root){
  'use strict';
  function mesh(positions,parts){return {positions:new Float32Array(positions),parts:new Float32Array(parts),count:positions.length/3};}
  function fish(){
    const p=[],a=[];const tri=(part,...v)=>{p.push(...v);a.push(part,part,part);};
    tri(0, 1,0,0, .25,.48,.05, -.72,.3,0);tri(0, 1,0,0, -.72,.3,0, -.72,-.3,0);tri(0,1,0,0,-.72,-.3,0,.25,-.48,.05);
    tri(1,-.68,.08,0,-1.35,.62,.08,-1.18,0,0);tri(1,-.68,-.08,0,-1.18,0,0,-1.35,-.62,.08);
    tri(2,.12,.12,.02,-.28,.68,.18,-.42,.12,.02);tri(2,.12,-.12,.02,-.28,-.68,.18,-.42,-.12,.02);
    return mesh(p,a);
  }
  function rock(){return mesh([-.7,0,.5,.7,0,.5,0,1.25,0,.7,0,.5,.55,0,-.55,0,1.25,0,.55,0,-.55,-.55,0,-.55,0,1.25,0,-.55,0,-.55,-.7,0,.5,0,1.25,0],[0,0,0,0,0,0,0,0,0,0,0,0]);}
  function blade(){return mesh([-.08,0,0,.08,0,0,.03,1.7,.04,-.08,0,0,.03,1.7,.04,-.02,1.1,-.04],[0,0,0,0,0,0]);}
  function seabed(){return mesh([-24,-5,-20,24,-5,-20,24,-5,20,-24,-5,-20,24,-5,20,-24,-5,20],[0,0,0,0,0,0]);}
  function particle(){return mesh([-.5,-.12,0,.5,-.12,0,0,.12,0],[0,0,0]);}
  root.CinemapOceanGeometry={fish,rock,blade,seabed,particle};
})(typeof window!=='undefined'?window:globalThis);
