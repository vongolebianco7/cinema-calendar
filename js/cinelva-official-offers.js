(() => {
 'use strict';
 // Standalone provider promotion blocks are intentionally disabled across Cinelva.
 // An official catalog listing is not proof of a streaming release date.
 // Verified, dated streaming events belong only in the streaming calendar.
 function removePromotionalSections(){
   document.querySelectorAll('[data-official-offers]').forEach(target=>target.remove());
 }
 // Announcement evidence describes the dated calendar event, never a live
 // availability observation. Do not add checked_at or infer current access.
 const officialHosts={
   'Netflix':['about.netflix.com','www.netflix.com'],
   'Prime Video':['www.aboutamazon.jp'],
   'Disney+':['disneyplus.disney.co.jp','www.disneyplus.com'],
   'U-NEXT':['www.unext.co.jp'],
   'Hulu':['news.hulu.jp','www.hulu.jp'],
   'Apple TV+':['www.apple.com'],
   'Lemino':['lemino.docomo.ne.jp','www.asmik-ace.co.jp'],
   'ABEMA':['abema.tv','abematv.co.jp'],
   'WOWOWオンデマンド':['www.wowow.co.jp','note.wowow.co.jp','wod.wowow.co.jp']
 };
 function verifiedEvent(movie){
   if(movie?.event!=='streaming'||!officialHosts[movie.service]||!/^\d{4}-\d{2}-\d{2}$/.test(movie.date||''))return null;
   const parsed=new Date(movie.date+'T00:00:00Z');
   if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==movie.date)return null;
   try{
     const source=new URL(movie.source_url);
     if(source.protocol!=='https:'||source.username||source.password||!officialHosts[movie.service].includes(source.hostname))return null;
   }catch{return null;}
   return {service:movie.service,date:movie.date,source_url:movie.source_url,label:'公式配信発表'};
 }
 globalThis.CinelvaOfficialOffers={verifiedEvent,setFilter(){removePromotionalSections();}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removePromotionalSections,{once:true});
 else removePromotionalSections();
})();
