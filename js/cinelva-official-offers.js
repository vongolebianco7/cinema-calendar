(() => {
 'use strict';
 // Standalone provider promotion blocks are intentionally disabled across Cinelva.
 // An official catalog listing is not proof of a streaming release date.
 // Verified, dated streaming events belong only in the streaming calendar.
 function removePromotionalSections(){
   document.querySelectorAll('[data-official-offers]').forEach(target=>target.remove());
 }
 globalThis.CinelvaOfficialOffers={setFilter(){removePromotionalSections();}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removePromotionalSections,{once:true});
 else removePromotionalSections();
})();
