const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {assertTextContrast}=require('./helpers/text-contrast.cjs');
function pageWithColors(transparent,foreground='rgb(100, 100, 93)') {
 const body={tagName:'BODY',className:'',parentElement:null,background:'rgb(248, 246, 241)'};
 const label={tagName:'LABEL',className:'',parentElement:body,background:transparent,isConnected:true,textContent:'並び替え',getClientRects:()=>[{}]};
 return {evaluate:async(fn,selectors)=>vm.runInNewContext(`(${fn.toString()})(selectors)`,{
  selectors,document:{querySelectorAll:()=>[label]},
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
