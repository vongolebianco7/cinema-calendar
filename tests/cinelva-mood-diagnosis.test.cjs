'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const diagnosis=require('../js/movie-mood-diagnosis.js');

test('mood diagnosis has five questions and each answer maps to a usable discovery result',()=>{
  assert.equal(diagnosis.QUESTIONS.length,5);
  for(let profile=0;profile<4;profile++){
    const result=diagnosis.diagnose(Array(5).fill(profile));
    assert.equal(result.id,diagnosis.profiles[profile].id);
    assert.ok(result.genreId);
    assert.ok(result.name);
  }
});

test('special hub exposes the additional quiz and sends the result to discovery by genre',()=>{
  const page=fs.readFileSync('specials.html','utf8');
  assert.match(page,/映画の気分診断/);
  assert.match(page,/js\/movie-mood-diagnosis\.js/);
  assert.match(page,/discover\.html\?genre=/);
  assert.match(page,/aria-live="polite"/);
});

test('discovery honors only supported genre deep links and loads their result list',()=>{
  const page=fs.readFileSync('discover.html','utf8');
  assert.match(page,/new URLSearchParams\(location\.search\)\.get\("genre"\)/);
  assert.match(page,/genres\.some\(\(\[,id\]\)=>id&&id===value\)/);
  assert.match(page,/if\(linkedGenre\)\{\$\("#conditionResults"\)\.hidden=false;load\(true\)\}/);
});
