const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const html = fs.readFileSync('rankings.html', 'utf8');

test('box-office ranking omits image src when a poster URL is missing', () => {
  const start = html.indexOf('list.length?list.map((m,i)=>{\n const posters=boxPosterItems(m),poster=boxPosterUrl(m.poster),isVerifiedGroup=posters.length>0;');
  assert.notEqual(start, -1, 'box-office renderer should validate grouped artwork and normalize a single poster once');
  const end = html.indexOf("}).join('')", start);
  assert.notEqual(end, -1, 'box-office renderer should close its map callback');
  const renderer = html.slice(start, end);
  assert.ok(renderer.includes("(poster?'src=\"'+poster+'\" ':'')"), 'src should exist only for a usable poster URL');
  assert.ok(!renderer.includes('alt="" src="'), 'an empty poster must not create an empty src request');
  assert.ok(renderer.includes("data-box-placeholder '+(poster?'hidden':'')"), 'missing single-film posters retain the visible placeholder');
  assert.ok(renderer.includes("const artwork=isVerifiedGroup"), 'verified grouped records use separate artwork instead of a single-film image');
});
