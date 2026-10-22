const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function importer(){
 const source=fs.readFileSync('backend/scripts/import-json.ts','utf8');const start=source.indexOf('async function upsertMovie('),end=source.indexOf('\nasync function ',start+1);const code=source.slice(start,end).replace('item: MovieJson','item');
 const calls=[];const context=vm.createContext({prisma:{movie:{upsert:async args=>{calls.push(args);return args.create},findFirst:async()=>null,create:async args=>args.data}}});vm.runInContext(code+'\nthis.run=upsertMovie;',context);return{run:context.run,calls};
}
test('calendar ingestion uses explicit TMDB identity even without the legacy id field',async()=>{
 const {run,calls}=importer();await run({tmdbId:1276849,title:'スオミの話をしよう',poster:'suomi.jpg'});assert.equal(calls.length,1);assert.equal(calls[0].where.tmdbId,1276849);assert.equal(calls[0].update.posterUrl,'suomi.jpg');
});
test('explicit TMDB identity takes priority over an unrelated internal numeric ID',async()=>{
 const {run,calls}=importer();await run({id:12,tmdbId:1276849,title:'スオミの話をしよう'});assert.equal(calls[0].where.tmdbId,1276849);
});
