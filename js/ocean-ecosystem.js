(function(root,factory){if(typeof module==="object"&&module.exports){module.exports=factory();}else{root.CinemapOcean=factory();}})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SPECIES=[
{id:"chromis",name:"デバスズメダイ",kind:"school",traits:["bright","gentle","adventure"]},
{id:"clownfish",name:"クマノミ",kind:"reef",traits:["warm","family","comedy"]},
{id:"butterfly",name:"チョウチョウウオ",kind:"reef",traits:["romance","bright","art"]},
{id:"tuna",name:"マグロ",kind:"pelagic",traits:["action","speed","adventure"]},
{id:"ray",name:"エイ",kind:"pelagic",traits:["drama","quiet","art"]},
{id:"manta",name:"マンタ",kind:"rare",traits:["epic","adventure","art"]},
{id:"turtle",name:"ウミガメ",kind:"pelagic",traits:["family","adventure","gentle"]},
{id:"seahorse",name:"タツノオトシゴ",kind:"reef",traits:["romance","fantasy","gentle"]},
{id:"jelly",name:"クラゲ",kind:"drifter",traits:["fantasy","mystery","dream"]},
{id:"octopus",name:"タコ",kind:"benthic",traits:["mystery","crime","clever"]},
{id:"squid",name:"イカ",kind:"pelagic",traits:["sf","mystery","night"]},
{id:"shrimp",name:"エビ",kind:"benthic",traits:["comedy","quirky","bright"]},
{id:"crab",name:"カニ",kind:"benthic",traits:["crime","drama","quirky"]},
{id:"nudibranch",name:"ウミウシ",kind:"benthic",traits:["art","fantasy","colorful"]},
{id:"angler",name:"チョウチンアンコウ",kind:"deep",traits:["horror","mystery","night"]},
{id:"lanternfish",name:"ハダカイワシ",kind:"deep-school",traits:["horror","sf","night"]},
{id:"shark",name:"サメ",kind:"pelagic",traits:["thriller","action","horror"]},
{id:"moray",name:"ウツボ",kind:"reef",traits:["thriller","crime","horror"]},
{id:"lionfish",name:"ミノカサゴ",kind:"reef",traits:["horror","art","thriller"]},
{id:"moonfish",name:"マンボウ",kind:"pelagic",traits:["comedy","quirky","gentle"]},
{id:"nautilus",name:"オウムガイ",kind:"rare",traits:["history","mystery","classic"]},
{id:"whale",name:"クジラ",kind:"rare",traits:["epic","drama","history"]},
{id:"dolphin",name:"イルカ",kind:"school",traits:["family","comedy","adventure"]},
{id:"goby",name:"ハゼ",kind:"benthic",traits:["slice","gentle","drama"]}
];
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function tags(movie){const raw=[...(movie.genres||[]),movie.genre,movie.mood,movie.country].filter(Boolean).join(" ").toLowerCase();const t=[];const map={horror:["horror","ホラー"],thriller:["thriller","スリラー"],sf:["science fiction","sci-fi","sf","ＳＦ"],fantasy:["fantasy","ファンタジー"],romance:["romance","恋愛"],comedy:["comedy","コメディ"],action:["action","アクション"],crime:["crime","犯罪"],mystery:["mystery","ミステリー"],family:["family","ファミリー"],adventure:["adventure","アドベンチャー"],history:["history","歴史"],drama:["drama","ドラマ"],art:["animation","アニメ","music","音楽"]};for(const [k,words] of Object.entries(map))if(words.some(w=>raw.includes(w)))t.push(k);if((movie.year||0)<1980)t.push("classic");return t;}
function speciesFor(movie){const ts=tags(movie);const seed=hash(movie.id||movie.title||JSON.stringify(movie));let ranked=SPECIES.map((s,i)=>({s,score:s.traits.reduce((n,t)=>n+(ts.includes(t)?5:0),0)+((seed>>>((i%4)*8))&7)}));ranked.sort((a,b)=>b.score-a.score||hash((movie.id||movie.title)+a.s.id)-hash((movie.id||movie.title)+b.s.id));return ranked[0].s;}
function variant(movie){const h=hash((movie.id||movie.title)+"variant"),rating=Number(movie.rating||0);return{hue:h%360,pattern:["plain","stripe","spot","gradient"][h%4],scale:.72+((h>>>8)%45)/100,finish:rating>=5?"iridescent":rating>=4.5?"pearl":rating>=4?"vivid":"natural"};}
function habitat(movie){const t=tags(movie);if(t.includes("horror")||t.includes("mystery"))return"twilight";if(t.includes("adventure")||t.includes("action"))return"open-ocean";if(t.includes("fantasy")||t.includes("romance"))return"reef";return"coastal";}
function build(movies){const individuals=movies.map(m=>({movie:m,species:speciesFor(m),variant:variant(m),habitat:habitat(m)}));const counts={};individuals.forEach(x=>counts[x.species.id]=(counts[x.species.id]||0)+1);const n=movies.length;return{individuals,counts,environment:{coral:Math.floor(n/8),seaweed:Math.floor(n/5),rocks:Math.floor(n/12),ambientSchools:Math.floor(n/15),richness:Math.min(1,n/100)},discovered:Object.keys(counts)};}
return{SPECIES,hash,tags,speciesFor,variant,habitat,build};
});