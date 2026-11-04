/* Hobby pageviews plus optional first-party aggregate counters. No identifiers or payloads. */
(()=>{'use strict';const w=window,counts={search:0,record_saved:0,bookmark:0};
const consentKey='cinelva-anonymous-metrics-v1';let consent=false,sent=0;
try{consent=w.localStorage?.getItem(consentKey)==='yes';}catch{}
const eligible=w.location.hostname==='cinelva.vercel.app'&&!/feedback/.test(w.location.pathname)&&w.navigator.doNotTrack!=='1'&&!w.navigator.globalPrivacyControl;
function collect(name){try{consent=w.localStorage?.getItem(consentKey)==='yes';}catch{consent=false;}if(!consent||!eligible||sent>=20)return;sent++;try{w.fetch('https://backend-one-gray-94.vercel.app/api/metrics',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:name}),keepalive:true}).catch(()=>{});}catch{}}
w.CinelvaAnalytics={count(name){if(Object.prototype.hasOwnProperty.call(counts,name)){counts[name]++;collect(name);}},counts(){return{...counts};}};
for(const name of (w.CinelvaAnalyticsQueue||[]).slice(-100))w.CinelvaAnalytics.count(name);
w.CinelvaAnalyticsQueue=[];
function mountConsent(){const box=document.getElementById?.('anonymousMetrics');if(!box)return;box.checked=consent;box.disabled=w.navigator.doNotTrack==='1'||Boolean(w.navigator.globalPrivacyControl);box.addEventListener('change',()=>{consent=box.checked;try{w.localStorage.setItem(consentKey,consent?'yes':'no');}catch{}});}
w.addEventListener?.('storage',event=>{if(event.key!==consentKey&&event.key!==null)return;try{consent=w.localStorage?.getItem(consentKey)==='yes';}catch{consent=false;}const box=document.getElementById?.('anonymousMetrics');if(box)box.checked=consent;});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountConsent);else mountConsent();
// Paid Vercel custom-event calls are never used.
if(w.location.hostname!=='cinelva.vercel.app'||w.location.pathname.includes('admin-feedback')||w.navigator.doNotTrack==='1'||w.navigator.globalPrivacyControl)return;
w.va=w.va||function(){(w.vaq=w.vaq||[]).push(arguments);};
w.va('beforeSend',event=>{try{const url=new URL(event.url);if(url.pathname.includes('admin-feedback'))return null;url.search='';url.hash='';return{...event,url:url.href};}catch{return null;}});
const script=document.createElement('script');script.defer=true;script.src='/_vercel/insights/script.js';document.head.append(script);
})();
