'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {directorMatches,awardMatches}=require('../js/streaming-personal-match.js');
const snapshot={ok:true,movies:[
 {tmdb_id:11,title:'Film 11',director_id:55},
 {tmdb_id:12,title:'Film 12',director_id:66},
 {tmdb_id:13,title:'Film 13',director_id:55}
]};
const records=[
 {tmdbId:11,director_id:55,watched:true},
 {tmdbId:13,director_id:55,watched:true},
 {tmdbId:12,director_id:66,watched:true}
];
test('favorite director matches verified person identity',()=>{
 assert.deepEqual(directorMatches(snapshot,records).map(x=>x.tmdb_id),[11,13]);
});
test('director affinity never guesses from names or missing provider identities',()=>{
 assert.equal(directorMatches(snapshot,[{tmdbId:11,director:'同名監督',watched:true}]),null);
 assert.equal(directorMatches({ok:true,movies:[{tmdb_id:11,title:'A'}]},records),null);
 assert.equal(directorMatches({ok:false,movies:snapshot.movies},records),null);
});
test('favorite awards require explicit complete award audit and resolved TMDB IDs',()=>{
 const awards={coverage_audit:{all_relevant_awards_verified:true},awards:[
  {organization:'賞A',match_status:'resolved',tmdb_id:11},
  {organization:'賞A',match_status:'resolved',tmdb_id:13},
  {organization:'賞B',match_status:'resolved',tmdb_id:12},
  {organization:'賞A',match_status:'unresolved',tmdb_id:12}
 ]};
 assert.deepEqual(awardMatches(snapshot,records,awards).map(x=>x.tmdb_id),[11,13]);
 const missing={...awards,coverage_audit:null};
 assert.equal(awardMatches(snapshot,records,missing),null);
});
