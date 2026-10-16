const fs=require('node:fs');
const assert=require('node:assert/strict');
const [beforeFile,afterFile]=process.argv.slice(2);
const before=JSON.parse(fs.readFileSync(beforeFile,'utf8')).metrics;
const after=JSON.parse(fs.readFileSync(afterFile,'utf8')).metrics;
assert.ok(before.length>0,'baseline journey metrics are required');
const current=new Map(after.map(row=>[row.id,row]));
const regressions=[];
for(const old of before){
  const next=current.get(old.id);
  if(!next||next.earned<old.earned||(old.status==='pass'&&next.status!=='pass')){
    regressions.push({id:old.id,before:old,after:next??null});
  }
}
console.log(JSON.stringify({checked:before.length,baselineNonPassing:before.filter(r=>r.status!=='pass').map(r=>({id:r.id,status:r.status,details:r.details})),regressions},null,2));
assert.equal(regressions.length,0,'CINELVA must not degrade the existing core journeys');
