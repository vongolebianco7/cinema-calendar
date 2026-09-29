const test=require('node:test');
const assert=require('node:assert/strict');
const {ecologySignalsForRecords}=require('../preview/ocean/real-fish/ecology-state.js');

test('same watch count can produce richer biodiversity from broader viewing history',()=>{
  const narrow={a:{rating:4,genres:['Drama'],region:'JP',director:'A'},b:{rating:4,genres:['Drama'],region:'JP',director:'A'},c:{rating:4,genres:['Drama'],region:'JP',director:'A'}};
  const broad={a:{rating:4,genres:['Drama','SF'],region:'JP',director:'A'},b:{rating:4,genres:['Comedy','Animation'],region:'US',director:'B'},c:{rating:4,genres:['Documentary'],region:'FR',director:'C'}};
  const n=ecologySignalsForRecords(narrow),b=ecologySignalsForRecords(broad);
  assert.equal(n.count,b.count);
  assert.equal(n.ratingBonus,b.ratingBonus);
  assert.ok(b.diversityScore>n.diversityScore);
  assert.ok(b.diversityTier>n.diversityTier);
});

test('biodiversity signal is descriptive, not genre-to-creature mapping',()=>{
  const s=ecologySignalsForRecords({a:{genres:['Horror','Drama'],region:'KR',director:'Park'}});
  assert.deepEqual({genreCount:s.genreCount,regionCount:s.regionCount,directorCount:s.directorCount},{genreCount:2,regionCount:1,directorCount:1});
  assert.equal(typeof s.diversityTier,'number');
  assert.equal('creature' in s,false);
  assert.equal('fish' in s,false);
});
