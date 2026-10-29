const test=require('node:test'),assert=require('node:assert/strict');
const quality=()=>require('../js/cinelva-theater-quality.js');
test('official branch enrichment preserves verified city, address and official links',()=>{
 const {mergeOfficialDirectory}=quality();assert.equal(typeof mergeOfficialDirectory,'function');
 const official=[{name:'イオンシネマ 江別',prefecture:'北海道',municipality:'',address:'',website:'',source:'cinema-discounts-official'}];
 const prior=[{name:'イオンシネマ江別',prefecture:'北海道',municipality:'江別市',address:'江別市の住所',website:'https://www.aeoncinema.com/cinema/ebetsu/',source:'Wikidata'}];
 const result=mergeOfficialDirectory(official,prior);
 assert.equal(result.length,1);assert.equal(result[0].municipality,'江別市');assert.equal(result[0].address,prior[0].address);assert.equal(result[0].website,prior[0].website);
 assert.equal(official[0].website,'','source objects remain unchanged');
});
test('official incomplete snapshot never resurrects a known closed venue',()=>{
 const {mergeOfficialDirectory}=quality();assert.equal(typeof mergeOfficialDirectory,'function');
 assert.deepEqual(mergeOfficialDirectory([{name:'閉館した館',prefecture:'北海道'}],[{name:'閉館した館',prefecture:'北海道',closed:true}]),[]);
});
test('same-name distinct branches are retained without an extra unlocated official duplicate',()=>{
 const {mergeOfficialDirectory}=quality();assert.equal(typeof mergeOfficialDirectory,'function');
 const prior=[{name:'Cinema',prefecture:'東京都',address:'市1'},{name:'Cinema',prefecture:'東京都',address:'市2'}];
 const result=mergeOfficialDirectory([{name:'Cinema',prefecture:'東京都',website:''}],prior);
 assert.equal(result.length,2);assert.deepEqual(result.map(t=>t.address),['市1','市2']);
});
test('known closed or demolished facilities are excluded while unknown operation stays explicitly unknown',()=>{const {directory}=quality();const rows=[{name:'Closed',status:'closed'},{name:'Gone',closed:true},{name:'Ended',dissolved_at:'2020-01-01'},{name:'Unknown'},{name:'Future',dissolved_at:'2099-01-01'}];assert.deepEqual(directory(rows).map(x=>x.name),['Unknown','Future']);assert.equal(rows[3].status,undefined);});
test('source identity deduplicates repeats without conflating different same-named locations',()=>{const {directory}=quality();const rows=[{name:'Cinema',source:'Wikidata',source_id:'Q1'},{name:'Cinema repeat',source:'Wikidata',source_id:'Q1'},{name:'Cinema',lat:35,lon:139},{name:'Cinema',lat:36,lon:140}];assert.equal(directory(rows).length,3);});
test('exact name/address duplicates collapse across sources but missing geography does not merge unrelated facilities',()=>{const {directory}=quality();const rows=[{name:'ABC cinema',address:'東京都1-2',source:'Wikidata',source_id:'Q1'},{name:'ＡＢＣ cinema',address:'東京都1-2',source:'OpenStreetMap',osm_type:'node',osm_id:2},{name:'Cinema'},{name:'Cinema'}];assert.equal(directory(rows).length,3);});
test('empty source identifiers do not collapse unrelated unlocated facilities',()=>{const {directory}=quality();assert.equal(directory([{name:'One',source:'API',source_id:''},{name:'Two',source:'API',source_id:''}]).length,2);});
test('nearby same-name facilities with distinct coordinates remain separate',()=>{assert.equal(quality().directory([{name:'Cinema',lat:35.00001,lon:139},{name:'Cinema',lat:35.00002,lon:139}]).length,2);});
