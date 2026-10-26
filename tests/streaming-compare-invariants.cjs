// Run: node tests/streaming-compare-invariants.cjs
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const html=read('streaming-compare.html');
const must=(...parts)=>parts.forEach(part=>assert.ok(html.includes(part),'missing: '+part));
must('月額料金（税込）','広告の有無','同時視聴可能台数','作成可能プロフィール数',
 '家族共有','登録可能端末数','ブックマークした映画','好きな監督の映画',
 '好きな映画賞の映画','サブスク乗り換え時の増減','billingCycle','yearlyFees',
 'Disney+','Lemino','Prime Video','WOWOW','Apple TV','確認中','未集計');
must('streaming-availability.js','streaming-availability.json','streaming-bookmark-identity.js','cinelva-want-to-watch-v1',
 'confirmedMatches(service.name)','matchesDialog','matchBookmarkIds(validated,ids)',
 'compareBookmarkAvailability','deltaActions','updateMovieDelta',
 'search.html?','new URLSearchParams({search:movie.title,id:String(movie.tmdb_id)})',
 'const scores=new Map()', 'CinelvaQuickRate?.mountInline', 'cinelva-quick-rate.js');
assert.match(html,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(html,/CinelvaStreamingBookmarks\?\.resolve\(raw,records\)/);
assert.doesNotMatch(html,/\.map\(\(\[id\]\)=>Number\(id\)\)/);
assert.match(html,/現在の配信カレンダーは配信開始情報/);
assert.match(html,/ライセンス状況・プラン・地域・更新日/);
assert.doesNotMatch(html,/movies\.length\s*\/\s*services\.length/);
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(script,'inline application script missing');
new vm.Script(script[1],{filename:'streaming-compare.html'});
const availability=JSON.parse(read('data/streaming-availability.json'));
assert.equal(availability.country,'JP');
assert.deepEqual(availability.services,{});
assert.equal(availability.generated_at,null);
for(const filename of ['js/streaming-availability.js','js/streaming-bookmark-identity.js']){
 new vm.Script(read(filename),{filename});
}
console.log('streaming compare invariant checks passed');
