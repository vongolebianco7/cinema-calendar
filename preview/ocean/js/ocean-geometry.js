(function(root){
  'use strict';
  function mesh(positions,parts){return {positions:new Float32Array(positions),parts:new Float32Array(parts),count:positions.length/3};}
  function fish(){const p=[],a=[],tri=(part,...v)=>{p.push(...v);a.push(part,part,part);};tri(0,1,0,0,.25,.48,.08,-.72,.3,-.04);tri(0,1,0,0,-.72,.3,-.04,-.72,-.3,.04);tri(0,1,0,0,-.72,-.3,.04,.25,-.48,-.08);tri(1,-.68,.08,0,-1.35,.62,.12,-1.18,0,0);tri(1,-.68,-.08,0,-1.18,0,0,-1.35,-.62,-.12);tri(2,.12,.12,.02,-.28,.68,.24,-.42,.12,.02);tri(2,.12,-.12,.02,-.28,-.68,-.24,-.42,-.12,.02);return mesh(p,a);}
  function rock(){return mesh([-.7,0,.5,.7,0,.5,0,1.25,0,.7,0,.5,.55,0,-.55,0,1.25,0,.55,0,-.55,-.55,0,-.55,0,1.25,0,-.55,0,-.55,-.7,0,.5,0,1.25,0],[0,0,0,0,0,0,0,0,0,0,0,0]);}
  function blade(){return mesh([-.08,0,0,.08,0,0,.03,1.7,.04,-.08,0,0,.03,1.7,.04,-.02,1.1,-.04],[0,0,0,0,0,0]);}
  function coral(){const p=[],a=[],tri=(...v)=>{p.push(...v);a.push(0,0,0);};tri(-.12,0,0,.12,0,0,.02,1.9,.05);tri(-.04,.72,0,.05,.8,.02,-.72,1.38,.18);tri(.02,.92,0,.1,1.0,.02,.72,1.55,-.16);tri(-.02,1.25,0,.07,1.3,.01,-.48,1.9,.1);tri(.01,1.42,0,.08,1.45,.01,.45,2.08,-.08);return mesh(p,a);}
  function seabed(){return mesh([-24,-5,-20,24,-5,-20,24,-5,20,-24,-5,-20,24,-5,20,-24,-5,20],[0,0,0,0,0,0]);}
  function particle(){return mesh([-.5,-.12,0,.5,-.12,0,0,.12,0],[0,0,0]);}
  root.CinemapOceanGeometry={fish,rock,blade,coral,seabed,particle};
})(typeof window!=='undefined'?window:globalThis);
