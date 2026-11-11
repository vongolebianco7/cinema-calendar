const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const html = fs.readFileSync('rankings.html', 'utf8');

test('box-office ranking omits image src when a poster URL is missing', () => {
  const start = html.indexOf('list.length?list.map((m,i)=>{const poster=boxPosterUrl(m.poster);');
  assert.notEqual(start, -1, 'box-office renderer should normalize the poster once');
  const end = html.indexOf("}).join('')", start);
  assert.notEqual(end, -1, 'box-office renderer should close its map callback');
  const renderer = html.slice(start, end);
  const imgStart = renderer.indexOf('<img data-box-poster');
  const placeholderStart = renderer.indexOf('<div class="rankPosterPlaceholder');
  const image = renderer.slice(imgStart, placeholderStart);
  assert.ok(image.includes("(poster?'src=\"'+poster+'\" ':'')"), 'src should exist only for a usable poster URL');
  assert.ok(!image.includes('alt="" src="'), 'an empty poster must not create an empty src request');
  assert.ok(renderer.includes("data-box-placeholder '+(poster?'hidden':'')"), 'missing posters retain the visible placeholder');
});
