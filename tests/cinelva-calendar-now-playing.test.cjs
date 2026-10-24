const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../js/cinelva-calendar-now-playing.js');
const now=Date.parse('2026-10-24T00:00:00Z');
const snapshot={schema_version:1,region:'JP',complete:true,generated_at:new Date(now).toISOString(),source:{id:'tmdb',endpoint:'/movie/now_playing'},movies:[{id:42,title:'上映中'}]};
test('exact numeric movie IDs only, independent of event/date/title',()=>{
 assert.equal(api.matches({tmdbId:42,event:'tv',date:'2020-01-01'},snapshot,now),true);
 assert.equal(api.matches({id:'42',event:'streaming'},snapshot,now),true);
 assert.equal(api.matches({id:43,title:'上映中'},snapshot,now),false);
 assert.equal(api.matches({id:'db42',title:'上映中'},snapshot,now),false);
 assert.equal(api.matches({tmdbId:43,id:42},snapshot,now),false);
});
test('stale, future, wrong-source and incomplete observations never label posters',()=>{
 for(const d of [{...snapshot,complete:false},{...snapshot,region:'US'},{...snapshot,generated_at:new Date(now-37*3600000).toISOString()},{...snapshot,generated_at:new Date(now+3600000).toISOString()},null])assert.equal(api.matches({id:42},d,now),false);
});
