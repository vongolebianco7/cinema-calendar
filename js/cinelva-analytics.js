/* Hobby: pageviews only. No custom-event requests, user identifiers or record payloads. */
(()=>{'use strict';const w=window,counts={search:0,record_saved:0,bookmark:0};
w.CinelvaAnalytics={count(name){if(Object.prototype.hasOwnProperty.call(counts,name))counts[name]++;},counts(){return{...counts};}};
// Diagnostic counters are memory-only for this page, never uploaded as paid custom events.
if(w.location.hostname!=='cinelva.vercel.app'||w.location.pathname.includes('admin-feedback')||w.navigator.doNotTrack==='1'||w.navigator.globalPrivacyControl)return;
w.va=w.va||function(){(w.vaq=w.vaq||[]).push(arguments);};
w.va('beforeSend',event=>{try{const url=new URL(event.url);if(url.pathname.includes('admin-feedback'))return null;url.search='';url.hash='';return{...event,url:url.href};}catch{return null;}});
const script=document.createElement('script');script.defer=true;script.src='/_vercel/insights/script.js';document.head.append(script);
})();
