const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
async function ranks(region='すべて'){
 const html=fs.readFileSync('rankings.html','utf8'),nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',style:{}});return nodes.get(id)};
 const ctx={$ ,boxRegion:region,boxEra:'歴代',boxoffice:{by_year:{},all_time:[{title:'A',year:2000,gross:100,region:'国内'},{title:'B',year:2001,gross:90,region:'国内'},{title:'C',year:2002,gross:90,region:'国内'},{title:'D',year:2003,gross:85,region:'国外'},{title:'E',year:2004,gross:80,region:'国内'}]},productionBucket:(_a,m)=>m.region,boxMovieId:()=>'',boxPosterUrl:()=>'',document:{querySelectorAll:()=>[]},hydrateBoxCardsLazy(){},mountRankingGauges(){}};
 vm.runInNewContext(html.slice(html.indexOf('async function renderBox()'),html.indexOf('function awardFilmName('))+';globalThis.renderBox=renderBox',ctx);await ctx.renderBox();return [...$('#grid').innerHTML.matchAll(/class="no">#(\d+)/g)].map(m=>Number(m[1]));
}
test('equal box-office amounts share competition rank and skip following ranks',async()=>{assert.deepEqual(await ranks(),[1,2,2,4,5]);});
test('competition ranks remain consistent after a region filter',async()=>{assert.deepEqual(await ranks('国内'),[1,2,2,4]);});
