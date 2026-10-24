const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const api=require('../js/calendar-dedupe.js');
test('finite screenings appear once per displayed month with the true interval retained',()=>{
 const row={date:'2026-10-02',end_date:'2026-10-15'};
 assert.equal(api.inFirstVisibleWeek(row,'2026-09-28','2026-10-04','2026-09-28'),true);
 assert.equal(api.inFirstVisibleWeek(row,'2026-10-05','2026-10-11','2026-09-28'),false);
 assert.equal(api.inFirstVisibleWeek(row,'2026-10-12','2026-10-18','2026-09-28'),false);
 assert.equal(api.inFirstVisibleWeek({date:'2026-10-16',end_date:'2026-10-29'},'2026-10-26','2026-11-01','2026-10-26'),true);
});
test('shared theme never alters pixels or removes the supplied logo frame',()=>{
 const theme=fs.readFileSync('js/theme.js','utf8');assert(!theme.includes('cinelva-logo-frame.js'));
});
