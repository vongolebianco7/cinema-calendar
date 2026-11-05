'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {resolve}=require('../js/streaming-bookmark-identity.js');
test('uses explicit TMDB IDs and never treats local key as a TMDB ID',()=>{
 const result=resolve({'999':{id:'999',title:'Film',year:2024,tmdbId:123}},[]);
 assert.deepEqual(result,{ids:[123],unresolved:0});
});
test('backfills a legacy bookmark only with exact key title and year plus explicit record TMDB ID',()=>{
 const bookmarks={'local-7':{id:'local-7',title:'映画A',year:'2024'}};
 const records=[{id:'local-7',title:'映画A',year:2024,tmdb_id:4321}];
 assert.deepEqual(resolve(bookmarks,records),{ids:[4321],unresolved:0});
});
test('does not guess from title alone or ambiguous/missing year',()=>{
 const bookmarks={'local-7':{id:'local-7',title:'映画A',year:2024}};
 assert.deepEqual(resolve(bookmarks,[{id:'other',title:'映画A',year:2024,tmdbId:4321}]),{ids:null,unresolved:1});
 assert.deepEqual(resolve(bookmarks,[{id:'local-7',title:'映画A',year:2023,tmdbId:4321}]),{ids:null,unresolved:1});
 assert.deepEqual(resolve(bookmarks,[{id:'local-7',title:'映画B',year:2024,tmdbId:4321}]),{ids:null,unresolved:1});
 assert.deepEqual(resolve(bookmarks,[{id:'local-7',title:'映画A',year:2024,tmdbId:4321},{id:'local-7',title:'映画A',year:2024,tmdbId:4322}]),{ids:null,unresolved:1});
});
test('one unresolved bookmark withholds the entire count instead of undercounting',()=>{
 const bookmarks={a:{tmdbId:123},b:{title:'Unresolved'}};
 assert.deepEqual(resolve(bookmarks,[]),{ids:null,unresolved:1});
});
test('empty watchlist is a valid zero, malformed storage is unknown',()=>{
 assert.deepEqual(resolve({},[]),{ids:[],unresolved:0});
 assert.deepEqual(resolve(null,[]),{ids:null,unresolved:0});
});
