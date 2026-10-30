const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const medium=require('../js/cinelva-film-medium.js');
const rows=[{id:1,title:'TV special',genre_ids:[10770],year:2025},{id:2,title:'Anime feature',genre_ids:[16],year:2024},{id:3,title:'Drama feature',genre_ids:[18],year:2023}];
test('calendar detail sourced and remote director works exclude TV specials',()=>{
 const line=fs.readFileSync('index.html','utf8').split('\n').find(x=>x.includes('let d=m.director_id&&directors['));
 for(const directors of [{7:{works:rows}},{}]){const ctx={CinelvaFilmMedium:medium,m:{director_id:7,director_works:rows},directors};vm.runInNewContext(line+';globalThis.works=works',ctx);assert.deepEqual(Array.from(ctx.works,r=>r.id),[2,3]);}
});
test('search detail director works exclude TV before ordering and limiting',()=>{
 const html=fs.readFileSync('search.html','utf8'),expression=html.match(/,w=(.*?);const trailParams=/)[1];
 const ctx={CinelvaFilmMedium:medium,m:{director_works:[...rows,...Array.from({length:31},(_,i)=>({id:100+i,title:'TV '+i,genre_ids:[10770],year:1900}))]}};
 vm.runInNewContext('globalThis.works='+expression,ctx);assert.deepEqual(Array.from(ctx.works,r=>r.id),[3,2]);
});
