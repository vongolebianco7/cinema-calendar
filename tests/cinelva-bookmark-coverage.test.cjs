const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('every canonical quick-rate surface loads the common bookmark store first',()=>{
 for(const path of ['index.html','discover.html','search.html','rankings.html','my-cinelva/index.html']){const html=fs.readFileSync(path,'utf8');assert.ok(html.indexOf('js/cinelva-bookmarks.js')>=0,path);assert.ok(html.indexOf('js/cinelva-bookmarks.js')<html.indexOf('js/cinelva-quick-rate.js'),path);}
});
test('movie controls and wanted list delegate bookmark persistence exclusively to shared store',()=>{
 const quick=fs.readFileSync('js/cinelva-quick-rate.js','utf8'),records=fs.readFileSync('js/cinelva-records-page.js','utf8'),wanted=fs.readFileSync('js/cinelva-watchlist.js','utf8');
 assert.match(quick,/CinelvaBookmarks\?\.bind\(bookmark,movie\)/);
 for(const source of [quick,records,wanted])assert.doesNotMatch(source,/setItem\((?:bookmarkKey|key),JSON\.stringify\(data\)\)/);
 assert.match(records,/data-film-controls=/);assert.match(records,/mountInline/);assert.match(wanted,/mountInline/);
});
test('source inventory covers every active route and names each effective source plus controls',()=>{
 const manifest=JSON.parse(fs.readFileSync('quality/route-manifest.json','utf8')),inventory=JSON.parse(fs.readFileSync('docs/operations/ui-operation-inventory.json','utf8'));
 assert.deepEqual(inventory.routes.map(x=>x.route).sort(),manifest.routes.map(x=>x.path).sort());
 for(const route of inventory.routes){assert.ok(fs.existsSync(route.effective_source));assert.ok(Array.isArray(route.controls));}
 assert.ok(inventory.sources.some(source=>source.file==='js/cinelva-bookmarks.js'));
});
