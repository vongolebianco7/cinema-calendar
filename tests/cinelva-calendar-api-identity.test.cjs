const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
test('calendar API retains explicit TMDB identity separately from a local database ID',async()=>{
 const source=require('node:module').stripTypeScriptTypes(fs.readFileSync('backend/app/api/calendar/route.ts','utf8'),{mode:'transform'}).replace(/^import .*?;\s*$/gm,'').replaceAll('export ','');
 const context=vm.createContext({...require('../backend/lib/catalog-snapshot.cjs'),Request,Response,prisma:{release:{findMany:async()=>[{date:new Date('2026-10-13'),event:'streaming',service:'Prime Video',movie:{id:'local-db-id',tmdbId:1276849,title:'スオミの話をしよう'}}]}},json:value=>value,rateLimited:()=>null,options:()=>null});
 vm.runInContext(source+'\nthis.handler=GET;',context);
 const data=await context.handler();assert.equal(data.movies[0].tmdbId,1276849);assert.equal(data.movies[0].id,1276849);
});
