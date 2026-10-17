const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

test('calendar movie detail never fabricates observation time for embedded availability',()=>{
 assert.doesNotMatch(html,/checked_at\s*:\s*m\.availability\.checked_at\s*\|\|\s*new Date\(\)\.toISOString\(\)/);
 assert.match(html,/m\.availability\?\{\.\.\.m\.availability\}:null/);
 assert.match(html,/CinelvaDataQuality\.availabilityIsFresh\(av\)/);
});
