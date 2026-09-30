const test=require('node:test');
const assert=require('node:assert/strict');
const {layoutPopulation}=require('../preview/ocean/real-fish/population-layout.js');

function pairDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function nearestDistances(points){return points.map((p,i)=>{let min=Infinity;for(let j=0;j<points.length;j++){if(i===j)continue;min=Math.min(min,pairDistance(p,points[j]))}return min})}

test('500-preview generates exactly 500 creature positions',()=>{
  const points=layoutPopulation(500);
  assert.equal(points.length,500);
});

test('500-preview mixes large, medium, small shoals and 5-10% solitary creatures',()=>{
  const points=layoutPopulation(500);
  const solitary=points.filter(p=>p.school===-1);
  assert.ok(solitary.length>=25&&solitary.length<=50,`solitary=${solitary.length}`);
  const counts=new Map();
  for(const p of points){if(p.school<0)continue;counts.set(p.school,(counts.get(p.school)||0)+1)}
  const sizes=[...counts.values()];
  assert.ok(sizes.some(n=>n>=28&&n<=45),`no large shoal: ${sizes}`);
  assert.ok(sizes.some(n=>n>=12&&n<=24),`no medium shoal: ${sizes}`);
  assert.ok(sizes.some(n=>n>=4&&n<=10),`no small shoal: ${sizes}`);
});

test('500-preview avoids grid spacing and keeps readable density with open water',()=>{
  const points=layoutPopulation(500);
  const nearest=nearestDistances(points);
  const distinct=new Set(nearest.map(n=>n.toFixed(2)));
  assert.ok(distinct.size>80,`nearest-distance variety=${distinct.size}`);
  const crowded=nearest.filter(n=>n<0.7).length;
  assert.ok(crowded<=50,`too many near-overlaps=${crowded}`);
  const cells=new Set(points.map(p=>`${Math.floor(p.x/10)}:${Math.floor(p.y/10)}`));
  assert.ok(cells.size>=32&&cells.size<=55,`occupied cells=${cells.size}`);
});

test('500-preview keeps a visually readable mix of sizes',()=>{
  const points=layoutPopulation(500);
  const large=points.filter(p=>p.width>=6).length;
  const medium=points.filter(p=>p.width>=4&&p.width<6).length;
  const small=points.filter(p=>p.width<4).length;
  assert.ok(large>=20&&large<=60,`large=${large}`);
  assert.ok(medium>=90,`medium=${medium}`);
  assert.ok(small>=200,`small=${small}`);
});
