const test=require('node:test');
const assert=require('node:assert/strict');
const { maturityStateForRecords }=require('../preview/ocean/real-fish/ecology-state.js');

const states={0:{},10:{},20:{},30:{},40:{},50:{},60:{},70:{},80:{},90:{},100:{},300:{},500:{}};
const records=n=>Object.fromEntries(Array.from({length:n},(_,i)=>['m'+i,{rating:3.5}]));

test('no saved history keeps the preview fallback state',()=>{
  assert.equal(maturityStateForRecords({},states,100),100);
});

test('saved watched count chooses the highest reached ecosystem milestone',()=>{
  assert.equal(maturityStateForRecords(records(1),states,100),0);
  assert.equal(maturityStateForRecords(records(10),states,100),10);
  assert.equal(maturityStateForRecords(records(37),states,100),30);
  assert.equal(maturityStateForRecords(records(118),states,100),100);
  assert.equal(maturityStateForRecords(records(520),states,100),500);
});

test('only actual object records contribute to watched maturity',()=>{
  const history={a:{rating:4},b:null,c:'bad',d:{rating:5}};
  assert.equal(maturityStateForRecords(history,states,100),0);
});
