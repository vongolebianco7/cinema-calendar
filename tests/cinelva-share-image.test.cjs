const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

test('cancelling an image render never downloads a previous period canvas',async()=>{
 const elements=Object.fromEntries(['art','period','imageSort','format','status','summary','detail','savePreview','download','saveDialog','save','share','closeDialog'].map(id=>[id,{value:'',click(){},showModal(){},close(){}}]));
 elements.period.value='all';elements.imageSort.value='date';elements.format.value='portrait';
 const images=[];let exports=0;
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:text=>({width:String(text).length*10})},{get:(target,key)=>target[key]||(()=>{})});
 elements.art.getContext=()=>ctx;elements.art.toBlob=callback=>{exports++;callback({size:1});};
 class Image {constructor(){this.width=100;this.height=150;images.push(this);}set src(value){this.url=value;}}
 const records=[{id:1,title:'Prior year',watchedAt:'2025-01-01',poster:'old',rating:3},{id:2,title:'This year',watchedAt:'2026-01-01',poster:'new',rating:4}];
 const sandbox={document:{getElementById:id=>elements[id],createElement:()=>({click(){}})},CinelvaLibraryRecords:{all:()=>records},Image,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},navigator:{userAgent:'Desktop'},setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync('js/cinelva-share-image.js','utf8'),sandbox);
 for(const image of images.slice())image.onload();await new Promise(setImmediate);
 const saving=elements.save.onclick(),saveImages=images.slice(2);
 elements.period.value='year';const changing=elements.period.onchange();
 for(const image of saveImages)image.onload();await saving;
 assert.equal(exports,0,'a superseded save must not serialize the prior preview');
 for(const image of images.slice(4))image.onload();await changing;
});
