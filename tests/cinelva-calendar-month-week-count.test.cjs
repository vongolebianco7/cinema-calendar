const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('index.html','utf8');
const names=['monthPageStart','monthPageEnd','monthPageWeekCount'];
const helpers=names.map(name=>{
 const start=source.indexOf(`function ${name}(`);
 assert.ok(start>=0,`missing production helper ${name}`);
 return source.slice(start,source.indexOf('\n}',start)+2);
}).join('\n');
const context=vm.createContext({Date});vm.runInContext(helpers,context);
for(const [year,month,weeks] of [[2026,9,5],[2027,1,4],[2026,7,6]]){
 test(`calendar ${year}-${month+1} renders exactly ${weeks} complete weeks`,()=>{
  const date=new Date(year,month,15);
  assert.equal(context.monthPageWeekCount(date),weeks);
  const start=context.monthPageStart(date),end=context.monthPageEnd(date);
  assert.equal(start.getDay(),1);assert.equal(end.getDay(),0);
  const finalRowStart=new Date(start);finalRowStart.setDate(start.getDate()+(weeks-1)*7);
  assert.ok(finalRowStart<=end,'last row belongs to the visible month interval');
  const extraRow=new Date(start);extraRow.setDate(start.getDate()+weeks*7);
  assert.ok(extraRow>end,'an extra row must not be rendered beyond the month interval');
 });
}
