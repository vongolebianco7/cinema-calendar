const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');

test('Best 10 export never fetches or draws third-party poster artwork',()=>{
  const source=fs.readFileSync('js/my-cinemap-art.js','utf8');
  const calls={images:0,draws:0,text:[]};
  const ctx={
    save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},ellipse(){},stroke(){},fill(){},
    fillRect(){},strokeRect(){},moveTo(){},lineTo(){},bezierCurveTo(){},arc(){},closePath(){},clip(){},
    createLinearGradient(){return {addColorStop(){}}},measureText(s){return {width:String(s).length*10}},
    fillText(s){calls.text.push(String(s))}
  };
  const canvas={width:0,height:0,getContext:()=>ctx,setAttribute(){},toBlob(cb){cb({})}};
  const elements={artCanvas:canvas,share:{disabled:false},format:{value:'portrait'},layout:{value:'single'},theme:{value:'minimal'},fontSize:{value:'medium'},fontStyle:{value:'modern'},title:{value:'My Best 10'},sub:{value:''},cinemaBackground:{value:'none'}};
  const document={getElementById:id=>elements[id]||null};
  function Image(){calls.images++;}
  ctx.drawImage=()=>calls.draws++;
  const context={document,window:{addEventListener(){}},Image,File:function(){},URL:{},Map,Math,String,Array};
  vm.runInNewContext(source+';globalThis.__drawArtwork=drawArtwork',context);
  context.__drawArtwork([{title:'Film One',year:2024,director:'Director One',poster:'https://image.tmdb.org/t/p/w342/poster.jpg'}]);
  assert.equal(calls.images,0,'export should not fetch poster images');
  assert.equal(calls.draws,0,'export should not draw poster images');
  assert.ok(calls.text.includes('Film One'),'title remains in export');
  assert.ok(calls.text.includes('2024   ·   Director One'),'year and director remain in export');
});
