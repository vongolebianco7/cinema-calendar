(function(root){'use strict';
function svg(body,w=320,h=160){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#f7fbff"/><stop offset=".45" stop-color="#8fd7e8"/><stop offset="1" stop-color="#244d6a"/></linearGradient></defs>${body}</svg>`)}
const assets={
 clown:svg('<g><ellipse cx="154" cy="82" rx="88" ry="42" fill="#ff7f2a"/><polygon points="242,82 302,44 287,82 302,120" fill="#ff7f2a"/><path d="M105 47v70M156 40v84M205 49v68" stroke="#fff" stroke-width="18"/><path d="M105 47v70M156 40v84M205 49v68" stroke="#171717" stroke-width="4"/><circle cx="92" cy="70" r="7" fill="#111"/></g>'),
 manta:svg('<path d="M28 86C74 25 126 22 160 70c34-48 86-45 132 16-30-8-54-4-76 16-23 20-39 32-56 34-17-2-33-14-56-34-22-20-46-24-76-16Z" fill="url(#g)"/><path d="M160 70c5 36 8 63 1 86" stroke="#7cc6d9" stroke-width="8" fill="none"/>'),
 dolphin:svg('<path d="M24 91c44-35 102-50 170-36 29 6 56 3 86-14-16 26-32 41-51 49 23 6 42 15 62 30-33-5-62-5-89 0-69 14-127 2-178-29Z" fill="url(#g)"/><path d="M138 55c13-21 25-31 46-36-5 19-9 32-2 43" fill="#5aa8c0"/><circle cx="206" cy="70" r="4" fill="#0d2633"/>'),
 shark:svg('<path d="M18 88c58-35 133-45 209-18l60-35-22 48 26 37-65-16c-76 27-151 17-208-16Z" fill="url(#g)"/><path d="M135 61l27-44 17 52M145 101l24 36 11-42" fill="#397994"/><circle cx="211" cy="71" r="4" fill="#091d28"/>'),
 orca:svg('<path d="M18 90c51-38 124-47 201-22l66-29-30 48 33 35-73-12c-76 25-145 15-197-20Z" fill="#0d1720"/><path d="M162 62c25 2 44 11 62 28-26 7-51 8-76 1 8-11 11-20 14-29Z" fill="#fff"/><path d="M132 61l23-41 16 48" fill="#0d1720"/><ellipse cx="211" cy="70" rx="12" ry="7" fill="#fff"/>'),
 humpback:svg('<path d="M12 89c68-48 157-51 235-14l61-22-32 40 28 29-63-10c-84 33-162 25-229-23Z" fill="url(#g)"/><path d="M142 101c-22 24-45 36-75 39 19-16 29-29 31-45" fill="#6aacc0"/><path d="M236 73c18-12 31-29 38-51 9 20 6 40-8 58" fill="#6aacc0"/>'),
 whaleshark:svg('<path d="M10 91c58-41 146-50 237-19l63-30-31 48 30 33-67-13c-88 30-171 22-232-19Z" fill="#3f7f97"/><g fill="#d8edf2" opacity=".85"><circle cx="78" cy="78" r="3"/><circle cx="99" cy="68" r="3"/><circle cx="123" cy="82" r="3"/><circle cx="147" cy="69" r="3"/><circle cx="171" cy="84" r="3"/><circle cx="198" cy="72" r="3"/><circle cx="222" cy="88" r="3"/></g>'),
 bluewhale:svg('<path d="M6 90c71-45 168-48 252-11l54-18-24 35 25 25-61-8c-89 34-179 27-246-23Z" fill="url(#g)"/><path d="M117 105c-31 23-61 31-91 28 24-11 41-24 50-41" fill="#5b9fb8"/><path d="M250 79c20-14 34-34 39-55 10 18 8 38-3 56" fill="#5b9fb8"/>' )
};
const REWARDS={
100:{key:'clown',label:'カクレクマノミ',asset:assets.clown,width:8},
200:{key:'turtle',label:'ウミガメ',asset:'optimized/species-small-sea-turtle.webp',width:13},
300:{key:'octopus',label:'大ダコ',asset:'optimized/species-octopus.webp',width:14},
400:{key:'manta',label:'マンタ',asset:assets.manta,width:17},
500:{key:'dolphin',label:'イルカ',asset:assets.dolphin,width:18},
600:{key:'shark',label:'大型サメ',asset:assets.shark,width:20},
700:{key:'orca',label:'シャチ',asset:assets.orca,width:23},
800:{key:'humpback',label:'ザトウクジラ',asset:assets.humpback,width:28},
900:{key:'whaleshark',label:'ジンベイザメ',asset:assets.whaleshark,width:30},
1000:{key:'bluewhale',label:'シロナガスクジラ',asset:assets.bluewhale,width:34}
};
function rewardFor(at){return REWARDS[at]||null}
root.CinemapOceanMilestoneStars={REWARDS,rewardFor};
})(window);
