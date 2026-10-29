'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {collectReleaseNotices,todayInJapan}=require('../js/cinelva-release-notices.js');
const today='2026-10-29';
const event={id:42,tmdbId:42,title:'映画A',year:2025,date:today,event:'streaming',service:'配信サービス',source:'公式発表',source_url:'https://example.com/official'};
const bookmark={id:'42',title:'映画A',year:2025,savedAt:'2026-10-01T12:00:00.000Z'};
test('notices a verified bookmarked streaming date on its Japan calendar day',()=>assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:[event],today}).length,1));
test('notices a bookmarked theatrical date with the same identity safeguards',()=>assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:[{...event,event:'theatrical'}],today})[0].event,'theatrical'));
test('requires exact title, year, positive TMDB identity, official HTTPS source and allowed event type',()=>{
 for(const patch of [{title:'別作品'},{year:2024},{id:0,tmdbId:0},{source_url:'http://example.com'},{event:'tv'},{date:'2026-10-30'}])assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:[{...event,...patch}],today}).length,0);
});
test('legacy bookmark identity needs exact title/year/id and an unambiguous catalog row',()=>{
 assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:[event,{...event,id:43,tmdbId:43}],today}).length,0);
 assert.equal(collectReleaseNotices({bookmarks:[{...bookmark,tmdbId:43}],catalog:[event],today}).length,0);
 assert.equal(collectReleaseNotices({bookmarks:[{...bookmark,year:2024}],catalog:[event],today}).length,0);
});
test('does not notify after the expected date or before a bookmark was saved',()=>{
 assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:[event],today:'2026-10-30'}).length,0);
 assert.equal(collectReleaseNotices({bookmarks:[{...bookmark,savedAt:'2026-10-30'}],catalog:[event],today}).length,0);
});
test('deduplicates repeated catalog rows and honors dismissed event keys',()=>{
 const rows=[event,{...event}];assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:rows,today}).length,1);
 assert.equal(collectReleaseNotices({bookmarks:[bookmark],catalog:rows,today,dismissed:['42:2026-10-29:streaming']}).length,0);
});
test('derives today using Japan local date across UTC midnight',()=>assert.equal(todayInJapan(Date.parse('2026-10-28T16:00:00Z')),'2026-10-29'));
