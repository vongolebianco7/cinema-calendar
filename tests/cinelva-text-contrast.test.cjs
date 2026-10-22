const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {assertTextContrast}=require('./helpers/text-contrast.cjs');
function pageWithColors(transparent,foreground='rgb(100, 100, 93)') {
 const body={tagName:'BODY',className:'',parentElement:null,background:'rgb(248, 246, 241)'};
 const label={tagName:'LABEL',className:'',parentElement:body,background:transparent,isConnected:true,textContent:'並び替え',getClientRects:()=>[{}]};
 return {evaluate:async(fn,selectors)=>vm.runInNewContext(`(${fn.toString()})(selectors)`,{
  selectors,document:{querySelectorAll:()=>[label]},requestAnimationFrame:callback=>callback(),
  getComputedStyle:el=>({color:foreground,backgroundColor:el.background})
 })};
}
for(const transparent of ['rgba(0, 0, 0, 0)','rgba(0,0,0,0)','rgba(0, 0, 0, 0.0)','transparent']) {
 test(`transparent text surface resolves to its painted ancestor: ${transparent}`,async()=>{
  const result=await assertTextContrast(pageWithColors(transparent),['label']);
  assert.ok(result[0].ratio>5,'muted label is readable on the actual light background');
 });
}
test('a genuinely low-contrast label still fails on its painted background',async()=>{
 await assert.rejects(assertTextContrast(pageWithColors('rgba(0,0,0,0)','rgb(220, 220, 220)'),['label']),/ratio/);
});

test('measurements wait for the new document to paint before sampling',async()=>{
 const frames=[];
 const body={tagName:'BODY',parentElement:null};
 const label={tagName:'LABEL',parentElement:body,isConnected:true,textContent:'並び替え',getClientRects:()=>[{}]};
 const page={evaluate:async(fn,selectors)=>vm.runInNewContext(`(${fn.toString()})(selectors)`,{
  selectors,document:{querySelectorAll:()=>[label]},
  requestAnimationFrame:callback=>{frames.push('paint');callback()},
  getComputedStyle:el=>({color:'rgb(100, 100, 93)',backgroundColor:el===body&&frames.length>=2?'rgb(248, 246, 241)':'rgba(0,0,0,0)'})
 })};
 const results=await assertTextContrast(page,['label']);
 assert.equal(frames.length,2);assert.ok(results[0].ratio>5);
});
