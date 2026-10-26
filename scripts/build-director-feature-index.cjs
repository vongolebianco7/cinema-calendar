/* Project the same director-credit policy into a small browser lookup. No requests. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {isDirectorCredit,normalizeName}=require('../js/cinelva-global-search.js');
function build(source){const directors={};for(const [id,d] of Object.entries(source.directors||{})){
 if(d.coverage?.source!=='tmdb_director_movie_credits')continue;
 const names=new Set([d.name,d.nameJa,d.original_name,...(d.also_known_as||[])].filter(Boolean).map(normalizeName));
 const resolve=name=>names.has(normalizeName(name))?d.name:name;
 const ids=[...new Set((d.works||[]).filter(w=>isDirectorCredit(w,d.name,resolve)).map(w=>Number(w.id)).filter(n=>Number.isSafeInteger(n)&&n>0))].sort((a,b)=>a-b);
 directors[id]={ids,complete:d.coverage.truncated===false};
 }return {generated_at:source.generated_at,directors};}
if(require.main===module){const root=path.resolve(__dirname,'..'),out=path.join(root,'data/director-feature-index.json');const d=build(JSON.parse(fs.readFileSync(path.join(root,'data/directors-mobile.json'),'utf8')));fs.writeFileSync(out,JSON.stringify(d)+'\n');console.log('Director feature index: '+Object.keys(d.directors).length+' directors, '+fs.statSync(out).size+' bytes');}
module.exports={build};
