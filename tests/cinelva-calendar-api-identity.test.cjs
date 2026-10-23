const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
test('calendar API retains explicit TMDB identity separately from a local database ID',async()=>{
 const source=fs.readFileSync('backend/app/api/calendar/route.ts','utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
 const context=vm.createContext({...require('../backend/lib/catalog-snapshot.cjs'),Response,prisma:{release:{findMany:async()=>[{date:new Date('2026-10-13'),event:'streaming',service:'Prime Video',movie:{id:'local-db-id',tmdbId:1276849,title:'スオミの話をしよう'}}]}},json:value=>value});
 vm.runInContext(source+'\nthis.handler=GET;',context);
 const data=await context.handler();assert.equal(data.movies[0].tmdbId,1276849);assert.equal(data.movies[0].id,1276849);
});
