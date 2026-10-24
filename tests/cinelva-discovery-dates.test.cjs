const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const shelves=require('../js/cinelva-discovery-shelves.js');

test('cards retain a known full release date ahead of the year',()=>{
 assert.equal(shelves.displayDate?.({year:2007,release_date:'2007-11-10'}),'2007-11-10');
 assert.equal(shelves.displayDate?.({year:2026,event:'streaming',date:'2026-10-23'}),'2026-10-23');
});
test('year-only and invalid-date records never acquire an invented day',()=>{
 assert.equal(shelves.displayDate?.({year:2007}),'2007');
 assert.equal(shelves.displayDate?.({year:2026,date:'2026-02-30'}),'2026');
 assert.equal(shelves.displayDate?.({date:'2026-10'}),'');
 assert.equal(shelves.displayDate?.({release_date:'2024-02-29'}),'2024-02-29');
});
test('all discover card renderers use the same full-date formatter',()=>{
 for(const path of ['discover.html','cinelva/discover.html']) {
  const html=fs.readFileSync(path,'utf8');
  assert.ok(html.indexOf('src="js/cinelva-discovery-shelves.js"')<html.indexOf('function popularCardHtml(')&&html.includes('src="js/cinelva-discovery-shelves.js"'),path+' loads formatter before render');
  for(const name of ['popularCardHtml','render','personCardHtml']) {
   const fn=html.match(new RegExp('function '+name+'\\([^\\n]+'))?.[0]||'';
   assert.match(fn,/CinelvaDiscoveryShelves\.displayDate\(m\)/,path+' '+name);
  }
 }
});
