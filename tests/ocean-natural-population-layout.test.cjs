const test=require('node:test');
const assert=require('node:assert/strict');
const {layoutPopulation}=require('../preview/ocean/real-fish/population-layout.js');

function nearestDistances(points){return points.map((p,i)=>{let best=Infinity;for(let j=0;j<points.length;j++){if(i===j)continue;const q=points[j],dx=p.x-q.x,dy=p.y-q.y;best=Math.min(best,Math.hypot(dx,dy));}return best;});}

test('100 watched films create 100 distinct visible positions',()=>{
  const points=layoutPopulation(100);
  assert.equal(points.length,100);
  assert.equal(new Set(points.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`)).size,100);
  assert.ok(points.every(p=>p.x>=3&&p.x<=93&&p.y>=7&&p.y<=86));
});

test('layout is not an equal grid: spacing varies and includes shoals plus open water',()=>{
  const points=layoutPopulation(100);
  const nearest=nearestDistances(points);
  const min=Math.min(...nearest),max=Math.max(...nearest);
  assert.ok(max/min>2.2,`nearest-neighbour variation too small: ${max/min}`);
  const xs=new Set(points.map(p=>Math.round(p.x)));
  const ys=new Set(points.map(p=>Math.round(p.y)));
  assert.ok(xs.size>24,'too few distinct x positions');
  assert.ok(ys.size>20,'too few distinct y positions');
});

test('depth and size vary enough that fish remain readable instead of tiny uniform dots',()=>{
  const points=layoutPopulation(100);
  const sizes=points.map(p=>p.width);
  assert.ok(Math.min(...sizes)<=3.5);
  assert.ok(Math.max(...sizes)>=7.0);
  assert.ok(new Set(points.map(p=>p.depth)).size===3);
  assert.ok(points.filter(p=>p.depth==='near').length>=12);
});

test('dense oceans populate the lower third in clustered habitats while preserving open seabed water',()=>{
  for(const count of [300,500]){
    const points=layoutPopulation(count);
    const lower=points.filter(p=>p.y>=70);
    assert.ok(lower.length>=Math.floor(count*.08),`${count} films only places ${lower.length} creatures in the lower third`);
    assert.ok(Math.max(...points.map(p=>p.y))>=82,`${count} films never reaches the lower seabed zone`);
    const lowerCells=new Set(lower.map(p=>`${Math.floor(p.x/10)}:${Math.floor(p.y/10)}`));
    assert.ok(lowerCells.size<=12,`${count} films spreads lower-third life across too many cells: ${lowerCells.size}`);
  }
});
