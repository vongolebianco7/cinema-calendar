(function(root){
  'use strict';
  const BOUNDS={x:18,y:8,minDistance:14,maxDistance:70,overviewDistance:56};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function createState(){return {x:0,y:0,targetX:0,targetY:0,distance:BOUNDS.overviewDistance,targetDistance:BOUNDS.overviewDistance,mode:'overview'};}
  function applyPan(state,dx,dy){return {...state,targetX:clamp(state.targetX-dx*0.055,-BOUNDS.x,BOUNDS.x),targetY:clamp(state.targetY+dy*0.035,-BOUNDS.y,BOUNDS.y),mode:'explore'};}
  function applyZoom(state,factor){return {...state,targetDistance:clamp(state.targetDistance*factor,BOUNDS.minDistance,BOUNDS.maxDistance),distance:clamp(state.distance*factor,BOUNDS.minDistance,BOUNDS.maxDistance),mode:'explore'};}
  function createCameraController(viewport,options){
    options=options||{}; let state=createState(); const pointers=new Map(); let lastPinch=0; let dragDistance=0; let downAt=0;
    const onPointerDown=(e)=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragDistance=0;downAt=performance.now();viewport.setPointerCapture&&viewport.setPointerCapture(e.pointerId);};
    const onPointerMove=(e)=>{const prev=pointers.get(e.pointerId);if(!prev)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1){const dx=e.clientX-prev.x,dy=e.clientY-prev.y;dragDistance+=Math.hypot(dx,dy);state=applyPan(state,dx,dy);}else if(pointers.size===2){const pts=[...pointers.values()],d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(lastPinch>0&&d>0)state=applyZoom(state,lastPinch/d);lastPinch=d;}};
    const onPointerUp=(e)=>{pointers.delete(e.pointerId);if(pointers.size<2)lastPinch=0;if(dragDistance<8&&performance.now()-downAt<420&&options.onTap)options.onTap(e);};
    viewport.addEventListener('pointerdown',onPointerDown);viewport.addEventListener('pointermove',onPointerMove);viewport.addEventListener('pointerup',onPointerUp);viewport.addEventListener('pointercancel',onPointerUp);
    function update(){state.x+=(state.targetX-state.x)*0.11;state.y+=(state.targetY-state.y)*0.11;state.distance+=(state.targetDistance-state.distance)*0.1;return state;}
    function reset(){state=createState();return state;}
    function destroy(){viewport.removeEventListener('pointerdown',onPointerDown);viewport.removeEventListener('pointermove',onPointerMove);viewport.removeEventListener('pointerup',onPointerUp);viewport.removeEventListener('pointercancel',onPointerUp);}
    return {getState:()=>({...state}),update,reset,destroy};
  }
  root.CinemapOceanCamera={BOUNDS,createState,applyPan,applyZoom,createCameraController};
})(typeof window!=='undefined'?window:globalThis);
