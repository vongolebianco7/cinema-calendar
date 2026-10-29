/* Defer shared review controls without removing film cards or changing storage. */
(function(root){
 'use strict';
 function create({mount,Observer=root.IntersectionObserver}){
  const pending=new Set(),mounted=new WeakSet();
  const paint=node=>{if(node.isConnected===false||mounted.has(node))return;mount(node);mounted.add(node);};
  const observer=typeof Observer==='function'?new Observer(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting||!pending.has(entry.target))continue;
    pending.delete(entry.target);observer.unobserve(entry.target);paint(entry.target);
   }
  },{rootMargin:'400px 0px'}):null;
  return {
   observe(nodes){
    for(const node of pending)if(node.isConnected===false){observer.unobserve(node);pending.delete(node);}
    for(const node of nodes){
     if(node.isConnected===false||mounted.has(node)||pending.has(node))continue;
     if(observer){pending.add(node);observer.observe(node);}else paint(node);
    }
   },
   disconnect(){observer?.disconnect();pending.clear();}
  };
 }
 const api={create};root.CinelvaVisibleReviews=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:this);
