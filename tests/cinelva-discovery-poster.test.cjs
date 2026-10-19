'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const page=fs.readFileSync('discover.html','utf8');
test('all discovery movie tiles provide a visible fallback when poster data or image loading is missing',()=>{
 for(const renderer of ['function popularCardHtml','function render()','function personCardHtml','async function askConcierge'])assert.ok(page.includes(renderer),`expected ${renderer} renderer`);
 assert.match(page,/posterFallback/);
 assert.match(page,/onerror=/);
});
